import {
  createContext,
  useContext,
  createSignal,
  type ParentProps,
  type Accessor,
} from "solid-js";
import { streamChat, getAIModel, type StreamCallbacks } from "../api/chat";


interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatContextValue {
  markdownContent: Accessor<string>;
  isStreaming: Accessor<boolean>;
  sendMessage: (text: string) => void;
  abort: () => void;
  clearMessages: () => void;
  /** 设置 AI 上下文：key 变化时下一条消息会自动注入 context */
  setContext: (key: string, context: string) => void;
}

const ChatContext = createContext<ChatContextValue>();

export function ChatProvider(props: ParentProps) {
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [markdownContent, setMarkdownContent] = createSignal("");
  const [isStreaming, setIsStreaming] = createSignal(false);
  //因为这里的数据还要提供给ui，所以不能使用普通变量。
  let abortController: AbortController | null = null;
  let streamingIndex = -1;

  // ── 上下文管理 ──
  let currentContextKey = "";
  let currentContextContent = "";
  let contextDirty = false;

  function setContext(key: string, context: string) {
    if (key !== currentContextKey) {
      contextDirty = true;
    }
    currentContextKey = key;
    currentContextContent = context;
  }

  function rebuildMarkdown(msgs: ChatMessage[]): string {
    let md = "";
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i]!;
      if (m.role === "user") {
        md += `> **You:** ${m.content}\n\n`;
      } else {
        md += m.content + "\n\n";
      }
    }
    return md;
  }

  function sendMessage(text: string) {
    if (!text.trim() || isStreaming()) return;

    const model = getAIModel();
    if (!model) {
      console.error("[chat] AI_MODEL is not configured");
      setMarkdownContent((prev) => prev + "\n\n> ❌ AI_MODEL 未配置\n\n");
      return;
    }

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };

    // 先算出历史部分的 markdown 基础串
    const baseMarkdown = rebuildMarkdown([...messages(), userMsg]);

    setMessages((prev) => {
      const next = [...prev, userMsg, assistantMsg];
      streamingIndex = next.length - 1;
      return next;
    });
    setIsStreaming(true);
    setMarkdownContent(baseMarkdown);

    // 独立的流式字符串缓冲区 —— 不碰 messages 数组
    let currentAssistantText = "";

    // 构建 API 历史（不含占位的 assistant）
    const history = messages()
      .filter((_, i) => i !== streamingIndex)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // 如果上下文发生变化，在用户消息前注入上下文切换消息
    if (contextDirty && currentContextContent) {
      const contextSwitchMsg = {
        role: "user" as const,
        content: `【系统通知】上下文已切换，请基于以下内容回答后续问题：\n${currentContextContent}`,
      };
      const contextAckMsg = {
        role: "assistant" as const,
        content: "好的，ska 已经明白了(嚣张)~有什么想问的就尽管说吧！",
      };
      history.push(contextSwitchMsg, contextAckMsg);
    }
    contextDirty = false;

    abortController = new AbortController();

    const callbacks: StreamCallbacks = {
      onChunk(delta: string) {
        currentAssistantText += delta;
        setMarkdownContent(baseMarkdown + currentAssistantText);
      },
      onDone() {
        setMessages((prev) => {
          const next = [...prev];
          const target = next[streamingIndex];
          if (target) {
            next[streamingIndex] = {
              role: target.role,
              content: currentAssistantText,
            };
          }
          return next;
        });
        setMarkdownContent(rebuildMarkdown(messages()));
        setIsStreaming(false);
        abortController = null;
        streamingIndex = -1;
      },
      onError(error: Error) {
        console.error("[chat] stream error:", error.message);
        setMessages((prev) => {
          const next = [...prev];
          const target = next[streamingIndex];
          if (target) {
            next[streamingIndex] = {
              role: target.role,
              content: currentAssistantText || `❌ ${error.message}`,
            };
          }
          return next;
        });
        setMarkdownContent(rebuildMarkdown(messages()));
        setIsStreaming(false);
        abortController = null;
        streamingIndex = -1;
      },
    };

    streamChat(
      history,
      callbacks,
      abortController.signal,
    );
  }

  function abort() {
    if (abortController) {
      abortController.abort();
      abortController = null;
      setIsStreaming(false);
      streamingIndex = -1;
    }
  }

  function clearMessages() {
    setMessages([]);
    setMarkdownContent("");
  }

  return (
    <ChatContext.Provider
      value={{
        markdownContent,
        isStreaming,
        sendMessage,
        abort,
        clearMessages,
        setContext,
      }}
    >
      {props.children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
}
