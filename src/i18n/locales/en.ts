/**
 * English message catalog — the source of truth for i18n keys.
 * Other locales (e.g. zh-TW) must provide the same set of keys.
 * Placeholders use the `{name}` syntax, filled by the t() function.
 */
export const en = {
  // ── common ──
  "common.unknown": "(unknown)",
  "common.escClose": "Esc to close",

  // ── app bottom bar ──
  "app.bar.theme": "Theme",
  "app.bar.user": "User",
  "app.bar.language": "Language",
  "app.bar.back": "Back/Disconnect",
  "app.bar.quit": "Quit",

  // ── posts / main content ──
  "posts.title": "✦ Posts",
  "posts.count": "{count} posts",
  "posts.loading": "Loading posts…",
  "posts.loadError": "Load failed: {message}",
  "posts.empty": "No posts yet",
  "error.unknownNetwork": "Unknown network error",
  "nav.disconnect": "[ESC] Disconnect",
  "nav.backToList": "[ESC] Back to list",
  "shortcut.theme": "[T] Theme",

  // ── post card ──
  "post.untitled": "Untitled",
  "post.anonymous": "Anonymous",

  // ── sidebar ──
  "sidebar.currentPost": "Current post: {title}",
  "sidebar.updatedAt": "Updated: ",
  "sidebar.locationHome": "Location: Home",
  "sidebar.currentUser": "User: {user}",
  "sidebar.links": " Links ",
  "source.master": "Home",

  // ── AI chat UI ──
  "chat.startHint": "_Type a message to start chatting…_",
  "chat.replying": "AI is replying…",
  "chat.inputPlaceholder": "Type a message (Enter to send)",
  "chat.stop": "⏹ Esc to stop",
  "chat.send": "⏎ Enter to send",
  "chat.noModel": "❌ AI_MODEL is not configured",
  "chat.you": "You",
  "chat.toolResult": "Tool {name} succeeded",

  // ── AI context (prompt-facing; sent to the model, not shown as UI chrome) ──
  "ai.ctx.reading":
    "[Context: The user is currently reading an article. Details: \"{title}\"]",
  "ai.ctx.home": "[Context: Currently on the home page. Article list:]",
  "ai.ctx.switch":
    "[System notice] The context has switched. Answer subsequent questions based on the following content:\n{content}",
  "ai.ctx.ack":
    "Fine, ska already gets it (smug)~ Go ahead and ask whatever you want!",

  // ── theme dialog ──
  "theme.title": "Select theme",
  "theme.hint": "↑↓ Select | Enter Confirm | Esc Close",
  "theme.bugNote": "(Note: an opentui bug hides some UTF-8 text behind dialogs — sorry!)",

  // ── language dialog ──
  "language.title": "Select language",
  "language.hint": "↑↓ Select | Enter Confirm | Esc Close",

  // ── user info dialog ──
  "userinfo.title": "Connection info",
  "userinfo.username": "Username:",
  "userinfo.authMethod": "Auth method:",
  "userinfo.fingerprint": "Key fingerprint:",
  "userinfo.keyAlgorithm": "Key algorithm:",
  "userinfo.remoteAddress": "Remote address:",
  "userinfo.terminalType": "Terminal type:",
  "userinfo.terminalSize": "Terminal size:",
  "userinfo.pty": "PTY:",
  "userinfo.requested": "requested",
  "userinfo.notRequested": "not requested",
  "auth.none": "No auth",
  "auth.password": "Password",
  "auth.keyboardInteractive": "Keyboard-interactive",
  "auth.publickey": "Public key",

  // ── shortcut bar (currently unused, kept for completeness) ──
  "shortcut.themeWord": "Theme",
  "shortcut.quit": "Quit",
};

/** The message shape all locales must implement (keys of en, string values). */
export type Messages = typeof en;

export default en;
