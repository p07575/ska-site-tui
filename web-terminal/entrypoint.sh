#!/bin/sh
# Launch a browser terminal (ttyd) that opens a fresh SSH session to the SKA
# TUI app for every visitor. The app authenticates in "open" mode (any user,
# no password), so ssh connects non-interactively.
set -eu

TARGET_HOST="${TARGET_HOST:-ska-site-tui}"
TARGET_PORT="${TARGET_PORT:-2222}"
SSH_USER="${SSH_USER:-guest}"
TTYD_PORT="${TTYD_PORT:-7681}"

echo "[web-terminal] ttyd :${TTYD_PORT} -> ssh ${SSH_USER}@${TARGET_HOST}:${TARGET_PORT}"

exec ttyd \
  --port "${TTYD_PORT}" \
  --writable \
  --client-option 'disableLeaveAlert=true' \
  --client-option 'theme={"background":"#0d1117"}' \
  ssh -tt \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -o PreferredAuthentications=none,keyboard-interactive,password \
    -o NumberOfPasswordPrompts=0 \
    -o ConnectTimeout=8 \
    -o ServerAliveInterval=30 \
    -p "${TARGET_PORT}" \
    "${SSH_USER}@${TARGET_HOST}"
