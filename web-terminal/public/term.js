/* Client for the SKA web terminal. Renders xterm.js, bridges keystrokes over a
   WebSocket to the SSH-backed TUI, and — crucially — lets the BROWSER keep its
   own shortcuts (F11 fullscreen, F5/Ctrl+R reload, zoom, copy/paste) instead of
   swallowing them the way ttyd did. */
(function () {
  "use strict";

  var term = new Terminal({
    fontSize: 16,
    fontFamily:
      'ui-monospace, "SF Mono", "JetBrains Mono", "Cascadia Code", Menlo, Consolas, "Liberation Mono", monospace',
    cursorBlink: true,
    allowProposedApi: true,
    scrollback: 2000,
    theme: {
      // opencode palette — matches the SSH TUI
      background: "#0a0a0a",
      foreground: "#eeeeee",
      cursor: "#fab283",
      cursorAccent: "#0a0a0a",
      selectionBackground: "#3c3c3c",
      black: "#0a0a0a",
      red: "#e06c75",
      green: "#7fd88f",
      yellow: "#e5c07b",
      blue: "#5c9cf5",
      magenta: "#9d7cd8",
      cyan: "#56b6c2",
      white: "#eeeeee",
      brightBlack: "#606060",
      brightRed: "#e06c75",
      brightGreen: "#7fd88f",
      brightYellow: "#e5c07b",
      brightBlue: "#5c9cf5",
      brightMagenta: "#9d7cd8",
      brightCyan: "#56b6c2",
      brightWhite: "#ffffff",
    },
  });

  var fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById("terminal"));
  fit.fit();
  term.focus();

  // Hand browser-level shortcuts back to the browser; send everything else to
  // the terminal. Returning false = "xterm, don't handle this key."
  term.attachCustomKeyEventHandler(function (e) {
    if (e.type !== "keydown") return true;
    if (e.key === "F5" || e.key === "F11" || e.key === "F12") return false;
    if (e.ctrlKey && !e.altKey) {
      var k = (e.key || "").toLowerCase();
      if (k === "r") return false; // reload
      if (["+", "-", "=", "0"].indexOf(e.key) !== -1) return false; // zoom
      if (e.shiftKey && (k === "c" || k === "v")) return false; // copy / paste
    }
    return true;
  });

  var enc = new TextEncoder();
  var proto = location.protocol === "https:" ? "wss" : "ws";
  var ws = new WebSocket(proto + "://" + location.host + "/ws");
  ws.binaryType = "arraybuffer";

  function sendResize() {
    try { fit.fit(); } catch (e) {}
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    }
  }

  ws.onopen = function () {
    sendResize();
    term.focus();
  };
  ws.onmessage = function (ev) {
    if (typeof ev.data === "string") return; // no text frames from server yet
    term.write(new Uint8Array(ev.data));
  };
  ws.onclose = function () {
    term.write("\r\n\x1b[38;5;180m— disconnected — press F5 to reconnect —\x1b[0m\r\n");
  };

  // Keystrokes as binary frames; resize as text frames.
  term.onData(function (d) {
    if (ws.readyState === 1) ws.send(enc.encode(d));
  });
  term.onResize(function () {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    }
  });
  window.addEventListener("resize", sendResize);
  window.addEventListener("focus", function () { term.focus(); });
})();
