---
title: "能力（capability）"
description: "AG-UI 协议中 Agent 的动态能力（capability）发现"
---

# 能力（capability）

AG-UI 协议中的 Agent 可以通过**能力（capability）发现**在运行（run）时声明自己支持哪些内容。这样一来，客户端（client）就能查询 Agent，并依据可用的特性来调整自身行为——无需猜测，也无需把假设硬编码进去。

## 工作原理

`AbstractAgent` 声明了一个可选的 `getCapabilities()` 方法，它返回一份带类型的快照（snapshot），描述该 Agent 当前支持的全部内容。该方法由了解自身能力（capability）的 Agent 子类实现——例如 LangGraph 与 ADK 集成，或者你自己的实现——而不是由裸的 `HttpAgent` 实现，因为后者只是一种传输（transport）层，并没有可供询问的发现端点。对于没有实现该方法的 Agent，下面这个可选调用会返回 `undefined`：

```typescript
// 任何实现了 getCapabilities() 的 AbstractAgent 子类；
// 裸的 HttpAgent 没有实现，此处会得到 undefined。
const agent = new LangGraphAgent({ url: "https://my-agent.example.com/api" })

const capabilities = await agent.getCapabilities?.()

if (capabilities?.tools?.supported) {
  console.log(`Agent provides ${capabilities.tools.items?.length} tools`)
}

if (capabilities?.reasoning?.supported) {
  // 显示推理（reasoning）界面的开关
}
```

### 关键原则

- **仅做发现** —— Agent 声明自己能做什么，不存在协商
- **动态** —— 返回调用时刻的当前状态（state）（例如新增了工具，下一次调用就会反映出它们）
- **可选** —— 未实现该方法的 Agent 返回 `undefined`
- **缺省即未知** —— 只声明你确实支持的内容，被省略的字段意味着该能力（capability）未被声明

## AgentCapabilities 接口

能力（capability）被组织成若干带类型的类别，每一类代表 Agent 功能的不同方面：

```typescript
interface AgentCapabilities {
  /** Agent 的身份与元数据（metadata）。 */
  identity?: IdentityCapabilities
  /** 支持的传输（transport）机制（SSE、WebSocket、二进制（binary）等）。 */
  transport?: TransportCapabilities
  /** Agent 提供的工具以及工具调用（tool call）配置。 */
  tools?: ToolsCapabilities
  /** 输出格式支持（结构化输出、MIME 类型）。 */
  output?: OutputCapabilities
  /** 状态（state）与记忆管理（快照（snapshot）、增量（delta）、持久化）。 */
  state?: StateCapabilities
  /** 多 Agent 协同（委派、交接、子 Agent（subagent））。 */
  multiAgent?: MultiAgentCapabilities
  /** 推理（reasoning）与思考支持（思维链、加密思考）。 */
  reasoning?: ReasoningCapabilities
  /** 按方向（输入与输出）组织的多模态输入/输出支持。 */
  multimodal?: MultimodalCapabilities
  /** 执行控制与限制（代码执行、超时、迭代上限）。 */
  execution?: ExecutionCapabilities
  /** 人在回路（human in the loop）支持（审批、干预、反馈）。 */
  humanInTheLoop?: HumanInTheLoopCapabilities
  /** 标准类别未覆盖的、集成特有的能力（capability）。 */
  custom?: Record<string, unknown>
}
```

`custom` 字段是一个逃生舱口，用于容纳那些无法归入标准类别的、集成特有的能力（capability）。

## 能力（capability）类别

### Identity（身份）

关于 Agent 的基本元数据（metadata）。适用于发现类 UI、Agent 市场以及调试。当你希望客户端（client）展示 Agent 信息，或者在存在多个 Agent、需要用户挑选其一的时候，就设置这些字段。

