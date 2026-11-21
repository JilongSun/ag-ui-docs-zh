---
title: "状态（state）"
description: "共享的状态（state）与对话本身：整体替换，或以 patch 修正 —— 1.0"
---

状态（state）是 Agent 与应用（application）保持同步的值——一份计划、一张表单、一份正在构建的文档。它由[快照–增量模式（snapshot–delta pattern）](../basic/patterns/snapshots.md)承载；本页补充状态（state）特有的内容，以及对话自身那份快照（snapshot）特有的内容。

## 事件（event）

### `STATE_SNAPSHOT`

整体替换 Agent 的状态（state）。在增量（delta）无法表达该变更时发送，或用于让消费者（consumer）重新同步。消费者（consumer）必须（MUST）用 `snapshot` 替换自己的状态（state）——不做合并。

### `STATE_DELTA`

用 RFC 6902 patch 修改当前状态（state）。基线（baseline）是消费者（consumer）当前的状态（state）：在一次运行（run）开始时，是输入（input）的 `state`；此后，则是这次运行（run）自己的快照（snapshot）与增量（delta）所造就的任何结果。[模式（pattern）](../basic/patterns/snapshots.md)关于 patch 的一切——原子应用、开放的操作、失败处理、重新同步——原样适用。

### `MESSAGES_SNAPSHOT`

生产者（producer）拥有的完整消息（message）集合，按顺序。

它作用于整个对话，而不是一次普通的覆盖，因为消费者（consumer）可能持有任何生产者（producer）都不跟踪的、属于自己的消息（message）。对账规则：

- 快照（snapshot）中的一条消息（message）替换消费者（consumer）中 id 相同的副本——*就地*替换：消费者（consumer）为它已经持有的消息（message）保留现有位置。消费者（consumer）从未见过的快照消息（message）会按快照（snapshot）顺序追加。因此，快照（snapshot）的顺序只对消费者（consumer）首次遇到的消息（message）具有权威性；它不会重排消费者（consumer）已有的内容。
- 消费者（consumer）持有、但在快照（snapshot）中*缺席*的消息（message）会被丢弃——生产者（producer）是在声明完整集合——**例外**是生产者（producer）无从知晓的、仅属于客户端（client）的材料：[活动（activity）](activity.md)消息（message），它们从不发往生产者（producer）；以及推理消息（reasoning message），大多数生产者（producer）不跟踪它们。
- 这一例外按角色（role）生效，并且会自我撤销：一个自身携带任何活动消息（activity message）的快照（snapshot），就是在声明完整的活动（activity）集合，消费者（consumer）中不在其中的活动消息（activity message）会像其他任何东西一样被丢弃。同样的规则适用于推理消息（reasoning message）。

由于作用于整个对话，快照（snapshot）不携带自己的 `subagentRunId`；它通过所含的消息（message）确立每条消息（message）的所有权（ownership）。

## 跨运行（run）行为

状态（state）在一个线程（thread）上的多次运行（run）之间持续存在，直到有事件（event）替换它；下一次运行（run）的输入（input）把它作为起始值带回——这个循环让双方保持一致。消息（message）以同样的方式累积；`MESSAGES_SNAPSHOT` 是生产者（producer）直接重述这种累积的方式。

## 消息流（message flow）

```mermaid
sequenceDiagram
    participant Agent
    participant Application

    Agent->>Application: STATE_SNAPSHOT {"draft": {"sections": []}}
    Agent->>Application: STATE_DELTA (add /draft/sections/0)
    Agent->>Application: STATE_DELTA (replace /draft/sections/0/status)
    Agent->>Application: RUN_FINISHED
    Application->>Agent: 下一次 RunAgentInput（state：当前值）
```

## 数据类型

[`StateSnapshotEvent`](../schema.md#statesnapshotevent)、[`StateDeltaEvent`](../schema.md#statedeltaevent) 与 [`MessagesSnapshotEvent`](../schema.md#messagessnapshotevent) 由 [schema 参考](../schema.md)定义，其中 [`State`](../schema.md#state) 被有意保持不受约束——可以是任何 JSON 值，而不只是对象——增量（delta）则是 [`JsonPatch`](../schema.md#jsonpatch)。

## 错误处理

结构上畸形的 patch 是致命的；一个格式良好但应用失败的 patch 会告警（warning）并被跳过，依据[模式（pattern）](../basic/patterns/snapshots.md#当补丁无法应用时)。

## 安全考量

状态（state）事件（event）是对应用（application）状态（state）的远程写入。应用（application）必须（MUST）在依据从状态（state）中读出的内容行事之前校验它——渲染它、执行它、因它而授予任何东西——正如它会校验任何其他跨越信任边界的输入（input）那样。反过来，生产者（producer）不应（SHOULD NOT）把机密放进状态（state）：每次运行（run）它都要经由消费者（consumer）往返一次。
