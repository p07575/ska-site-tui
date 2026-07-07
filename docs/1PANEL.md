# Deploy the terminal UI on 1Panel (Cloudflare Tunnel, no open ports)

This runs `ska-site-tui` (the SSH/terminal front end) next to your Halo on the
same server, reachable at **`sblog.jasonxiang.net`** through your existing
Cloudflare Tunnel — **without publishing a single port**.

```
Visitors ──► https://sblog.jasonxiang.net  (Cloudflare)
             └► cloudflared (already running, on 1panel-network)
                └► ska-web-terminal:7681      (ttyd, HTTP/WebSocket)
                   └► ssh ska-site-tui:2222   (OpenTUI blog, internal only)
                      └► reads posts from your Halo container
```

Nothing here binds a host port. cloudflared dials **out**, so there's nothing to
forward and nothing new exposed on your box.

## 1. Put the code on the server

SSH into the server (or use 1Panel's terminal) and clone the repo where your
other apps live:

```bash
cd /opt/1panel/apps
git clone https://github.com/p07575/ska-site-tui.git
cd ska-site-tui
```

To pull future updates later: `git pull` in that folder, then re-run the deploy.

## 2. Configure `.env`

```bash
cp .env.example .env
```

Set these:

| Var | Value |
| --- | --- |
| `HALO_BASE_URL` | Your Halo **container** on the shared network, e.g. `http://1Panel-halo-XXXX:8090`. Find the name with `docker ps --format '{{.Names}}' \| grep -i halo`. |
| `DEFAULT_LOCALE` | `en` |
| `ENABLE_AI` | `false` (leave the AI panel off) |

## 3. Confirm the shared network name

The compose file attaches to `1panel-network` (external) so this app can reach
Halo and cloudflared by name. Verify it exists:

```bash
docker network ls | grep 1panel
```

If your network is named differently, change `1panel-network` in
`docker-compose.yml` to match.

## 4. Deploy

**Via 1Panel:** Containers → **Compose** → Create → point it at
`/opt/1panel/apps/ska-site-tui/docker-compose.yml` (or paste it). 1Panel builds
and runs it and shows it in your app/compose list.

**Or via CLI:**

```bash
docker compose up -d --build
```

Check it's healthy and the web terminal answers **from inside the network**
(there's no host port, so test from another container):

```bash
docker logs ska-site-tui           # should show "@opentui/ssh ▸ ssh://…:2222"
docker exec ska-web-terminal wget -qO- http://ska-site-tui:2222 >/dev/null; echo "ssh reachable: $?"
```

## 5. Point the tunnel at it — `sblog.jasonxiang.net`

Your cloudflared must share `1panel-network` (it already reaches Halo, so it
likely does). Add a public hostname:

**Dashboard tunnel** (Zero Trust → Networks → Tunnels → your tunnel → Public
Hostnames → Add):

| Field | Value |
| --- | --- |
| Subdomain | `sblog` |
| Domain | `jasonxiang.net` |
| Type | `HTTP` |
| URL | `ska-web-terminal:7681` (container cloudflared) **or** `localhost:7681` (host cloudflared) |

- **cloudflared is a container** on `1panel-network` → use `http://ska-web-terminal:7681`.
- **cloudflared runs on the host** → use `http://localhost:7681`. The compose binds
  the web terminal to `127.0.0.1:7681` for exactly this (loopback only — not
  exposed to the internet), so the same pattern as your `blog → localhost:8090` works.

WebSockets work automatically. Open `https://sblog.jasonxiang.net` → the blog in
a browser terminal.

**Or `config.yml` tunnel** — add an ingress rule:

```yaml
ingress:
  - hostname: sblog.jasonxiang.net
    service: http://ska-web-terminal:7681
  # ...your existing blog.jasonxiang.net rule...
  - service: http_status:404
```

## 6. (Optional) Real SSH clients, still no open ports

Power users can use a native `ssh` client over the same tunnel. Add an SSH public
hostname `ssh.jasonxiang.net` → `ssh://ska-site-tui:2222`, then they run:

```
# ~/.ssh/config  (client side; needs cloudflared installed)
Host jxblog
  HostName ssh.jasonxiang.net
  ProxyCommand cloudflared access ssh --hostname %h
  User guest
```

Then just `ssh jxblog`. Any username, no password. The web terminal already
covers everyone with zero install — this is only for SSH purists.

## Updating

```bash
cd /opt/1panel/apps/ska-site-tui
git pull
docker compose up -d --build
```

## Notes

- **No ports published.** SSH (2222) and ttyd (7681) are `expose`-only, reachable
  only on the Docker network — by the web terminal and cloudflared.
- **Host key persists** via `./data/keys`, so SSH clients don't get
  host-key-changed warnings across restarts.
- **AI is off** (`ENABLE_AI=false`); the assistant panel won't render and makes
  no API calls.
- The blog content comes from Halo, so anything you publish there shows up in the
  terminal UI automatically.
