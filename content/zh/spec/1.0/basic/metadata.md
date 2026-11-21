---
title: "元数据（metadata）"
description: "万物之上的开放通道（open channel）：它携带什么、如何合并（merge），以及落在何处 — 1.0"
---

协议（protocol）中几乎一切都携带一个可选（OPTIONAL）的 `metadata` 对象（object）——事件（event）、消息（message）、工具调用（tool call）、工具、中断（interrupt）、恢复（resume）条目（entry）。它是承载协议（protocol）未建模内容的开放通道（open channel）：提供方（provider）名称、延迟、结束原因（finish reason）、token 计数、追踪键（trace key），以及应用（application）想让数据顺带携带的任何东西。

## 取值（value）

`metadata` 按键（key）开放。键（key）下允许任意 JSON 值，包括 `null`——那里的 `null` 是有意义的数据。该对象（object）本身要么缺席，要么是一个对象（object），不得（MUST NOT）为 `null`。

未知的元数据（metadata）键（key）在协议（protocol）上是合法的，不属于未被识别的素材（material）：[处理模型（processing model）](processing.md)在任何键（key）上都不会剥离（strip）它们。

## 键（key）

`ag-ui` 键（key）保留给协议（protocol）自用。其他每个键（key）都是应用（application）空间；生产者（producer）应当（SHOULD）给自己发明的键（key）加上厂商（vendor）或应用（application）名前缀，这样两个扩展同一条流（stream）的参与方不会撞车。

## 合并（merge）

流式产生的条目（item）由若干事件（event）拼装而成，而有意思的取值——token 用量（token usage）、结束原因（finish reason）——只有在末尾才可知。因此元数据（metadata）是累积的，而不是在条目（item）打开时就固定下来：消费者（consumer）必须（MUST）把构成某个条目（item）的每个事件（event）的元数据（metadata）逐键（key）合并（merge），每个键（key）以后写者胜出。

合并（merge）不得（MUST NOT）递归。键（key）的取值是整体替换的，因此键（key）下的对象（object）或数组会被整体替换，而不是与先前的值混合。

## 每个事件（event）的元数据（metadata）落在何处

合并（merge）需要一个目标，而目标就是该事件（event）所构建的东西——并非总是那条消息（message）：

| 事件（event） | 合并进（merge into） |
| --- | --- |
| `TEXT_MESSAGE_START` / `CONTENT` / `END` | 文本消息（text message） |
| `REASONING_MESSAGE_START` / `CONTENT` / `END` | 推理消息（reasoning message） |
| `TOOL_CALL_START` / `ARGS` / `END` | **工具调用（tool call）本身**——而不是拥有它的那条助手消息（assistant message） |
| `TOOL_CALL_RESULT` | 它创建的工具消息（tool message） |
| `ACTIVITY_SNAPSHOT` / `ACTIVITY_DELTA` | 活动消息（activity message）——累积的元数据（metadata）能在替换性快照（snapshot）中存活（[活动（activity）](../events/activity.md)） |
| chunk（`*_CHUNK`） | 其合成事件（synthesized event）所合并（merge）进去的对象（[chunk 元数据（metadata）](patterns/streaming.md#分块chunk元数据metadata)） |
| 其他一切（`RUN_*`、`STEP_*`、快照（snapshot）、`RAW`、`CUSTOM`、……） | 无处可落——见下文 |

> [!NOTE]
> 工具调用（tool call）的元数据（metadata）落在调用本身而不是其父消息（parent message）上，是刻意为之。一条助手消息（assistant message）可以拥有多次工具调用（tool call），若把它们的元数据（metadata）折进父级，结果就会取决于这些调用恰好交错出现的顺序。每次调用各自保留自己的元数据（metadata），正是让它保持无歧义的原因。

不构建任何持久条目（durable item）的事件（event）没有合并（merge）目标：它的元数据（metadata）属于该事件（event）自己，对中间件（middleware）以及任何观察该流（stream）的一方可见，协议（protocol）不会把它再分配到别处。消费者（consumer）可以（MAY）把它呈现出来——比如把某次运行（run）的 `RUN_FINISHED` 元数据（metadata）记进自己的记账（bookkeeping）里——但没有任何规则要求这样做。

## 存储的元数据（metadata）

消息（message）、工具调用（tool call）、工具、中断（interrupt）与恢复（resume）条目（entry）把 `metadata` 作为自身的一个普通存储字段（field）携带。除了上文列出的那些事件（event），没有任何东西合并（merge）进这些字段（field）；[运行输入（run input）](run-input.md)中某个工具的元数据（metadata），或某个中断（interrupt）的元数据（metadata），只是随其载体（carrier）旅行的数据。

## 数据类型（data type）

[`Metadata`](../schema.md#metadata) 由 [schema 参考（schema reference）](../schema.md)定义，其中每个载体（carrier）的条目（entry）都会列出它的 `metadata` 字段（field）。
