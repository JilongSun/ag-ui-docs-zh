---
title: "子 Agent（subagent）"
description: "归属、所有权、嵌套、并行执行、状态（state）与终止 —— 1.0"
---

一个 Agent 可以把一次运行（run）的一部分委派给另一个 Agent。被委派者产出的一切都走同一条流，所以消费者（consumer）需要知道哪些工作属于谁，而无需重放这次运行。

## 归属

`subagentRunId` 标识子 Agent（subagent）的一次调用。子 Agent产出的事件（event）携带它；父 Agent 产出的事件不携带。`subagentRunId` 缺席意味着父 Agent，且不得（MUST NOT）写成 `null`。

一个 id 标识的是一次*调用*，而不是一个 Agent。生产者（producer）不得（MUST NOT）在一次运行内把同一个 `subagentRunId` 复用于第二次调用，即便是同一个子 Agent——第二次调用会得到自己的 id。当一次被挂起的调用被继续时，该 id 可以（MAY）在之后的运行中重新出现。

哪些事件可以携带归属是一个结构性问题，由 [schema](../schema.md#attributable) 回答。把独立事件上的标记——`STEP_*`、`CUSTOM`、`RAW`、状态（state）事件——读作来源：它记录是谁产出了该事件，而不是说生产者拥有该事件所触及之物的私有副本。

## 生命周期

`SUBAGENT_STARTED` 宣布一次调用，`SUBAGENT_FINISHED` 关闭它，`SUBAGENT_ERROR` 报告它失败了。三者都携带它们所涉及的那个 `subagentRunId`，生产者不得（MUST NOT）省略它。

- 宣布一次调用的生产者必须（MUST）在任何归属到它的事件之前完成这次宣布。
- 生产者不得（MUST NOT）宣布一个 id 已处于活动状态的调用。
- 生产者不得（MUST NOT）复用一个已在此次运行中结束的调用的 id。
- 生产者宣布的每一次调用都必须（MUST）在运行结束之前由 `SUBAGENT_FINISHED` 或 `SUBAGENT_ERROR` 关闭。

生产者可以（MAY）给事件加归属而不宣布任何东西。这样的流告诉消费者哪些工作属于一起，却不告诉它某次调用何时开始、何时结束，消费者必须（MUST）接受它：`subagentRunId` 本身就有意义，若强制要求生命周期事件，就会让无法报告它们的生产者无法使用分组。能够报告生命周期的生产者应当（SHOULD）报告，这样消费者就能把某次调用显示为正在运行，而不必从恰好到达的事件中推断。

`SUBAGENT_ERROR` 结束的是这次调用，而不是这次运行。父 Agent 可以（MAY）处理一个失败的子 Agent并继续；这正是它不是 `RUN_ERROR` 的原因。

子 Agent的模型调用就是这次运行的调用：没有任何子 Agent事件携带 token 用量，这次运行的终止事件[报告](lifecycle.md#token-用量)整次运行的用量，子 Agent也算在内。

`SUBAGENT_FINISHED` 报告这一段为何结束。结果缺席意味着成功。挂起结果意味着这次调用暂停，等待外部输入——对这条流而言是终止，但对该调用而言不是，之后的运行可以（MAY）以同一 id 继续它。生产者不得（MUST NOT）发送 schema 未描述的结果值，也不得（MUST NOT）把中断（interrupt）id 挂到成功结果上。

## 所有权

归属不是建议性的。一个实体一旦在某个所有者之下被开启，继续它的每个事件都必须（MUST）就该所有者保持一致。

- `TEXT_MESSAGE_CONTENT` 或 `TEXT_MESSAGE_END` 不得（MUST NOT）携带与开启该消息（message）的 `TEXT_MESSAGE_START` 不一致的 `subagentRunId`。它可以（MAY）省略该标记：未加标记的续篇延续开启者所拥有的一切，只给开启者加标记的生产者仍符合规范（conformance）。
- 推理消息同理；工具调用（tool call）相对其 `TOOL_CALL_START` 同理；活动消息相对开启它的快照（snapshot）同理。
- `STEP_FINISHED` 必须（MUST）携带与它所关闭的 `STEP_STARTED` 相同的归属。步骤是按所有者区分的：父 Agent 与子 Agent可以（MAY）各自同时打开一个同名的步骤，各关各的。

消费者必须（MUST）拒绝标记与开启者不一致的续篇。接受它会把一个生产者的内容追加进另一个生产者的消息，而这是任何消费者事后都无法检测的。不带标记的续篇不算不一致，必须（MUST）被接受。

工具调用继承承载它的那条消息的归属。生产者不得（MUST NOT）让一次工具调用的归属指向一个所有者，而承载它的消息的归属指向另一个所有者。

## 嵌套与并行

子 Agent自己也可以（MAY）再委派。`SUBAGENT_STARTED` 上的 `parentSubagentRunId` 指名催生这次调用的那次调用；缺席意味着由父 Agent 直接催生。生产者不得（MUST NOT）指名一个在此次运行中尚未被宣布的父调用。

各次调用可以（MAY）并行运行，它们的事件可以（MAY）任意交错。每次调用的实体分别跟踪，所以两个子 Agent可以（MAY）同时流式送出消息。消费者不得（MUST NOT）假定某次调用的事件是连续的，也不得（MUST NOT）因为另一次调用结束就关闭这次调用的实体。

## 状态（state）

状态是运行作用域的。子 Agent发送的 `STATE_SNAPSHOT` 或 `STATE_DELTA` 更新这次运行的状态，与父 Agent 发送的完全一样，消费者必须（MUST）以那种方式应用它。

状态事件上的 `subagentRunId` 是来源：它记录是哪个调用产出了这次更新。不得（MUST NOT）把它读作子 Agent拥有自己的私有状态，消费者也不得（MUST NOT）因为更新来自子 Agent就不把它应用于这次运行的状态。本协议中没有按子 Agent区分的状态。

## 终止

只要还有调用处于活动状态，运行就不得（MUST NOT）结束。生产者在还有调用打开的情况下走到工作尽头，就是一个缺陷：要么该调用已经结束却没有被报告，要么它没有结束，而运行也就没有结束。

`RUN_ERROR` 终结一切。运行出错时，消费者必须（MUST）把每一个打开的调用都视为被放弃，且不得（MUST NOT）期待它们中任何一个会有收尾事件。

当一次运行以中断结果结束时，它携带的中断可以（MAY）带归属。带有 `subagentRunId` 标记的中断是在该调用内部引发的；未加标记的中断属于父 Agent。因某个后代中断而被挂起的调用自己没有中断，所以挂起结果可以（MAY）完全不携带中断id。
