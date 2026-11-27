---
title: "消息（message）"
description: "理解 AG-UI 中的消息（message）结构与通信"
---

# 消息（message）

消息（message）构成了 AG-UI 协议中通信的骨干。它们表示用户与 AI Agent 之间的对话
历史，并提供了一种标准化的方式来交换信息，而无论底层使用的是哪种 AI 服务。

## 消息（message）结构

AG-UI 消息采用厂商中立的格式，在保持结构一致的同时确保不同 AI 提供商之间的兼容性。
这使应用可以在不同 AI 服务（如 OpenAI、Anthropic 或自定义模型）之间切换，而无需
修改客户端（client）侧实现。

基本消息结构包括：

```typescript
interface BaseMessage {
  id: string // Unique identifier for the message
  role: string // The role of the sender (user, assistant, system, tool, reasoning)
  content?: string // Optional text content of the message
  name?: string // Optional name of the sender
  encryptedContent?: string // Optional encrypted content for privacy-preserving state continuity
  metadata?: Record<string, any> // Optional extra information attached to the message
}
```

`role` 判别字段可以是 `"user"`、`"assistant"`、`"system"`、`"tool"`、
`"developer"`、`"activity"` 或 `"reasoning"`。具体的消息类型在此基础上
按各自需要的字段进行扩展。

每种消息类型都携带 `metadata`，这是一个可选的、按键开放的对象，
在消息由其事件（event）逐步构建的过程中不断累积。工具调用（tool call）也有自己的 `metadata`。规则见
[Metadata](metadata.md)。

> `encryptedContent` 字段支持隐私保护型工作流：敏感内容（例如推理（reasoning）链）可以跨轮次
> 传递，而无需暴露原始内容。这对于零数据留存（ZDR）合规以及 `store:false`
> 场景尤其有用。

## 消息（message）类型

AG-UI 支持多种消息类型，以适配对话中不同的参与者：

### 用户消息（message）

来自最终用户、发给 Agent 的消息：

```typescript
interface UserMessage {
  id: string
  role: "user"
  content: string | ContentPart[] // Text or multimodal input from the user
  name?: string // Optional user identifier
}

type ContentPart =
  | TextPart
  | ImagePart
  | AudioPart
  | VideoPart
  | DocumentPart

interface DataSource {
  type: "data"
  value: string
  mimeType: string
}

interface UrlSource {
  type: "url"
  value: string
  mimeType?: string
}

interface FileSource {
  type: "file"
  value: string // a handle the provider issued; opaque, never fetched
  provider?: string // who issued it, e.g. "openai"
  mimeType?: string
}

type PartSource = DataSource | UrlSource | FileSource

interface TextPart {
  type: "text"
  text: string
}

interface ImagePart {
  type: "image"
  source: PartSource
  metadata?: Record<string, unknown>
}

interface AudioPart {
  type: "audio"
  source: PartSource
  metadata?: Record<string, unknown>
}

interface VideoPart {
  type: "video"
  source: PartSource
  metadata?: Record<string, unknown>
}

interface DocumentPart {
  type: "document"
  source: PartSource
  metadata?: Record<string, unknown>
}
```

> 在 Python 中，先前的 `BinaryInputContent` 模型已被弃用，并作为兼容路径
> 暂时保留可用。

这种结构在保持传统纯文本输入可用的同时，允许在同一条消息中承载更丰富的负载，
例如图片、音频片段或上传的文件。

### 助手消息（message）

来自 AI 助手、发给用户的消息：

```typescript
interface AssistantMessage {
  id: string
  role: "assistant"
  content?: string // Text response from the assistant (optional if using tool calls)
  name?: string // Optional assistant identifier
  toolCalls?: ToolCall[] // Optional tool calls made by the assistant
  encryptedContent?: string // Optional encrypted content for state continuity
}
```

### 系统消息（message）

提供给 Agent 的指令或上下文：

```typescript
interface SystemMessage {
  id: string
  role: "system"
  content: string // Instructions or context for the agent
  name?: string // Optional identifier
}
```

### 工具消息（message）

工具执行的结果：

