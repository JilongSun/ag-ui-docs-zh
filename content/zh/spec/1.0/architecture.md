---
title: "架构"
description: "各组件、作为交互单元的运行（run），以及两者背后的原则 — 1.0"
---

AG-UI 通过一条通道把 Agent 连接到面向用户的应用：一路有序的类型化事件（event），应答单一请求。用户所能看到的 Agent 的一切 —— 文本、工具调用（tool call）、推理（reasoning）、状态（state）、进度 —— 都在流里；没有旁路。

## 核心组件

```mermaid
graph LR
    subgraph "应用"
        UI[用户界面]
        C[AG-UI 客户端（client）<br/>中间件（middleware） · 强制执行 · 验证]
        UI --- C
    end
    subgraph "Agent 侧"
        E[Agent 端点]
        B[框架桥接层]
        A[Agent / LLM 框架]
        E --- B
        B --- A
    end
    C -- "RunAgentInput" --> E
    E -- "事件流" --> C
```

### 应用

拥有用户。它渲染流，执行它对外声明过的[工具调用](events/tool-calls.md)，保存 Agent 与它共享的[状态](events/state.md)，并决定什么需要用户的同意。

### 客户端（client）

消费者（consumer）侧的协议机制，通常是一个 SDK。它发送[运行输入（run input）](basic/run-input.md)，对返回的内容运行[处理流水线](basic/processing.md) —— 兼容性翻译、中间件、强制执行、分块展开、验证 —— 并把一条可信的流交给应用。

### Agent 端点及其桥接层

生产者（producer）。桥接层把框架的原生事件翻译成协议事件；端点讲某种[传输绑定（binding）](basic/transports/index.md)。协议不携带任何框架概念，这正是让一个客户端能面对任何框架的原因。

### 中间件（middleware）

任意一方安装到客户端流水线中的代码。它在强制执行剥离任何东西**之前**看到每一个事件，因此兼容垫片可以翻译[已退役形状](basic/versioning.md#已退役形状)，扩展也可以对当前版本未定义的材料采取行动。

## 运行（run）

交互的单元。消费者用一次 `RunAgentInput` 开启一次交换；生产者以被[运行生命周期](events/lifecycle.md)包裹的事件作答 —— 所请求的运行（run），前面可能还有重放的历史；对话是由此类运行组成的线程（thread），累积消息（message）与状态。

```mermaid
sequenceDiagram
    participant Application as 应用
    participant Agent

    Application->>Agent: RunAgentInput (threadId, runId, messages, tools, state)
    Agent->>Application: RUN_STARTED
    Agent->>Application: … 消息、工具调用、状态、活动（activity） …
    Agent->>Application: RUN_FINISHED (outcome, usage)
    Note over Application: 渲染、执行、存储
    Application->>Agent: 下一次 RunAgentInput (same threadId)
```

## 设计原则

1. **Agent 应当极易对外暴露。** 桥接层是一次翻译，而不是一次实现：框架发出的任何东西都映射到一小组事件族（event family）上，而所有可选的（optional）东西都是可选的。强制的表面只有运行生命周期，别无其他。

2. **一切可观察的东西都在交换之中。** Agent 可见行为中没有任何东西走带外：持有这些交换的录制器 —— 每个运行输入以及应答它的事件 —— 能重建 UI 在每一时刻所知的一切，这正是让协议可测试、可重放且传输无关的原因。

3. **宽容的读者，严格的写者。** 生产者必须（MUST）只发出 schema 所定义的内容；消费者必须（MUST）在遇到它不认识的内容时存活下来，将其剥离并发出告警，而不是失败。完整的不对称性 —— 以及为什么畸形的已知值会被反向对待 —— 见[处理模型](basic/processing.md)。

4. **中间件先于强制执行运行。** 翻译在任何东西被剥离之前获得机会，因此协议可以演进而不让任何一方被困住：昨天的形状在边界处被翻译，明天的形状则一路传递到认识它们的人手里。

5. **传输（transport）即绑定。** 语义绝不随线上（wire）而变。同样的事件，同样的规则，无论被分帧为 SSE 文本还是 protobuf 帧 —— 跨实现一致性由共享的字节语料固定。