```typescript
interface IdentityCapabilities {
  /** 展示在 UI 和 Agent 选择器中的可读名称。 */
  name?: string
  /** 驱动该 Agent 的框架或平台（例如 "langgraph"、"mastra"、"crewai"）。 */
  type?: string
  /** 该 Agent 的职责——帮助用户和路由逻辑判断何时使用它。 */
  description?: string
  /** Agent 的语义化版本（例如 "1.2.0"）。用于兼容性检查。 */
  version?: string
  /** 维护该 Agent 的组织或团队。 */
  provider?: string
  /** 指向该 Agent 文档或主页的 URL。 */
  documentationUrl?: string
  /** 用于集成特有身份信息的任意键值对。 */
  metadata?: Record<string, unknown>
}
```

### Transport（传输（transport））

声明 Agent 支持哪些传输（transport）机制。客户端（client）据此选择最佳的连接策略。只对 Agent 实际处理的传输（transport）把标志设为 `true`——对不支持的传输（transport），要么省略，要么设为 `false`。

```typescript
interface TransportCapabilities {
  /** 如果 Agent 通过 SSE 流式返回响应，则设为 `true`。多数 Agent 会启用此项。 */
  streaming?: boolean
  /** 如果 Agent 接受持久化的 WebSocket 连接，则设为 `true`。 */
  websocket?: boolean
  /** 如果 Agent 支持 AG-UI 二进制（binary）协议（基于 HTTP 的 protobuf），则设为 `true`。 */
  httpBinary?: boolean
  /** 如果 Agent 能在一次运行（run）结束后通过 webhook 发送异步更新，则设为 `true`。 */
  pushNotifications?: boolean
  /** 如果 Agent 支持通过序列号恢复（resume）被中断（interrupt）的流，则设为 `true`。 */
  resumable?: boolean
}
```

### Tools（工具）

工具调用（tool call）能力（capability）。区分 Agent 自身提供的工具（列在 `items` 中）与客户端（client）在运行（run）时通过 `RunAgentInput.tools` 传入的工具。当你的 Agent 能调用函数、搜索网页、执行代码等时，启用此项。

```typescript
interface ToolsCapabilities {
  /** 如果 Agent 具备工具调用（tool call）能力（capability），则设为 `true`。设为 `false` 表示即使存在
   *  items 也明确声明工具调用（tool call）已停用。 */
  supported?: boolean
  /** 该 Agent 自身提供的工具（完整的 JSON Schema 定义）。
   *  它们与客户端（client）在 `RunAgentInput.tools` 中传入的工具不同。 */
  items?: Tool[]
  /** 如果 Agent 能在单个步骤（step）内并发调用多个工具，则设为 `true`。 */
  parallelCalls?: boolean
  /** 如果 Agent 接受并使用客户端（client）在运行时提供的工具，则设为 `true`。 */
  clientProvided?: boolean
}
```

### Output（输出）

输出格式支持。当你的 Agent 能返回符合某个 JSON schema 的响应时，启用 `structuredOutput`，这对程序化消费很有用。

```typescript
interface OutputCapabilities {
  /** 如果 Agent 能产出符合所提供 schema 的结构化 JSON 输出，则设为 `true`。 */
  structuredOutput?: boolean
  /** Agent 能产出的 MIME 类型（例如 `["text/plain", "application/json"]`）。
   *  如果 Agent 只产出纯文本，则省略此项。 */
  supportedMimeTypes?: string[]
}
```

### State（状态（state））

状态（state）与记忆管理能力（capability）。它们告诉客户端（client）该 Agent 如何处理共享状态（state），以及对话上下文是否跨运行（run）持久保留。

```typescript
interface StateCapabilities {
  /** 如果 Agent 会发出 `STATE_SNAPSHOT` 事件（event）（整体替换状态（state）），则设为 `true`。 */
  snapshots?: boolean
  /** 如果 Agent 会发出 `STATE_DELTA` 事件（event）（JSON Patch 增量（delta）更新），则设为 `true`。 */
  deltas?: boolean
  /** 如果 Agent 在当前线程（thread）之外还具备长期记忆，则设为 `true`
   *  （例如向量库、知识库或跨会话召回）。 */
  memory?: boolean
  /** 如果状态（state）在同一线程（thread）内的多次运行（run）之间保持不变，则设为 `true`。
   *  为 `false` 时，每次运行（run）都会重置状态（state）。 */
  persistentState?: boolean
}
```

