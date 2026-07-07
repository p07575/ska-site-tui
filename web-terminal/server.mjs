// Web terminal for the SKA TUI.
//
// Serves an xterm.js page and bridges each browser WebSocket to a fresh SSH
// session on the app (which authenticates with the "none" method). Unlike ttyd,
// the client (public/term.js) hands browser shortcuts (F11/F5/Ctrl+R/zoom) back
// to the browser instead of swallowing them.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import ssh2 from "ssh2";

const { Client } = ssh2;
const here = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.TTYD_PORT ?? 7681);
const TARGET_HOST = process.env.TARGET_HOST ?? "ska-site-tui";
const TARGET_PORT = Number(process.env.TARGET_PORT ?? 2222);
const SSH_USER = process.env.SSH_USER ?? "guest";

const STATIC = {
  "/": ["public/index.html", "text/html; charset=utf-8"],
  "/term.js": ["public/term.js", "text/javascript; charset=utf-8"],
  "/vendor/xterm.js": ["node_modules/@xterm/xterm/lib/xterm.js", "text/javascript"],
  "/vendor/xterm.css": ["node_modules/@xterm/xterm/css/xterm.css", "text/css"],
  "/vendor/addon-fit.js": ["node_modules/@xterm/addon-fit/lib/addon-fit.js", "text/javascript"],
};

const httpServer = createServer(async (req, res) => {
  const path = (req.url ?? "/").split("?")[0];
  if (path === "/healthz") {
    res.writeHead(200);
    res.end("ok");
    return;
  }
  const entry = STATIC[path];
  if (!entry) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  try {
    const buf = await readFile(join(here, entry[0]));
    res.writeHead(200, { "content-type": entry[1], "cache-control": "no-cache" });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

wss.on("connection", (ws) => {
  const conn = new Client();
  let stream = null;

  ws.on("message", (data, isBinary) => {
    if (!isBinary) {
      // Text frame = control message (window resize).
      try {
        const m = JSON.parse(data.toString());
        if (m.type === "resize" && stream) {
          stream.setWindow(m.rows, m.cols, 0, 0);
        }
      } catch {
        /* ignore malformed control frames */
      }
      return;
    }
    // Binary frame = keystrokes for the shell.
    if (stream) stream.write(data);
  });

  const cleanup = () => {
    try { stream?.end(); } catch {}
    try { conn.end(); } catch {}
  };
  ws.on("close", cleanup);
  ws.on("error", cleanup);

  conn.on("ready", () => {
    conn.shell({ term: "xterm-256color", cols: 120, rows: 40 }, (err, s) => {
      if (err) {
        try { ws.close(); } catch {}
        return;
      }
      stream = s;
      s.on("data", (d) => {
        if (ws.readyState === ws.OPEN) ws.send(d);
      });
      s.on("close", () => {
        try { ws.close(); } catch {}
        conn.end();
      });
    });
  });
  conn.on("error", () => {
    try { ws.close(); } catch {}
  });

  conn.connect({
    host: TARGET_HOST,
    port: TARGET_PORT,
    username: SSH_USER,
    authHandler: ["none"], // the app runs auth: "open"
    hostVerifier: () => true, // internal network, host key not pinned
    readyTimeout: 8000,
    keepaliveInterval: 30000,
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[web-terminal] http+ws :${PORT} -> ssh ${SSH_USER}@${TARGET_HOST}:${TARGET_PORT}`);
});
