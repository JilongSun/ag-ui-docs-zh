---
title: "事件（event）模式"
description: "生产者（producer）把事件（event）组合成流的方式 — 1.0"
---

本页定义核心协议的事件（event）模式：生产者（producer）把事件组合成流的方式。每一种[传输（transport）](../transports/index.md)都承载所有这些模式；传输之间的差别只在于事件如何被分帧与投递。

协议的方向是固定的。事件从生产者流向消费者（consumer）；消费者每次交换只发言一次，即发送开启该交换的[运行输入（run input）](../run-input.md)。生产者不得（MUST NOT）要求消费者发送任何运行中消息 —— 需要外部输入的运行（run）会结束，答案在下一个运行中到达：通过中断（interrupt）及其恢复（resume）条目，或通过一个[前端工具调用（tool call）](../../events/tool-calls.md#前端工具)留待未答、并在下一次输入的 messages 中作答。

## 流式

长的值一次到达一片：一个 `*_START` 开启一项，内容事件扩展它，一个 `*_END` 关闭它 —— 或者分块简写把三者压缩在一起。文本消息、工具调用与推理消息都以这种方式流式传输。

```mermaid
sequenceDiagram
    participant Producer as 生产者
    participant Consumer as 消费者
    Producer->>Consumer: *_START (id)
    Producer->>Consumer: content (id, delta) ×N
    Producer->>Consumer: *_END (id)
```

参见[流式消息（message）](streaming.md)。

## 快照（snapshot）与增量（delta）

演进中的值 —— Agent 状态（state）、活动（activity）、对话本身 —— 以替换整体的快照（snapshot）与修正现有值的增量（delta）携带，增量以 RFC 6902 JSON Patch 表达。

```mermaid
sequenceDiagram
    participant Producer as 生产者
    participant Consumer as 消费者
    Producer->>Consumer: *_SNAPSHOT (the whole value)
    Producer->>Consumer: *_DELTA (a patch) ×N
    Producer->>Consumer: *_SNAPSHOT (resynchronise)
```

参见[快照与增量](snapshots.md)。

## 中断（interrupt）与恢复（resume）

需要来自外部某物的运行—— 一次批准、一个缺失的值 —— 以中断结果结束，而从它继续的运行在其输入中携带答案。

```mermaid
sequenceDiagram
    participant Application as 应用
    participant Agent
    Application->>Agent: RunAgentInput
    Agent->>Application: … 事件 …
    Agent->>Application: RUN_FINISHED (outcome: interrupt)
    Note over Application: 收集答案
    Application->>Agent: RunAgentInput (resume: answers)
    Agent->>Application: RUN_STARTED …
```

参见[中断与恢复](interrupt-resume.md)。

## 添加模式

所有协议特性都由这些模式构建。新增模式的协议修订版本在本页定义它。传输无需改动即可承载新模式，因为模式完全以事件与运行输入来表达。
