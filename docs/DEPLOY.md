# Deploying SKA-SITE-TUI publicly (home server + Cloudflare Tunnel)

This guide targets the common setup: **a home server with no forwardable ports**,
a **Cloudflare Tunnel already running**, **Halo** as the content source, and a
UI in **English / Traditional Chinese**.

## How it fits together

The app is a blog rendered as a **terminal UI, served over SSH**. Two problems
solve each other:

- A public Cloudflare Tunnel only proxies **HTTP/HTTPS** to the general public.
  Raw SSH cannot be made public through a normal tunnel.
- So we run a **web terminal** (`ttyd`) that renders the *identical* TUI in the
  browser over HTTP, and expose **that** through the tunnel.

```
                              ┌─ Web visitors (everyone) ─────────────────────┐
                              │  https://term.yourdomain.com                   │
Cloudflare edge  ◄──outbound──┤    → cloudflared → ttyd :7681                  │
   (your domain)   tunnel     │      → ssh guest@ska-site-tui:2222 → the app   │
                              └────────────────────────────────────────────────┘
                              ┌─ Real SSH users (optional, power users) ───────┐
                              │  ssh ska   (uses `cloudflared access ssh`)      │
                              │    → cloudflared → ssh://ska-site-tui:2222      │
                              └────────────────────────────────────────────────┘
```

**No inbound ports are opened.** `cloudflared` dials *out* to Cloudflare, so
there is nothing to forward on your router. The app's SSH port (2222) and the
web terminal (7681) stay internal.

## 1. Configure

```bash
cp .env.example .env
```

Edit `.env`:

| Var | What |
| --- | --- |
| `DEFAULT_LOCALE` | `en` or `zh-TW` — the language new visitors see (they can switch live with **Ctrl+L**). |
| `HALO_BASE_URL` | Your Halo instance, e.g. `http://halo:8090` (see Halo note below). |
| `ENABLE_AI` | `false` (default) hides the AI chat panel entirely. Set `true` **and** fill the `AI_*` vars to enable it. |
| `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` | Any OpenAI-compatible endpoint. Only used when `ENABLE_AI=true`. |
| `HINDSIGHT_API_URL` | Optional memory backend. Leave blank to disable. |

## 2. Build & run

```bash
docker compose up -d --build
```

This starts two containers on an internal network `ska-net`:

- `ska-site-tui` — the app (SSH, internal only).
- `ska-web-terminal` — ttyd, bound to `127.0.0.1:7681` (localhost only).

Sanity check the web terminal locally:

```bash
curl -sI http://localhost:7681        # expect: HTTP/1.1 200 OK
```

## 3. Point your Cloudflare Tunnel at it

Pick the option matching how your tunnel runs.

### A. Dashboard / "token" tunnel (Zero Trust → Networks → Tunnels)

Open your tunnel → **Public Hostnames** → **Add a public hostname**:

| Field | Value |
| --- | --- |
| Subdomain | `term` (or `blog`) |
| Domain | `yourdomain.com` |
| Type | `HTTP` |
| URL | `localhost:7681` *(if cloudflared runs on the host / 1Panel)* |

> If your `cloudflared` runs as a **container**, attach it to `ska-net` (or
> uncomment the `cloudflared` service in `docker-compose.yml`) and use
> `web-terminal:7681` instead of `localhost:7681`.

WebSockets work automatically — no extra setting needed. Visit
`https://term.yourdomain.com` and you should get the TUI.

### B. Self-managed `config.yml` tunnel

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /etc/cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - hostname: term.yourdomain.com
    service: http://localhost:7681      # or http://web-terminal:7681 if on ska-net
  # --- optional: real SSH (see step 4) ---
  - hostname: ssh.yourdomain.com
    service: ssh://localhost:2222        # or ssh://ska-site-tui:2222 if cloudflared is a container on ska-net; the host case must expose 2222 to localhost (see step 4)
  - service: http_status:404
```

Then create the DNS record and restart:

```bash
cloudflared tunnel route dns <YOUR_TUNNEL_ID> term.yourdomain.com
```

## 4. (Optional) Real SSH, still with no open ports

Power users can keep using a real `ssh` client — the tunnel carries SSH out the
same outbound pipe. Two pieces:

**Server side** — expose 2222 to the tunnel:
- If `cloudflared` is a **container on `ska-net`**: it can already reach
  `ssh://ska-site-tui:2222`. Add the `ssh.yourdomain.com` public hostname
  (Type `SSH`, URL `ska-site-tui:2222`).
- If `cloudflared` runs on the **host**: add a localhost binding to the app so
  the host can reach it, then use `ssh://localhost:2222`:
  ```yaml
  # in docker-compose.yml, under ska-site-tui:
  ports:
    - "127.0.0.1:2222:2222"
  ```
  This is still localhost-only — not open to the internet.

**Client side** — the visitor installs `cloudflared` once and adds to `~/.ssh/config`:

```
Host ska
  HostName ssh.yourdomain.com
  ProxyCommand cloudflared access ssh --hostname %h
  User guest
```

Then simply: `ssh ska`. (Any username works; no password.)

> The web terminal covers everyone with zero install. The `cloudflared access`
> route is only for people who specifically want a native SSH client.

## Halo (content source)

The default blog source (`master`) reads from `HALO_BASE_URL`. Make sure your
Halo instance is reachable from the `ska-site-tui` container:

- If Halo also runs in Docker, put it on the **same network** and use its
  service name, e.g. `HALO_BASE_URL=http://halo:8090`.
- The 1Panel + Halo layout is in the README appendix.

Not running Halo yet? The app also ships an **RSS adapter**
(`src/api/adapters/`). You can add an RSS source in
`src/api/adapters/config.ts` and make it the default instead of Halo.

## Language

- Server default: `DEFAULT_LOCALE` in `.env` (`en` or `zh-TW`).
- Per visitor: **Ctrl+L** opens a language picker (English / 繁體中文). The
  choice is per session and also switches the AI assistant's reply language.

## Security notes

- **The web terminal is public and unauthenticated by design** (it's a public
  blog). ttyd runs a *fixed* command (ssh to the app) — visitors cannot escape
  to a host shell.
- **The AI panel is off by default** (`ENABLE_AI=false`). If you enable it,
  remember it costs API tokens on every message and the site is public — an
  abuser can burn your quota. Mitigations: keep it disabled, put a Cloudflare
  **Access** policy / rate limit in front of `term.yourdomain.com`, or use a
  cheap/self-hosted model.
- Keep the `./data/keys` volume so the SSH **host key is stable** across
  restarts (otherwise clients see host-key-changed warnings).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Browser terminal is blank / "connection closed" | Check the app is up: `docker compose logs ska-site-tui`. ttyd only connects when the app's SSH is reachable at `ska-site-tui:2222`. |
| ttyd hangs at a password prompt | The app must run with `auth: "open"` (it does by default). Confirm `web-terminal` env `SSH_USER`/`TARGET_*` are correct. |
| Tunnel 502 / can't reach service | Host cloudflared must use `localhost:7681`; container cloudflared must be on `ska-net` and use `web-terminal:7681`. |
| Layout doesn't resize | Resize the browser window; ttyd forwards the size to ssh → the app re-renders. |
| Posts fail to load | `HALO_BASE_URL` must be reachable from inside the `ska-site-tui` container (service name, not `localhost`). |
