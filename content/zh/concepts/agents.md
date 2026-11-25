---
title: "Agent"
description: "了解 Agent User Interaction Protocol 中的 Agent"
---

# Agent

Agent 是 AG-UI 协议中处理请求并生成响应的核心组件。无论底层实现如何，Agent
都为前端（front-end）应用建立了一种标准化的方式，使其能够通过一致的接口与 AI 服务通信。

## 什么是 Agent？

在 AG-UI 中，Agent 是一个类，它：

1. 管理对话状态（state）与消息（message）历史
2. 处理传入的消息（message）与上下文
3. 通过事件（event）驱动的流式接口生成响应
4. 遵循标准化的通信协议

Agent 可以实现为与任何 AI 服务连接，包括：

- 大语言模型（LLM），如 GPT-4 或 Claude
- 自定义 AI 系统
- 检索增强生成（RAG）系统
- 多 Agent 系统

## Agent 架构

AG-UI 中的所有 Agent 都继承 `AbstractAgent` 类，该类为以下方面提供基础：

- 状态（state）管理
- 消息（message）历史追踪
- 事件（event）流处理
- 工具使用

```typescript
import { AbstractAgent } from "@ag-ui/client"

class MyAgent extends AbstractAgent {
  run(input: RunAgentInput): RunAgent {
    // Implementation details
  }
}
```

### 核心组件

AG-UI Agent 有若干关键组件：

1. **配置**：Agent ID、线程（thread）ID 和初始状态（state）
2. **消息（message）**：包含用户消息（message）与助手消息（message）的对话历史
3. **状态（state）**：在多次交互之间持久保存的结构化数据
4. **事件（event）**：用于与客户端（client）通信的标准化消息（message）
5. **工具**：Agent 可用于与外部系统交互的函数

## Agent 类型

AG-UI 提供不同的 Agent 实现以适应各种需求：

### AbstractAgent

所有 Agent 都继承的基类。它负责核心事件（event）处理、状态（state）管理和消息（message）历史。

### HttpAgent

一个具体的实现，通过 HTTP 连接远程 AI 服务：

```typescript
import { HttpAgent } from "@ag-ui/client"

const agent = new HttpAgent({
  url: "https://your-agent-endpoint.com/agent",
  headers: {
    Authorization: "Bearer your-api-key",
  },
})
```

### 自定义 Agent

你可以通过继承 `AbstractAgent` 创建自定义 Agent，以集成任何 AI 服务：

```typescript
class CustomAgent extends AbstractAgent {
  // Custom properties and methods

  run(input: RunAgentInput): RunAgent {
    // Implement the agent's logic
  }
}
```

## 实现 Agent

### 基本实现

要创建自定义 Agent，请继承 `AbstractAgent` 类并实现必需的 `run` 方法：

```typescript
import {
  AbstractAgent,
  RunAgent,
  RunAgentInput,
  EventType,
  BaseEvent,
} from "@ag-ui/client"
import { Observable } from "rxjs"

class SimpleAgent extends AbstractAgent {
  run(input: RunAgentInput): RunAgent {
    const { threadId, runId } = input

    return () =>
      new Observable<BaseEvent>((observer) => {
        // Emit RUN_STARTED event
        observer.next({
          type: EventType.RUN_STARTED,
          threadId,
          runId,
        })

        // Send a message
        const messageId = Date.now().toString()

        // Message start
        observer.next({
          type: EventType.TEXT_MESSAGE_START,
          messageId,
          role: "assistant",
        })

        // Message content
        observer.next({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId,
          delta: "Hello, world!",
        })

        // Message end
        observer.next({
          type: EventType.TEXT_MESSAGE_END,
          messageId,
        })

        // Emit RUN_FINISHED event
        observer.next({
          type: EventType.RUN_FINISHED,
          threadId,
          runId,
        })

        // Complete the observable
        observer.complete()
      })
  }
}
```

## Agent 能力（capability）

AG-UI 协议中的 Agent 提供丰富的能力（capability），可实现复杂的 AI 交互：

### 交互式通信

Agent 通过事件（event）流与前端（front-end）应用建立双向通信通道。这使得以下能力（capability）成为可能：

- 逐字符实时流式响应
- 用户与 AI 之间的即时反馈循环
- 长时间运行（run）操作的进度指示
- 双向的结构化数据交换

### 工具使用

Agent 可以使用工具来执行操作并访问外部资源。重要的是，工具由前端（front-end）应用定义并传入
Agent，从而形成灵活且可扩展的系统：

```typescript
// Tool definition
const confirmAction = {
  name: "confirmAction",
  description: "Ask the user to confirm a specific action before proceeding",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "The action that needs user confirmation",
      },
      importance: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "The importance level of the action",
      },
      details: {
        type: "string",
        description: "Additional details about the action",
      },
    },
    required: ["action"],
  },
}

// Running an agent with tools from the frontend
agent.runAgent({
  tools: [confirmAction], // Frontend-defined tools passed to the agent
  // other parameters
})
```

工具通过一系列事件（event）被调用：

1. `TOOL_CALL_START`：表示一次工具调用（tool call）的开始
2. `TOOL_CALL_ARGS`：流式发送（streams）该工具调用（tool call）的参数
3. `TOOL_CALL_END`：标记该工具调用（tool call）的完成

随后，前端（front-end）应用可以执行该工具并将结果返回给 Agent。这种双向流程可支持复杂的人在回路（human in the loop）
工作流，其中：

