---
title: "规范"
description: "AG-UI 协议的行为规范 — 1.0"
---

AG-UI 是一个开放协议，它标准化 Agent 与面向用户的应用之间的交流方式：一次请求进入，一路有序的类型化事件（event）流出，携带用户所能看到的 Agent 的一切 —— 文本、工具调用（tool call）、推理（reasoning）、共享状态（state）、进度。

本规范定义了权威的协议要求，其基础是 [`schema.json`](https://docs.ag-ui.com/spec/1.0/schema.json) 中的 JSON Schema，并以 [schema 参考](schema.md)的形式呈现为可读文档。

关于实现指南、概念与示例，见[文档](https://docs.ag-ui.com/introduction)。

本文档中的关键词 "MUST"、"MUST NOT"、"REQUIRED"、"SHALL"、"SHALL NOT"、"SHOULD"、"SHOULD NOT"、"RECOMMENDED"、"NOT RECOMMENDED"、"MAY" 与 "OPTIONAL"，当且仅当它们以全大写形式出现（如本文所示）时，应按 [BCP 14](https://datatracker.ietf.org/doc/html/bcp14) [[RFC2119](https://datatracker.ietf.org/doc/html/rfc2119)] [[RFC8174](https://datatracker.ietf.org/doc/html/rfc8174)] 所述来解释。

## 本文档是什么

JSON Schema 说明一个事件长什么样。它无法说明事件可以以什么顺序到达、实现对它所不认识的东西会做什么，或必须在什么时候发出告警。这些规则就是协议，而本文档陈述它们。

权威的划分是刻意为之且绝对的：

- **[schema](schema.md) 对结构具有权威性。** 哪些字段存在、哪些是必需（required）、每个字段携带什么类型、判别字段可以取哪些值。本文档提到某个字段时，是为了让某条规则有意义 —— 绝不是为了重述该字段的形状。如果两者在结构上不一致，则以 schema 为准，本文档有缺陷。
- **本文档对行为具有权威性。** 顺序、生命周期、归属、错误处理、兼容性。schema 无法表达其中任何一项。如果某个实现与本文档的某条规则不一致，则该实现有缺陷。

## 角色

每条规则都指明了它约束谁。有两个角色承担义务：

- **生产者（producer）** 是任何发出事件流的东西 —— 一个 Agent、一个代理进程、一个桥接层、一个测试替身。
- **消费者（consumer）** 是任何读取事件流的东西 —— 一个客户端（client） SDK、一个 UI、一台录制器、另一个代理进程。

同时承担两者的参与者，在两个方向上分别受两套规则约束。

## 一致性（conformance）

当实现满足适用于其所扮演角色的每一条必须（MUST）与不得（MUST NOT）时，它就是一致的。应当（SHOULD）级别的规则描述好的实现会做什么；偏离其中一条是需要理由的决定，而不是违规。

一致性（conformance）按流判定。一个生产者只要发出过一次畸形的运行（run），就是不一致的 —— 无论它在其他运行中表现如何。

## 概述

协议可分解为一个所有实现都要讲的基础，以及生产者在有话要说时才发出的若干特性：

- **[事件模型](basic/index.md)** —— 信封、通用字段、标识符。
- **[运行输入（run input）](basic/run-input.md)** —— 从应用发往 Agent 的那一条消息（message）。
- **[元数据（metadata）](basic/metadata.md)** —— 附着于一切之上的开放通道，以及它如何合并。
- **[事件模式](basic/patterns/index.md)** —— 流式、快照（snapshot）–增量（delta）、中断（interrupt）–恢复（resume）。
- **[传输（transport）](basic/transports/index.md)** —— HTTP + SSE、HTTP + Protobuf，以及自定义绑定（binding）必须满足的契约。
- **[处理模型](basic/processing.md)** —— 中间件（middleware）先于强制执行；不被识别的材料得以保留，畸形的已知值则是致命的。
- **[版本管理与兼容性](basic/versioning.md)** —— 与更旧和更新的对端交谈，以及内容丢失所带来的义务。
- **[事件流](events/index.md)** —— 八个事件族（event family）。

## 安全与信任（Trust & Safety）

AG-UI 把模型输出变成应用实际执行的事情：工具调用变成动作，状态事件变成写入，流式内容变成用户读到的东西。随之而来的是协议无法在线上（wire）强制、但实现者必须处理的义务。

### 关键原则

1. **用户同意与控制。** 由应用决定运行什么。在执行有副作用的[工具调用](events/tool-calls.md)之前，它应当（SHOULD）取得用户的明确同意，并且不得（MUST NOT）把未经用户批准的动作表示为已获用户批准。
2. **模型输出是不可信的输入。** 工具参数、工具结果（tool result）、[状态](events/state.md)内容以及[透传](events/passthrough.md)载荷都会跨越信任边界。应用必须（MUST）校验自己要据以行动的内容，且不得（MUST NOT）把流式内容渲染为可执行标记。
3. **数据双向流动。** 状态与消息在每次运行中穿过消费者往返。生产者不应（SHOULD NOT）把机密放入其中；消费者应当（SHOULD）以与对话同等的保密级别对待推理与加密工件。

### 实现指南

协议本身无法强制这些原则。实现者应当（SHOULD）为有后果的动作构建同意流程，在每一个信任边界校验 schema 与语义，把渲染与执行隔离开来，并记录足够的日志，以便审计 Agent 代表用户做了什么。

## 范围

本文档规定协议：事件流、运行输入，以及交换它们的各方的义务。它不规定任何特定集成在收到某个事件之后对它做什么、Agent 框架应如何组织，或 UI 应如何渲染任何内容。

AG-UI 由三个第一方 SDK 共同维护 —— TypeScript、Python 与 .NET —— 此处的每一条规则都平等地适用于它们。其他语言的绑定由社区维护；当它们声称符合一致性时，就受本文档约束，但本文档没有任何内容源自它们。

## 了解更多

- **[架构](architecture.md)** — 各组件、运行，以及背后的设计原则。
- **[基础协议](basic/index.md)** — 事件模型、运行输入、模式、传输、处理、版本管理。
- **[事件流](events/index.md)** — 八个事件族及其规则。
- **[关键变更](changelog.md)** — 1.0 相对于 0.x 系列的改动。
