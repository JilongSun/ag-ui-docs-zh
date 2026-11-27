---
title: "事件模型"
description: "事件（event）的信封、其通用字段、各类标识符，以及每个事件（event）的全景图 — 1.0"
---

基础协议是每个实现无论使用哪些功能都会使用的部分：

- **事件模型** —— 本页：每个事件（event）共用的信封、其通用字段，以及把事件串联起来的标识符。
- **[运行输入（run input）](run-input.md)** —— 反向流动的那一条消息（message）。
- **[元数据（metadata）](metadata.md)** —— 万物之上的开放通道，以及它如何合并。
- **[能力（capability）](capabilities.md)** —— Agent 在一次运行（run）之前对自身的声明，以及一项声明所附带的义务。
- **[事件模式](patterns/index.md)** —— 事件组合成流的各种方式。
- **[传输（transport）](transports/index.md)** —— 流如何分帧与投递。
- **[处理模型](processing.md)** —— 消费者（consumer）如何处理它不认识的素材。
- **[版本管理与兼容性](versioning.md)** —— 与更旧或更新的对端通信。

所有实现必须（MUST）支持事件模型与事件模式。运行生命周期之外的[事件族（event family）](../events/index.md)属于功能：生产者（producer）只发出自己有话要说的那些。

## 事件（event）

每个事件都是一个共享同一信封的 JSON 对象，由 schema 定义为 `BaseEvent`：

- `type` —— 必需（REQUIRED）。判别字段，取 `EventType` 的 31 个值之一。本规范中的每条规则都通过该字段附着到事件上。
- `timestamp` —— 可选（OPTIONAL）。事件被创建的时刻。属于资料性说明：消费者不得（MUST NOT）用它来给事件排序——到达顺序才是协议的顺序。按照惯例，单位是自 Unix 纪元起的毫秒数。
- `rawEvent` —— 可选（OPTIONAL）。该事件由之翻译而来的提供方原生事件，逐字携带。消费者不得（MUST NOT）从中推导协议行为。
- `metadata` —— 可选（OPTIONAL）。参见[通用字段](#通用字段)。

可以归属于子 Agent（subagent）工作的事件还会额外携带一个可选（OPTIONAL）的 `subagentRunId`（schema 中的 `Attributable`）；它由[子 Agent规则](../events/subagents.md)约束。运行级事件——`RUN_STARTED`、`RUN_FINISHED`、`RUN_ERROR`、`MESSAGES_SNAPSHOT`——描述的是整个运行或整个会话，不携带归属。

## 通用字段

### `metadata`

万物之上的开放通道：按键开放，每个键下可以是任意 JSON 值，在构建同一个条目的各事件之间累积——逐键累加、后写者胜出、不做递归——具有按事件族区分的合并目标，以及一个保留的 `ag-ui` 键。它有自己的页面：[元数据](metadata.md)。

### 缺席即缺席

没有取值的可选（optional）字段必须（MUST）省略，而不是以 `null` 发送。

这适用于每一个可选字段，包括携带任意 JSON 的字段，例如 `rawEvent`、`RUN_FINISHED.result` 与 `forwardedProps`。整个可选字段被设为 `null` 时必须（MUST）省略。必需（required）的 JSON 载荷可以是 `null`，例如 `CUSTOM.value` 或 `STATE_SNAPSHOT.snapshot`。

> [!NOTE]
> 这不是风格偏好。消费者若要同时接受两种写法，就必须在任何地方都把二者视为等同，而这类宽容一旦发布便永久存在。协议只承载每个实现都能表示的那一种写法。

按键开放的对象*内部的 `null` 取值*——某个元数据值、`state` 中的某个东西——是数据，必须（MUST）保留。只有代替整个缺席字段的那个 `null` 才被禁止。

对于协议已经针对可选位置上的 `null` 发布过宽容的情形，由兼容垫片处理，而不是由这条规则处理。参见[版本管理与兼容性](versioning.md)。

## 标识符

- `threadId` 标识一次对话。它由应用铸造，在多次运行之间保持稳定。
- `runId` 标识一次运行。不得（MUST NOT）把它复用于同一线程（thread）上的另一次运行。
- `messageId` 标识一条消息。它跨越运行边界——后续运行中的快照（snapshot）可以（MAY）按 id 重述某条消息——因此它在所属线程内必须（MUST）唯一。
- `toolCallId` 标识一次工具调用（tool call），并把它自己的结果以及任何与它相关的中断（interrupt）回指到它。
- `subagentRunId` 是某次子 Agent*调用*的不透明句柄，而不是子 Agent定义的可复用名称：同一个子 Agent的两次调用携带两个不同的值。

所有标识符都是不透明字符串：消费者不得（MUST NOT）从中解析出结构。

## 事件（event）全览

三十一种事件类型，分属八个事件族：

| 事件族 | 事件 | 模式 |
| --- | --- | --- |
| [运行与步骤](../events/lifecycle.md) | `RUN_STARTED` `RUN_FINISHED` `RUN_ERROR` `STEP_STARTED` `STEP_FINISHED` | 生命周期 |
| [文本消息](../events/text-messages.md) | `TEXT_MESSAGE_START` `TEXT_MESSAGE_CONTENT` `TEXT_MESSAGE_END` `TEXT_MESSAGE_CHUNK` | [流式](patterns/streaming.md) |
| [工具调用](../events/tool-calls.md) | `TOOL_CALL_START` `TOOL_CALL_ARGS` `TOOL_CALL_END` `TOOL_CALL_CHUNK` `TOOL_CALL_RESULT` | [流式](patterns/streaming.md) |
| [推理（reasoning）](../events/reasoning.md) | `REASONING_START` `REASONING_END` `REASONING_MESSAGE_START` `REASONING_MESSAGE_CONTENT` `REASONING_MESSAGE_END` `REASONING_MESSAGE_CHUNK` `REASONING_ENCRYPTED_VALUE` | [流式](patterns/streaming.md) |
| [状态（state）](../events/state.md) | `STATE_SNAPSHOT` `STATE_DELTA` `MESSAGES_SNAPSHOT` | [快照–增量（snapshot–delta）](patterns/snapshots.md) |
| [活动（activity）](../events/activity.md) | `ACTIVITY_SNAPSHOT` `ACTIVITY_DELTA` | [快照–增量（snapshot–delta）](patterns/snapshots.md) |
| [子 Agent](../events/subagents.md) | `SUBAGENT_STARTED` `SUBAGENT_FINISHED` `SUBAGENT_ERROR` | 生命周期 |
| [透传](../events/passthrough.md) | `RAW` `CUSTOM` | 独立 |

## Schema

协议的完整结构由位于 [`/spec/1.0/schema.json`](https://docs.ag-ui.com/spec/1.0/schema.json) 的 JSON Schema 定义。它是事实来源：TypeScript、Python 与 .NET 模型都由它生成；本文档提到某个字段时，只是在命名 schema 定义的某个东西，绝不重述它的形状。

schema 刻意不说本文档所说的内容：顺序、生命周期、归属、错误处理与兼容性都是行为性的，schema 无法表达它们。如果二者在结构上出现分歧，以 schema 为准，而本文档就是有缺陷的一方。
