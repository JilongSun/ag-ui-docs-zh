---
title: "子 Agent（subagent）"
description: "归属（attribution）、所有权（ownership）、嵌套（nesting）、并行执行（parallelism）、状态（state）与终止（termination） —— 1.0"
---

一个 Agent 可以把一次运行（run）的一部分委派给另一个 Agent。被委派者产出的一切都走同一条流（stream），所以消费者（consumer）需要知道哪些工作属于谁，而无需重放（replay）这次运行（run）。

## 归属（attribution）

`subagentRunId` 标识子 Agent（subagent）的一次调用（invocation）。子 Agent（subagent）产出的事件（event）携带它；父 Agent 产出的事件（event）不携带。`subagentRunId` 缺席意味着父 Agent，且不得（MUST NOT）写成 `null`。

一个 id 标识的是一次*调用（invocation）*，而不是一个 Agent。生产者（producer）不得（MUST NOT）在一次运行（run）内把同一个 `subagentRunId` 复用于第二次调用（invocation），即便是同一个子 Agent（subagent）——第二次调用（invocation）会得到自己的 id。当一次被挂起（suspend）的调用（invocation）被继续时，该 id 可以（MAY）在之后的运行（run）中重新出现。

哪些事件（event）可以携带归属（attribution）是一个结构性问题，由 [schema](../schema.md#attributable) 回答。把独立事件（event）上的标记——`STEP_*`、`CUSTOM`、`RAW`、状态（state）事件（event）——读作来源（provenance）：它记录是谁产出了该事件（event），而不是说生产者（producer）拥有该事件（event）所触及之物的私有副本。

## 生命周期（lifecycle）

`SUBAGENT_STARTED` 宣布一次调用（invocation），`SUBAGENT_FINISHED` 关闭它，`SUBAGENT_ERROR` 报告它失败了。三者都携带它们所涉及的那个 `subagentRunId`，生产者（producer）不得（MUST NOT）省略它。

- 宣布一次调用（invocation）的生产者（producer）必须（MUST）在任何归属（attribution）到它的事件（event）之前完成这次宣布。
- 生产者（producer）不得（MUST NOT）宣布一个 id 已处于活动状态的调用（invocation）。
- 生产者（producer）不得（MUST NOT）复用一个已在此次运行（run）中结束的调用（invocation）的 id。
- 生产者（producer）宣布的每一次调用（invocation）都必须（MUST）在运行（run）结束之前由 `SUBAGENT_FINISHED` 或 `SUBAGENT_ERROR` 关闭。

生产者（producer）可以（MAY）给事件（event）加归属（attribution）而不宣布任何东西。这样的流（stream）告诉消费者（consumer）哪些工作属于一起，却不告诉它某次调用（invocation）何时开始、何时结束，消费者（consumer）必须（MUST）接受它：`subagentRunId` 本身就有意义，若强制要求生命周期事件（lifecycle event），就会让无法报告它们的生产者（producer）无法使用分组。能够报告生命周期（lifecycle）的生产者（producer）应当（SHOULD）报告，这样消费者（consumer）就能把某次调用（invocation）显示为正在运行（running），而不必从恰好到达的事件（event）中推断。

`SUBAGENT_ERROR` 结束的是这次调用（invocation），而不是这次运行（run）。父 Agent 可以（MAY）处理一个失败的子 Agent（subagent）并继续；这正是它不是 `RUN_ERROR` 的原因。

子 Agent（subagent）的模型调用就是这次运行（run）的调用：没有任何子 Agent（subagent）事件（event）携带 token 用量，这次运行（run）的终止事件（terminal event）[报告](lifecycle.md#token-用量token-usage)整次运行（run）的用量，子 Agent（subagent）也算在内。

`SUBAGENT_FINISHED` 报告这一段为何结束。结果（outcome）缺席意味着成功。挂起（suspended）结果意味着这次调用（invocation）暂停，等待外部输入——对这条流（stream）而言是终止，但对该调用（invocation）而言不是，之后的运行（run）可以（MAY）以同一 id 继续它。生产者（producer）不得（MUST NOT）发送 schema 未描述的结果（outcome）值，也不得（MUST NOT）把中断（interrupt）id 挂到成功结果（outcome）上。

## 所有权（ownership）

归属（attribution）不是建议性的。一个实体一旦在某个所有者（owner）之下被开启，继续它的每个事件（event）都必须（MUST）就该所有者（owner）保持一致。

- `TEXT_MESSAGE_CONTENT` 或 `TEXT_MESSAGE_END` 不得（MUST NOT）携带与开启该消息（message）的 `TEXT_MESSAGE_START` 不一致的 `subagentRunId`。它可以（MAY）省略该标记：未加标记的续篇延续开启者（opener）所拥有的一切，只给开启者（opener）加标记的生产者（producer）仍符合规范（conformance）。
- 推理消息（reasoning message）同理；工具调用（tool call）相对其 `TOOL_CALL_START` 同理；活动消息（activity message）相对开启它的快照（snapshot）同理。
- `STEP_FINISHED` 必须（MUST）携带与它所关闭的 `STEP_STARTED` 相同的归属（attribution）。步骤（step）是按所有者（owner）区分的：父 Agent 与子 Agent（subagent）可以（MAY）各自同时打开一个同名的步骤（step），各关各的。

消费者（consumer）必须（MUST）拒绝标记与开启者（opener）不一致的续篇。接受它会把一个生产者（producer）的内容追加进另一个生产者（producer）的消息（message），而这是任何消费者（consumer）事后都无法检测的。不带标记的续篇不算不一致，必须（MUST）被接受。

工具调用（tool call）继承承载它的那条消息（message）的归属（attribution）。生产者（producer）不得（MUST NOT）让一次工具调用（tool call）的归属（attribution）指向一个所有者（owner），而承载它的消息（message）的归属（attribution）指向另一个所有者（owner）。

## 嵌套（nesting）与并行（parallelism）

子 Agent（subagent）自己也可以（MAY）再委派。`SUBAGENT_STARTED` 上的 `parentSubagentRunId` 指名催生这次调用（invocation）的那次调用（invocation）；缺席意味着由父 Agent 直接催生。生产者（producer）不得（MUST NOT）指名一个在此次运行（run）中尚未被宣布的父调用（invocation）。

各次调用（invocation）可以（MAY）并行（parallelism）运行（run），它们的事件（event）可以（MAY）任意交错。每次调用（invocation）的实体分别跟踪，所以两个子 Agent（subagent）可以（MAY）同时流式（streaming）送出消息（message）。消费者（consumer）不得（MUST NOT）假定某次调用（invocation）的事件（event）是连续的，也不得（MUST NOT）因为另一次调用（invocation）结束就关闭这次调用（invocation）的实体。

## 状态（state）

状态（state）是运行（run）作用域的。子 Agent（subagent）发送的 `STATE_SNAPSHOT` 或 `STATE_DELTA` 更新这次运行（run）的状态（state），与父 Agent 发送的完全一样，消费者（consumer）必须（MUST）以那种方式应用它。

状态（state）事件（event）上的 `subagentRunId` 是来源（provenance）：它记录是哪个调用（invocation）产出了这次更新。不得（MUST NOT）把它读作子 Agent（subagent）拥有自己的私有状态（state），消费者（consumer）也不得（MUST NOT）因为更新来自子 Agent（subagent）就不把它应用于这次运行（run）的状态（state）。本协议（protocol）中没有按子 Agent（subagent）区分的状态（state）。

## 终止（termination）

只要还有调用（invocation）处于活动状态，运行（run）就不得（MUST NOT）结束。生产者（producer）在还有调用（invocation）打开的情况下走到工作尽头，就是一个缺陷：要么该调用（invocation）已经结束却没有被报告，要么它没有结束，而运行（run）也就没有结束。

`RUN_ERROR` 终结一切。运行（run）出错时，消费者（consumer）必须（MUST）把每一个打开的调用（invocation）都视为被放弃，且不得（MUST NOT）期待它们中任何一个会有收尾事件（event）。

当一次运行（run）以中断（interrupt）结果（outcome）结束时，它携带的中断（interrupt）可以（MAY）带归属（attribution）。带有 `subagentRunId` 标记的中断（interrupt）是在该调用（invocation）内部引发的；未加标记的中断（interrupt）属于父 Agent。因某个后代中断（interrupt）而被挂起（suspend）的调用（invocation）自己没有中断（interrupt），所以挂起（suspended）结果（outcome）可以（MAY）完全不携带中断（interrupt）id。
