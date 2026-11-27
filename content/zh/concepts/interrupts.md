---
title: "中断（interrupt）"
description: "Agent 用户交互协议中的人在回路暂停与恢复（resume）"
---

Agent 有时需要暂停：在执行敏感操作前获得人类审批、请求结构化输入、等待带外的策略决定。AG-UI 将其暴露为**感知中断的运行生命周期**——一种终结式模型：运行（run）以中断结果结束，随后客户端（client）启动一次新的运行，并携带针对每个中断（interrupt）的应答。

## 生命周期

```mermaid
sequenceDiagram
  participant Agent
  participant Client as Client App

  Note over Agent,Client: Run 1 begins
  Agent-->>Client: RunStarted (runId: r1)
  Agent-->>Client: ...ToolCall* / TextMessage* / StateSnapshot...
  Note over Agent,Client: Agent needs user input — emit snapshot, then interrupt
  Agent-->>Client: RunFinished { outcome: { type: "interrupt", interrupts: [...] } }

  Note over Agent,Client: User resolves interrupts
  Client-->>Agent: RunAgentInput { threadId, resume: [{interruptId, status, payload?}, ...] }

  Note over Agent,Client: Run 2 begins; resume[].interruptId links back to run 1's interrupts
  Agent-->>Client: RunStarted (runId: r2)
  Agent-->>Client: ...continue / ToolCallResult / ...
  Agent-->>Client: RunFinished { outcome: { type: "success" }, result }
```

## 运行（run）结果

`RunFinished` 携带一个可选的 `outcome` 字段——一个可辨识联合，与具体变体相关的数据嵌套在其中：

- **省略** —— 遗留/向后兼容。按正常完成处理。尚不了解中断的既有 AG-UI 客户端仍会发出这种形态，新的读取方应当接受它。
- `{ type: "success" }` —— 运行正常完成。为向后兼容，可选的 `result` 仍留在事件（event）的根部。
- `{ type: "interrupt", interrupts: [...] }` —— 运行因等待用户输入而暂停。`interrupts` 是非空数组，它位于 outcome 内部，从而随需要它的变体一起传递。

```typescript
type RunFinishedOutcome =
  | { type: "success" }
  | { type: "interrupt"; interrupts: Interrupt[] }

type RunFinishedEvent = {
  type: "RUN_FINISHED"
  threadId: string
  runId: string
  result?: unknown
  outcome?: RunFinishedOutcome
}
```

由于 `outcome` 是可选的，一个从未听说过中断的旧生产者（producer）（没有 `outcome` 字段）在新 schema 下仍能通过 `RunFinished` 事件的校验——客户端只有在关心感知中断的变体时才需要检查 `outcome`。

## Interrupt 类型

```typescript
type Interrupt = {
  id: string
  reason: string
  message?: string
  toolCallId?: string
  responseSchema?: JsonSchema
  expiresAt?: string
  metadata?: Record<string, any>
  subagentRunId?: string
}
```

