---
title: "中间件（middleware）"
description: "在 AG-UI Agent 中变换和拦截事件（event）"
---

# 中间件（middleware）

AG-UI 中的中间件（middleware）提供了一种强大的方式，用于变换、过滤和增强流经 Agent 的事件（event）流。它使你能在不修改 Agent 核心逻辑的情况下，加入日志记录、认证、限流、事件过滤等横切关注点。

下文示例假定已导入相关的 RxJS 操作符/工具函数（`map`、`tap`、`catchError`、`switchMap`、`timer` 等）。

## 什么是中间件（middleware）？

中间件位于 Agent 执行与事件消费者（consumer）之间，使你能够：

1. **变换事件** – 在事件流经管道时修改或增强事件
2. **过滤事件** – 有选择地放行或拦截特定事件
3. **添加元数据（metadata）** – 注入额外上下文或追踪信息
4. **处理错误** – 实现自定义的错误恢复策略
5. **监控执行** – 增加日志、指标或调试能力（capability）

## 中间件（middleware）如何工作

中间件构成一条链，每个中间件包装下一个中间件，从而形成层层叠加的功能。当 Agent 运行（run）时，事件流会依次流经每个中间件。

```typescript
import { AbstractAgent } from "@ag-ui/client"

const agent = new MyAgent()

// 中间件链：logging -> auth -> filter -> agent
agent.use(loggingMiddleware, authMiddleware, filterMiddleware)

// 当 agent 运行时，事件流经所有中间件
await agent.runAgent()
```

通过 `agent.use(...)` 添加的中间件在 `runAgent()` 中生效。`connectAgent()` 当前直接调用 `connect()`，不会运行中间件。

## 基于函数的中间件（middleware）

对于简单的变换，可以使用基于函数的中间件。这是添加中间件最简洁的方式：

```typescript
import { MiddlewareFunction } from "@ag-ui/client"
import { EventType } from "@ag-ui/core"

const prefixMiddleware: MiddlewareFunction = (input, next) => {
  return next.run(input).pipe(
    map(event => {
      if (
        event.type === EventType.TEXT_MESSAGE_CHUNK ||
        event.type === EventType.TEXT_MESSAGE_CONTENT
      ) {
        return {
          ...event,
          delta: `[AI]: ${event.delta}`
        }
      }
      return event
    })
  )
}

agent.use(prefixMiddleware)
```

## 基于类的中间件（middleware）

对于需要状态（state）或配置的更复杂场景，请使用基于类的中间件：

```typescript
import { Middleware } from "@ag-ui/client"
import { Observable } from "rxjs"
import { tap } from "rxjs/operators"

class MetricsMiddleware extends Middleware {
  private eventCount = 0

  constructor(private metricsService: MetricsService) {
    super()
  }

  run(input: RunAgentInput, next: AbstractAgent): Observable<BaseEvent> {
    const startTime = Date.now()

    return this.runNext(input, next).pipe(
      tap(event => {
        this.eventCount++
        this.metricsService.recordEvent(event.type)
      }),
      finalize(() => {
        const duration = Date.now() - startTime
        this.metricsService.recordDuration(duration)
        this.metricsService.recordEventCount(this.eventCount)
      })
    )
  }
}

agent.use(new MetricsMiddleware(metricsService))
```

如果你在编写类中间件，请优先使用以下辅助方法：
- `runNext(input, next)` 会将 chunk 事件规范化成完整的 `TEXT_MESSAGE_*`/`TOOL_CALL_*` 事件序列。
- `runNextWithState(input, next)` 还会在每个事件之后提供累积的 `messages` 与 `state`。

## 内置中间件（middleware）

AG-UI 为常见用例提供了若干内置中间件组件：

### FilterToolCallsMiddleware

根据允许列表或禁止列表过滤工具调用（tool call）：

```typescript
import { FilterToolCallsMiddleware } from "@ag-ui/client"

// 只允许特定工具
const allowedFilter = new FilterToolCallsMiddleware({
  allowedToolCalls: ["search", "calculate"]
})

// 或拦截特定工具
const blockedFilter = new FilterToolCallsMiddleware({
  disallowedToolCalls: ["delete", "modify"]
})

agent.use(allowedFilter)
```

