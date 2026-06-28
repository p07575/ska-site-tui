import crypto from "node:crypto";

const HALO_BASE_URL = process.env.HALO_BASE_URL ?? "http://localhost:8090";
const HALO_USERNAME = process.env.HALO_USERNAME ?? "";
const HALO_PASSWORD = process.env.HALO_PASSWORD ?? "";
const CHAT_MODEL_ID = process.env.CHAT_MODEL_ID ?? "";

// ── Cookie 管理 ──────────────────────────────────────────────────────

const cookieStore = new Map<string, string>();

function parseSetCookies(headers: Headers) {
  // 遍历所有 header，找到 set-cookie（不区分大小写）
  // Bun/Fetch API 可能不支持 getSetCookie()，用 forEach 兼容
  headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      const pair = value.split(";")[0]?.trim();
      if (!pair) return;
      const eq = pair.indexOf("=");
      if (eq === -1) return;
      cookieStore.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  });
}

function getCookieHeader(): string {
  return [...cookieStore.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

// ── RSA 加密（移植自 halo.py）────────────────────────────────────────

function rsaEncryptBase64(pubKeyPemBase64: string, plainText: string): string {
  const pemDER = Buffer.from(pubKeyPemBase64, "base64");
  const publicKey = crypto.createPublicKey({
    key: pemDER,
    format: "der",
    type: "spki",
  });
  const encrypted = crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(plainText, "utf-8")
  );
  return encrypted.toString("base64");
}

// ── 登录（参考 halo.py auto_login_halo）──────────────────────────────

let loggedIn = false;

export async function login(): Promise<void> {
  if (loggedIn) return;
  if (!HALO_USERNAME || !HALO_PASSWORD) {
    console.error("[chat] HALO_USERNAME / HALO_PASSWORD not configured");
    return;
  }

  // 1) 获取登录页 → 提取公钥 + CSRF token
  const loginPageResp = await fetch(`${HALO_BASE_URL}/login`);
  parseSetCookies(loginPageResp.headers);
  console.log("[chat] Login page cookies:", [...cookieStore.entries()]);
  const loginPageHtml = await loginPageResp.text();

  // 公钥在 JS 字符串中用 \/ 转义了 /，需要匹配并还原
  const pubKeyMatch = loginPageHtml.match(
    /const publicKey = "([^"]+)"/
  );
  if (!pubKeyMatch) {
    throw new Error("Cannot extract RSA public key from login page");
  }
  const pubKeyB64 = (pubKeyMatch[1] as string).replace(/\\\//g, "/");

  const csrfMatch = loginPageHtml.match(/name="_csrf" value="([^"]+)"/);
  const csrfToken = csrfMatch?.[1] ?? "";
  console.log("[chat] CSRF token:", csrfToken ? csrfToken.slice(0, 20) + "..." : "(empty)");

  // 2) RSA 加密密码
  const encryptedPwd = rsaEncryptBase64(pubKeyB64, HALO_PASSWORD);
  console.log("[chat] Encrypted password length:", encryptedPwd.length);

  // 3) POST /login（form-urlencoded）
  const formBody = new URLSearchParams({
    username: HALO_USERNAME,
    password: encryptedPwd,
    _csrf: csrfToken,
    "remember-me": "true",
  });

  const loginResp = await fetch(`${HALO_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: getCookieHeader(),
    },
    body: formBody.toString(),
    redirect: "manual",
  });

  parseSetCookies(loginResp.headers);
  console.log("[chat] Login response:", loginResp.status, loginResp.statusText);
  console.log("[chat] Post-login cookies:", [...cookieStore.entries()].map(([k]) => k));

  // 即使 302 也算成功（重定向说明登录通过）
  if (loginResp.status === 200 || loginResp.status === 302) {
    loggedIn = true;
  } else {
    throw new Error(
      `Login failed: ${loginResp.status} ${await loginResp.text()}`
    );
  }
}

// ── 类型定义 ────────────────────────────────────────────────────────

export interface ChatApiMessage {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; id: string; text: string }[];
}

export interface StreamCallbacks {
  onChunk: (delta: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

// ── 辅助 ────────────────────────────────────────────────────────────

let nextId = 1;
function generateId(): string {
  return `msg-${Date.now()}-${nextId++}`;
}

export function getChatModelId(): string {
  return CHAT_MODEL_ID;
}

// ── 查询模型列表 ────────────────────────────────────────────────────

export async function listModels(): Promise<
  { name: string; displayName: string; modelId: string }[]
> {
  await login();

  const resp = await fetch(
    `${HALO_BASE_URL}/apis/console.api.aifoundation.halo.run/v1alpha1/models`,
    {
      headers: {
        Accept: "application/json",
        Cookie: getCookieHeader(),
      },
    }
  );

  if (!resp.ok) {
    throw new Error(`Failed to list models: ${resp.status}`);
  }

  const models = await resp.json();
  return models.map((m: any) => ({
    name: m.metadata.name,
    displayName: m.spec.displayName ?? m.metadata.name,
    modelId: m.spec.modelId ?? "",
  }));
}

// ── SSE 流式对话 ────────────────────────────────────────────────────

export async function streamChat(
  modelId: string,
  messages: ChatApiMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  await login();

  const url = `${HALO_BASE_URL}/apis/console.api.aifoundation.halo.run/v1alpha1/models/${modelId}/test-chat/ui-message/stream`;
  console.log("[chat] SSE URL:", url);

  const body = JSON.stringify({
    id: "chat-tui",
    messages,
    system: SYSTEM_PROMPT,
    providerOptions: {
      openailike: {
        thinking: { type: "disabled" },
      },
    },
  });
  console.log("[chat] SSE body:", body.slice(0, 200));

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        Cookie: getCookieHeader(),
      },
      body,
      signal,
    });
  } catch (err: any) {
    if (err.name === "AbortError") return;
    callbacks.onError(err);
    return;
  }

  if (!resp.ok) {
    callbacks.onError(
      new Error(`SSE request failed: ${resp.status} ${resp.statusText}`)
    );
    return;
  }

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data:[DONE]") continue;

        if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const event = JSON.parse(jsonStr);
            console.log("[chat] SSE event:", event.type, event.delta?.slice(0, 30), JSON.stringify(event).slice(0, 200));
            if (event.type === "text-delta" && event.delta) {
              console.log("[Debug Chunk]:", JSON.stringify(event.delta));
              callbacks.onChunk(event.delta);
            } else if (event.type === "finish") {
              callbacks.onDone();
              return;
            } else if (event.type === "error") {
              callbacks.onError(new Error(event.errorText || event.message || event.error || JSON.stringify(event)));
              return;
            }
          } catch {
            // 忽略无法解析的行
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name !== "AbortError") {
      callbacks.onError(err);
    }
  } finally {
    callbacks.onDone();
  }
}

// ── 消息格式转换 ────────────────────────────────────────────────────

const SYSTEM_PROMPT = `please use markdown format`;

export function toApiMessages(
  history: { role: "user" | "assistant"; content: string }[],
  context?: string
): ChatApiMessage[] {
  return history.map((msg, i) => {
    let text = msg.content;
    if (i === 0 && msg.role === "user" && context) {
      text = `${context}\n\n---\n\n${msg.content}`;
    }
    return {
      id: generateId(),
      role: msg.role,
      parts: [{ type: "text", id: generateId(), text }],
    };
  });
}

export { SYSTEM_PROMPT };