| 字段 | 用途 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | 在中断、恢复（resume）、幂等性与审计之间建立关联的键。 |
| `reason`         | 分类路由提示——参见[原因分类](#原因分类)。 |
| `message`        | 人类可读的提示语。通用的兜底 UI 内容。 |
| `toolCallId`     | 将该中断绑定（binding）到先前的 `ToolCall*` 序列。 |
| `responseSchema` | 针对期望的 `resume.payload` 的 JSON Schema。 |
| `expiresAt`      | 可选的 ISO-8601 TTL。过期的恢复会产生 `RunError`。 |
| `metadata`       | 自由格式的、框架特定的数据。 |
| `subagentRunId`  | 提出该中断的那份工作所属的子 Agent（subagent）——由根 Agent 提出的中断则没有该字段。归属信息按中断逐条存放，因为一次运行可能承载来自多个子 Agent 的中断。若生产者会发出子 Agent 生命周期事件，它还会以 `outcome: { type: "suspended" }` 关闭该子 Agent——生命周期事件始终是可选的，因此这里的归属信息可以独立成立（参见 [子 Agent](subagents.md#挂起)）。 |

## 恢复（resume）一次运行（run）

同一线程（thread）上的下一个 `RunAgentInput` 会携带一个 `resume` 数组：

```typescript
type RunAgentInput = {
  // ... existing fields
  resume?: Array<{
    interruptId: string
    status: "resolved" | "cancelled"
    payload?: any
    metadata?: Record<string, any>
  }>
}
```

- `resolved` —— 用户已作答。`payload` 携带回答内容，并按该中断的 `responseSchema` 进行校验。拒绝在 payload 内部表达（例如 `{ approved: false }`），而不是作为一个独立的状态（state）。
- `cancelled` —— 用户放弃，未提供有意义的输入。应省略 `payload`。
- `metadata` —— 关于该回答的可选信封数据（例如证明人类决定未被篡改的签名，或路由键），它与 `payload` 相对：后者是 Agent 所请求、并将据此采取行动的回答。按 key 开放；每个 key 下允许任意 JSON 值，包括 `null`。该对象本身要么缺席，要么是一个对象，绝不为 `null`。`ag-ui` 这个 key 保留给 AG-UI 自身使用。两种 status 下均允许携带。

## 契约规则

1. **同一线程。** 恢复请求必须使用与被中断的运行相同的 `threadId`。
2. **恢复关联。** `resume[].interruptId` 必须引用被中断运行 `interrupts[]` 中的某个 `id`。`parentRunId` 与此正交——它保持 AG-UI 既有的分支/时间旅行语义。
3. **覆盖全部未决中断。** 单个 `resume` 数组必须处理被中断运行中每一个未决的中断。不支持部分恢复。
4. **挂起的中断会阻断新输入。** 若某个线程存在未解决的中断，则该线程上的任何 `RunAgentInput` 都必须包含一个处理它们的 `resume`。收到不符合该约定的输入的 Agent 必须发出 `RunError`。
5. **幂等性。** 具有相同 `(threadId, interruptId, status, payload)` 的恢复必须可以安全重放。
6. **payload 校验。** 若某个中断声明了 `responseSchema`，Agent 可以校验对应的恢复 `payload`，并在不匹配时发出 `RunError`。客户端应当在提交前先行校验。
7. **过期强制。** 客户端不得提交超过某个 interrupt 的 `expiresAt` 的恢复。过期的恢复会产生 `RunError`。
8. **优雅处理。** Agent 应通过 `RunError` 来处理缺失或无效的恢复 payload，而不是静默失败。

## 中断（interrupt）边界处的状态（state）

在发生中断的时刻，Agent 必须通过 `StateSnapshot` 与 `MessagesSnapshot` 事件，在携带该中断的 `RunFinished` 事件**之前**，发出恢复所需的全部状态。

这条规则使协议与恢复模式无关：无论是重放式续跑（从消息（message） + 状态重建上下文）还是检查点式续跑（恢复被挂起的协程），在恢复时都必须产生完全一致的可观察行为。框架原生的检查点机制是一种实现层面的优化，而非协议契约。

## 错误处理

`RunError` 是唯一的错误事件。`outcome` 枚举不包含 `"error"` 值。会产生 `RunError` 的中断特定错误情形包括：

- 恢复在某个中断的 `expiresAt` 之后到达。
- 恢复 payload 未通过其 `responseSchema` 的校验。
- 恢复引用了 Agent 无法关联的 `interruptId`。
- 恢复未能处理每一个未决 interrupt（违反规则 3）。
- 在存在挂起中断的线程上，`RunAgentInput` 省略了 `resume`（违反规则 4）。

## 原因分类

`reason` 是必填字符串。规范定义了一小组核心取值；其他任何字符串都是合法的扩展。

### 核心取值

| 取值             | 语义                                                  | 典型配套字段                    |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------- |
| `tool_call`      | 绑定到某个等待决策的具体工具调用（tool call）的中断。 | `toolCallId` 必须设置。                   |
| `input_required` | Agent 需要结构化输入才能继续。                  | 应设置 `responseSchema`。             |
| `confirmation`   | 不绑定到工具的独立是/否决策。         | `responseSchema` 可选；默认布尔。 |

### 自定义原因

其他任何字符串都是合法的。Agent 应将自定义原因以 `<framework>:<name>` 的形式做命名空间隔离（例如 `langgraph:database_modification`、`mastra:workflow_suspend`）。`core:` 前缀保留给未来的规范新增内容。

### 客户端（client）路由

- 客户端应针对已知的核心取值做分支，以渲染专用 UI。
- 对于未知原因，客户端不得报错。应基于 `message`、`responseSchema` 与 `metadata` 进行渲染。

## 绑定（binding）到工具调用（tool call）的中断（interrupt）

当某个中断携带 `reason: "tool_call"` 与一个 `toolCallId` 时，该工具调用及其解决过程横跨两次运行。完整的审计链为：

1. 被中断运行中的 `ToolCallArgs`（Agent 的提议）。
2. 恢复后运行中的 `RunAgentInput.resume` payload（用户的决定与编辑）。
3. 恢复后运行中的 `ToolCallResult`（实际执行结果）。

Agent 在恢复后的运行中**不会**重新发出 `ToolCallStart`/`ToolCallArgs`/`ToolCallEnd`——它会针对最初的 `toolCallId` 发出 `ToolCallResult`。

### 服务端（server）拥有的工具执行

生产者可以用 `metadata: { "ag-ui:tool-execution": "server" }` 标记一个绑定到工具调用的中断，以显式标识该工具由服务端（server）拥有。客户端在 `resume` 中发送用户的批准或拒绝，且不得根据该决定合成工具结果（tool result）消息。服务端则针对最初的 `toolCallId` 提供实际执行结果。.NET 适配器会为原生工具审批请求发出该标记。

在持久化或恢复挂起的中断时请保留该元数据（metadata）。它的缺席并不确立工具归属；既有的前端（frontend）完成契约保持不变。该标记向客户端描述执行归属，并不是授权凭证：服务端仍必须校验各项决定，并拒绝客户端为服务端拥有的工具提供的结果。

### 带编辑的批准

对于支持“带编辑的批准”的、绑定到工具调用的中断，推荐的 `responseSchema` 模式如下：

```json
{
  "type": "object",
  "properties": {
    "approved": { "type": "boolean" },
    "editedArgs": {
      "type": "object",
      "description": "Full replacement of the tool args. Not merged."
    }
  },
  "required": ["approved"]
}
```

`editedArgs` 是整体替换，而非部分合并。它在 schema 中的出现即是**能力（capability）信号**，表明客户端可以提供编辑 UI。

## 示例

### 最小工具审批

Agent 在提议 `sendEmail` 之后中断：

```json
{
  "type": "RUN_FINISHED",
  "threadId": "thread-1",
  "runId": "run-1",
  "outcome": {
    "type": "interrupt",
    "interrupts": [
      {
        "id": "int-abc123",
        "reason": "tool_call",
        "message": "Send email to a@b.com with subject 'Hi'?",
        "toolCallId": "tc-001",
        "responseSchema": {
          "type": "object",
          "properties": { "approved": { "type": "boolean" } },
          "required": ["approved"]
        }
      }
    ]
  }
}
```

客户端提交恢复：

```json
{
  "threadId": "thread-1",
  "runId": "run-2",
  "resume": [
    {
      "interruptId": "int-abc123",
      "status": "resolved",
      "payload": { "approved": true }
    }
  ]
}
```

Agent 在 `run-2` 中继续，针对 `tc-001` 发出 `ToolCallResult`，随后发出 `RunFinished { outcome: { type: "success" } }`。

### 带编辑的批准（完整审计）

```json
{
  "type": "RUN_FINISHED",
  "threadId": "thread-2",
  "runId": "run-10",
  "outcome": {
    "type": "interrupt",
    "interrupts": [
      {
        "id": "int-email-edit",
        "reason": "tool_call",
        "message": "Send email to a@b.com? You can edit the body before approving.",
        "toolCallId": "tc-42",
        "responseSchema": {
          "type": "object",
          "properties": {
            "approved": { "type": "boolean" },
            "editedArgs": {
              "type": "object",
              "properties": {
                "to": { "type": "string", "format": "email" },
                "subject": { "type": "string" },
                "body": { "type": "string" }
              }
            }
          },
          "required": ["approved"]
        },
        "metadata": {
          "langgraph": {
            "checkpointId": "ckpt-xyz",
            "nodeId": "tool_executor"
          }
        }
      }
    ]
  }
}
```

客户端带编辑的恢复：

```json
{
  "threadId": "thread-2",
  "runId": "run-11",
  "resume": [
    {
      "interruptId": "int-email-edit",
      "status": "resolved",
      "payload": {
        "approved": true,
        "editedArgs": {
          "to": "a@b.com",
          "subject": "Hi",
          "body": "Hi (revised per my note)"
        }
      }
    }
  ]
}
```

`tc-42` 的审计链：

- `run-10` 的 `ToolCallArgs` —— 最初的提议。
- `run-11` 的 `RunAgentInput.resume[0].payload.editedArgs` —— 用户的编辑。
- `run-11` 的 `ToolCallResult` —— 实际结果。

### 并行中断（interrupt）

```json
{
  "type": "RUN_FINISHED",
  "threadId": "thread-3",
  "runId": "run-20",
  "outcome": {
    "type": "interrupt",
    "interrupts": [
      {
        "id": "i-1",
        "reason": "tool_call",
        "toolCallId": "tc-a",
        "message": "Approve sendEmail to x@y.com?"
      },
      {
        "id": "i-2",
        "reason": "tool_call",
        "toolCallId": "tc-b",
        "message": "Approve sendEmail to y@z.com?"
      },
      {
        "id": "i-3",
        "reason": "tool_call",
        "toolCallId": "tc-c",
        "message": "Approve sendEmail to z@w.com?"
      }
    ]
  }
}
```

客户端批准两个、取消一个：

```json
{
  "threadId": "thread-3",
  "runId": "run-21",
  "resume": [
    {
      "interruptId": "i-1",
      "status": "resolved",
      "payload": { "approved": true }
    },
    {
      "interruptId": "i-2",
      "status": "resolved",
      "payload": { "approved": true }
    },
    { "interruptId": "i-3", "status": "cancelled" }
  ]
}
```

在 `run-21` 中，Agent 为 `tc-a` 与 `tc-b` 发出 `ToolCallResult`，并将 `tc-c` 视为未执行。

### 非工具调用（tool call）的输入请求

```json
{
  "type": "RUN_FINISHED",
  "threadId": "thread-4",
  "runId": "run-30",
  "outcome": {
    "type": "interrupt",
    "interrupts": [
      {
        "id": "int-form",
        "reason": "input_required",
        "message": "Please provide the quarterly filing details.",
        "responseSchema": {
          "type": "object",
          "properties": {
            "quarter": { "type": "string", "enum": ["Q1", "Q2", "Q3", "Q4"] },
            "year": { "type": "integer", "minimum": 2000 },
            "revenue": { "type": "number" }
          },
          "required": ["quarter", "year", "revenue"]
        },
        "expiresAt": "2026-04-20T17:00:00Z"
      }
    ]
  }
}
```

客户端应答：

```json
{
  "threadId": "thread-4",
  "runId": "run-31",
  "resume": [
    {
      "interruptId": "int-form",
      "status": "resolved",
      "payload": { "quarter": "Q1", "year": 2026, "revenue": 4200000 }
    }
  ]
}
```

## 框架集成

| 框架   | 包                                | 中断支持                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LangGraph   | `@ag-ui/langgraph` / `ag-ui-langgraph` | ✅ 接受 `RunAgentInput.resume[]`。可以发出 `RunFinishedEvent.outcome = {type:"interrupt"}`——通过 `emitInterruptOutcome` / `emit_interrupt_outcome` 选择开启（默认关闭；通过 `command.resume` 恢复的旧客户端一旦看到结构化 outcome 就不再恢复）。默认发出遗留的 `CustomEvent(name="on_interrupt")`；可通过 `enableLegacyOnInterruptEvent: false` 关闭。提供子类钩子以自定义 HITL 转换。 |
| AWS Strands | `@ag-ui/aws-strands`                   | ✅ 通过 `RunFinishedEvent.outcome` 转发 Strands 原生中断。                                                                                                                                                                                                                                                                                                                                                                                  |

## 相关

- [事件](events.md) —— `RunFinished` 如何融入更广泛的事件流。
- [能力](capabilities.md) —— Agent 所声明的 `humanInTheLoop.interrupts` 与 `humanInTheLoop.approveWithEdits` 标志。
