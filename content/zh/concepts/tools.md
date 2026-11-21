---
title: "工具"
description: "理解工具，以及工具如何支撑人在回路（human in the loop）的 AI 工作流"
---

# 工具

工具是 AG-UI 协议中的一个基础概念，它使 AI Agent 能够与外部系统交互，并把人的判断纳入到工作流之中。

AG-UI 区分两类工具：由 Agent 后端定义的工具，以及由客户端（client）在运行（run）时提供的工具。后端定义的工具保留在后端 Agent 或框架的配置中。客户端（client）定义的工具通过 `RunAgentInput.tools` 传入，使 Agent 能够回调应用特定的前端（frontend）行为，例如 UI 操作、审批，或由用户参与的工作流。

## 什么是工具？

在 AG-UI 中，工具是 Agent 可以调用的函数，用于：

1. 请求特定信息
2. 在外部系统中执行操作
3. 请求人的输入或确认
4. 访问专门的能力（capability）

工具弥合了 AI 推理（reasoning）与现实世界操作之间的差距，使 Agent 能够完成仅靠对话无法完成的任务。

## 工具结构

工具遵循统一的结构，用于定义其名称、用途以及预期参数：

```typescript
interface Tool {
  name: string // Unique identifier for the tool
  description: string // Human-readable explanation of what the tool does
  parameters: {
    // JSON Schema defining the tool's parameters
    type: "object"
    properties: {
      // Tool-specific parameters
    }
    required: string[] // Array of required parameter names
  }
}
```

