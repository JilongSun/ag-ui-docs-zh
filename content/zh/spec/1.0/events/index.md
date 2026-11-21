---
title: "事件流（event stream）"
description: "八个事件族（event family），以及每一族的响应方 —— 1.0"
---

生产者（producer）要说的一切都以事件（event）的形式到达，共分八个事件族（event family）。每个事件族（event family）绑定一种[事件模式（event patterns）](../basic/patterns/index.md)，并加入自己的规则；每个事件族（event family）面向消费者（consumer）的不同部分：

| 事件族（event family） | 事件（event） | 模式（pattern） | 消费方 |
| --- | --- | --- | --- |
| [运行（run）与步骤（step）](lifecycle.md) | `RUN_STARTED` · `RUN_FINISHED` · `RUN_ERROR` · `STEP_STARTED` · `STEP_FINISHED` | 生命周期（lifecycle） | 客户端（client）自身 |
| [文本消息（text message）](text-messages.md) | `TEXT_MESSAGE_*` | 流式（streaming） | UI |
| [工具调用（tool call）](tool-calls.md) | `TOOL_CALL_*` | 流式（streaming） | 应用 |
| [推理（reasoning）](reasoning.md) | `REASONING_*` | 流式（streaming） | UI |
| [状态（state）](state.md) | `STATE_SNAPSHOT` · `STATE_DELTA` · `MESSAGES_SNAPSHOT` | 快照–增量（snapshot–delta） | 应用的状态（state）存储 |
| [活动（activity）](activity.md) | `ACTIVITY_SNAPSHOT` · `ACTIVITY_DELTA` | 快照–增量（snapshot–delta） | UI |
| [子 Agent（subagent）](subagents.md) | `SUBAGENT_STARTED` · `SUBAGENT_FINISHED` · `SUBAGENT_ERROR` | 生命周期（lifecycle） | 客户端（client）自身 |
| [透传（passthrough）](passthrough.md) | `RAW` · `CUSTOM` | 独立（standalone） | 应用，需主动启用 |

这些事件族（event family）所包含的三十一种事件（event）类型列举在[事件模型（The Event Model）](../basic/index.md)中，它们的形状由 [schema](../schema.md) 规定。只有运行生命周期（run lifecycle）对生产者（producer）是强制性的——其他每个事件族（event family）都只是它在有话要说时才发出的功能。消费者（consumer）必须（MUST）接受它们全部：来自一个消费者（consumer）用不上的事件族（event family）的事件（event），仍然是一个格式良好的事件（event），而不是[未识别材料（unrecognised material）](../basic/processing.md)。

- **[运行（run）与步骤（step）](lifecycle.md)** — 一次运行（run）何时开始与结束，以及步骤（step）如何标记它的各个阶段。
- **[文本消息（text message）](text-messages.md)** — 对话本身，在生成的过程中被流式（streaming）送出。
- **[工具调用（tool call）](tool-calls.md)** — Agent 提议，应用（application）处置。
- **[推理（reasoning）](reasoning.md)** — 模型的 thinking，被流式（streaming）送出，以及让它往返传递的加密产物（artefact）。
- **[状态（state）](state.md)** — 共享的状态（state）与对话，被整体替换或被修补。
- **[活动（activity）](activity.md)** — UI 在对话记录（transcript）之外渲染的结构化进度。
- **[子 Agent（subagent）](subagents.md)** — 归属（attribution）、所有权（ownership）、嵌套（nesting），以及被委派的工作如何终止（termination）。
- **[原始事件与自定义事件（raw and custom events）](passthrough.md)** — 两个逃生通道，以及它们的限制。
