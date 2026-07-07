# Web terminal: serves the SKA TUI over HTTP/WebSocket (xterm.js) by
# proxying to the app's SSH server. This is what Cloudflare Tunnel exposes
# publicly — HTTP travels fine through a tunnel, raw SSH does not.
FROM alpine:3.20

# ttyd lives in the Alpine "community" repo; openssh-client is in "main".
RUN echo "https://dl-cdn.alpinelinux.org/alpine/v3.20/community" >> /etc/apk/repositories \
 && apk add --no-cache ttyd openssh-client

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 7681

ENTRYPOINT ["/entrypoint.sh"]
