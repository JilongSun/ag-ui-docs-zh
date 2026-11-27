---
title: "HTTP + Server-Sent Events"
description: "默认绑定（binding）：一次携带运行输入（run input）的 POST，一条携带运行（run）的 text/event-stream — 1.0"
---

默认绑定（binding）。应用把运行输入（run input）POST 到 Agent 的端点；响应是一条 [Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html) 流，承载该运行（run）。

## 请求

- 客户端（client）向 Agent 端点发送 `POST`。正文是[`RunAgentInput`](../run-input.md)，即单个 JSON 对象，UTF-8 编码，`Content-Type: application/json`。
- 客户端发送 `Accept: text/event-stream`（在也能消费该绑定时加上 [protobuf 媒体类型](http-protobuf.md)）。

## 响应

- 开始的运行以 `200` 应答，`Content-Type: text/event-stream`。
- 每个 SSE 事件（event）的 `data` 载荷恰好是一个协议事件的 JSON 对象 —— 绝不多于一个，绝不是片段。多行 `data:` 字段按 SSE 规定的方式拼接。
- 生产者（producer）必须（MUST）以 LF（`\n`）行尾对流分帧。SSE 语法也接受 CR 与 CRLF，但本绑定固定为每个消费者（consumer）已知都能解析的那一种形式；消费者可以（MAY）额外接受完整语法。
- 消费者必须（MUST）忽略 `data` 以外的 SSE 字段（`event:`、`id:`、`retry:`），并且必须（MUST）容忍 SSE 注释行（`: keep-alive`），生产者可以（MAY）以任意节奏发送它们。
- 生产者在最后一次运行的终止事件之后关闭响应正文。一次 POST 携带一个请求；然而当生产者在请求的运行之前重放线程（thread）的历史时，响应仍可以（MAY）携带[多个运行](../../events/lifecycle.md#一条流上的多次运行 run)—— 按[绑定契约](index.md#绑定 binding 契约)，不会有更多输入为它们传输。

## 错误

- 在运行开始之前被拒绝的输入 —— 畸形的 JSON、校验失败、认证被拒 —— 是一个 HTTP 错误状态，没有事件流。运行从未开始。
- 流打开之后的失败在流内以 `RUN_ERROR` 传输。HTTP 状态已经发送且无法更改；消费者不得（MUST NOT）仅凭 `200` 推断成功。
- 没有终止事件就断开的连接是一次[被截断的运行](index.md#截断)。

## 无恢复

该绑定没有流恢复：不使用 SSE 的 `Last-Event-ID` 机制，断开的流无法重新进入。重新运行就是一次带新 `runId` 的新运行，其输入携带消费者所保留的任何内容。

## 示例

```
POST /agent HTTP/1.1
Content-Type: application/json
Accept: text/event-stream

{"threadId":"thr-1","runId":"run-1","messages":[…]}

HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"type":"RUN_STARTED","threadId":"thr-1","runId":"run-1"}

data: {"type":"TEXT_MESSAGE_START","messageId":"msg-1","role":"assistant"}

data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"msg-1","delta":"Hello."}

data: {"type":"TEXT_MESSAGE_END","messageId":"msg-1"}

data: {"type":"RUN_FINISHED","threadId":"thr-1","runId":"run-1"}
```