### Multi-Agent（多 Agent）

多 Agent 协同能力（capability）。当你的 Agent 能够编排其他 Agent，或把工作交接给其他 Agent 时，启用这些项。

```typescript
interface MultiAgentCapabilities {
  /** 如果 Agent 参与任何形式的多 Agent 协同，则设为 `true`。 */
  supported?: boolean
  /** 如果 Agent 能在保留控制权的前提下把子任务委派给其他 Agent，则设为 `true`。 */
  delegation?: boolean
  /** 如果 Agent 能把整段对话完全转移给另一个 Agent，则设为 `true`。 */
  handoffs?: boolean
  /** 该 Agent 可调用的子 Agent（subagent） 列表。有助于客户端（client）构建 Agent 选择 UI。 */
  subagents?: Array<{ name: string; description?: string }>
}
```

### Reasoning（推理（reasoning））

推理（reasoning）与思考能力（capability）。当你的 Agent 对外暴露其内部思考过程（例如思维链、扩展思考）时，启用这些项。

```typescript
interface ReasoningCapabilities {
  /** 如果 Agent 产出对客户端（client）可见的推理（reasoning）/思考 token，则设为 `true`。 */
  supported?: boolean
  /** 如果推理（reasoning） token 是增量（delta）流式返回的（而非一次性全部返回），则设为 `true`。 */
  streaming?: boolean
  /** 如果推理（reasoning）内容是加密的（零数据保留模式），则设为 `true`。
   *  客户端（client）应预期收到不透明的 `encryptedValue` 字段，而不是可读内容。 */
  encrypted?: boolean
}
```

### Multimodal（多模态）

多模态输入与输出支持，按 `input` 与 `output` 两个子对象组织，使客户端（client）可以分别查询 Agent 接受什么、产出什么。客户端（client）借此显示或隐藏文件上传按钮、录音器、图片选择器等。

```typescript
interface MultimodalInputCapabilities {
  /** 如果 Agent 能处理图片输入（例如截图、照片），则设为 `true`。 */
  image?: boolean
  /** 如果 Agent 能处理音频输入（语音、录音），则设为 `true`。 */
  audio?: boolean
  /** 如果 Agent 能处理视频输入，则设为 `true`。 */
  video?: boolean
  /** 如果 Agent 能处理 PDF 文档，则设为 `true`。 */
  pdf?: boolean
  /** 如果 Agent 能处理任意文件上传，则设为 `true`。 */
  file?: boolean
}

interface MultimodalOutputCapabilities {
  /** 如果 Agent 能在响应中生成图片，则设为 `true`。 */
  image?: boolean
  /** 如果 Agent 能产出音频输出（文本转语音、音频文件），则设为 `true`。 */
  audio?: boolean
}

interface MultimodalCapabilities {
  /** Agent 可作为输入接受的模态（图片、音频、视频、PDF、文件）。 */
  input?: MultimodalInputCapabilities
  /** Agent 可作为输出产出的模态（图片、音频）。 */
  output?: MultimodalOutputCapabilities
}
```

### Execution（执行）

执行控制与限制。声明这些项，客户端（client）才能对一次 Agent 运行（run）可能耗时多久或经历多少步骤（step）建立预期。

```typescript
interface ExecutionCapabilities {
  /** 如果 Agent 能在一次运行（run）中执行代码（例如 Python、JavaScript），则设为 `true`。 */
  codeExecution?: boolean
  /** 如果代码执行发生在沙箱/隔离环境中，则设为 `true`。
   *  仅在 `codeExecution` 为 `true` 时才有意义。 */
  sandboxed?: boolean
  /** Agent 每次运行（run）会执行的最大工具调用（tool call）/推理（reasoning）迭代次数。
   *  有助于客户端（client）展示进度或设定超时预期。 */
  maxIterations?: number
  /** Agent 超时前的最长实际耗时（以毫秒计）。 */
  maxExecutionTime?: number
}
```

### Human-in-the-Loop（人在回路（human in the loop））

