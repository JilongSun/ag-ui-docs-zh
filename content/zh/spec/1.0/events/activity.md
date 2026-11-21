---
title: "活动（activity）"
description: "UI 以自有小组件渲染的结构化进度，保持在消息序列之中 —— 1.0"
---

活动（activity）是并非对话内容的结构化进度——一次正在进行的搜索、一份正在填写的清单、一个 UI 渲染为自有小组件的步骤（step）。它被物化为一条消息（message），以保持在序列中的位置，但它的内容是对象，而不是文本。

## 事件（event）

活动（activity）绑定[快照–增量模式（snapshot–delta pattern）](../basic/patterns/snapshots.md)，作用域为每条活动消息（activity message），以 `messageId` 匹配。

### `ACTIVITY_SNAPSHOT`

创建或替换一条活动消息（activity message）。

```json
{
  "type": "ACTIVITY_SNAPSHOT",
  "messageId": "act-1",
  "activityType": "web_search",
  "content": { "query": "…", "found": 3 }
}
```

- `activityType` 是一个开放字符串：取值集合属于生产者（producer），而不属于协议（protocol）。消费者（consumer）必须（MUST）容忍它不认识的类型。
- 针对一个消费者（consumer）尚未见过的 `messageId` 的快照（snapshot），会在到达的位置创建该活动消息（activity message）。
- 针对一条已存在活动（activity）的快照（snapshot）会替换它的内容与 `activityType`。`replace` 是可选（OPTIONAL）的；缺席意味着它会替换，而这个含义是规范性（normative）的。显式的 `replace: false` 要求消费者（consumer）保持现有消息（message）原样——内容*与* `activityType` 皆然；快照（snapshot）自己的取值只在它创建消息（message）时才生效。它不是一次合并。
- 替换（replacement）替换的是*内容*，而不是迄今累积的元数据（metadata）——元数据（metadata）依[元数据规则（metadata rules）](../basic/metadata.md)继续合并。归属（attribution）是例外：替换型快照（snapshot）会重新铸出这条活动（activity），因此消息（message）的 `subagentRunId` 变成快照（snapshot）自己的，包括变成缺席。
- 针对一条已存在活动（activity）的 `replace: false` 快照（snapshot）不会重新铸出所有权（ownership）：既定的所有者（owner）保持不变，而快照（snapshot）自己的归属（attribution）必须（MUST）与之一致。生产者（producer）的义务与[子 Agent 规则（subagent rules）](subagents.md)加在流式（streaming）续篇上的那条相同；消费者（consumer）的义务被有意放得更宽——既定的所有者（owner）保持不变，不要求消费者（consumer）拒绝这种不一致，而流式（streaming）续篇的不匹配必须被拒绝。

### `ACTIVITY_DELTA`

用针对某条活动消息（activity message）的 RFC 6902 patch 修改它的内容。增量（delta）的 `activityType` 会替换该消息（message）的 `activityType`——增量（delta）可以（MAY）重设它所修改的活动（activity）的类型，而无意重设的增量（delta）必须（MUST）重述当前类型，因为该字段是必需（required）的。

- 生产者（producer）不得（MUST NOT）为一条它没有用快照（snapshot）创建过的活动消息（activity message）发送增量（delta）——快照（snapshot）是[模式（pattern）](../basic/patterns/snapshots.md)所要求的基线（baseline）。
- 一个指名了不存在的消息（message）、或指名了非活动消息（activity message）的增量（delta）会被跳过；消费者（consumer）应当（SHOULD）给出告警（warning），并且不得（MUST NOT）让运行（run）失败。
- 打上 patch 之后的结果仍必须（MUST）是对象：`content` 按 schema 就是对象，生产者（producer）不得（MUST NOT）发送一个其应用结果会把它变成别的东西的 patch——比如根替换。不要求消费者（consumer）检测该违规。
- patch 失败的处理是[模式（pattern）](../basic/patterns/snapshots.md#当补丁无法应用时)的规则，并通过同一 `messageId` 的一份全新快照（snapshot）重新同步。

## 对话中的活动消息（activity message）

活动消息（activity message）以固定角色（role）`activity` 出现在历史中。它是供消费者（consumer）渲染的材料，而不是 Agent 据以恢复（resume）的对话：消费者（consumer）必须（MUST）把活动消息（activity message）从它在[运行输入（run input）](../basic/run-input.md)中发送的 `messages` 里剥离（strip）。活动消息（activity message）如何在 `MESSAGES_SNAPSHOT` 之后存活，规定在那个[事件（event）](state.md#messages_snapshot)中。

## 消息流（message flow）

```mermaid
sequenceDiagram
    participant Agent
    participant UI

    Agent->>UI: ACTIVITY_SNAPSHOT (act-1, "web_search", {query, found: 0})
    Note over UI: 搜索小组件出现
    Agent->>UI: ACTIVITY_DELTA (act-1, replace /found → 3)
    Agent->>UI: ACTIVITY_DELTA (act-1, add /results/0 …)
    Note over UI: 小组件就地更新
```

## 数据类型

[`ActivitySnapshotEvent`](../schema.md#activitysnapshotevent)、[`ActivityDeltaEvent`](../schema.md#activitydeltaevent) 与 [`ActivityMessage`](../schema.md#activitymessage) 由 [schema 参考](../schema.md)定义。[`ActivityMessage`](../schema.md#activitymessage) 独立存在，而不组合基础消息（base message），因为它的内容是对象而不是字符串。

## 错误处理

畸形的活动事件（activity event）作为畸形的已知值是致命的。两种被容忍的失败——针对缺失消息（message）或非活动消息（activity message）的增量（delta），以及格式良好却无法应用的 patch——会告警（warning）并跳过，如上所述；两者都可能让生产者（producer）与消费者（consumer）对该活动（activity）产生分歧，这由生产者（producer）的下一个快照（snapshot）修复。