```typescript
interface ToolMessage {
  id: string
  role: "tool"
  content: string // Result from the tool execution
  toolCallId: string // ID of the tool call this message responds to
  error?: string // Optional error message if the tool execution failed
  encryptedValue?: string // Optional encrypted reasoning for state continuity
}
```

要点：

- `toolCallId` 将结果关联回原始的工具调用
- 使用 `error` 表示工具执行失败
- 使用 `encryptedValue` 附着与 Agent 如何解读或处理该工具结果（tool result）相关的加密思维链

### 活动（activity）消息（message）

仅存在于前端（frontend）的结构化 UI 消息。用于进度、状态（state），或任何不应被发送给模型的自定义
可视元素：

```typescript
interface ActivityMessage {
  id: string
  role: "activity"
  activityType: string // e.g. "PLAN", "SEARCH", "SCRAPE"
  content: Record<string, any> // Structured payload rendered by the frontend
}
```

要点

- 通过 `ACTIVITY_SNAPSHOT` 和 `ACTIVITY_DELTA` 发出，以支持实时、可更新的 UI
  （清单、步骤、进行中的搜索等）。
- **仅限前端：** 从不转发给 Agent，因此无需过滤，也不会让 LLM 产生混淆。
- **可定制：** 定义你自己的 `activityType` 和 `content`，并渲染与之匹配的 UI 组件。
- **可流式：** 对于长时间运行（run）的操作，可以随时间持续更新。
- 通过把自定义事件转换为可持久化的消息对象，帮助持久化/恢复它们。

### 开发者消息（message）

用于开发或调试的内部消息：

```typescript
interface DeveloperMessage {
  id: string
  role: "developer"
  content: string
  name?: string
}
```

### 推理（reasoning）消息（message）

表示 Agent 内部推理或思维链过程的消息：

```typescript
interface ReasoningMessage {
  id: string
  role: "reasoning"
  content: string // Reasoning content (visible to client)
  encryptedValue?: string // Optional encrypted reasoning for state continuity
}
```

> [!TIP]
> 与活动（activity）消息不同，推理消息旨在表示 Agent 的内部思考过程，并且可以出于隐私
> 目的进行加密，同时会回传给 Agent，以便在后续轮次中进一步处理。

要点：

- 通过 `REASONING_MESSAGE_START`、`REASONING_MESSAGE_CONTENT` 和
  `REASONING_MESSAGE_END` 事件发出。
- **可见性控制：** 内容可以对用户可见（作为摘要），也可以完全加密。
- **加密值：** 使用 `REASONING_ENCRYPTED_VALUE` 事件将加密的思维链附着到消息
  或工具调用上，而不暴露内容。
- **状态连续性：** 加密的推理项可以跨对话轮次传递，而无需暴露原始思维链。
- **隐私优先：** 支持 `store:false` 与零数据留存（ZDR）策略，同时保留推理能力（capability）。
- **与助手消息分离：** 推理与最终响应保持区分，以避免污染对话历史。