人在回路（human in the loop）交互支持。当你的 Agent 能在继续之前暂停执行、请求人工输入、审批或反馈时，启用这些项。

```typescript
interface HumanInTheLoopCapabilities {
  /** 如果 Agent 支持任何形式的人在回路（human in the loop）交互，则设为 `true`。 */
  supported?: boolean
  /** 如果 Agent 能在执行敏感操作（例如发送邮件、删除数据）之前
   *  暂停并请求显式审批，则设为 `true`。 */
  approvals?: boolean
  /** 如果 Agent 允许人类在执行中途介入并修改其计划，则设为 `true`。 */
  interventions?: boolean
  /** 如果 Agent 能吸收用户反馈（点赞/点踩、纠正）以改进它在
   *  当前会话内的行为，则设为 `true`。 */
  feedback?: boolean
  /** 如果 Agent 参与 AG-UI 中断（interrupt）协议（发出带
   *  `outcome: { type: "interrupt", interrupts: [...] }` 的 `RunFinished`，
   *  接受 `RunAgentInput.resume`），则设为 `true`。 */
  interrupts?: boolean
  /** 如果工具调用（tool call）中断（interrupt）在恢复（resume）载荷中接受 `editedArgs`，则设为 `true`。
   *  仅在 `interrupts` 为 `true` 时才有意义。 */
  approveWithEdits?: boolean
}
```

> [!NOTE]
> 完整的协议规范见[中断（interrupt）](interrupts.md)。

## 实现 getCapabilities()

### 自定义 Agent

在你的 Agent 子类上实现 `getCapabilities()`，只返回你确实支持的能力（capability）：

```typescript
import { AbstractAgent, AgentCapabilities } from "@ag-ui/client"

class MyAgent extends AbstractAgent {
  async getCapabilities(): Promise<AgentCapabilities> {
    return {
      identity: {
        name: "my-agent",
        description: "A custom agent with tool support",
        version: "1.0.0",
      },
      transport: {
        streaming: true,
      },
      tools: {
        supported: true,
        items: this.getRegisteredTools(),
        clientProvided: true,
      },
      state: {
        snapshots: true,
        deltas: true,
      },
    }
  }

  // ... run() 实现
}
```

### 动态能力（capability）

由于 `getCapabilities()` 返回的是实时快照（snapshot），它会反映 Agent 的当前状态（state）：

```typescript
const agent = new MyAgent(config)

let caps = await agent.getCapabilities()
console.log(caps.tools?.items?.length) // 5

// 在运行时再注册一些工具
agent.registerTool(newTool)

caps = await agent.getCapabilities()
console.log(caps.tools?.items?.length) // 6
```

## 客户端（client）使用模式

### 自适应 UI

根据 Agent 支持的内容来渲染 UI 组件：

```typescript
const capabilities = await agent.getCapabilities?.()

// 只有支持时才显示推理（reasoning）面板
if (capabilities?.reasoning?.supported) {
  showReasoningPanel()
}

// 只有存在子 Agent（subagent） 时才显示选择器
if (capabilities?.multiAgent?.subagents?.length) {
  showSubAgentSelector(capabilities.multiAgent.subagents)
}

// 只有支持人在回路（human in the loop）时才显示审批 UI
if (capabilities?.humanInTheLoop?.approvals) {
  enableApprovalWorkflow()
}
```

### 特性开关

停用 Agent 不支持的特性，而不是在运行（run）时失败：

```typescript
const capabilities = await agent.getCapabilities?.()

// 以显式声明为准：省略字段意味着未声明，而不是不支持。
const canUseStructuredOutput = capabilities?.output?.structuredOutput === true
const canStream = capabilities?.transport?.streaming === true
```

### 自定义能力（capability）

通过 `custom` 字段访问集成特有的能力（capability）：

```typescript
const capabilities = await agent.getCapabilities?.()

const rateLimit = capabilities?.custom?.rateLimit as
  | { maxRequestsPerMinute: number }
  | undefined

if (rateLimit) {
  configureThrottling(rateLimit.maxRequestsPerMinute)
}
```
