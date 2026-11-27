---
title: "元数据（metadata）"
description: "为事件（event）、消息（message）和工具调用（tool call）附加额外信息"
---

元数据（metadata）是为协议附加额外信息的官方认可方式——token 用量、trace id、结束原因，任何你的应用需要随对话一同携带的东西。

在它出现之前，生产者（producer）把未声明的属性挂在事件（event）上，寄希望于消费者（consumer）把它们透传下去。这正是 1.0 中移除“未知属性到达订阅者”的原因：元数据用一个已声明、带类型、且消费者必须携带的东西取代了它。

## 它存在于何处

四处位置，全部可选：

| 携带 `metadata` 的位置 | 说明                                                                           |
| ------------------ | ---------------------------------------------------------------------------------- |
| 每个事件            | 在基础事件上声明一次，因此所有事件类型都具备                       |
| 每条消息（message）            | 全部七种角色：developer、system、assistant、user、tool、activity、reasoning     |
| 每个工具调用（tool call）        | 工具调用不是消息——见[工具调用](#工具调用tool-call)                       |
| 每个恢复（resume）条目 | 它是请求字段，因此没有任何东西会合并进去——见 [恢复条目](#resume-条目) |

## 形态

该对象**以键为开放维度**。任意 JSON 值都可以放在某个键下，包括 `null`。对你放入其中的内容没有 schema 约束。

```typescript
{
  type: EventType.TEXT_MESSAGE_END,
  messageId: "msg_123",
  metadata: {
    "ag-ui": { usage: { input: 1200, output: 340 } },
    finishReason: "stop",
    traceId: "abc-123",
    retries: 0,
    labels: ["experimental"]
  }
}
```

对象本身**要么不存在，要么是一个对象——绝不会是 `null`**。空对象是合法的，表示“没有什么要说的”，与省略它等价。

> [!NOTE]
> 生产者从不发出 `"metadata": null`：在所有官方 SDK 中，没有取值的可选字段会在 JSON 中被整体省略。TypeScript 客户端（client）强制执行这一点，并拒绝 `null` 的元数据对象——与某些较早的可选字段不同，元数据没有需要兼容的遗留生产者。注意这种不对称性：某个**键下的 `null` 值**是有效数据，且始终会被保留。只有代表整个对象的 `null` 才是非法的。

## 保留键

`ag-ui` 键为 AG-UI 自身使用而保留。除此之外的每个键都属于你。

运行（run）时并不会拒绝写入 `ag-ui`——强制拒绝会与“以键为开放维度”的规则相冲突——但请把它视为禁区，因为 AG-UI 可能在未来版本中把自身的值放在那里。

## 合并进消息（message）

一条消息是由一系列事件组装而成的，而有意思的值往往到末尾才可知：提供方在生成结束之前并不知道自己的 token 用量。因此，消费者会**在序列到达的过程中，把每个事件的元数据合并进该事件所构建的那条消息**。

这里描述的是从流中组装消息的客户端，例如 TypeScript 客户端。.NET 客户端不组装 AG-UI 消息——参见下文的 SDK 说明。

规则是逐键的“后写覆盖先写”：

```typescript
// TEXT_MESSAGE_START    metadata: { source: "openai", stage: "start" }
// TEXT_MESSAGE_CONTENT  metadata: { stage: "content" }
// TEXT_MESSAGE_END      metadata: { stage: "end", usage: { output: 340 } }

message.metadata
// { source: "openai", stage: "end", usage: { output: 340 } }
```

`source` 之所以保留下来，是因为后来没有任何东西设置它。`stage` 最终停在最后一次写入的值上。`usage` 只在末尾才到达，而这正是全部意义所在。

### 值是被替换，而非混合

合并从不递归。某个键持有数组或对象时，会被整体替换：

```typescript
// 先前：{ tags: ["a", "b", "c"] }
// 之后：{ tags: ["z"] }
// 结果：{ tags: ["z"] }        而不是 ["a", "b", "c", "z"]
```

这一规则在 `ag-ui` 下同样成立。如果你需要向某个嵌套结构中追加内容，请发送完整的新值。

### 什么不会合并

不构建消息的事件上的元数据会留在该事件上，永远不会到达任何消息：

- `RUN_STARTED`、`RUN_FINISHED`、`RUN_ERROR`
- `STEP_STARTED`、`STEP_FINISHED`
- `STATE_SNAPSHOT`、`STATE_DELTA`
- `RAW`、`CUSTOM`
- `REASONING_START`、`REASONING_END`、`REASONING_ENCRYPTED_VALUE`

`MESSAGES_SNAPSHOT` 是一个特例：其中的消息携带自己的元数据，并且在到达时就已经附带好了，因此该事件自身的元数据不会合并进其中任何一条消息。

> [!TIP]
> 把运行级别的汇总数据放在 `RUN_FINISHED` 上是没问题的，而且往往是正确做法——只是要从事件上读取它们，而不要指望它们出现在某条消息上。如果你希望它们出现在某条特定消息上，就在那条消息的 `*_END` 事件上发送它们。

## 工具调用（tool call）

工具调用事件——`TOOL_CALL_START`、`TOOL_CALL_ARGS`、`TOOL_CALL_END`——合并进**工具调用**，而不是合并进拥有它的那条 assistant 消息。

```typescript
assistantMessage.toolCalls[0].metadata
// { provider: "anthropic", latencyMs: 84 }
```

原因在于，多个工具调用可能共享同一条父 assistant 消息。把它们的元数据全部折叠进那个父级，会使结果依赖于这些调用恰好交错出现的顺序——而流变换是允许改变该顺序的。让每个工具调用拥有自己的元数据，就消除了这个共享目标，因此无论流如何被处理，结果都相同。

`TOOL_CALL_RESULT` 则不同：它创建一条 tool 消息，因此它的元数据会像任何其他构建消息的事件一样合并进那条消息。

## Resume 条目

`RunAgentInput.resume` 中的每个条目——即客户端在一次以中断（interrupt）结果结束的运行之后，针对每个 interrupt 回送的那份响应——都携带自己的元数据。它保存关于该响应的外层封装数据，例如证明人类决策未被篡改的签名，或路由键；而 Agent 所求的答案属于 `payload`。

恢复条目是请求字段，而不是从流中组装出来的东西，因此**没有合并语义**——没有任何东西会累积到它里面。完整的恢复契约见[中断](interrupts.md#恢复resume一次运行run)。

## 传输（transport）

在 JSON 之上——SSE 所承载的就是它，所有 SDK 读写的也是它——元数据就是一个普通对象，各种取值形态都能精确往返：null、数组、嵌套对象、字符串与数字。

二进制 protobuf 格式将其承载为 `google.protobuf.Struct`，其值类型拥有真正的 null 情况，因此某个键下的 `null` 会被保留而不会被近似处理，不存在的对象也依然能与空对象区分开。那里有两点注意事项，且都不是元数据特有的：

- **并非每个事件都有 protobuf 表示。** 线上（wire）只覆盖事件类型的一个子集——工具结果（tool result）、活动（activity）、推理（reasoning）以及已废弃的 thinking 事件都没有对应的 protobuf 消息，因此它们根本无法跨该传输（transport），无论是否带元数据。.NET 编码器会直接拒绝它们；TypeScript 编码器会产出一个空载荷，随后解码时被拒绝。无论哪种方式，事件都不会到达，所以不要依赖二进制传输来承载这些事件。
- **数字是 IEEE-754 double。** `google.protobuf.Value` 把每个数字都建模为 double，因此超出 2^53 的整数在往返时会丢失精度。这是该格式的属性，对 `state` 以及所有其他动态载荷同样适用。

不同编码器之间的输出不保证逐字节相同：`Struct` 是 `map<string, Value>`，而 protobuf 的 map 条目顺序不是规范化的。可以保证的是，两侧都会解码为相同的值。在实践中，TypeScript 与 .NET 编码器对跨语言测试套件中的每个夹具确实产出相同的字节，这一点在那里有断言，但不要依赖它。

## SDK 参考

> [!NOTE]
> 在每个 SDK 中元数据都以键为开放维度，因此该类型是刻意宽松的。保持内容可 JSON 序列化（JSON-serializable）是你的责任——函数或 `bigint` 在类型层面会被接受，但编码时会失败。

**TypeScript** —— 事件、消息、工具调用与 resume 条目上的 `metadata?: Record<string, any>`。如果你自己组装消息，可从 `@ag-ui/core` 导入 `mergeMetadata(existing, incoming)`，以及用于保留键的 `AGUI_METADATA_KEY`。

**Python** —— `metadata: Optional[Dict[str, Any]]`。基础模型在所有序列化路径上都会省略任何未设置的可选字段，因此不存在的对象会被省略而不是以 `null` 发出——无需 `exclude_none=True`。`Metadata` 与 `AGUI_METADATA_KEY` 从 `ag_ui.core` 导出。

**.NET** —— `BaseEvent`、`AGUIMessage`、`AGUIToolCall` 与 `AGUIResume` 上的 `JsonElement? Metadata`，保留键由 `AGUIMetadata.ReservedKey` 提供。

它是一个**线级字段**。它能通过 JSON 与 protobuf 忠实往返，因此读取 `RunAgentInput` 的服务端（server）、或解码流的客户端都能完整地看到它，而 `AGUIMessage.Metadata` 会在 `MESSAGES_SNAPSHOT` 内部的消息上承载它。它刻意没有暴露在 `Microsoft.Extensions.AI` 的 `ChatMessage` 上，这与 `encryptedValue` 和 `AGUIToolMessage.Error` 现有的行为一致。

如果你通过 `AGUIChatClient` 消费流，请注意这在实践中意味着什么：`EventStreamConverter` 不会为 `TEXT_MESSAGE_START`、`TEXT_MESSAGE_END`、`TOOL_CALL_START` 或 `TOOL_CALL_ARGS` 发出任何 `ChatResponseUpdate`，因此这些事件上的元数据——包括按上文建议放在 `TEXT_MESSAGE_END` 上的用量——也不会到达 `RawRepresentation`。请从原始事件流中读取，而不是从高层的 chat 客户端读取。

## 压缩

TypeScript 客户端中的 `compactEvents` 会把一段流式事件压成更少的事件以便存储或重放，并且刻意重排它们，使每条流的各个事件彼此相邻。

元数据本身不会引入新的顺序敏感性：每个合并目标都是唯一的——每条消息有自己的目标，每个工具调用携带自己的目标，而不是折叠进它可能共享的父级——因此两个合并到同一目标的事件永远不会被相对重排。

不过，压缩的重排在一般情况下并不保语义，而且这一点在元数据出现之前就已如此。会打断某条流的事件会在该流之后发出，因此中途到达的 `MESSAGES_SNAPSHOT` 会在该消息自身的事件之后被重放，并覆盖它们所产生的结果——被追加的内容和合并的元数据都一样。如果你依赖精确的重放等价性，请避免把快照（snapshot）与尚未结束的流交错在一起。