`FilterToolCallsMiddleware` 过滤的是输出的 `TOOL_CALL_*` 事件。它不会阻止上游模型/运行时中的工具执行。

## 中间件（middleware）模式

常见模式包括日志记录、通过 `forwardedProps` 进行认证，以及限流。具体实现请参见 [JS 中间件参考](https://docs.ag-ui.com/sdk/js/client/middleware)。

## 组合中间件（middleware）

你可以组合多个中间件，构建复杂的处理管道：

```typescript
const logMiddleware: MiddlewareFunction = (input, next) => next.run(input)
const metricsMiddleware = new MetricsMiddleware(metricsService)
const filterMiddleware = new FilterToolCallsMiddleware({ allowedToolCalls: ["search"] })

agent.use(logMiddleware, metricsMiddleware, filterMiddleware)
```

## 执行顺序

中间件按添加顺序执行，每个中间件包装下一个中间件：

1. 第一个中间件接收原始输入
2. 它可以在把输入传递给下一个中间件之前修改输入
3. 每个中间件都会处理来自链中下一个中间件的事件
4. 最后一个中间件调用真正的 agent

```typescript
agent.use(middleware1, middleware2, middleware3)

// 执行流程：
// → middleware1
//   → middleware2
//     → middleware3
//       → agent.run()
//     ← 事件经 middleware3 回流
//   ← 事件经 middleware2 回流
// ← 事件经 middleware1 回流
```

## `RUN_STARTED` 上的协议版本

每次运行的 `RUN_STARTED.protocolVersion` 声明的是该次运行的事件流所用协议版本，而不是谁转发了它（[版本管理](../spec/1.0/basic/versioning.md#版本协商)）。对中间件而言，这意味着一条规则，具体取决于该次运行由谁产生：

- **转发一次运行。** 当 `RUN_STARTED` 来自链中的下一个 Agent 时，原样传递它及其 `protocolVersion`。不要添加、覆盖或删除该字段。如果下游 Agent 早于该字段出现，那么缺失的声明才是如实的声明。
- **合成一次运行。** 当中间件自行应答请求并发出自己的 `RUN_STARTED`（没有任何下游 Agent 运行）时，该中间件就是这次运行的生产者（producer）。应使用 SDK 的 `PROTOCOL_VERSION` 常量声明它构建时所依据的版本。不要照抄客户端（client）的 `RunAgentInput.protocolVersion`，也不要省略该字段。
- **转换一次运行。** 把事件流重写为另一种协议版本的中间件，应声明它所输出的版本。

合成的运行会像其他任何生产者一样，使用输入中的 `threadId` 和 `runId`：

```typescript
import { EventType, PROTOCOL_VERSION, type RunStartedEvent } from "@ag-ui/client"

const runStarted: RunStartedEvent = {
  type: EventType.RUN_STARTED,
  threadId: input.threadId,
  runId: input.runId,
  protocolVersion: PROTOCOL_VERSION,
}
```

## 最佳实践

1. **让中间件保持职责单一** – 每个中间件应只承担一项职责
2. **优雅地处理错误** – 使用 RxJS 的错误处理操作符
3. **避免阻塞式操作** – I/O 操作请使用异步模式
4. **记录副作用** – 明确说明中间件是否会修改状态
5. **独立测试中间件** – 为每个中间件编写单元测试
6. **关注性能** – 注意事件流中的处理开销

## 进阶用例

### 条件中间件（middleware）

根据运行时条件应用中间件：

```typescript
const conditionalMiddleware: MiddlewareFunction = (input, next) => {
  if (input.forwardedProps?.debug === true) {
    // 应用调试日志
    return next.run(input).pipe(
      tap(event => console.debug(event))
    )
  }
  return next.run(input)
}
```

关于事件变换与流控制的变体，请参见 [JS 中间件参考](https://docs.ag-ui.com/sdk/js/client/middleware)。

## 结论

中间件提供了一种灵活而强大的方式，使你无需修改 Agent 的核心逻辑即可扩展 AG-UI Agent。无论你需要简单的事件变换，还是复杂的有状态处理，中间件系统都提供了构建健壮、可维护的 Agent 应用所需的工具。
