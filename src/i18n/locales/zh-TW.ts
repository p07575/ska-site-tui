import type { Messages } from "./en";

/**
 * 繁體中文（台灣）訊息目錄。
 * 鍵必須與 en.ts 完全一致。
 */
export const zhTW: Messages = {
  // ── common ──
  "common.unknown": "(未知)",
  "common.escClose": "Esc 關閉",

  // ── app bottom bar ──
  "app.bar.theme": "主題",
  "app.bar.user": "使用者",
  "app.bar.language": "語言",
  "app.bar.back": "返回",
  "app.bar.quit": "退出",

  // ── posts / main content ──
  "posts.title": "✦ 文章列表",
  "posts.count": "共 {count} 篇",
  "posts.loading": "正在讀取文章列表…",
  "posts.loadError": "載入失敗：{message}",
  "posts.empty": "暫無文章",
  "error.unknownNetwork": "未知網路錯誤",
  "nav.disconnect": "[Ctrl+D] 斷線",
  "nav.backToList": "[ESC] 返回首頁",
  "shortcut.theme": "[T] 主題切換",
  "shortcut.user": "[U] 使用者",
  "shortcut.language": "[L] 語言",

  // ── post card ──
  "post.untitled": "無標題",
  "post.anonymous": "匿名",

  // ── sidebar ──
  "sidebar.currentPost": "目前文章：{title}",
  "sidebar.updatedAt": "更新時間：",
  "sidebar.locationHome": "目前位置：首頁",
  "sidebar.currentUser": "目前使用者：{user}",
  "sidebar.links": " 友情連結 ",
  "source.master": "回到主站",

  // ── AI chat UI ──
  "chat.startHint": "_輸入訊息開始對話…_",
  "chat.replying": "AI 正在回覆…",
  "chat.inputPlaceholder": "輸入訊息（Enter 送出）",
  "chat.stop": "⏹ Esc 停止",
  "chat.send": "⏎ Enter 送出",
  "chat.noModel": "❌ 尚未設定 AI_MODEL",
  "chat.you": "你",
  "chat.toolResult": "工具 {name} 執行成功",

  // ── AI context（提示詞用；送給模型，非畫面文字）──
  "ai.ctx.reading": "[上下文：使用者正在閱讀文章。文章詳細資訊：「{title}」]",
  "ai.ctx.home": "[上下文：目前在首頁，文章列表如下]",
  "ai.ctx.switch": "【系統通知】上下文已切換，請根據以下內容回答後續問題：\n{content}",
  "ai.ctx.ack": "好的，ska 已經明白了(囂張)～有什麼想問的就儘管說吧！",

  // ── theme dialog ──
  "theme.title": "選擇主題",
  "theme.hint": "↑↓ 選擇 | Enter 確認 | Esc 關閉",
  "theme.bugNote": "(opentui 有個 bug，對話框後方的 UTF-8 文字會看不到，敬請見諒～)",

  // ── language dialog ──
  "language.title": "選擇語言",
  "language.hint": "↑↓ 選擇 | Enter 確認 | Esc 關閉",

  // ── user info dialog ──
  "userinfo.title": "連線使用者資訊",
  "userinfo.username": "使用者名稱：",
  "userinfo.authMethod": "認證方式：",
  "userinfo.fingerprint": "公鑰指紋：",
  "userinfo.keyAlgorithm": "金鑰演算法：",
  "userinfo.remoteAddress": "遠端位址：",
  "userinfo.terminalType": "終端類型：",
  "userinfo.terminalSize": "終端尺寸：",
  "userinfo.pty": "PTY：",
  "userinfo.requested": "已請求",
  "userinfo.notRequested": "未請求",
  "auth.none": "無認證",
  "auth.password": "密碼認證",
  "auth.keyboardInteractive": "鍵盤互動認證",
  "auth.publickey": "公鑰認證",

  // ── shortcut bar (目前未使用，保留以求完整) ──
  "shortcut.themeWord": "主題",
  "shortcut.quit": "退出",
};

export default zhTW;