- Agent 可以请求执行特定操作
- 人类可以凭借恰当的判断执行这些操作
- 结果被反馈给 Agent 以继续推理（reasoning）
- Agent 保持对过程中所做全部决策的感知

在实现 AI 与人类协作的界面时，这一机制尤为强大。例如，[CopilotKit](https://docs.copilotkit.ai/)
正是借助这一模式，通过其
[`useCopilotAction`](https://docs.copilotkit.ai/guides/frontend-actions) hook，
为在 React 应用中定义和处理工具提供了简化的方式。

通过工具机制让 AI 了解人类的决策，应用可以维持上下文，并在用户与 AI 助手之间营造
更自然的协作体验。

### 状态（state）管理

Agent 维护在多次交互之间持久保存的结构化状态（state）。该状态（state）可以：

- 通过 `STATE_DELTA` 事件（event）增量（delta）更新
- 通过 `STATE_SNAPSHOT` 事件（event）完整刷新
- 由 Agent 和前端（front-end）共同访问
- 用于存储用户偏好、对话上下文或应用状态（state）

```typescript
// Accessing agent state
console.log(agent.state.preferences)

// State is automatically updated during agent runs
agent.runAgent().subscribe((event) => {
  if (event.type === EventType.STATE_DELTA) {
    // State has been updated
    console.log("New state:", agent.state)
  }
})
```

### 多 Agent 协作

AG-UI 支持 Agent 之间的交接与协作：

- Agent 可以将任务委派给其他专门的 Agent
- 多个 Agent 可以在协调一致的工作流中协同工作
- 状态（state）与上下文可以在 Agent 之间传递
- 前端（front-end）在 Agent 切换过程中保持一致的用户体验

例如，当需要编程帮助时，通用助手 Agent 可以交接给专门的编程 Agent，同时传递对话
上下文和具体要求。

### 人在回路（human in the loop）工作流

Agent 支持人工介入与协助：

- Agent 可以就特定决策请求人类输入
- 前端（front-end）可以暂停 Agent 执行，并在收到人类反馈后恢复（resume）执行
- 人类专家可以在 Agent 输出最终确定之前审阅并修改
- 混合工作流将 AI 的效率与人类的判断结合起来

这使得应用中的 Agent 成为协作伙伴，而不是一个自主系统。

### 对话记忆

Agent 维护完整的对话消息（message）历史：

- 过去的交互会影响未来的响应
- 消息（message）历史在客户端（client）与服务端（server）之间同步
- 消息（message）可以包含丰富内容（文本、结构化数据、引用）
- 可以管理上下文窗口以聚焦相关信息

```typescript
// Accessing message history
console.log(agent.messages)

// Adding a new user message
agent.messages.push({
  id: "msg_123",
  role: "user",
  content: "Can you explain that in more detail?",
})
```

### 元数据（metadata）与监测

Agent 可以发出关于其内部过程的元数据（metadata）：

- 通过自定义事件（event）发出推理（reasoning）步骤（step）
- 性能指标与耗时信息
- 来源引用与参考追踪
- 不同响应选项的置信度分数

这使前端（front-end）能够透明地展示 Agent 的决策过程，并帮助用户理解结论是如何得出的。

## 使用 Agent

实现或实例化 Agent 之后，可以这样使用它：

```typescript
// Create an agent instance
const agent = new HttpAgent({
  url: "https://your-agent-endpoint.com/agent",
})

// Add initial messages if needed
agent.messages = [
  {
    id: "1",
    role: "user",
    content: "Hello, how can you help me today?",
  },
]

// Run the agent
agent
  .runAgent({
    runId: "run_123",
    tools: [], // Optional tools
    context: [], // Optional context
  })
  .subscribe({
    next: (event) => {
      // Handle different event types
      switch (event.type) {
        case EventType.TEXT_MESSAGE_CONTENT:
          console.log("Content:", event.delta)
          break
        // Handle other events
      }
    },
    error: (error) => console.error("Error:", error),
    complete: () => console.log("Run complete"),
  })
```

## Agent 配置

Agent 通过构造函数接受配置：

```typescript
interface AgentConfig {
  agentId?: string // Unique identifier for the agent
  description?: string // Human-readable description
  threadId?: string // Conversation thread identifier
  initialMessages?: Message[] // Initial messages
  initialState?: State // Initial state object
}

// Using the configuration
const agent = new HttpAgent({
  agentId: "my-agent-123",
  description: "A helpful assistant",
  threadId: "thread-456",
  initialMessages: [
    { id: "1", role: "system", content: "You are a helpful assistant." },
  ],
  initialState: { preferredLanguage: "English" },
})
```

## Agent 状态（state）管理

AG-UI Agent 在多次交互之间维护状态（state）：

```typescript
// Access current state
console.log(agent.state)

// Access messages
console.log(agent.messages)

// Clone an agent with its state
const clonedAgent = agent.clone()
```

## 结论

Agent 是 AG-UI 协议的基础，提供了一种标准化方式来连接前端（front-end）应用与 AI 服务。通过
实现 `AbstractAgent` 类，你可以为任何 AI 服务创建自定义集成，同时为应用保持一致
的接口。

事件（event）驱动的架构促成了实时、流式的交互，这对现代 AI 应用至关重要；而标准化的协议
则确保不同实现之间的兼容性。
