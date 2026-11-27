---
title: "关键变更"
description: "1.0 相对于 0.x 系列的改动 — 1.0"
---

本页列出 1.0 相对于协议 0.x 系列所做的行为变更，面向熟悉 0.x、只想要差异而不想要整份文档的审阅者。它是资料性的：链接到的页面才是规范。

## 重大变更

1. **规范出现了。** 0.x 定义了形状；行为则存在于 TypeScript 客户端（client）中。这些页面上的规则 —— 顺序、未知与畸形之别、告警、归属 —— 现在是规范性的（normative），以 [BCP 14](https://datatracker.ietf.org/doc/html/bcp14) 的语言书写，其中 [schema](schema.md) 对结构具有权威性，而本文档对行为具有权威性。

2. **运行（run）会报告它们如何结束。** `RUN_FINISHED` 携带一个可选的 `outcome`：缺省或 success 表示成功，中断结果携带该运行正在等待的东西，而[已取消结果](events/lifecycle.md#已取消的运行)标记一个在完成之前被有意停止的运行。随之而来的是 `Interrupt`、[运行输入（run input）](basic/run-input.md)上的恢复（resume）条目，以及[中断（interrupt）–恢复模式](basic/patterns/interrupt-resume.md)。在结果存在之前编写的每一个生产者（producer）本来就已符合一致性（conformance）。

3. **子 Agent（subagent）。** 被委派的工作通过在可以携带它的那些事件（event）上的 `subagentRunId` 进行归属，可选地由 `SUBAGENT_STARTED` 宣告，并由 `SUBAGENT_FINISHED` 或 `SUBAGENT_ERROR` 收尾，并配有[关于所有权、嵌套、并行与终止的规则](events/subagents.md)。

4. **推理（reasoning）取代 thinking。** 0.x 的 `THINKING_*` 事件已退役，改由[推理事件族（event family）](events/reasoning.md)承担：推理区间、按 `messageId` 匹配的流式推理消息（message），以及供消费者（consumer）存储并原样返回而无需读取的提供商工件所用的 `REASONING_ENCRYPTED_VALUE`。已退役形状在[兼容性边界](basic/versioning.md#已退役形状)处被翻译，而不是被丢弃。

5. **活动（activity）事件。** `ACTIVITY_SNAPSHOT` 与 `ACTIVITY_DELTA` 以消息的形式携带[结构化进度](events/activity.md)，其内容是一个对象，并由 JSON Patch 修正。

6. **未知与畸形之别，且具规范性。** 不被识别的事件、字段与联合成员在翻译到强制执行之前得以保留；强制执行会丢弃未知事件并剥离未知成员，并在过程中发出告警；畸形的已知值则是致命的。在翻译器有机会处理之前，什么都不会被移除，而且两种传输（transport）都汇入同一条[处理流水线](basic/processing.md) —— 该页还陈述了流水线唯一获准的收窄，即针对分块字段。

7. **分块形式有规则。** 首个分块必须（MUST）携带开启所需的内容（文本消息的 `messageId` 与 role 语义，工具调用（tool call）的 `toolCallId` 与 `toolCallName`）；后续分块可以（MAY）省略它们；续块若重复某个开启字段却给出冲突的值，则是致命的（[流式模式](basic/patterns/streaming.md)）。

8. **二进制线上（wire）。** [HTTP + Protobuf 绑定（binding）](basic/transports/http-protobuf.md)已作出规定 —— 按媒体类型协商、4 字节长度前缀分帧、由同一 schema 生成，并以共享的字节语料固定跨实现一致性。

9. **能力（capability）进入了 schema。** SDK 曾以三份手写副本携带的 `AgentCapabilities` 声明，现在只在 schema 中定义一次，并为每个 SDK 生成。其语义也已陈述：省略意味着未声明，声明是资料性的，以流为准，而获取方式刻意留给实现（[能力](basic/capabilities.md)）。子 Agent 列表拼作 `subagents`，与 `subagentRunId` 一致；较早的 `subAgents` 键不会被读取。

10. **工具结果（tool result）携带内容片段。** `TOOL_CALL_RESULT.content` 以及它所铸造的工具消息接受字符串，或接受与用户消息所携带内容相同的有序片段列表，因此工具可以返回文档、图像或搜索结果，而无需把它编码进字符串（[工具调用](events/tool-calls.md#结果内容)）。为此重命名了这些片段 —— `InputContent` → `ContentPart`、`TextInputContent` → `TextPart`、`ImageInputContent` → `ImagePart` 等等，`InputContentSource` → `PartSource`，其中包含 `DataSource` 与 `UrlSource` —— 因为按方向命名的片段一旦反向传输就名不副实。线上未变：每个 `type` 值都相同，只有定义名与锚点移动了，SDK 则把旧名称保留为别名。每个片段都新增了可选的 `id`，文本片段也获得了媒体片段已有的 `metadata`。`ReasoningPart`、`ToolCallPart` 与 `AssistantPart` 保留给助手消息同样携带片段的那次发布。

## 次要变更

1. 运行输入上的 `tools` 与 `context` 是可选（optional）的：缺省与空值含义相同（[运行输入](basic/run-input.md)）。
2. 元数据（metadata）合并语义是规范性的：逐键判定，最后写入者胜出，不递归，按事件族设定合并目标；`ag-ui` 键为保留键（[元数据](basic/metadata.md)）。
3. 缺省就是缺省：可选字段被省略，绝不写成 `null`（[事件模型](basic/index.md#缺席即缺席)）。
4. `RUN_FINISHED` 与 `RUN_ERROR` 可以（MAY）携带按提供商划分的令牌用量，采用同一套记账规则：输入与输出计数是总量，缓存与推理令牌是其中的一部分，缓存读取与缓存写入分别报告，用量遵循运行边界 —— 子 Agent 的调用计入，子运行与恢复运行的调用不计入（[运行与步骤](events/lifecycle.md#token-用量)）。
5. 因前端工具调用而停止的运行以成功结束，绝不作为中断结束，且成功结果可以（MAY）在 `pendingToolCallIds` 中指明它未作答的调用（[工具调用](events/tool-calls.md#前端工具)）。
6. 输入消息可以（MAY）携带多模态内容片段（文本、图像、音频、视频、文档），以 URL 形式、以内联数据形式，或以提供商文件句柄形式 —— 即 1.0 新增的 `file` 来源，用于已上传到模型提供商的字节（[运行输入](basic/run-input.md#提供方文件句柄)）。
7. `TOOL_CALL_RESULT` 本身就是一条消息，不会重新打开它所回答的那次调用（[工具调用](events/tool-calls.md)）。
8. `RUN_FINISHED` 之后迟到的 `RUN_ERROR` 是被允许的，用于报告在成功已被报告之后才浮现的失败（[运行与步骤](events/lifecycle.md)）。
9. 消费者把它所拒绝的流与自行报告失败的运行区分开来，并且「把该运行视为失败」是有定义的：把它暴露出来，绝不报告成功，API 形状留给实现（[运行与步骤](events/lifecycle.md#错误处理)）。
10. 协议版本带内传输：消费者在 `RunAgentInput.protocolVersion` 上声明自己的版本，生产者在 `RUN_STARTED.protocolVersion` 上以自己的版本作答，而缺省即可识别出尚未版本化的对端（[版本管理](basic/versioning.md#版本协商)）。
