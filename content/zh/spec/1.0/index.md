---
title: "规范（specification）"
description: "AG-UI 协议（protocol）的行为规范（specification） — 1.0"
---

AG-UI 是一个开放协议（protocol），它标准化 Agent 与面向用户的应用（application）之间的交流方式：一次请求进入，一路有序的类型化事件（event）流出，携带用户所能看到的 Agent 的一切 —— 文本、工具调用（tool call）、推理（reasoning）、共享状态（state）、进度。

本规范（specification）定义了权威的协议（protocol）要求，其基础是 [`schema.json`](https://docs.ag-ui.com/spec/1.0/schema.json) 中的 JSON Schema，并以 [schema 参考](schema.md)的形式呈现为可读文档。

关于实现（implementation）指南、概念与示例，见[文档](https://docs.ag-ui.com/introduction)。

本文档中的关键词 "MUST"、"MUST NOT"、"REQUIRED"、"SHALL"、"SHALL NOT"、"SHOULD"、"SHOULD NOT"、"RECOMMENDED"、"NOT RECOMMENDED"、"MAY" 与 "OPTIONAL"，当且仅当它们以全大写形式出现（如本文所示）时，应按 [BCP 14](https://datatracker.ietf.org/doc/html/bcp14) [[RFC2119](https://datatracker.ietf.org/doc/html/rfc2119)] [[RFC8174](https://datatracker.ietf.org/doc/html/rfc8174)] 所述来解释。

## 本文档是什么

JSON Schema 说明一个事件（event）长什么样。它无法说明事件（event）可以以什么顺序到达、实现（implementation）对它所不认识的东西会做什么，或必须在什么时候发出告警（warning）。这些规则就是协议（protocol），而本文档陈述它们。

权威的划分是刻意为之且绝对的：

- **[schema](schema.md) 对结构具有权威性。** 哪些字段（field）存在、哪些是必需（required）、每个字段（field）携带什么类型、判别字段（discriminator）可以取哪些值。本文档提到某个字段（field）时，是为了让某条规则有意义 —— 绝不是为了重述该字段（field）的形状。如果两者在结构上不一致，则以 schema 为准，本文档有缺陷。
- **本文档对行为具有权威性。** 顺序、生命周期（lifecycle）、归属（attribution）、错误处理、兼容性（compatibility）。schema 无法表达其中任何一项。如果某个实现（implementation）与本文档的某条规则不一致，则该实现（implementation）有缺陷。

## 角色

每条规则都指明了它约束谁。有两个角色承担义务：

- **生产者（producer）** 是任何发出事件（event）流（stream）的东西 —— 一个 Agent、一个代理进程、一个桥接层、一个测试替身。
- **消费者（consumer）** 是任何读取事件（event）流（stream）的东西 —— 一个客户端（client） SDK、一个 UI、一台录制器、另一个代理进程。

同时承担两者的参与者，在两个方向上分别受两套规则约束。

## 一致性（conformance）

当实现（implementation）满足适用于其所扮演角色的每一条必须（MUST）与不得（MUST NOT）时，它就是一致的。应当（SHOULD）级别的规则描述好的实现（implementation）会做什么；偏离其中一条是需要理由的决定，而不是违规。

一致性（conformance）按流（stream）判定。一个生产者（producer）只要发出过一次畸形（malformed）的运行（run），就是不一致的 —— 无论它在其他运行（run）中表现如何。

## 概述

协议（protocol）可分解为一个所有实现（implementation）都要讲的基础，以及生产者（producer）在有话要说时才发出的若干特性：

- **[事件（event）模型](basic/index.md)** —— 信封、通用字段（field）、标识符。
- **[运行输入（run input）](basic/run-input.md)** —— 从应用（application）发往 Agent 的那一条消息（message）。
- **[元数据（metadata）](basic/metadata.md)** —— 附着于一切之上的开放通道，以及它如何合并。
- **[事件（event）模式](basic/patterns/index.md)** —— 流式（streaming）、快照（snapshot）–增量（delta）、中断（interrupt）–恢复（resume）。
- **[传输（transport）](basic/transports/index.md)** —— HTTP + SSE、HTTP + Protobuf，以及自定义绑定（binding）必须满足的契约。
- **[处理模型](basic/processing.md)** —— 中间件（middleware）先于强制执行；不被识别的材料得以保留，畸形的已知值则是致命的。
- **[版本（version）管理与兼容性（compatibility）](basic/versioning.md)** —— 与更旧和更新的对端（peer）交谈，以及内容丢失所带来的义务。
- **[事件（event）流（stream）](events/index.md)** —— 八个事件族（event family）。

## 安全与信任（Trust & Safety）

AG-UI 把模型输出变成应用（application）实际执行的事情：工具调用（tool call）变成动作，状态（state）事件（event）变成写入，流式内容变成用户读到的东西。随之而来的是协议（protocol）无法在线上格式（wire format）层面强制、但实现者必须处理的义务。

### 关键原则

1. **用户同意与控制。** 由应用（application）决定运行（run）什么。在执行有副作用的[工具调用（tool call）](events/tool-calls.md)之前，它应当（SHOULD）取得用户的明确同意，并且不得（MUST NOT）把未经用户批准（approval）的动作表示为已获用户批准（approval）。
2. **模型输出是不可信的输入。** 工具参数（args）、工具结果（tool result）、[状态（state）](events/state.md)内容以及[透传（passthrough）](events/passthrough.md)载荷都会跨越信任边界。应用（application）必须（MUST）校验自己要据以行动的内容，且不得（MUST NOT）把流式内容渲染为可执行标记。
3. **数据双向流动。** 状态（state）与消息（message）在每次运行（run）中穿过消费者（consumer）往返。生产者（producer）不应（SHOULD NOT）把机密放入其中；消费者（consumer）应当（SHOULD）以与对话同等的保密级别对待推理（reasoning）与加密工件。

### 实现（implementation）指南

协议（protocol）本身无法强制这些原则。实现者应当（SHOULD）为有后果的动作构建同意流程，在每一个信任边界校验 schema 与语义，把渲染与执行隔离开来，并记录足够的日志，以便审计 Agent 代表用户做了什么。

## 范围

本文档规定协议（protocol）：事件（event）流（stream）、运行输入（run input），以及交换它们的各方的义务。它不规定任何特定集成（integration）在收到某个事件（event）之后对它做什么、Agent 框架应如何组织，或 UI 应如何渲染任何内容。

AG-UI 由三个第一方 SDK 共同维护 —— TypeScript、Python 与 .NET —— 此处的每一条规则都平等地适用于它们。其他语言的绑定（binding）由社区维护；当它们声称符合一致性（conformance）时，就受本文档约束，但本文档没有任何内容源自它们。

## 了解更多

- **[架构](architecture.md)** — 各组件、运行（run），以及背后的设计原则。
- **[基础协议（protocol）](basic/index.md)** — 事件（event）模型、运行输入（run input）、模式、传输（transport）、处理、版本（version）管理。
- **[事件（event）流（stream）](events/index.md)** — 八个事件族（event family）及其规则。
- **[关键变更](changelog.md)** — 1.0 相对于 0.x 系列的改动。
