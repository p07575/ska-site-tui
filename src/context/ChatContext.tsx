import {
  createContext,
  useContext,
  createSignal,
  type ParentProps,
  type Accessor,
} from "solid-js";
import {
  streamChat,
  toApiMessages,
  getChatModelId,
  type StreamCallbacks,
} from "../api/chat";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  isStreaming: boolean;
}

interface ChatContextValue {
  messages: Accessor<ChatMessage[]>;
  isStreaming: Accessor<boolean>;
  sendMessage: (text: string) => void;
  abort: () => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextValue>();

let msgId = 0;

export function ChatProvider(props: ParentProps) {
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = createSignal(false);
  let abortController: AbortController | null = null;

  function sendMessage(text: string) {
    if (!text.trim() || isStreaming()) return;

    const modelId = getChatModelId();
    console.log("[chat] modelId:", modelId);
    if (!modelId) {
      console.error("[chat] CHAT_MODEL_ID is not configured");
      // 显示错误消息给用户
      setMessages((prev) => [...prev, {
        id: ++msgId,
        role: "assistant",
        content: "❌ CHAT_MODEL_ID 环境变量未配置",
        isStreaming: false,
      }]);
      return;
    }

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: ++msgId,
      role: "user",
      content: text.trim(),
      isStreaming: false,
    };

    // 添加占位的 assistant 消息
    const assistantMsg: ChatMessage = {
      id: ++msgId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // 构建 API 消息历史（排除占位消息）
    const history = messages()
      .filter((m) => m.id !== assistantMsg.id)
      .map((m) => ({ role: m.role, content: m.content }));

    const apiMessages = toApiMessages(history);
    abortController = new AbortController();

    const callbacks: StreamCallbacks = {
      onChunk(delta: string) {
        console.log("[chat] chunk:", delta.slice(0, 50));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: m.content + delta }
              : m
          )
        );
      },
      onDone() {
        console.log("[chat] stream done");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
          )
        );
        setIsStreaming(false);
        abortController = null;
      },
      onError(error: Error) {
        console.error("[chat] stream error:", error.message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: m.content || `❌ Error: ${error.message}`,
                  isStreaming: false,
                }
              : m
          )
        );
        setIsStreaming(false);
        abortController = null;
      },
    };

    streamChat(modelId, apiMessages, callbacks, abortController.signal);
  }

  function abort() {
    if (abortController) {
      abortController.abort();
      abortController = null;
      setIsStreaming(false);
      // 标记最后一条 assistant 消息为非流式
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && last.isStreaming) {
          return prev.map((m) =>
            m.id === last.id ? { ...m, isStreaming: false } : m
          );
        }
        return prev;
      });
    }
  }

  function clearMessages() {
    setMessages([]);
  }

  return (
    <ChatContext.Provider
      value={{ messages, isStreaming, sendMessage, abort, clearMessages }}
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