`parameters` 字段使用 [JSON Schema](https://json-schema.org/) 定义工具所接受的参数结构。该 schema 同时被 Agent（用于生成合法的工具调用（tool call））和前端（frontend）（用于校验并解析工具参数）使用。

## 前端（frontend）定义的工具

AG-UI 工具系统的一个关键之处在于：工具在前端（frontend）定义，并在执行期间传递给 Agent：

```typescript
// Define tools in the frontend
const userConfirmationTool = {
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
    },
    required: ["action"],
  },
}

// Pass tools to the agent during execution
agent.runAgent({
  tools: [userConfirmationTool],
  // Other parameters...
})
```

这种做法有几个优点：

1. **前端（frontend）控制**：由前端（frontend）决定 Agent 可以使用哪些能力（capability）
2. **动态能力（capability）**：可以根据用户权限、上下文或应用状态（state）添加或移除工具
3. **关注点分离**：Agent 专注于推理（reasoning），而前端（frontend）负责工具的实现
4. **安全**：敏感操作由应用控制，而不是由 Agent 控制

`RunAgentInput.tools` 仅用于这些由客户端（client）提供的工具，并不是用来承载后端 Agent 可用的全部工具。如果你的集成包含后端工具，应在后端框架中定义它们，或通过 Agent 的能力（capability）（capabilities）来声明它们，而不是从客户端（client）发送它们的 schema。

## 工具调用（tool call）生命周期

当 Agent 需要使用某个工具时，它会遵循一套标准化的事件（event）序列：

1. **ToolCallStart**：表示一次工具调用（tool call）的开始，携带唯一的 ID 和工具名

   ```typescript
   {
     type: EventType.TOOL_CALL_START,
     toolCallId: "tool-123",
     toolCallName: "confirmAction",
     parentMessageId: "msg-456" // Optional reference to a message
   }
   ```

2. **ToolCallArgs**：在工具参数生成的过程中流式传输（transport）这些参数

   ```typescript
   {
     type: EventType.TOOL_CALL_ARGS,
     toolCallId: "tool-123",
     delta: '{"act' // Partial JSON being streamed
   }
   ```

   ```typescript
   {
     type: EventType.TOOL_CALL_ARGS,
     toolCallId: "tool-123",
     delta: 'ion":"Depl' // More JSON being streamed
   }
   ```

   ```typescript
   {
     type: EventType.TOOL_CALL_ARGS,
     toolCallId: "tool-123",
     delta: 'oy the application to production"}' // Final JSON fragment
   }
   ```

3. **ToolCallEnd**：标记该工具调用（tool call）的完成
   ```typescript
   {
     type: EventType.TOOL_CALL_END,
     toolCallId: "tool-123"
   }
   ```

前端（frontend）会累积这些增量（delta），从而构造出完整的工具调用（tool call）参数。一旦工具调用（tool call）完成，前端（frontend）就可以执行该工具，并把结果返回给 Agent。

### 工具调用（tool call）元数据（metadata）

上述三个事件（event）都可以携带一个 `metadata` 对象，而该对象会累积到**工具调用（tool call）自身**上，而不是累积到拥有它的 assistant 消息（message）上：

```typescript
assistantMessage.toolCalls[0].metadata
// { provider: "anthropic", latencyMs: 84 }
```

这是有意为之的。一条 assistant 消息（message）可以拥有多个工具调用（tool call），因此把它们的元数据（metadata）折叠进父级，会让结果取决于这些调用恰好交错发生的顺序。让每个工具调用（tool call）各自持有自己的元数据（metadata），才能保持含义无歧义。

`ToolCallResult` 则不同——它会创建一条工具消息（message），因此它的元数据（metadata）会像其他构建消息（message）的事件（event）一样合并进那条消息（message）。参见 [Metadata](metadata.md)。

## 工具结果（tool result）

工具执行完成之后，结果会以“工具消息（message）”的形式发送回 Agent：

```typescript
{
  id: "result-789",
  role: "tool",
  content: "true", // Tool result as a string
  toolCallId: "tool-123" // References the original tool call
}
```

这条消息（message）会成为对话历史的一部分，使 Agent 能够在后续回复中引用并纳入工具的结果。

如果工具没有成功，就把 `error` 设为失败信息：

```typescript
{
  id: "result-789",
  role: "tool",
  content: "Deployment blocked: the production environment is locked",
  toolCallId: "tool-123",
  error: "the production environment is locked" // Marks this result as a failure
}
```

`error` 是协议用来表达客户端（client）工具失败的方式。若没有它，失败的工具与成功的工具就无法区分——前端（frontend）恰好在 `content` 里放入的内容，就是 Agent 唯一能依据的东西。完整的 `ToolMessage` 结构参见 [Messages](messages.md)。

## 人在回路（human in the loop）工作流

AG-UI 的工具系统在实现人在回路（human in the loop）工作流方面尤为强大。通过定义请求人的输入或确认的工具，开发者可以打造出将自主运行（run）与人的判断无缝融合的 AI 体验。

例如：

1. Agent 需要做出一个重要决策
2. Agent 调用 `confirmAction` 工具，并附上关于该决策的细节
3. 前端（frontend）向用户展示确认对话框
4. 用户给出自己的输入
5. 前端（frontend）把用户的决定发送回 Agent
6. Agent 在知晓用户选择的情况下继续处理

这种模式支持如下用例：

- **审批工作流**：AI 提出需要人工批准的操作
- **数据校验**：由人来核实或修正 AI 生成的数据
- **协同决策**：AI 与人共同解决复杂问题
- **有监督学习**：人的反馈改善 AI 未来的决策

## CopilotKit 集成

[CopilotKit](https://docs.copilotkit.ai/) 通过其 [`useCopilotAction`](https://docs.copilotkit.ai/guides/frontend-actions) hook，提供了一种在 React 应用中使用 AG-UI 工具的简化方式：

```tsx
import { useCopilotAction } from "@copilotkit/react-core"

// Define a tool for user confirmation
useCopilotAction({
  name: "confirmAction",
  description: "Ask the user to confirm an action",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "The action to confirm",
      },
    },
    required: ["action"],
  },
  handler: async ({ action }) => {
    // Show a confirmation dialog
    const confirmed = await showConfirmDialog(action)
    return confirmed ? "approved" : "rejected"
  },
})
```

这种做法让定义工具变得容易：这些工具能与你的 React 组件集成，并以简洁、声明式的方式处理工具执行逻辑。

## 工具示例

以下是 AG-UI 应用中常见的几类工具：

### 用户确认

```typescript
{
  name: "confirmAction",
  description: "Ask the user to confirm an action",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "The action to confirm"
      },
      importance: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "The importance level"
      }
    },
    required: ["action"]
  }
}
```

### 数据检索

```typescript
{
  name: "fetchUserData",
  description: "Retrieve data about a specific user",
  parameters: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        description: "ID of the user"
      },
      fields: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Fields to retrieve"
      }
    },
    required: ["userId"]
  }
}
```

### 用户界面控制

```typescript
{
  name: "navigateTo",
  description: "Navigate to a different page or view",
  parameters: {
    type: "object",
    properties: {
      destination: {
        type: "string",
        description: "Destination page or view"
      },
      params: {
        type: "object",
        description: "Optional parameters for the navigation"
      }
    },
    required: ["destination"]
  }
}
```

### 内容生成

```typescript
{
  name: "generateImage",
  description: "Generate an image based on a description",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Description of the image to generate"
      },
      style: {
        type: "string",
        description: "Visual style for the image"
      },
      dimensions: {
        type: "object",
        properties: {
          width: { type: "number" },
          height: { type: "number" }
        },
        description: "Dimensions of the image"
      }
    },
    required: ["prompt"]
  }
}
```

## 最佳实践

在为 AG-UI 设计工具时：

1. **命名清晰**：使用描述性强、面向动作的名称
2. **描述详尽**：提供充分完整的描述，帮助 Agent 理解何时以及如何使用该工具
3. **结构化参数**：定义精确的参数 schema，并使用描述性的字段名与约束
4. **必填字段**：仅当参数确实必要时，才将其标记为必填
5. **错误处理**：在工具执行代码中实现健壮的错误处理
6. **用户体验**：设计能为人的决策提供恰当上下文的工具 UI

## 结语

AG-UI 中的工具弥合了 AI 推理（reasoning）与现实世界操作之间的差距，使结合 AI 与人类智能各自优势的复杂工作流成为可能。通过在前端（frontend）定义工具并传递给 Agent，开发者可以打造出 AI 与人高效协作的交互体验。

工具系统在实现人在回路（human in the loop）工作流方面尤为强大：在这类工作流中，AI 可以给出操作建议，但把关键决策交由人来做。这使自动化与人的判断取得平衡，创造出既强大又值得信赖的 AI 体验。
