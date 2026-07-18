# halo-theme — terminal skin for theme-earth

The Halo blog (blog.jasonxiang.net) runs [theme-earth](https://github.com/halo-dev/theme-earth) v1.16.1
reskinned to match the SSH TUI's opencode palette. The skin is:

- `assets/terminal.css` — full reskin (palette, titlebar, prompt nav, `$ ls -lt` headers, statusbar)
- `assets/terminal.js` — DOM injector (titlebar/statusbar elements, strips like/share buttons + home category filter)
- two `<head>` lines injected into every page template, referencing the files above

**This directory is the source of truth.** The copy on the server can be destroyed by any
theme upgrade/reinstall from the Halo console — rebuild and redeploy from here.

## Rebuild + deploy

```bash
bun halo-theme/build.mjs                # build dist/theme-earth-terminal.zip
HALO_TOKEN=pat-xxx bun halo-theme/build.mjs --deploy   # build + upload + verify
bun halo-theme/build.mjs --check-live   # health check: probe every live asset URL
```

`HALO_TOKEN` is a Personal Access Token (Halo Console → Personal Access Tokens) with the
theme-management role. Never commit it. Revoke it after use.

Bump `ASSET_VERSION` in `build.mjs` whenever you change `terminal.css`/`terminal.js`
(it's the browser cache-buster on the `?v=` query).

## The black-page incident (2026-07-19) — why the paranoid checks exist

A previous rebuild extracted the theme to disk on Windows and silently **dropped the two
`vendor~archives~author~...` chunks** (~110-char filenames). Cloudflare kept serving cached
copies, so nothing looked wrong — until the cache expired after a server restart. Then:

1. `index-*.js` imports the vendor chunk → 404 → module graph dies
2. theme-earth ships `<body class="hidden">` and un-hides it from that JS
3. body stays hidden on our `#0a0a0a` background → **completely black page**, container healthy

`build.mjs` therefore patches the zip **entirely in memory** (no filesystem extraction) and
refuses to write output unless every original entry is present, the vendor chunks are
byte-identical, and every page template got the head snippet. `--deploy` additionally probes
every live asset URL for HTTP 200 afterward. If the blog ever looks black again, run
`bun halo-theme/build.mjs --check-live` first — it finds missing assets in seconds.
