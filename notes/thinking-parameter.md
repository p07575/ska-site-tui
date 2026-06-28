# 通过 Halo AI Foundation 插件传递 Thinking 参数

## 问题

小米 MiMo 模型支持 `thinking.type` 参数控制深度思考（enabled/disabled），但这个参数不是 OpenAI 标准参数。我们通过 Halo AI Foundation 插件调用模型，需要在不修改插件源码的情况下传递这个参数。

## 解决方案：providerOptions

Halo AI Foundation 插件的 `TestUiMessageChatRequest` 请求体包含一个 `providerOptions` 字段：

```java
// ModelConsoleEndpoint.java
public static class TestUiMessageChatRequest {
    // ...
    private Map<String, Map<String, Object>> providerOptions;
    // ...
}
```

### 工作原理

1. `providerOptions` 是一个嵌套 Map，**外层 key 是 provider type 字符串**，内层是任意键值对
2. 插件在构建上游 HTTP 请求时，会提取对应 provider type 的子 Map，然后通过 `body.putAll()` **直接合并**到发给 LLM 的请求体中
3. 因此，内层的任何字段都会原样传递到上游 API

### 关键代码链路

```
TestUiMessageChatRequest.providerOptions
  → applyConsoleGenerationOptions()
    → GenerateTextRequest.providerOptions
      → OpenAiExtraBodyOptions.apply()
        → builder.extraBody(Map.copyOf(options))  // 提取子 Map
          → OpenAiCompatibleChatModel.requestBody()
            → body.putAll(options.getExtraBody())  // 直接合并到 HTTP body
```

### Provider Type 对应关系

| Provider Type 字符串 | 说明 | 适配器类型 |
|---|---|---|
| `"openai"` | 官方 OpenAI | `OPENAI_CHAT` |
| **`"openailike"`** | **OpenAI 兼容（通用）** | `OPENAI_CHAT` |
| `"mimo"` | 小米 MiMo（原生） | — |
| `"deepseek"` | DeepSeek | — |
| `"kimi"` | Kimi | — |
| `"doubao"` | 豆包 | — |
| `"ernie"` | 文心一言 | — |
| `"siliconflow"` | 硅基流动 | — |

> ⚠️ 外层 key 必须是 provider type（如 `"openailike"`），**不是** provider name（如 `"openailike-hfz66ahz"`），也不是 adapter type（如 `"openai-chat"`）。

### 为什么 `reasoning` 字段不行

插件有一个 `reasoning` 一等字段，但它的映射逻辑取决于 provider adapter：

- **OpenAI adapter** → 映射为 `reasoning_effort`（OpenAI 风格）
- **Kimi/MiMo adapter** → 映射为 `{"thinking": {"type": "enabled"}}`（小米风格）

因为我们的 provider 是 `openailike`（OpenAI 兼容），插件走的是 OpenAI adapter 逻辑，`reasoning.mode=ENABLED` 被映射成了 `reasoning_effort`，而非 `thinking.type`。所以 `reasoning` 字段对 OpenAI 兼容 provider 无效。

## 实际使用

### 请求体

```json
{
  "id": "chat-tui",
  "messages": [...],
  "providerOptions": {
    "openailike": {
      "thinking": { "type": "disabled" }
    }
  }
}
```

### 开启深度思考

```json
{
  "providerOptions": {
    "openailike": {
      "thinking": { "type": "enabled" }
    }
  }
}
```

### 关闭深度思考

```json
{
  "providerOptions": {
    "openailike": {
      "thinking": { "type": "disabled" }
    }
  }
}
```

### SSE 响应变化

开启思考时，SSE 流中会多出 `reasoning-delta` 事件：

```
data:{"type":"reasoning-start","id":"rsn_xxx"}
data:{"type":"reasoning-delta","delta":"思考内容..."}
data:{"type":"reasoning-end"}
data:{"type":"text-start","id":"txt_xxx"}
data:{"type":"text-delta","delta":"最终回答..."}
data:{"type":"text-end"}
```

关闭思考时，直接输出 `text-delta`，没有 `reasoning-*` 事件。

## 适用场景

这个方法适用于任何通过 Halo AI Foundation 插件调用的 OpenAI 兼容 provider，可以传递任意额外参数到上游 API，例如：

- `thinking.type` — 控制深度思考
- `temperature` — 温度（虽然插件也有标准字段，但 providerOptions 也能传）
- 任何 provider 特有的非标准参数
