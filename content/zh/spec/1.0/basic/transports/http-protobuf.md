---
title: "HTTP + Protobuf"
description: "二进制绑定（binding）：同样的 POST，回传一路带长度前缀的 protobuf 帧 — 1.0"
---

二进制绑定（binding），面向想要紧凑线上（wire）的消费者（consumer）。它完全共享 [SSE 绑定](http-sse.md)的请求一半 —— 运行输入（run input）就是同一个 JSON POST —— 只在响应上不同。

## 协商

- 想要该绑定的客户端（client）在其 `Accept` 头中包含 `application/vnd.ag-ui.event+proto`，与 `text/event-stream` 并列。是否接纳即是否选择加入 —— 通配范围（`*/*`、`application/*`）也接纳该媒体类型 —— 因此无法消费 protobuf 的客户端必须（MUST）发送明确列出自己所能接受内容的 `Accept`，而不是通配符或降序条目：两种媒体类型之间的相对质量值不被参考。
- 支持该绑定的生产者（producer）应当（SHOULD）在客户端的 `Accept` 以正质量接纳该媒体类型时用它作答，否则必须（MUST）以 SSE 作答。不支持该绑定的生产者会忽略该媒体类型 —— 这正是客户端必须（MUST）始终准备好接收 SSE 的原因。
- 响应的 `Content-Type` 恰为 `application/vnd.ag-ui.event+proto`；消费者依此头选择解析器。

## 分帧

响应正文是一串帧，每帧一个协议事件（event）：

- 一帧是一个 4 字节长度头 —— 无符号 32 位大端整数 —— 后跟恰好那么多字节的单个已编码事件。
- 帧之间紧邻，没有分隔符。消费者必须（MUST）容忍跨传输（transport）分块拆分的帧，以及单个分块内的多个帧。
- 在帧中途结束的正文是一次[被截断的运行（run）](index.md#截断)。

## 线上 schema

protobuf 消息定义由生成 SDK 所用的同一份 [JSON Schema](../../schema-files.md) 生成；线上 schema 不是第二个真相来源。跨实现的一致性属于一致性（conformance）表面的一部分：一组规范事件的语料固定已编码的字节，每一个第一方编码器都必须（MUST）逐字节复现该语料。（语料才是保障 —— 两个拿到同一*语义*值的编码器仍可能以不同顺序排列开放 JSON 对象的条目，而 protobuf map 编码会把这暴露出来。）

语义在与二进制线上所允许的范围内尽可能贴近 SSE 绑定：

- 从帧解码出的事件进入与从 SSE 解析出的事件相同的[处理流水线](../processing.md)—— 中间件（middleware）在前，强制执行在后，完全一致。
- 线上 schema 作为开放载荷携带的材料 —— `RUN_FINISHED.outcome`、元数据（metadata）、状态（state）、`rawEvent` —— 能在解码后存活并到达该流水线：到达该绑定的不被识别的结果会被强制执行剥离并发出告警，与在 SSE 上完全一致，而绑定不得（MUST NOT）在解码时拒绝它。
- 对于其余部分，二进制线上天生更窄。构建时线上 schema 早于它的某个*字段*会被 protobuf 解码本身静默跳过 —— 剥离并告警的行为只在 JSON 线上完全可见。同样的收窄也覆盖线上 schema 未建模的协议合法开放成员：JSON Patch 操作的扩展成员，JSON 线上必须（MUST）保留，但无法在此存活。构建早于其信封分支的*事件*没有类型字符串可以传递下去，因此绑定丢弃该帧并发出告警—— 与强制执行给出的答案相同，只是写在传输层。
- 字节无法解码为消息的帧是畸形的传输材料，对流是致命的。仅仅在帧中途结束的正文则不是：那是一次[被截断的运行](index.md#截断)。

## 错误

与 [SSE 绑定](http-sse.md#错误)完全相同：流之前的拒绝是一个 HTTP 错误状态；流内部的失败是 `RUN_ERROR`，作为一个帧，与其他帧无异。
