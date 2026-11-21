---
title: "HTTP + Server-Sent Events"
description: "默认绑定（binding）：一次携带运行输入（run input）的 POST，一条携带运行（run）的 text/event-stream — 1.0"
---

默认绑定（binding）。应用（application）把运行输入（run input）POST 到 Agent 的端点；响应是一条 [Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html) 流（stream），承载该运行（run）。

## 请求

- 客户端（client）向 Agent 端点发送 `POST`。正文是[`RunAgentInput`](../run-input.md)，即单个 JSON 对象，UTF-8 编码，`Content-Type: application/json`。
- 客户端（client）发送 `Accept: text/event-stream`（在也能消费该绑定（binding）时加上 [protobuf 媒体类型](http-protobuf.md)）。

## 响应

- 开始的运行（run）以 `200` 应答，`Content-Type: text/event-stream`。
- 每个 SSE 事件（event）的 `data` 载荷恰好是一个协议（protocol）事件（event）的 JSON 对象 —— 绝不多于一个，绝不是片段。多行 `data:` 字段按 SSE 规定的方式拼接。
- 生产者（producer）必须（MUST）以 LF（`\n`）行尾对流（stream）分帧（framing）。SSE 语法也接受 CR 与 CRLF，但本绑定（binding）固定为每个消费者（consumer）已知都能解析的那一种形式；消费者（consumer）可以（MAY）额外接受完整语法。
- 消费者（consumer）必须（MUST）忽略 `data` 以外的 SSE 字段（`event:`、`id:`、`retry:`），并且必须（MUST）容忍 SSE 注释行（`: keep-alive`），生产者（producer）可以（MAY）以任意节奏发送它们。
- 生产者（producer）在最后一次运行（run）的终止事件（event）之后关闭响应正文。一次 POST 携带一个请求；然而当生产者（producer）在请求的运行（run）之前重放线程（thread）的历史时，响应仍可以（MAY）携带[多个运行（run）](../../events/lifecycle.md#一条流stream上的多次运行run)—— 按[绑定（binding）契约](index.md#绑定binding契约)，不会有更多输入为它们传输。

## 错误

- 在运行（run）开始之前被拒绝的输入 —— 畸形的 JSON、校验（validation）失败、认证被拒 —— 是一个 HTTP 错误状态，没有事件（event）流（stream）。运行（run）从未开始。
- 流（stream）打开之后的失败在流（stream）内以 `RUN_ERROR` 传输。HTTP 状态已经发送且无法更改；消费者（consumer）不得（MUST NOT）仅凭 `200` 推断成功。
- 没有终止事件（event）就断开的连接是一次[被截断（truncation）的运行（run）](index.md#截断truncation)。

## 无恢复（resumption）

该绑定（binding）没有流（stream）恢复（resumption）：不使用 SSE 的 `Last-Event-ID` 机制，断开的流（stream）无法重新进入。重新运行（run）就是一次带新 `runId` 的新运行（run），其输入携带消费者（consumer）所保留的任何内容。

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
