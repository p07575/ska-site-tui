import { watch, utimesSync } from "node:fs";
import { resolve } from "node:path";
import { createServer } from "@opentui/ssh";
import { render, useTerminalDimensions } from "@opentui/solid";

// Auto-restart helper for Bun watch mode on Windows since Bun does not watch files compiled by custom plugins
if (process.execArgv.includes("--watch") || process.execArgv.includes("--hot")) {
  const entryFile = resolve(import.meta.dir, "index.tsx");
  watch(import.meta.dir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    const fullPath = resolve(import.meta.dir, filename);
    if (fullPath === entryFile) return;
    if (filename.startsWith(".") || filename.includes(".git") || filename.includes("node_modules")) return;

    try {
      const now = new Date();
      utimesSync(entryFile, now, now);
    } catch {
      // Ignore transient errors
    }
  });
}
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { ThemeProvider } from "./context/ThemeContext";
import { DialogProvider } from "./ui/dialog";

const PORT = Number(process.env.PORT ?? 2222);

function AppContent({ name }: { name: string }) {
  const terminalDimensions = useTerminalDimensions();
  const sidebarWidth = Math.max(15, Math.floor(terminalDimensions().width * 0.2));

  return (
    <box
      style={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        alignItems: "stretch",
        border: true,
        borderStyle: "single",
      }}
      title=" SKA-SITE://ROOT "
      titleAlignment="left"
    >
      <Header name={name} />
      <box
        style={{
          flexGrow: 1,
          flexShrink: 1,
          flexDirection: "row",
          alignItems: "stretch",
          gap: 0,
        }}
      >
        <Sidebar width={sidebarWidth} />
        <MainContent />
      </box>
    </box>
  );
}

function App({ name }: { name: string }) {
  return (
    <ThemeProvider>
      <DialogProvider>
        <AppContent name={name} />
      </DialogProvider>
    </ThemeProvider>
  );
}

const server = createServer({
  hostKey: { path: "./.keys/host_key" },
  auth: { publicKey: "any" },
}).serve((session) => {
  session.renderer.targetFps = 60;
  render(() => <App name={session.identity.username} />, session.renderer);
  session.renderer.keyInput.on("keypress", (key) => {
    if (key.name === "q" || (key.ctrl && key.name === "c")) session.end();
  });
  session.onClose(() => {});
});

await server.listen(PORT);

process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});
