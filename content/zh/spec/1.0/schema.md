---
title: "schema 参考"
description: "1.0 schema 的每一项定义，各占一个锚点（anchor）——自动生成，请勿编辑"
---

<!-- @generated from https://ag-ui.com/spec/1.0/schema.json — 本页由 schema 生成，请勿手工编辑。要改动内容，请先修改 schema 再重新生成。 -->

本页由位于 [`/spec/1.0/schema.json`](https://docs.ag-ui.com/spec/1.0/schema.json) 的机器可读 schema 生成——它是结构（structure）的唯一事实来源——这样正文规范（specification）就可以链接到某个定义，而不必重述它。请勿手工编辑本页：请修改 schema 后重新生成。

每个定义的锚点（anchor）就是它的名称的小写形式。

## 事件（event）

事件联合（union）、它的判别字段（discriminator），以及每一个事件（event）。它们字段（field）所来自的混入（mixin）列在[混入（mixin）](#混入mixin)之下。

### `EventType`

每个事件（event）都携带的判别字段（discriminator）。

**取值：**

`TEXT_MESSAGE_START` · `TEXT_MESSAGE_CONTENT` · `TEXT_MESSAGE_END` · `TEXT_MESSAGE_CHUNK` · `TOOL_CALL_START` · `TOOL_CALL_ARGS` · `TOOL_CALL_END` · `TOOL_CALL_CHUNK` · `TOOL_CALL_RESULT` · `STATE_SNAPSHOT` · `STATE_DELTA` · `MESSAGES_SNAPSHOT` · `ACTIVITY_SNAPSHOT` · `ACTIVITY_DELTA` · `RAW` · `CUSTOM` · `RUN_STARTED` · `RUN_FINISHED` · `RUN_ERROR` · `STEP_STARTED` · `STEP_FINISHED` · `REASONING_START` · `REASONING_MESSAGE_START` · `REASONING_MESSAGE_CONTENT` · `REASONING_MESSAGE_END` · `REASONING_MESSAGE_CHUNK` · `REASONING_END` · `REASONING_ENCRYPTED_VALUE` · `SUBAGENT_STARTED` · `SUBAGENT_FINISHED` · `SUBAGENT_ERROR`

### `TextMessageStartEvent`

开启一条流式文本消息（text message）。内容以 TEXT_MESSAGE_CONTENT 事件（event）到达，消息以 TEXT_MESSAGE_END 关闭。

**字段（field）：**

- `type` — `"TEXT_MESSAGE_START"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，**必需（required）**。标识本次流（stream）所构建的消息（message），并把后续的内容与结束事件（event）与它关联起来。
- `role` — [`TextMessageRole`](#textmessagerole)，可选（optional）。消息（message）来自谁。角色（role）缺省表示 assistant；这一含义是规范性（normative）的，写在正文中，因为校验器（validator）会把默认值当作说明文档而不是行为。默认值：`"assistant"`。
- `name` — `string`，可选（optional）。作者的可选显示名称，适用于会在同一个消息角色（role）下区分多位参与者的提供方。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `TextMessageContentEvent`

向一条流式文本消息（text message）追加一个片段。

**字段（field）：**

- `type` — `"TEXT_MESSAGE_CONTENT"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，**必需（required）**。该片段所属的消息（message）。
- `delta` — `string`，**必需（required）**。要追加的片段。可以是空字符串：提供方会把空增量（delta）当作保活（keep-alive）发送，也会在工具调用（tool call）尚未决定时发送，拒绝它们会杀掉本来运行正常的运行（run）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `TextMessageEndEvent`

关闭一条流式文本消息（text message）。

**字段（field）：**

- `type` — `"TEXT_MESSAGE_END"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，**必需（required）**。正在关闭的消息（message）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `TextMessageChunkEvent`

一种简写（shorthand），代替开始、内容与结束这一序列，供无法事先知道消息（message）从何开始的生产者（producer）使用。每个字段（field）都是可选（optional）的，因为续接用的分片（chunk）会省略没有变化的内容；一个不带任何字段（field）的分片（chunk）续接的是哪条消息（message），属于序列问题，由正文规范（specification）回答。

**字段（field）：**

- `type` — `"TEXT_MESSAGE_CHUNK"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，可选（optional）。该分片（chunk）所属的消息（message）。缺省时续接已经打开的那条消息（message）。
- `role` — [`TextMessageRole`](#textmessagerole)，可选（optional）。消息（message）来自谁，写在开启它的那个分片（chunk）上。
- `delta` — `string`，可选（optional）。要追加的片段。可以是空字符串。
- `name` — `string`，可选（optional）。作者的可选显示名称。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ToolCallStartEvent`

开启一次工具调用（tool call）。参数（args）以 TOOL_CALL_ARGS 事件（event）到达，调用以 TOOL_CALL_END 关闭。

**字段（field）：**

- `type` — `"TOOL_CALL_START"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `toolCallId` — `string`，**必需（required）**。标识该调用，并把后续的 args、结束与结果事件（event）与它关联起来。
- `toolCallName` — `string`，**必需（required）**。正在调用哪个工具（tool）。
- `parentMessageId` — `string`，可选（optional）。容纳该调用的助手消息（assistant message）。缺省表示生产者（producer）没有把它归于某一条消息（message）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ToolCallArgsEvent`

追加一次工具调用（tool call）参数（args）的一个片段。

**字段（field）：**

- `type` — `"TOOL_CALL_ARGS"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `toolCallId` — `string`，**必需（required）**。这些参数（args）所属的调用。
- `delta` — `string`，**必需（required）**。参数（args）的一个片段，这些片段拼接成该调用的参数（args）文本——按惯例是一个 JSON 文档，尽管协议（protocol）并不校验（validate）它（见 FunctionCall.arguments）。刻意用字符串而不是解析后的 JSON：片段本身并不是一个文档。可以是空字符串。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ToolCallEndEvent`

关闭一次工具调用（tool call），表示其参数（args）已经完整。

**字段（field）：**

- `type` — `"TOOL_CALL_END"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `toolCallId` — `string`，**必需（required）**。正在关闭的调用。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ToolCallChunkEvent`

一种简写（shorthand），代替一次工具调用（tool call）的开始、参数（args）与结束这一序列。每个字段（field）都可选，原因与 TEXT_MESSAGE_CHUNK 相同。

**字段（field）：**

- `type` — `"TOOL_CALL_CHUNK"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `toolCallId` — `string`，可选（optional）。该分片（chunk）所属的调用。缺省时续接已经打开的那次调用。
- `toolCallName` — `string`，可选（optional）。正在调用哪个工具（tool），写在开启它的那个分片（chunk）上。
- `parentMessageId` — `string`，可选（optional）。容纳该调用的助手消息（assistant message）。
- `delta` — `string`，可选（optional）。参数（args）的一个片段。可以是空字符串。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ToolCallResultEvent`

承载工具（tool）返回的内容。它铸造（mint）一条工具消息（tool message），而不是向已有消息（message）追加，这也是它有自己独立的 messageId 的原因。

**字段（field）：**

- `type` — `"TOOL_CALL_RESULT"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，**必需（required）**。该结果将成为的工具消息（tool message）。
- `toolCallId` — `string`，**必需（required）**。正在被回答的调用。
- `content` — `string` | [`ContentPart`](#contentpart) 的数组，**必需（required）**。工具（tool）返回的内容：或者是纯文本，或者是有序的片段（part）列表，与本事件（event）所铸造（mint）的工具消息（tool message）完全一致。返回结构化数据的工具（tool）会把它序列化（serialise）成文本；媒体则以自己的片段（part）形式传递。
- `role` — `"tool"`，可选（optional）。只为与它铸造（mint）的消息（message）保持对称而存在；值是固定的，所以生产者（producer）可以省略它。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `StateSnapshotEvent`

整体替换 Agent 状态（state）。在增量（delta）无法表达该变化时，或为了重新同步消费者（consumer）时发送。

**字段（field）：**

- `type` — `"STATE_SNAPSHOT"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `snapshot` — [`State`](#state)，**必需（required）**。完整的新状态（state）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `StateDeltaEvent`

以增量（delta）方式改变 Agent 状态（state）。

**字段（field）：**

- `type` — `"STATE_DELTA"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `delta` — [`JsonPatch`](#jsonpatch)，**必需（required）**。该变化，作为针对当前状态（state）的 RFC 6902 补丁。这里的结构合法并不意味着补丁能被应用：一个形式良好的操作可能指向不存在的路径，这一点 RFC 6902 留给应用方（applier）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `MessagesSnapshotEvent`

生产者（producer）所拥有的全部消息（message），按顺序排列。它是整段对话范围的，而不是简单的覆盖：消费者（consumer）可能保留自己的、任何生产者（producer）都不跟踪的消息（message），因此快照（snapshot）究竟如何与这些消息协调，属于行为问题，写在正文里。由于是整段对话范围的，它不可能只属于某一个子 Agent（subagent），所以它不携带归属（attribution）；但它通过消息（message）本身，确定了所包含的每条消息（message）归哪个子 Agent（subagent）所有。

**字段（field）：**

- `type` — `"MESSAGES_SNAPSHOT"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `messages` — [`Message`](#message) 的数组，**必需（required）**。生产者（producer）正在声明的消息（message），按顺序。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)；组合而来的字段（field）已在上面列出。

### `ActivitySnapshotEvent`

报告不属于对话内容的结构化进度，例如 UI 渲染为独立部件的步骤（step）。

**字段（field）：**

- `type` — `"ACTIVITY_SNAPSHOT"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，**必需（required）**。该事件（event）所描述的活动消息（activity message）。
- `activityType` — `string`，**必需（required）**。这是什么种类的活动（activity）。开放字符串：取值集合由生产者（producer）决定，而不是协议（protocol）决定。
- `content` — `object`，按键开放，**必需（required）**。活动的载荷（payload），按键开放。
- `replace` — `boolean`，可选（optional）。该快照（snapshot）是否覆盖活动（activity）已有的内容。缺省表示覆盖，这一含义是规范性（normative）的；只有显式的 false 才要求消费者（consumer）保留已有的内容。它并不要求合并（merge）——要增量（delta）改变内容得用 ACTIVITY_DELTA。消费者（consumer）如何处理不覆盖的快照（snapshot），属于行为问题，写在正文里。默认值：`true`。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ActivityDeltaEvent`

以增量（delta）方式改变活动消息（activity message）的内容。

**字段（field）：**

- `type` — `"ACTIVITY_DELTA"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，**必需（required）**。正在被改变的活动消息（activity message）。
- `activityType` — `string`，**必需（required）**。这是什么种类的活动（activity）。
- `patch` — [`JsonPatch`](#jsonpatch)，**必需（required）**。该变化，作为针对活动（activity）内容的 RFC 6902 补丁。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `RawEvent`

把一个提供方原生（provider-native）的事件（event）原样透传（passthrough），供需要协议（protocol）未建模细节的消费者（consumer）使用。

**字段（field）：**

- `type` — `"RAW"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `event` — 任意 JSON 值，**必需（required）**。提供方自己的事件（event）。任意 JSON 值，且为必需（required）：一个唯一用途就是承载它的事件（event），没有它便什么也表达不了。
- `source` — `string`，可选（optional）。该事件（event）来自哪个提供方或框架。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `CustomEvent`

协议（protocol）为应用自身事件（event）提供的扩展点。消费者（consumer）用它做任何事，都在协议（protocol）之外。

**字段（field）：**

- `type` — `"CUSTOM"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `name` — `string`，**必需（required）**。这个自定义事件（custom event）是什么。必需（required）：没有它，消费者（consumer）无法路由该值。
- `value` — 任意 JSON 值，**必需（required）**。载荷。任意 JSON 值，且为必需（required）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `RunStartedEvent`

开启一次运行（run）。它属于运行（run）作用域，因此不携带子 Agent（subagent）归属（attribution）。

**字段（field）：**

- `type` — `"RUN_STARTED"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `threadId` — `string`，**必需（required）**。该运行（run）所属的对话。
- `runId` — `string`，**必需（required）**。标识该运行（run）。
- `protocolVersion` — `string`，可选（optional）。该生产者（producer）所说的协议版本（protocol version），例如 "1.0"——是生产者（producer）自己的版本，而不是对输入版本的复述，正因如此两者合起来才构成协商（negotiation）：每一侧都声明自己，消费者（consumer）在降级（downgrade）发生的那一刻就能看到。缺省表示这是一个早于协议（protocol）携带版本的年代的生产者（producer）。
- `parentRunId` — `string`，可选（optional）。产生本次运行（run）的那次运行（run），用于 Agent 以独立运行（run）而非同一次运行（run）内的子 Agent（subagent）方式调用另一个 Agent 的情形。
- `input` — [`RunAgentInput`](#runagentinput)，可选（optional）。启动本次运行（run）的那个请求，回显出来，以便没有发出该请求的消费者（consumer）也能看到 Agent 被要求了什么。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)；组合而来的字段（field）已在上面列出。

### `RunFinishedEvent`

关闭一次没有失败的运行（run）。它属于运行（run）作用域，因此不携带子 Agent（subagent）归属（attribution）。

**字段（field）：**

- `type` — `"RUN_FINISHED"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `threadId` — `string`，**必需（required）**。该运行（run）所属的对话。
- `runId` — `string`，**必需（required）**。正在关闭的运行（run）。
- `result` — 除 `null` 外的任意 JSON 值，可选（optional）。该运行（run）的返回值，如果有的话。任意 JSON 值。
- `outcome` — [`RunFinishedOutcome`](#runfinishedoutcome)，可选（optional）。运行（run）为何结束。缺省表示成功，因此每个在结果（outcome）出现之前写就的生产者（producer）本来就已经符合规范。
- `usage` — [`TokenUsage`](#tokenusage) 的数组，可选（optional）。该运行（run）的 token 用量，每个提供方与模型一条，因此调用了多个模型的运行（run）会把它们分开保存。只想要总量的消费者（consumer）把各条目相加即可。运行（run）是记账边界：用量覆盖运行（run）内发生的每一次模型调用，包括其子 Agent（subagent）所作的调用；作为 parentRunId 下的独立运行（run）被调用的 Agent，在自己的终结事件（event）上报告自己的用量；而从被中断的运行（run）恢复（resume）的运行（run），只报告它自己所作的调用，不含被中断那次运行（run）的。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)；组合而来的字段（field）已在上面列出。

### `RunErrorEvent`

结束一次失败的运行（run）。它属于运行（run）作用域，因此不携带子 Agent（subagent）归属（attribution）；一个失败了却没有结束运行（run）的子 Agent（subagent）改为报告 SUBAGENT_ERROR。

**字段（field）：**

- `type` — `"RUN_ERROR"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `message` — `string`，**必需（required）**。出了什么问题，供人阅读。
- `code` — `string`，可选（optional）。机器可读的错误码。开放字符串：协议（protocol）不定义任何词汇表。
- `usage` — [`TokenUsage`](#tokenusage) 的数组，可选（optional）。失败之前累积的 token 用量，用于在死亡前完成过一次或多次模型调用的运行（run）。范围与 RUN_FINISHED 相同：本次运行（run）自己的调用，包含子 Agent（subagent）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)；组合而来的字段（field）已在上面列出。

### `StepStartedEvent`

在运行（run）内开启一个具名步骤（step），供其框架具有值得呈现的步骤（step）概念的生产者（producer）使用。

**字段（field）：**

- `type` — `"STEP_STARTED"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `stepName` — `string`，**必需（required）**。步骤（step）的名称。它标识该步骤（step）：与之匹配的 STEP_FINISHED 携带相同的名称。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `StepFinishedEvent`

关闭一个具名步骤（step）。

**字段（field）：**

- `type` — `"STEP_FINISHED"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `stepName` — `string`，**必需（required）**。正在关闭的步骤（step）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ReasoningStartEvent`

开启一个推理区间（reasoning span）。一个推理区间（reasoning span）可以包含多条推理消息（reasoning message）。

**字段（field）：**

- `type` — `"REASONING_START"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，**必需（required）**。正在开启的区间。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ReasoningMessageStartEvent`

开启一条流式推理消息（reasoning message）。

**字段（field）：**

- `type` — `"REASONING_MESSAGE_START"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，**必需（required）**。本次流（stream）所构建的推理消息（reasoning message）。
- `role` — `"reasoning"`，**必需（required）**。固定值，且是必需（required）而不是带默认值。这一要求继承自各 SDK，而不是特意选择的。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ReasoningMessageContentEvent`

向一条流式推理消息（reasoning message）追加一个片段。

**字段（field）：**

- `type` — `"REASONING_MESSAGE_CONTENT"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，**必需（required）**。该片段所属的推理消息（reasoning message）。
- `delta` — `string`，**必需（required）**。要追加的片段。可以是空字符串。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ReasoningMessageEndEvent`

关闭一条流式推理消息（reasoning message）。

**字段（field）：**

- `type` — `"REASONING_MESSAGE_END"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，**必需（required）**。正在关闭的推理消息（reasoning message）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ReasoningMessageChunkEvent`

一种简写（shorthand），代替一条推理消息（reasoning message）的开始、内容与结束这一序列。

**字段（field）：**

- `type` — `"REASONING_MESSAGE_CHUNK"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，可选（optional）。该分片（chunk）所属的推理消息（reasoning message）。缺省时续接已经打开的那条。
- `delta` — `string`，可选（optional）。要追加的片段。可以是空字符串。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ReasoningEndEvent`

关闭一个推理区间（reasoning span）。

**字段（field）：**

- `type` — `"REASONING_END"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `messageId` — `string`，**必需（required）**。正在关闭的区间。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ReasoningEncryptedValueEvent`

承载提供方（provider）不透明的加密推理（reasoning）产物，消费者（consumer）把它存起来，在后续轮次原样送回，而无法读懂它。

**字段（field）：**

- `type` — `"REASONING_ENCRYPTED_VALUE"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `subtype` — [`ReasoningEncryptedValueSubtype`](#reasoningencryptedvaluesubtype)，**必需（required）**。entityId 命名的是什么种类的东西，它决定该值存放的位置。
- `entityId` — `string`，**必需（required）**。该值属于谁：根据 subtype，是一个消息（message）id 还是一个工具调用（tool call）id。
- `encryptedValue` — `string`，**必需（required）**。提供方的不透明产物。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `SubagentStartedEvent`

宣告一次子 Agent（subagent）调用（invocation）已经开始。此后该子 Agent（subagent）产生的所有内容，都通过携带其 subagentRunId 来标注归属（attribution），这样消费者（consumer）不必重放整个流（stream）就能把这项工作归组。它只组合（compose）BaseEvent 而不组合（compose）Attributable，因为这里的 subagentRunId 标识的是子 Agent（subagent）本身，而不是给事件（event）标注归属（attribution）；对外层子 Agent（subagent）的归属（attribution）用的是 parentSubagentRunId。

**字段（field）：**

- `type` — `"SUBAGENT_STARTED"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，**必需（required）**。正在宣告的调用（invocation）。
- `name` — `string`，**必需（required）**。子 Agent（subagent）的名称，它可以在多次调用（invocation）之间重复使用，与 subagentRunId 不同。
- `description` — `string`，可选（optional）。该子 Agent（subagent）是用来做什么的，供消费者（consumer）展示。
- `parentSubagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。产生本次调用（invocation）的子 Agent（subagent）调用，用于嵌套（nesting）委派。缺省表示由父 Agent 直接产生。
- `parentToolCallId` — `string`，可选（optional）。产生该子 Agent（subagent）的工具调用（tool call），用于把 Agent 作为工具暴露给模型的模式。它让消费者（consumer）不必读取 rawEvent 就能把子 Agent（subagent）与该调用关联起来。
- `parentMessageId` — `string`，可选（optional）。容纳了产生它的工具调用（tool call）的那条消息（message）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)；组合而来的字段（field）已在上面列出。

### `SubagentFinishedEvent`

结束某次子 Agent（subagent）调用（invocation）在这次运行（run）中的片段，或因为工作已完成，或因为它被挂起（suspension）以等待外部输入。

**字段（field）：**

- `type` — `"SUBAGENT_FINISHED"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，**必需（required）**。正在关闭的调用（invocation）。
- `result` — 除 `null` 外的任意 JSON 值，可选（optional）。子 Agent（subagent）的返回值，如果有的话。任意 JSON 值，镜像 RUN_FINISHED.result。
- `outcome` — [`SubagentFinishedOutcome`](#subagentfinishedoutcome)，可选（optional）。该片段为何结束。缺省表示成功。挂起（suspended）的子 Agent（subagent）既不是成功也不是失败，正因如此需要一个自己的值来表明，而不是从之后的中断（interrupt）推断。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)；组合而来的字段（field）已在上面列出。

### `SubagentErrorEvent`

报告某次子 Agent（subagent）调用（invocation）失败。运行（run）仍可继续：父 Agent（parent agent）可以自行处理失败的子 Agent（subagent），这也是它不是 RUN_ERROR 的原因。

**字段（field）：**

- `type` — `"SUBAGENT_ERROR"` ([`EventType`](#eventtype))，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。
- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，**必需（required）**。失败的调用（invocation）。
- `message` — `string`，**必需（required）**。出了什么问题，供人阅读。
- `code` — `string`，可选（optional）。机器可读的错误码。开放字符串。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseEvent`](#baseevent)；组合而来的字段（field）已在上面列出。

### `Event`

任意 AG-UI 事件（event）。每个成员都是规范性（normative）的：没有可选的层级，也没有消费者（consumer）可以拒绝实现的事件（event）。以 `type` 属性作为判别字段（discriminator）。

**成员：**

- [`TextMessageStartEvent`](#textmessagestartevent)
- [`TextMessageContentEvent`](#textmessagecontentevent)
- [`TextMessageEndEvent`](#textmessageendevent)
- [`TextMessageChunkEvent`](#textmessagechunkevent)
- [`ToolCallStartEvent`](#toolcallstartevent)
- [`ToolCallArgsEvent`](#toolcallargsevent)
- [`ToolCallEndEvent`](#toolcallendevent)
- [`ToolCallChunkEvent`](#toolcallchunkevent)
- [`ToolCallResultEvent`](#toolcallresultevent)
- [`StateSnapshotEvent`](#statesnapshotevent)
- [`StateDeltaEvent`](#statedeltaevent)
- [`MessagesSnapshotEvent`](#messagessnapshotevent)
- [`ActivitySnapshotEvent`](#activitysnapshotevent)
- [`ActivityDeltaEvent`](#activitydeltaevent)
- [`RawEvent`](#rawevent)
- [`CustomEvent`](#customevent)
- [`RunStartedEvent`](#runstartedevent)
- [`RunFinishedEvent`](#runfinishedevent)
- [`RunErrorEvent`](#runerrorevent)
- [`StepStartedEvent`](#stepstartedevent)
- [`StepFinishedEvent`](#stepfinishedevent)
- [`ReasoningStartEvent`](#reasoningstartevent)
- [`ReasoningMessageStartEvent`](#reasoningmessagestartevent)
- [`ReasoningMessageContentEvent`](#reasoningmessagecontentevent)
- [`ReasoningMessageEndEvent`](#reasoningmessageendevent)
- [`ReasoningMessageChunkEvent`](#reasoningmessagechunkevent)
- [`ReasoningEndEvent`](#reasoningendevent)
- [`ReasoningEncryptedValueEvent`](#reasoningencryptedvalueevent)
- [`SubagentStartedEvent`](#subagentstartedevent)
- [`SubagentFinishedEvent`](#subagentfinishedevent)
- [`SubagentErrorEvent`](#subagenterrorevent)

以 `type` 作为判别字段（discriminator）。

## 消息（message）

消息联合（union），以及对话历史所保存的各种消息（message）。

### `TextMessageRole`

一条流式文本消息（text message）可以取的消息角色（role）。不包含 tool，它由 TOOL_CALL_RESULT 承载，而不是作为文本流式传输。

**取值：**

`developer` · `system` · `assistant` · `user`

### `DeveloperMessage`

来自应用开发者的指令。

**字段（field）：**

- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `id` — `string`，**必需（required）**。在对话内标识该消息（message）。
- `role` — `"developer"`，**必需（required）**。消息（message）来自谁。每个消息（message）定义都会把它收窄为单个值。
- `name` — `string`，可选（optional）。作者的可选显示名称。
- `encryptedValue` — `string`，可选（optional）。属于该消息（message）的提供方不透明产物，由消费者（consumer）保存，并在后续轮次送回。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该消息（message）的额外信息。
- `content` — `string`，**必需（required）**。指令。必需（required）：一条什么都没有的开发者消息（developer message）什么也说不了。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseMessage`](#basemessage)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `SystemMessage`

来自系统的指令。

**字段（field）：**

- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `id` — `string`，**必需（required）**。在对话内标识该消息（message）。
- `role` — `"system"`，**必需（required）**。消息（message）来自谁。每个消息（message）定义都会把它收窄为单个值。
- `name` — `string`，可选（optional）。作者的可选显示名称。
- `encryptedValue` — `string`，可选（optional）。属于该消息（message）的提供方不透明产物，由消费者（consumer）保存，并在后续轮次送回。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该消息（message）的额外信息。
- `content` — `string`，**必需（required）**。指令。必需（required）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseMessage`](#basemessage)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `AssistantMessage`

来自 Agent 的消息（message）。content 是可选（optional）的，因为一轮可能只由工具调用（tool call）构成。

**字段（field）：**

- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `id` — `string`，**必需（required）**。在对话内标识该消息（message）。
- `role` — `"assistant"`，**必需（required）**。消息（message）来自谁。每个消息（message）定义都会把它收窄为单个值。
- `name` — `string`，可选（optional）。作者的可选显示名称。
- `encryptedValue` — `string`，可选（optional）。属于该消息（message）的提供方不透明产物，由消费者（consumer）保存，并在后续轮次送回。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该消息（message）的额外信息。
- `content` — `string`，可选（optional）。Agent 说了什么，如果它说了的话。
- `toolCalls` — [`ToolCall`](#toolcall) 的数组，可选（optional）。本轮发出的工具调用（tool call）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseMessage`](#basemessage)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `UserMessage`

来自使用该应用的人的消息（message）。

**字段（field）：**

- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `id` — `string`，**必需（required）**。在对话内标识该消息（message）。
- `role` — `"user"`，**必需（required）**。消息（message）来自谁。每个消息（message）定义都会把它收窄为单个值。
- `name` — `string`，可选（optional）。作者的可选显示名称。
- `encryptedValue` — `string`，可选（optional）。属于该消息（message）的提供方不透明产物，由消费者（consumer）保存，并在后续轮次送回。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该消息（message）的额外信息。
- `content` — `string` | [`ContentPart`](#contentpart) 的数组，**必需（required）**。这个人发送的内容：或者是纯文本，或者是多模态（multimodal）消息（message）用的有序片段（part）列表。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`BaseMessage`](#basemessage)、[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ToolMessage`

工具（tool）返回的内容，作为对话中的一条消息（message）。它独立存在，不组合（compose）BaseMessage，因为它不携带 name。

**字段（field）：**

- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `id` — `string`，**必需（required）**。标识该消息（message）。
- `role` — `"tool"`，**必需（required）**。固定值。在此声明而不是继承，因为该消息（message）不组合（compose）BaseMessage。
- `content` — `string` | [`ContentPart`](#contentpart) 的数组，**必需（required）**。工具（tool）返回的内容：或者是纯文本，或者是有序的片段（part）列表。返回结构化数据的工具（tool）会把它序列化（serialise）成文本；媒体则以自己的片段（part）形式传递。
- `toolCallId` — `string`，**必需（required）**。本条消息（message）所回答的调用。
- `error` — `string`，可选（optional）。工具（tool）失败的原因，如果它失败了。它与 content 并存而不是取而代之，因此部分结果能在失败中留存。
- `encryptedValue` — `string`，可选（optional）。属于该消息（message）的提供方不透明产物。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该消息（message）的额外信息。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ActivityMessage`

不属于对话内容的结构化进度，被物化为一条消息（message），从而在序列中保住自己的位置。它独立存在，不组合（compose）BaseMessage，因为它的 content 是对象而不是字符串。

**字段（field）：**

- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `id` — `string`，**必需（required）**。标识该消息（message）。
- `role` — `"activity"`，**必需（required）**。固定值。在此声明而不是继承，因为该消息（message）不组合（compose）BaseMessage。
- `activityType` — `string`，**必需（required）**。这是什么种类的活动（activity）。开放字符串：取值集合由生产者（producer）决定。
- `content` — `object`，按键开放，**必需（required）**。活动的载荷（payload），按键开放。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该消息（message）的额外信息。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `ReasoningMessage`

Agent 推理（reasoning）的一个区间，被物化为一条消息（message）。它独立存在，不组合（compose）BaseMessage，因为它不携带 name。

**字段（field）：**

- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `id` — `string`，**必需（required）**。标识该消息（message）。
- `role` — `"reasoning"`，**必需（required）**。固定值。在此声明而不是继承，因为该消息（message）不组合（compose）BaseMessage。
- `content` — `string`，**必需（required）**。推理（reasoning）文本。
- `encryptedValue` — `string`，可选（optional）。属于该消息（message）的提供方不透明推理（reasoning）产物。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该消息（message）的额外信息。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `Message`

对话中的任意消息（message）。以 `role` 作为判别字段（discriminator）。

**成员：**

- [`DeveloperMessage`](#developermessage)
- [`SystemMessage`](#systemmessage)
- [`AssistantMessage`](#assistantmessage)
- [`UserMessage`](#usermessage)
- [`ToolMessage`](#toolmessage)
- [`ActivityMessage`](#activitymessage)
- [`ReasoningMessage`](#reasoningmessage)

以 `role` 作为判别字段（discriminator）。

### `Role`

物化消息（message）可以拥有的每一个消息角色（role）。

**取值：**

`developer` · `system` · `assistant` · `user` · `tool` · `activity` · `reasoning`

## 运行输入（run input）

启动一次运行（run）的请求，以及只有它携带的类型。行为细节见[运行输入（run input）](basic/run-input.md)。

### `TextPart`

一个文本片段（text part）。

**字段（field）：**

- `type` — `"text"`，**必需（required）**。判别字段（discriminator）。
- `id` — `string`，可选（optional）。在其消息（message）内标识该片段（part）。可选（optional），且目前无人读取它：保留下来，以便日后助手消息（assistant message）也携带片段时，能把流式片段对应到它在历史记录中的条目。
- `text` — `string`，**必需（required）**。文本。
- `metadata` — 除 `null` 外的任意 JSON 值，可选（optional）。关于该片段（part）的额外信息。它不受约束，与其它媒体片段（media part）相同。文本搜索命中就在这里携带它的来源与标题，而不是让协议（protocol）自己建模一个搜索结果片段（part）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `DataSource`

内联携带的字节。

**字段（field）：**

- `type` — `"data"`，**必需（required）**。判别字段（discriminator）。
- `value` — `string`，**必需（required）**。字节，base64 编码。在 2020-12 中 contentEncoding 是注解而不是约束，因此畸形的（malformed）字符串在这里仍然能通过校验（validation）；拒绝它是解码器的事。编码：`base64`。
- `mimeType` — `string`，**必需（required）**。这些字节是什么。这里它是必需（required）的，与 URL 来源（source）不同，因为没有别的东西能告诉消费者（consumer）该怎么读它们。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `UrlSource`

通过 URL 引用、由需要它的一方去获取的字节。

**字段（field）：**

- `type` — `"url"`，**必需（required）**。判别字段（discriminator）。
- `value` — `string`，**必需（required）**。该 URL。刻意不约束为 URI 格式，这样生产者（producer）已经在用的 scheme 不会在这里被拒绝。
- `mimeType` — `string`，可选（optional）。该资源是什么，当生产者（producer）知道时。可选（optional），因为响应里可以说明。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `FileSource`

已经位于提供方、以提供方签发的句柄（handle）命名的字节：一个 OpenAI 或 Anthropic 文件 id、一个 Gemini 文件 URI，或一个只有该提供方能读取的存储 URL。不传输任何字节，也不获取任何内容。只有铸造（mint）该句柄（handle）的提供方才能解析它；无法解析的对端（peer）会丢掉这个片段（part），就像丢掉任何它无法使用的片段（part）一样。

**字段（field）：**

- `type` — `"file"`，**必需（required）**。判别字段（discriminator）。
- `value` — `string`，**必需（required）**。该句柄（handle），与提供方签发时一模一样。不透明：消费者（consumer）不得（MUST NOT）获取它、解析它，或从中读出一个 scheme。
- `provider` — `string`，可选（optional）。谁签发了该句柄（handle），当生产者（producer）知道时。可选（optional）：Agent 本来就知道自己在跟哪个提供方打交道。存在时，应当（SHOULD）是 TokenUsage.provider 所用的全小写厂商 id（openai、anthropic、google），这样对端（peer）在发送之前就能判断该句柄（handle）是否是自己能用的。
- `mimeType` — `string`，可选（optional）。该文件是什么，当生产者（producer）知道时。可选（optional），因为持有字节的提供方知道。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `PartSource`

媒体片段（media part）的字节来自哪里：内联携带、通过 URL 引用，或已以提供方签发的句柄（handle）存在于提供方。

**成员：**

- [`DataSource`](#datasource)
- [`UrlSource`](#urlsource)
- [`FileSource`](#filesource)

以 `type` 作为判别字段（discriminator）。

### `ImagePart`

一个图像片段（part）。

**字段（field）：**

- `type` — `"image"`，**必需（required）**。判别字段（discriminator）。
- `id` — `string`，可选（optional）。在其消息（message）内标识该片段（part）。可选（optional），且目前无人读取它：保留下来，以便日后助手消息（assistant message）也携带片段时，能把流式片段对应到它在历史记录中的条目。
- `source` — [`PartSource`](#partsource)，**必需（required）**。图像来自哪里。
- `metadata` — 除 `null` 外的任意 JSON 值，可选（optional）。关于该片段（part）的额外信息。它不受约束，而不是一个对象：继承自各 SDK，它们把它声明为 unknown 而不是 record；这被列在 README 的已知分歧中，而不是在这里解决。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `AudioPart`

一个音频片段（part）。

**字段（field）：**

- `type` — `"audio"`，**必需（required）**。判别字段（discriminator）。
- `id` — `string`，可选（optional）。在其消息（message）内标识该片段（part）。可选（optional），且目前无人读取它：保留下来，以便日后助手消息（assistant message）也携带片段时，能把流式片段对应到它在历史记录中的条目。
- `source` — [`PartSource`](#partsource)，**必需（required）**。音频来自哪里。
- `metadata` — 除 `null` 外的任意 JSON 值，可选（optional）。关于该片段（part）的额外信息。不受约束，与其它媒体片段（media part）相同。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `VideoPart`

一个视频片段（part）。

**字段（field）：**

- `type` — `"video"`，**必需（required）**。判别字段（discriminator）。
- `id` — `string`，可选（optional）。在其消息（message）内标识该片段（part）。可选（optional），且目前无人读取它：保留下来，以便日后助手消息（assistant message）也携带片段时，能把流式片段对应到它在历史记录中的条目。
- `source` — [`PartSource`](#partsource)，**必需（required）**。视频来自哪里。
- `metadata` — 除 `null` 外的任意 JSON 值，可选（optional）。关于该片段（part）的额外信息。不受约束，与其它媒体片段（media part）相同。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `DocumentPart`

一个文档片段（part）。

**字段（field）：**

- `type` — `"document"`，**必需（required）**。判别字段（discriminator）。
- `id` — `string`，可选（optional）。在其消息（message）内标识该片段（part）。可选（optional），且目前无人读取它：保留下来，以便日后助手消息（assistant message）也携带片段时，能把流式片段对应到它在历史记录中的条目。
- `source` — [`PartSource`](#partsource)，**必需（required）**。文档来自哪里。
- `metadata` — 除 `null` 外的任意 JSON 值，可选（optional）。关于该片段（part）的额外信息。不受约束，与其它媒体片段（media part）相同。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `ContentPart`

消息（message）正文中的一个片段（part）：人在用户消息（user message）里发送的内容，或工具（tool）在工具消息（tool message）里返回的内容。以 `type` 作为判别字段（discriminator）。它的命名依据是片段本身是什么，而不是方向，因为同一个片段既可以随用户消息（user message）进入模型，又可以随工具结果（tool result）从流（stream）中返回。

**成员：**

- [`TextPart`](#textpart)
- [`ImagePart`](#imagepart)
- [`AudioPart`](#audiopart)
- [`VideoPart`](#videopart)
- [`DocumentPart`](#documentpart)

以 `type` 作为判别字段（discriminator）。

### `Tool`

Agent 可以调用的工具（tool）。

**字段（field）：**

- `name` — `string`，**必需（required）**。工具（tool）的名称，即 Agent 调用它时所用的名字。
- `description` — `string`，**必需（required）**。工具（tool）做什么，供 Agent 判断何时使用它。
- `parameters` — 除 `null` 外的任意 JSON 值，可选（optional）。描述该工具（tool）参数（args）的 JSON Schema。它被不透明地承载：协议（protocol）既不约束也不校验（validate）它。它是可选（optional）的，因为三个 SDK 都这样对待它，而且不接受任何参数（args）的工具（tool）没有什么可声明的；缺省的 schema 与空的 schema 对 Agent 来说含义相同。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。关于该工具（tool）的额外信息，供那些要给它附加自己的渲染或路由信息的消费者（consumer）使用。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `Context`

为这次运行（run）提供给 Agent 的一段具名环境信息，它不同于对话本身。

**字段（field）：**

- `description` — `string`，**必需（required）**。这段上下文是什么，供 Agent 理解。
- `value` — `string`，**必需（required）**。上下文本身。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `ResumeEntry`

对某一个中断（interrupt）的回答，在从它继续的那次运行（run）中发送。

**字段（field）：**

- `interruptId` — `string`，**必需（required）**。正在被回答的中断（interrupt）。
- `status` — `"resolved"` | `"cancelled"`，**必需（required）**。该中断（interrupt）是被回答了还是被放弃了。
- `payload` — 除 `null` 外的任意 JSON 值，可选（optional）。Agent 所要求并将据此行动的答案。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。关于该响应的信封（envelope）信息，例如签名或路由键，与 payload 相对——后者才是答案本身。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `RunAgentInput`

一次运行（run）Agent 的请求。它也作为 RUN_STARTED.input 回显。只有 threadId、runId 和 messages 是必需（required）的：这三个正是各 SDK 已经达成一致的，而对于 tools 和 context，缺少该键与空数组含义相同，所以把它们设为必需（required）也抓不住生产者（producer）可能犯的任何错误。

**字段（field）：**

- `threadId` — `string`，**必需（required）**。该运行（run）所属的对话。
- `runId` — `string`，**必需（required）**。标识该运行（run）。
- `protocolVersion` — `string`，可选（optional）。该消费者（consumer）所说的协议版本（protocol version），例如 "1.0"。缺省表示该输入产生于协议（protocol）尚未携带版本之前——正文中的版本管理规则规定了双方据此各自怎么做。它以带内（in-band）方式发送，而不是由传输层（transport）发送，因此一段被记录的交换始终自我描述。
- `parentRunId` — `string`，可选（optional）。产生本次运行（run）的那次运行（run）。
- `state` — 除 `null` 之外的 [`State`](#state)，可选（optional）。运行（run）的起始状态（state）。
- `messages` — [`Message`](#message) 的数组，**必需（required）**。到目前为止的对话，按顺序。
- `tools` — [`Tool`](#tool) 的数组，可选（optional）。Agent 可以调用的工具（tool）。缺省表示没有。
- `context` — [`Context`](#context) 的数组，可选（optional）。供该运行（run）使用的环境信息。缺省表示没有。
- `forwardedProps` — 除 `null` 外的任意 JSON 值，可选（optional）。原样透传（passthrough）给 Agent 的应用专属值。任意 JSON 值。
- `resume` — [`ResumeEntry`](#resumeentry) 的数组，可选（optional）。对结束上一次运行（run）的那些中断（interrupt）的回答，用于本次运行（run）从其中继续的情形。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

## 结果（outcome）与中断（interrupt）

运行（run）与子 Agent（subagent）如何报告结束，以及一次被中断的运行（run）在等待什么。行为细节见[中断（interrupt）与恢复（resume）](basic/patterns/interrupt-resume.md)。

### `RunFinishedSuccessOutcome`

运行（run）已完成。等同于缺少结果（outcome）。它与其它每个对象一样是封闭对象（closed object），这也正是它无法携带那个挂起（suspended）的兄弟结果中的 interrupts 的原因——一个成功结果却仍带着待处理的中断（interrupt），那是矛盾，而不是扩展。已完成的运行（run）仍可能留下待应用回答的前端工具调用（frontend tool call）；pendingToolCallIds 会列出它们。

**字段（field）：**

- `type` — `"success"`，**必需（required）**。判别字段（discriminator）。
- `pendingToolCallIds` — `string` 的数组，可选（optional）。本次运行（run）发起却未回答、留给应用在下一个输入的 messages 中回答的工具调用（tool call）——即运行（run）中没有 TOOL_CALL_RESULT 的那些——按它们发生的顺序排列。缺省或为空表示生产者（producer）没有指定任何一项，由消费者（consumer）从流（stream）中推导出该列表；否则它就是那个列表，且与流（stream）一致。它放在成功结果（success outcome）上而不是事件（event）上，是因为停在前端工具调用（frontend tool call）上的运行（run）是一次已完成的运行（run）：应用是否继续该线程（thread）是它自己的决定，所以生产者（producer）只报告它知道的内容，不多说。每项：一个工具调用 id，即 TOOL_CALL_START 所携带的那个。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `Interrupt`

运行（run）在继续之前需要从外部获得的东西，例如一次批准（approval）或一个缺失的值。

**字段（field）：**

- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `id` — `string`，**必需（required）**。标识该中断（interrupt）。恢复条目（resume entry）通过这个 id 回答它。
- `reason` — `string`，**必需（required）**。运行（run）为何停下。是开放字符串而不是枚举（enum）：协议（protocol）并不试图对 Agent 可能需要输入的每一种原因分类。
- `message` — `string`，可选（optional）。给回答者看的人类可读提示。
- `toolCallId` — `string`，可选（optional）。该中断（interrupt）涉及的工具调用（tool call），当它是一次工具批准（approval）时。
- `responseSchema` — `object`，按键开放，可选（optional）。描述该中断（interrupt）所期望答案的 JSON Schema，好让消费者（consumer）为它构建表单。它被不透明地承载：协议（protocol）既不约束也不校验（validate）它。这里限定为对象，因为 TypeScript 与 Python 都这样声明它；.NET 把它当作任意 JSON 持有，而委托制定本 schema 的工单把它列在任意 JSON 字段（field）之中。跟随那两个对它做约束的实现，可以让 schema 不接受参考客户端（client）会拒绝的文档，代价是会拒绝 JSON Schema 同样允许的布尔 schema——用一个裸的 true 表示「任意答案」。这被记录为已知分歧，而不是已定论。
- `expiresAt` — `string`，可选（optional）。该中断（interrupt）何时不再可回答。刻意不加约束而不是采用日期时间格式，因为各生产者（producer）对表示方式本就不一致，在这里收紧会拒绝今天还能工作的流（stream）。有文档记载的约定是 ISO 8601，而比较这个值的消费者（consumer）会把它当作日期解析，因此一个不是日期的值会让该中断（interrupt）看起来永不过期。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该中断（interrupt）的额外信息。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

组合（compose）[`Attributable`](#attributable)；组合而来的字段（field）已在上面列出。

### `RunFinishedInterruptOutcome`

运行（run）已暂停，等待它之外的某个东西。恢复（resume）意味着启动一次新的运行（run），其 resume 条目回答这些中断（interrupt）。

**字段（field）：**

- `type` — `"interrupt"`，**必需（required）**。判别字段（discriminator）。
- `interrupts` — [`Interrupt`](#interrupt) (min 1) 的数组，**必需（required）**。运行（run）在等待什么。至少一个：一个没有任何可回答内容的中断结果（interrupt outcome）会让消费者（consumer）无事可做。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `RunFinishedCancelledOutcome`

运行（run）在完成之前被运行它的一方停下，并且没有失败。既不是成功也不是中断（interrupt）：没有产出任何结果，也没有在等待任何东西，因此该线程（thread）上的下一次运行（run）是一次普通的新运行（run），而不是恢复（resume）。它与兄弟定义一样是封闭对象（closed object）：已取消（cancelled）的运行（run）没有要携带的中断（interrupt）。它在 1.0 之前就被写入 schema，因为消费者（consumer）不认识的结果（outcome）会被剥离（strip）并读作成功——一个后来才加入的取消值，会让每个 1.0 消费者（consumer）都把它读成一次已完成的运行（run）。

**字段（field）：**

- `type` — `"cancelled"`，**必需（required）**。判别字段（discriminator）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `RunFinishedOutcome`

一次运行（run）为何结束。

**成员：**

- [`RunFinishedSuccessOutcome`](#runfinishedsuccessoutcome)
- [`RunFinishedInterruptOutcome`](#runfinishedinterruptoutcome)
- [`RunFinishedCancelledOutcome`](#runfinishedcancelledoutcome)

以 `type` 作为判别字段（discriminator）。

### `SubagentFinishedSuccessOutcome`

子 Agent（subagent）完成了它的工作。等同于缺少结果（outcome）。

**字段（field）：**

- `type` — `"success"`，**必需（required）**。判别字段（discriminator）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `SubagentFinishedSuspendedOutcome`

子 Agent（subagent）已暂停，等待外部输入。这对本次流（stream）是终结性的，但对子 Agent（subagent）不是：一旦这些中断（interrupt）被回答，之后的运行（run）可以继续同一次调用（invocation）。

**字段（field）：**

- `type` — `"suspended"`，**必需（required）**。判别字段（discriminator）。
- `interruptIds` — `string` 的数组，可选（optional）。该子 Agent（subagent）自己提出的运行（run）级中断（interrupt）。可以为空或缺省：因为某个后代中断（interrupt）而挂起（suspended）的子 Agent（subagent）本身并不拥有任何中断（interrupt）。每项：一个 Interrupt.id。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `SubagentFinishedOutcome`

子 Agent（subagent）在一次运行（run）中的片段为何结束。它在下一层级上镜像 RunFinishedOutcome。

**成员：**

- [`SubagentFinishedSuccessOutcome`](#subagentfinishedsuccessoutcome)
- [`SubagentFinishedSuspendedOutcome`](#subagentfinishedsuspendedoutcome)

以 `type` 作为判别字段（discriminator）。

## 通用类型

以上各节共享的一切。

### `Metadata`

附加到事件（event）、消息（message）、工具调用（tool call）、工具（tool）、中断（interrupt）或恢复条目（resume entry）的额外信息。按键开放：键下允许任意 JSON 值，包括 null，因为那里的 null 是有意义的数据。对象本身可以缺省，但出现时永不为 null。键 ag-ui 保留给协议（protocol）自用；这种保留是约定，因为校验某个键值的形状会与「按键开放」相矛盾。

**类型：** `object`，按键开放

### `SubagentRunId`

某一次子 Agent（subagent）调用（invocation）的不透明句柄（handle），而不是子 Agent（subagent）定义的可复用名称：同一子 Agent（subagent）的两次调用（invocation）携带两个不同的值。命名上镜像下一层级的 runId，就像子 Agent（subagent）的 name 镜像 agentId 一样。

**类型：** `string`

### `State`

Agent 状态（state）。任意 JSON 值：协议（protocol）只承载状态（state）而不解释它，因此对象、数组、字符串和数字都是合法的。

**类型：** 任意 JSON 值

### `JsonPointer`

由 RFC 6901 定义的 JSON Pointer。要么是空字符串，表示整个文档；要么是一串以斜杠为前缀的引用记号（reference token），其中波浪号转义为 ~0、斜杠转义为 ~1。没有前导斜杠的值，或波浪号后面跟的不是 0 或 1 的值，都不是 JSON Pointer。

**类型：** 匹配 `^(/([^/~]|~[01])*)*$` 的 `string`

### `AddOperation`

在 path 处插入 value。RFC 6902 第 4.1 节。

**字段（field）：**

- `op` — `"add"`，**必需（required）**。add 操作的判别字段（discriminator）。
- `path` — [`JsonPointer`](#jsonpointer)，**必需（required）**。在哪里插入该值。
- `value` — 任意 JSON 值，**必需（required）**。要插入的值。任意 JSON 值，包括 null，因为 null 也是合法的可插入内容。

开放对象（open object）：超出这些的成员在协议（protocol）上合法，且永不被剥离（strip）。

### `RemoveOperation`

移除 path 处的值。RFC 6902 第 4.2 节。

**字段（field）：**

- `op` — `"remove"`，**必需（required）**。remove 操作的判别字段（discriminator）。
- `path` — [`JsonPointer`](#jsonpointer)，**必需（required）**。要移除什么。

开放对象（open object）：超出这些的成员在协议（protocol）上合法，且永不被剥离（strip）。

### `ReplaceOperation`

替换 path 处的值。RFC 6902 第 4.3 节。

**字段（field）：**

- `op` — `"replace"`，**必需（required）**。replace 操作的判别字段（discriminator）。
- `path` — [`JsonPointer`](#jsonpointer)，**必需（required）**。要替换什么。
- `value` — 任意 JSON 值，**必需（required）**。替换值。任意 JSON 值，包括 null。

开放对象（open object）：超出这些的成员在协议（protocol）上合法，且永不被剥离（strip）。

### `MoveOperation`

把 from 处的值移动到 path。RFC 6902 第 4.4 节。

**字段（field）：**

- `op` — `"move"`，**必需（required）**。move 操作的判别字段（discriminator）。
- `from` — [`JsonPointer`](#jsonpointer)，**必需（required）**。值从这里移出。
- `path` — [`JsonPointer`](#jsonpointer)，**必需（required）**。值移到这里。

开放对象（open object）：超出这些的成员在协议（protocol）上合法，且永不被剥离（strip）。

### `CopyOperation`

把 from 处的值复制到 path。RFC 6902 第 4.5 节。

**字段（field）：**

- `op` — `"copy"`，**必需（required）**。copy 操作的判别字段（discriminator）。
- `from` — [`JsonPointer`](#jsonpointer)，**必需（required）**。值从这里复制。
- `path` — [`JsonPointer`](#jsonpointer)，**必需（required）**。值复制到这里。

开放对象（open object）：超出这些的成员在协议（protocol）上合法，且永不被剥离（strip）。

### `TestOperation`

断言 path 处的值等于 value。RFC 6902 第 4.6 节。

**字段（field）：**

- `op` — `"test"`，**必需（required）**。test 操作的判别字段（discriminator）。
- `path` — [`JsonPointer`](#jsonpointer)，**必需（required）**。要比较什么。
- `value` — 任意 JSON 值，**必需（required）**。目标必须等于的值。任意 JSON 值，包括 null。

开放对象（open object）：超出这些的成员在协议（protocol）上合法，且永不被剥离（strip）。

### `JsonPatchOperation`

单个 RFC 6902 操作。操作形状中必须恰好有一个匹配，由 op 判别。与协议（protocol）自身的对象不同，这些操作是开放的：RFC 6902 第 4 节要求忽略而非拒绝操作未定义的成员，因此一个带着多余 value 的 remove 也是合法的补丁。RFC 中有两条规则是值之间的关系而非形状之间的关系，任何静态 schema 都无法表达，这里也都不做检查：其 from 是 path 的严格前缀的 move（第 4.4 节），以及指针在目标文档中无法解析的任何操作。两者都留给应用方（applier）去拒绝。

**成员：**

- [`AddOperation`](#addoperation)
- [`RemoveOperation`](#removeoperation)
- [`ReplaceOperation`](#replaceoperation)
- [`MoveOperation`](#moveoperation)
- [`CopyOperation`](#copyoperation)
- [`TestOperation`](#testoperation)

以 `op` 作为判别字段（discriminator）。

### `JsonPatch`

由 RFC 6902 定义的 JSON Patch 文档，由 STATE_DELTA.delta 与 ACTIVITY_DELTA.patch 引用：一串有序的操作，施加到目标文档上。空数组是合法的空操作补丁。这些操作是否真的能作用到它们的目标文档上，是 RFC 6902 留给应用方（applier）的运行时问题；这里的结构合法性对此不作任何保证。

**类型：** [`JsonPatchOperation`](#jsonpatchoperation) 的数组

### `FunctionCall`

一次工具调用（tool call）的名称与参数（args）。

**字段（field）：**

- `name` — `string`，**必需（required）**。正在调用哪个工具（tool）。
- `arguments` — `string`，**必需（required）**。参数（args）以 JSON 字符串形式给出，而不是解析后的 JSON。按原样保留，因为模型可能产出不是合法 JSON 的参数（args），而在协议（protocol）边界上把它们丢掉，会把这一错误从本该处理它的消费者（consumer）眼前藏起来。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `ToolCall`

助手消息（assistant message）发出的一次调用。它自身不携带子 Agent（subagent）归属（attribution），而是继承其所属消息（message）的归属（attribution），因为多次调用可以共享同一个父级。

**字段（field）：**

- `id` — `string`，**必需（required）**。标识该调用。回答它的工具消息（tool message）把这个值作为自己的 toolCallId 携带。
- `type` — `"function"`，**必需（required）**。协议（protocol）所建模的唯一一种调用。
- `function` — [`FunctionCall`](#functioncall)，**必需（required）**。正在调用什么，以及用什么调用。
- `encryptedValue` — `string`，可选（optional）。属于该调用的提供方不透明产物。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该调用的额外信息。它放在这里而不并入所属消息（message），因为多次调用可以共享同一个父级，合并它们会让结果取决于它们的顺序。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `TokenUsage`

某个提供方与模型的 token 计数，按协议（protocol）自己的记账方式：每个计数要么是一个总量，要么是某个总量的具名组成部分，因此来自不同提供方的条目可以直接相加而不会重复计算。inputTokens 与 outputTokens 是总量；reasoningTokens、cachedInputTokens 与 cacheWriteInputTokens 是它们的组成部分，从不额外相加；totalTokens 是这两个总量之和。每个字段（field）都是一个标签或一个数字——不含任何承载内容或标识身份的东西，没有提示、补全、消息（message），也没有线程（thread）、运行（run）和用户标识符。

**字段（field）：**

- `provider` — `string`，可选（optional）。由哪个提供方服务该请求。
- `model` — `string`，可选（optional）。由哪个模型服务该请求。
- `inputTokens` — `integer` (min 0, max 9007199254740991)，可选（optional）。该调用被计费的全部提示 token：从提供方缓存中读取的 token、写入缓存的 token，以及音频或其它非文本输入都算在这里。cachedInputTokens 与 cacheWriteInputTokens 是对这个数字的分解，从不额外相加——把缓存计数报在一个更小输入计数旁边的提供方，其数字在条目离开之前已由生产者（producer）相加进去。像 timestamp 一样受约束，原因也相同：超过 JSON 安全整数范围的计数无法无损往返，消费者（consumer）会静默地读到一个与生产者（producer）写入不同的数字。
- `outputTokens` — `integer` (min 0, max 9007199254740991)，可选（optional）。全部生成的 token，在提供方加以区分时包含推理（reasoning）。reasoningTokens 是对这个数字的分解，从不额外相加——把推理 token 报在一个更小补全计数旁边的提供方，其数字已由生产者（producer）相加进去。
- `totalTokens` — `integer` (min 0, max 9007199254740991)，可选（optional）。按上面的记账方式，inputTokens 加 outputTokens。生产者（producer）可以（MAY）自行计算它，而不是照抄提供方的总量，并且只有在提供方的总量按同样方式计数时才照抄，因此消费者（consumer）可以把该字段（field）读作另外两者之和。
- `reasoningTokens` — `integer` (min 0, max 9007199254740991)，可选（optional）。花在推理（reasoning）上的输出 token，在提供方加以区分时。它是 outputTokens 的一部分，而不是在其之外额外相加。
- `cachedInputTokens` — `integer` (min 0, max 9007199254740991)，可选（optional）。从提供方缓存中读取的输入 token。它是 inputTokens 的一部分，而不是在其之外额外相加，且与 cacheWriteInputTokens 互不相交。
- `cacheWriteInputTokens` — `integer` (min 0, max 9007199254740991)，可选（optional）。本次调用写入提供方缓存的输入 token，在提供方加以区分时。它是 inputTokens 的一部分，而不是在其之外额外相加，且与 cachedInputTokens 互不相交。它自成一个字段（field），因为提供方对缓存写入与缓存读取的定价不同，计算成本的消费者（consumer）离不开它。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `ReasoningEncryptedValueSubtype`

REASONING_ENCRYPTED_VALUE 属于一条消息（message）还是一次工具调用（tool call）。

**取值：**

`tool-call` · `message`

### `SubagentInfo`

描述一个可由父 Agent（parent agent）调用（invoke）的子 Agent（subagent）。

**字段（field）：**

- `name` — `string`，**必需（required）**。该子 Agent（subagent）的唯一名称或标识符。
- `description` — `string`，可选（optional）。该子 Agent（subagent）擅长什么。帮助客户端（client）构建 Agent 选择 UI。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `IdentityCapabilities`

关于 Agent 的基本元数据（metadata）。对发现类 UI、Agent 市场以及调试都有用。当你希望客户端（client）展示 Agent 信息，或在有多个 Agent 可用、用户需要挑选其中一个时，设置这些字段（field）。

**字段（field）：**

- `name` — `string`，可选（optional）。在 UI 与 Agent 选择器中展示的人类可读名称。
- `type` — `string`，可选（optional）。驱动该 Agent 的框架或平台（例如 "langgraph"、"mastra"、"crewai"）。
- `description` — `string`，可选（optional）。该 Agent 做什么——帮助用户与路由逻辑判断何时使用它。
- `version` — `string`，可选（optional）。该 Agent 的语义化版本（version）（例如 "1.2.0"）。对兼容性（compatibility）检查很有用。
- `provider` — `string`，可选（optional）。维护该 Agent 的组织或团队。
- `documentationUrl` — `string`，可选（optional）。该 Agent 的文档或主页 URL。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。用于集成（integration）专有身份信息的任意键值对。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `TransportCapabilities`

声明 Agent 支持哪些传输（transport）机制。客户端（client）用它挑选最佳连接策略。只对你 Agent 确实支持的传输（transport）把标志设为 true——不支持的请省略或设为 false。

**字段（field）：**

- `streaming` — `boolean`，可选（optional）。如果 Agent 通过 SSE 流式返回响应，设为 true。大多数 Agent 会启用它。
- `websocket` — `boolean`，可选（optional）。如果 Agent 接受持久的 WebSocket 连接，设为 true。
- `httpBinary` — `boolean`，可选（optional）。如果 Agent 支持 AG-UI 二进制（binary）协议（protobuf over HTTP），设为 true。
- `pushNotifications` — `boolean`，可选（optional）。如果 Agent 能在运行（run）结束后通过 webhook 发送异步更新，设为 true。
- `resumable` — `boolean`，可选（optional）。如果 Agent 支持通过序列号恢复（resume）被中断的流（stream），设为 true。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `ToolsCapabilities`

工具调用（tool call）能力（capability）。它区分 Agent 自身提供的工具（tool）（列在 items 中）与客户端（client）在运行时通过 RunAgentInput.tools 传入的工具（tool）。当你的 Agent 能调用函数、搜索网络、执行代码等时，启用这一项。

**字段（field）：**

- `supported` — `boolean`，可选（optional）。如果 Agent 能进行任何工具调用（tool call），设为 true。设为 false 可显式表示工具调用（tool call）被禁用，即使 items 存在。
- `items` — [`Tool`](#tool) 的数组，可选（optional）。该 Agent 自身提供的工具（tool）（完整的 JSON Schema 定义）。它们与在 RunAgentInput.tools 中传入的客户端（client）提供工具不同。
- `parallelCalls` — `boolean`，可选（optional）。如果 Agent 能在单个步骤（step）内并发调用多个工具（tool），设为 true。
- `clientProvided` — `boolean`，可选（optional）。如果 Agent 接受并使用客户端（client）在运行时提供的工具（tool），设为 true。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `OutputCapabilities`

输出格式支持。当你的 Agent 能返回符合某个 JSON schema 的响应时，启用 structuredOutput，这对程序化消费很有用。

**字段（field）：**

- `structuredOutput` — `boolean`，可选（optional）。如果 Agent 能产出符合给定 schema 的结构化 JSON 输出，设为 true。
- `supportedMimeTypes` — `string` 的数组，可选（optional）。Agent 能产出的 MIME 类型（例如 ["text/plain", "application/json"]）。如果 Agent 只产出纯文本，请省略。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `StateCapabilities`

状态（state）与记忆管理能力（capability）。它们告诉客户端（client）Agent 如何处理共享状态（state），以及对话上下文是否在多次运行（run）之间持续存在。

**字段（field）：**

- `snapshots` — `boolean`，可选（optional）。如果 Agent 会发出 STATE_SNAPSHOT 事件（event）（整体替换状态（state）），设为 true。
- `deltas` — `boolean`，可选（optional）。如果 Agent 会发出 STATE_DELTA 事件（event）（JSON Patch 增量（delta）更新），设为 true。
- `memory` — `boolean`，可选（optional）。如果 Agent 拥有超出当前线程（thread）的长期记忆（例如向量库、知识库或跨会话回忆），设为 true。
- `persistentState` — `boolean`，可选（optional）。如果状态（state）在同一线程（thread）内的多次运行（run）之间得到保留，设为 true。为 false 时，每次运行（run）都会重置状态（state）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `MultiAgentCapabilities`

多 Agent 协调能力（capability）。当你的 Agent 能编排工作或把工作交接（handoff）给其它 Agent 时，启用这些。

**字段（field）：**

- `supported` — `boolean`，可选（optional）。如果 Agent 参与任何形式的多 Agent 协调，设为 true。
- `delegation` — `boolean`，可选（optional）。如果 Agent 能把子任务委派给其它 Agent 并同时保留控制权，设为 true。
- `handoffs` — `boolean`，可选（optional）。如果 Agent 能把对话完全移交给另一个 Agent，设为 true。
- `subagents` — [`SubagentInfo`](#subagentinfo) 的数组，可选（optional）。该 Agent 可以调用的子 Agent（subagent）列表。帮助客户端（client）构建 Agent 选择 UI。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `ReasoningCapabilities`

推理（reasoning）与 thinking 能力（capability）。当你的 Agent 暴露其内部思考过程（例如思维链、扩展思考）时，启用这些。

**字段（field）：**

- `supported` — `boolean`，可选（optional）。如果 Agent 产出对客户端（client）可见的推理（reasoning）/thinking token，设为 true。
- `streaming` — `boolean`，可选（optional）。如果推理（reasoning）token 是增量（delta）流式传输的（而不是一次性返回），设为 true。
- `encrypted` — `boolean`，可选（optional）。如果推理（reasoning）内容被加密（零数据留存模式），设为 true。客户端（client）应当预期看到不透明的 encryptedValue 字段（field），而不是可读内容。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `MultimodalInputCapabilities`

Agent 可以作为输入接受的模态。客户端（client）用它来显示或隐藏文件上传按钮、录音控件、图片选择器等。

**字段（field）：**

- `image` — `boolean`，可选（optional）。如果 Agent 能处理图像输入（例如截图、照片），设为 true。
- `audio` — `boolean`，可选（optional）。如果 Agent 能处理音频输入（语音、录音），设为 true。
- `video` — `boolean`，可选（optional）。如果 Agent 能处理视频输入，设为 true。
- `pdf` — `boolean`，可选（optional）。如果 Agent 能处理 PDF 文档，设为 true。
- `file` — `boolean`，可选（optional）。如果 Agent 能处理任意文件上传，设为 true：即图像、音频、视频和文档片段（part）未覆盖的那类文件。它不涉及文件如何到达；片段（part）的来源（source）（内联、URL 还是提供方句柄（handle））是另一个问题。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `MultimodalOutputCapabilities`

Agent 可以作为输出产生的模态。客户端（client）用它来预期 Agent 响应中的富内容。

**字段（field）：**

- `image` — `boolean`，可选（optional）。如果 Agent 能在响应中生成图像，设为 true。
- `audio` — `boolean`，可选（optional）。如果 Agent 能产出音频输出（文本转语音、音频文件），设为 true。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `MultimodalCapabilities`

多模态（multimodal）输入与输出支持。它被组织为 input 与 output 两个子对象，以便客户端（client）分别查询 Agent 接受什么、产生什么。

**字段（field）：**

- `input` — [`MultimodalInputCapabilities`](#multimodalinputcapabilities)，可选（optional）。Agent 可以作为输入接受的模态（图像、音频、视频、PDF、文件）。
- `output` — [`MultimodalOutputCapabilities`](#multimodaloutputcapabilities)，可选（optional）。Agent 可以作为输出产生的模态（图像、音频）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `ExecutionCapabilities`

执行控制与限制。声明这些，客户端（client）就能对一次 Agent 运行（run）可能持续多久、经过多少个步骤（step）建立预期。

**字段（field）：**

- `codeExecution` — `boolean`，可选（optional）。如果 Agent 能在运行（run）期间执行代码（例如 Python、JavaScript），设为 true。
- `sandboxed` — `boolean`，可选（optional）。如果代码执行发生在沙箱或隔离环境中，设为 true。仅在 codeExecution 为 true 时有意义。
- `maxIterations` — `integer` (min 0, max 9007199254740991)，可选（optional）。Agent 每次运行（run）会执行的最大工具调用（tool call）/推理（reasoning）迭代次数。帮助客户端（client）展示进度或设置超时预期。
- `maxExecutionTime` — `integer` (min 0, max 9007199254740991)，可选（optional）。Agent 在超时前会运行的最长墙钟时间（以毫秒计）。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `HumanInTheLoopCapabilities`

人在回路（human in the loop）交互支持。当你的 Agent 能在继续之前暂停执行，以请求人工输入、批准（approval）或反馈时，启用这些。

**字段（field）：**

- `supported` — `boolean`，可选（optional）。如果 Agent 支持任何形式的人在回路（human in the loop）交互，设为 true。
- `approvals` — `boolean`，可选（optional）。如果 Agent 能在执行敏感操作（例如发送邮件、删除数据）之前暂停并请求显式批准（approval），设为 true。
- `interventions` — `boolean`，可选（optional）。如果 Agent 允许人在执行中途介入并修改它的计划，设为 true。
- `feedback` — `boolean`，可选（optional）。如果 Agent 能吸收用户反馈（点赞／点踩、纠正），以改进它在当前会话中的行为，设为 true。
- `interrupts` — `boolean`，可选（optional）。如果 Agent 参与 AG-UI 中断（interrupt）协议（protocol），设为 true：它以携带中断结果（interrupt outcome）的 RUN_FINISHED 结束一次运行（run），并在 RunAgentInput.resume 中接受回答。
- `approveWithEdits` — `boolean`，可选（optional）。如果工具调用（tool call）中断（interrupt）接受 resume 载荷中的 editedArgs，设为 true。仅在 interrupts 为 true 时有意义。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

### `AgentCapabilities`

对 Agent 当前能力（capability）的带类型、带分类的快照（snapshot）。所有字段（field）都是可选（optional）的——Agent 只声明它支持什么。省略某个字段（field）意味着该能力没有声明（未知），而不是不支持。custom 字段是一个逃生通道，用于那些无法归入标准类别、专属于某个集成（integration）的能力（capability）。

**字段（field）：**

- `identity` — [`IdentityCapabilities`](#identitycapabilities)，可选（optional）。Agent 的身份与元数据（metadata）。
- `transport` — [`TransportCapabilities`](#transportcapabilities)，可选（optional）。支持的传输（transport）机制（SSE、WebSocket、二进制（binary）等）。
- `tools` — [`ToolsCapabilities`](#toolscapabilities)，可选（optional）。Agent 提供的工具（tool）与工具调用（tool call）配置。
- `output` — [`OutputCapabilities`](#outputcapabilities)，可选（optional）。输出格式支持（结构化输出、MIME 类型）。
- `state` — [`StateCapabilities`](#statecapabilities)，可选（optional）。状态（state）与记忆管理（快照（snapshot）、增量（delta）、持久化）。
- `multiAgent` — [`MultiAgentCapabilities`](#multiagentcapabilities)，可选（optional）。多 Agent 协调（委派、交接（handoff）、子 Agent（subagent））。
- `reasoning` — [`ReasoningCapabilities`](#reasoningcapabilities)，可选（optional）。推理（reasoning）与 thinking 支持（思维链、加密 thinking）。
- `multimodal` — [`MultimodalCapabilities`](#multimodalcapabilities)，可选（optional）。多模态（multimodal）输入/输出支持（图像、音频、视频、文件）。
- `execution` — [`ExecutionCapabilities`](#executioncapabilities)，可选（optional）。执行控制与限制（代码执行、超时、迭代上限）。
- `humanInTheLoop` — [`HumanInTheLoopCapabilities`](#humanintheloopcapabilities)，可选（optional）。人在回路（human in the loop）支持（批准（approval）、介入、反馈）。
- `custom` — `object`，按键开放，可选（optional）。标准类别未覆盖的集成（integration）专有能力（capability）。按键开放：键下允许任意 JSON 值，因为上面的类别无法预见某个集成会声明什么。

封闭对象（closed object）：schema 拒绝未在此列出的成员。

## 混入（mixin）

共享的字段（field）集合，会被展平进每一个组合（compose）它们的定义。它们在 schema 中以具名定义的形式存在，好让文档只写一次；线上（wire）中从不存在「只是一个混入（mixin）」的对象。

### `Attributable`

被组合（compose）进一切可能属于某个子 Agent（subagent）工作的定义：描述内容或进度的事件（event）、各类消息（message），以及每一个中断（interrupt）。属于运行（run）作用域的事件（event）不带它——RUN_STARTED、RUN_FINISHED 和 RUN_ERROR 描述的是运行（run）本身，而 MESSAGES_SNAPSHOT 是整段对话范围的，所以它们都不属于某一个子 Agent（subagent）。工具调用（tool call）也不带它，而是继承其所属消息（message）的归属（attribution）。

**字段（field）：**

- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。


### `BaseEvent`

每个事件（event）无论类型如何都携带的字段（field）。它被组合（compose）进每个事件（event）定义而不是重复书写，这样一处改动就能同时覆盖所有事件（event）。

**字段（field）：**

- `type` — [`EventType`](#eventtype)，**必需（required）**。这是哪个事件（event）。每个事件（event）定义都会把它收窄为单个值。
- `timestamp` — `integer` (min -9007199254740991, max 9007199254740991)，可选（optional）。事件（event）创建的时间。被限制在 JSON 数字能无损往返的范围内，因此消费者（consumer）读到的值就是生产者（producer）写入的值。刻意不用浮点数。单位在这里不受约束，因为规范从未对它做过规范性（normative）规定；实际上每个设置它的 SDK 都用 Unix 纪元以来的毫秒数，而选择其它单位的生产者（producer）虽然能通过校验（validation），却会被消费者（consumer）误读。协议（protocol）中没有任何计算会用到这个值。
- `rawEvent` — 除 `null` 外的任意 JSON 值，可选（optional）。本事件（event）译自的提供方原生（provider-native）事件（event），逐字携带，供调试以及需要协议（protocol）未建模细节的消费者（consumer）使用。任意 JSON 值。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该事件（event）的额外信息。


### `BaseMessage`

开发者、系统、助手与用户消息（message）共享的字段（field）。它刻意排除了 content，因为用户消息（user message）的 content 可能是数组，而其它消息的 content 是字符串，而这里的组合（composition）是求交集而不是覆盖：如果基础定义把 content 限定为字符串，数组形式的 content 就会变成非法。工具、活动（activity）与推理（reasoning）消息（message）不组合（compose）它，因为它们不携带 name。

**字段（field）：**

- `subagentRunId` — [`SubagentRunId`](#subagentrunid)，可选（optional）。该项所属的子 Agent（subagent）调用（invocation）。缺省表示由父 Agent 直接产生。
- `id` — `string`，**必需（required）**。在对话内标识该消息（message）。
- `role` — `string`，**必需（required）**。消息（message）来自谁。每个消息（message）定义都会把它收窄为单个值。
- `name` — `string`，可选（optional）。作者的可选显示名称。
- `encryptedValue` — `string`，可选（optional）。属于该消息（message）的提供方不透明产物，由消费者（consumer）保存，并在后续轮次送回。
- `metadata` — [`Metadata`](#metadata)，可选（optional）。附加到该消息（message）的额外信息。

