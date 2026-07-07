# Web terminal: an xterm.js page bridged to the app's SSH server over a
# WebSocket. This is what Cloudflare Tunnel exposes publicly (HTTP travels fine
# through a tunnel; raw SSH does not). Unlike ttyd, the client hands browser
# shortcuts (F11 / F5 / Ctrl+R / zoom) back to the browser.
FROM node:20-slim

WORKDIR /app

COPY package.json ./
# ssh2's native optional deps (cpu-features) need a toolchain; skip them — ssh2
# falls back to its pure-JS crypto, which is what we use here.
RUN npm install --omit=optional --no-audit --no-fund

COPY server.mjs ./
COPY public ./public

EXPOSE 7681
ENV TTYD_PORT=7681

CMD ["node", "server.mjs"]
