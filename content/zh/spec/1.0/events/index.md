---
title: "事件流"
description: "八个事件族（event family），以及每一族的响应方 —— 1.0"
---

生产者（producer）要说的一切都以事件（event）的形式到达，共分八个事件族（event family）。每个事件族绑定一种[事件模式](../basic/patterns/index.md)，并加入自己的规则；每个事件族面向消费者（consumer）的不同部分：

| 事件族 | 事件 | 模式 | 消费方 |
| --- | --- | --- | --- |
| [运行（run）与步骤](lifecycle.md) | `RUN_STARTED` · `RUN_FINISHED` · `RUN_ERROR` · `STEP_STARTED` · `STEP_FINISHED` | 生命周期 | 客户端（client）自身 |
| [文本消息](text-messages.md) | `TEXT_MESSAGE_*` | 流式 | UI |
| [工具调用（tool call）](tool-calls.md) | `TOOL_CALL_*` | 流式 | 应用 |
| [推理（reasoning）](reasoning.md) | `REASONING_*` | 流式 | UI |
| [状态（state）](state.md) | `STATE_SNAPSHOT` · `STATE_DELTA` · `MESSAGES_SNAPSHOT` | 快照–增量（snapshot–delta） | 应用的状态存储 |
| [活动（activity）](activity.md) | `ACTIVITY_SNAPSHOT` · `ACTIVITY_DELTA` | 快照–增量（snapshot–delta） | UI |
| [子 Agent（subagent）](subagents.md) | `SUBAGENT_STARTED` · `SUBAGENT_FINISHED` · `SUBAGENT_ERROR` | 生命周期 | 客户端自身 |
| [透传](passthrough.md) | `RAW` · `CUSTOM` | 独立 | 应用，需主动启用 |

这些事件族所包含的三十一种事件类型列举在[事件模型（The Event Model）](../basic/index.md)中，它们的形状由 [schema](../schema.md) 规定。只有运行生命周期对生产者是强制性的——其他每个事件族都只是它在有话要说时才发出的功能。消费者必须（MUST）接受它们全部：来自一个消费者用不上的事件族的事件，仍然是一个格式良好的事件，而不是[未识别材料](../basic/processing.md)。

- **[运行与步骤](lifecycle.md)** — 一次运行何时开始与结束，以及步骤如何标记它的各个阶段。
- **[文本消息](text-messages.md)** — 对话本身，在生成的过程中被流式送出。
- **[工具调用](tool-calls.md)** — Agent 提议，应用处置。
- **[推理](reasoning.md)** — 模型的 thinking，被流式送出，以及让它往返传递的加密产物。
- **[状态](state.md)** — 共享的状态与对话，被整体替换或被修补。
- **[活动](activity.md)** — UI 在对话记录之外渲染的结构化进度。
- **[子 Agent](subagents.md)** — 归属、所有权、嵌套，以及被委派的工作如何终止。
- **[原始事件与自定义事件](passthrough.md)** — 两个逃生通道，以及它们的限制。
