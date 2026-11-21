---
title: "传输（transport）"
description: "传输（transport）为承载 AG-UI 必须提供什么，以及标准绑定（binding） — 1.0"
---

协议（protocol）语义在每一种传输（transport）上都完全相同。传输（transport）是一种**绑定（binding）**：它定义[运行输入（run input）](../run-input.md)如何被投递、事件（event）如何被分帧（framing）与编码，以及流（stream）如何终止或失败。它不定义事件（event）的含义 —— [事件（event）模式](../patterns/index.md)与[处理模型](../processing.md)在每一种绑定（binding）上都相同。

## 绑定（binding）契约

一种绑定（binding）必须（MUST）提供：

- 对运行（run）的事件（event）进行**有序、完整的投递**，顺序与生产者（producer）发出时一致。协议（protocol）的顺序就是到达顺序；一种会重排或丢弃事件（event）的传输（transport），若没有一层同时恢复这两者，就无法承载 AG-UI。
- **投递开启该交换的 `RunAgentInput`**，且在任何事件（event）之前。若流（stream）接着承载[更多运行（run）](../../events/lifecycle.md#一条流stream上的多次运行run)—— 重放的线程（thread）—— 则不会为它们投递更多输入：那些运行（run）是生产者（producer）在重述历史，每个 `RUN_STARTED` 可以（MAY）携带它自己的 `input` 回显。
- **一个消费者（consumer）能与截断（truncation）区分的终止信号**：在终止事件（event）之后干净结束的流（stream）是已关闭的运行（run），而没有终止事件（event）就中断的连接是截断（truncation）的运行（run）。
- **被拒绝输入的错误路径** —— 结构无效的 `RunAgentInput` 在 `RUN_STARTED` 之前、在流（stream）之外被拒绝。

认证与授权是绑定（binding）与应用（application）的属性，而不是协议（protocol）的属性：AG-UI 不定义任何凭证，绑定（binding）携带其通道所用的任何东西（HTTP 认证、环境中的进程身份，或什么都不用）。

## 标准绑定（binding）

1. [HTTP + Server-Sent Events](http-sse.md)：运行输入（run input）是一次 HTTP POST；事件（event）以携带 JSON 的 SSE 帧流式返回。
2. [HTTP + Protobuf](http-protobuf.md)：同样的 POST，协商（negotiation）为带长度前缀的 protobuf 帧的二进制（binary）响应。

两种绑定（binding）共享请求的一半；它们只在响应编码上不同，由内容协商（negotiation）选择。讲 HTTP 的实现（implementation）必须（MUST）支持 SSE 绑定（binding）；protobuf 绑定（binding）是可选（OPTIONAL）的。

## 截断（truncation）

流（stream）在没有终止事件（event）的情况下结束的消费者（consumer），面对的是被截断（truncation）的运行（run）：生产者（producer）可能还在继续，但这个消费者（consumer）永远不会看到其余部分。被截断（truncation）的运行（run）没有结果（outcome）。消费者（consumer）不得（MUST NOT）为它合成 `RUN_FINISHED`，也不得（MUST NOT）把它报告为已成功；运行（run）在中断之前投递的一切仍然算已投递。除此之外是否以及如何暴露截断（truncation）—— 让运行（run）保持未决，或抛出合成的失败 —— 是消费者（consumer）自己的事；重新运行（run）就是一次带新 `runId` 的新运行（run）。

## 自定义传输（transport）

实现（implementation）可以（MAY）通过其他通道承载 AG-UI —— WebSockets、消息总线、进程内管道。自定义传输（transport）必须（MUST）保留事件（event）模型、事件（event）模式与处理规则，并且必须（MUST）满足上述绑定（binding）契约。它应当（SHOULD）记录其分帧（framing）、输入投递、终止与错误信号，以促进互操作性。

承载 JSON 的自定义传输（transport）应当（SHOULD）完全按 SSE 绑定（binding）的方式对事件（event）分帧（framing）—— 每帧一个事件（event）对象 —— 而不是发明新的信封：SSE 绑定（binding）的分帧（framing）就是协议（protocol）的 JSON 分帧（framing），只有它的 HTTP 机制是 HTTP 特有的。