流式事件生命周期见 [推理事件](events.md#推理reasoning事件event)。

## 厂商中立性

AG-UI 消息在设计上保持厂商中立，这意味着它们可以轻松地与各 AI 提供商使用的
专有格式相互映射：

```typescript
// Example: Converting AG-UI messages to OpenAI format
const openaiMessages = agUiMessages
  .filter((msg) => ["user", "system", "assistant"].includes(msg.role))
  .map((msg) => ({
    role: msg.role as "user" | "system" | "assistant",
    content: msg.content || "",
    // Map tool calls if present
    ...(msg.role === "assistant" && msg.toolCalls
      ? {
          tool_calls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: tc.type,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        }
      : {}),
  }))
```

这种抽象使 AG-UI 能够充当通用接口，而无论底层 AI 服务是什么。

## 消息（message）同步

消息可以通过两种主要机制在客户端与服务端（server）之间同步：

### 完整快照（snapshot）

`MESSAGES_SNAPSHOT` 事件提供对话中所有消息的完整视图：

```typescript
interface MessagesSnapshotEvent {
  type: EventType.MESSAGES_SNAPSHOT
  messages: Message[] // Complete array of all messages
}
```

它通常用于：

- 初始化对话时
- 连接中断之后
- 发生重大状态变化时
- 确保客户端与服务端同步

### 流式消息（message）

对于实时交互，新消息可以边生成边流式发送：

1. **开始一条消息**：表示正在创建一条新消息

   ```typescript
   interface TextMessageStartEvent {
     type: EventType.TEXT_MESSAGE_START
     messageId: string
     role: string
   }
   ```

2. **流式发送内容**：内容块一就绪就发送

   ```typescript
   interface TextMessageContentEvent {
     type: EventType.TEXT_MESSAGE_CONTENT
     messageId: string
     delta: string // Text chunk to append
   }
   ```

3. **结束一条消息**：发出该消息已完成的信号
   ```typescript
   interface TextMessageEndEvent {
     type: EventType.TEXT_MESSAGE_END
     messageId: string
   }
   ```

这种流式方式提供了具备即时反馈的响应式用户体验。

## 消息（message）中的工具集成

AG-UI 消息优雅地集成了工具使用，使 Agent 能够执行操作并处理其结果：

### 工具调用（tool call）

工具调用内嵌于助手消息中：

```typescript
interface ToolCall {
  id: string // Unique ID for this tool call
  type: "function" // Type of tool call
  function: {
    name: string // Name of the function to call
    arguments: string // JSON-encoded string of arguments
  }
}
```

带工具调用的助手消息示例：

```typescript
{
  id: "msg_123",
  role: "assistant",
  content: "I'll help you with that calculation.",
  toolCalls: [
    {
      id: "call_456",
      type: "function",
      function: {
        name: "calculate",
        arguments: '{"expression": "24 * 7"}'
      }
    }
  ]
}
```

### 工具结果（tool result）

工具执行的结果以工具消息表示：

```typescript
{
  id: "result_789",
  role: "tool",
  content: "168",
  toolCallId: "call_456" // References the original tool call
}
```

这样形成清晰的工具使用链路：

1. 助手请求一次工具调用
2. 工具执行并返回结果
3. 助手可以引用该结果并据此响应

## 流式工具调用（tool call）

与文本消息类似，工具调用也可以流式发出，以实时呈现 Agent 正在执行的操作：

1. **开始一次工具调用**：

   ```typescript
   interface ToolCallStartEvent {
     type: EventType.TOOL_CALL_START
     toolCallId: string
     toolCallName: string
     parentMessageId?: string // Optional link to parent message
   }
   ```

2. **流式发送参数**：

   ```typescript
   interface ToolCallArgsEvent {
     type: EventType.TOOL_CALL_ARGS
     toolCallId: string
     delta: string // JSON fragment to append to arguments
   }
   ```

3. **结束一次工具调用**：
   ```typescript
   interface ToolCallEndEvent {
     type: EventType.TOOL_CALL_END
     toolCallId: string
   }
   ```

这使前端能够在 Agent 构建其推理的过程中，逐步展示正在被调用的工具。

## 实践示例

下面是一个包含工具使用的完整对话示例：

```typescript
// Conversation history
;[
  // User query
  {
    id: "msg_1",
    role: "user",
    content: "What's the weather in New York?",
  },

  // Assistant response with tool call
  {
    id: "msg_2",
    role: "assistant",
    content: "Let me check the weather for you.",
    toolCalls: [
      {
        id: "call_1",
        type: "function",
        function: {
          name: "get_weather",
          arguments: '{"location": "New York", "unit": "celsius"}',
        },
      },
    ],
  },

  // Tool result
  {
    id: "result_1",
    role: "tool",
    content:
      '{"temperature": 22, "condition": "Partly Cloudy", "humidity": 65}',
    toolCallId: "call_1",
  },

  // Assistant's final response using tool results
  {
    id: "msg_3",
    role: "assistant",
    content:
      "The weather in New York is partly cloudy with a temperature of 22°C and 65% humidity.",
  },
]
```

## 结论

AG-UI 中的消息结构在保持厂商中立的同时，实现了复杂的对话式 AI 体验。通过标准化
消息的表示、同步与流式发送方式，AG-UI 为实现在人类与 Agent 之间的交互式通信
提供了一致的方式，而无论底层 AI 服务是什么。

该系统既支持简单的文本交换，也支持复杂的基于工具的工作流，同时兼顾实时响应性与
高效的数据传输。
