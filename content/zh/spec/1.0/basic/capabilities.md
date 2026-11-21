---
title: "能力（capability）"
description: "Agent 在运行（run）前对自身的声明（declaration）、一项声明（declaration）所附带的义务，以及它不附带什么 — 1.0"
---

一次运行（run）向消费者（consumer）展示某个 Agent *做了什么*。能力（capability）让消费者（consumer）在要求 Agent 做事之前先了解它*能做什么*：它是否流式输出推理（reasoning）、是否会为批准（approval）而暂停、接受哪些模态（modality）、可以委派给哪些子 Agent（subagent）。应用（application）用它们来塑造自己提供的界面——只在接受文件的地方显示文件选择器，只在支持中断（interrupt）的地方提供批准（approval）入口——而不是靠试错去发现支持情况。

[schema](../schema.md#agentcapabilities) 定义其形状：`AgentCapabilities`，一组可选（OPTIONAL）的分组（group），每个分组（group）是一个由可选（OPTIONAL）字段（field）构成的对象（object）。本页说明一项声明（declaration）附带什么义务。它刻意不规定消费者（consumer）如何*获得*声明（declaration）——参见[获取（retrieval）](#获取retrieval)。

## 声明（declaration）

每个分组（group），以及分组（group）内的每个字段（field），都是可选（OPTIONAL）的。生产者（producer）声明自己有话要说的部分，省略其余部分。字段（field）引用的记录（record）保留各自的必需（required）项：一个 `SubagentInfo` 需要它的 `name`，而 `tools.items` 中的一个条目（entry）是一个 `Tool`。

**被省略的字段（field）意味着未声明（undeclared），而不是不支持。** 对 `reasoning` 一字未提的 Agent 并没有说自己不能推理（reason）；消费者（consumer）不得（MUST NOT）从某项能力（capability）的声明（declaration）缺席推断出该能力（capability）不存在。Agent 若想表明某项内容*不*受支持，那些布尔字段（boolean field）正是用来显式携带 `false` 的。

生产者（producer）应当（SHOULD）只声明它确实做到的事。声明（declaration）是向应用（application）说明如何为一次运行（run）做准备；Agent 不兑现的声明（declaration）会误导建立在它之上的界面。并没有义务把所有为真的事情都声明出来——最小化的声明（declaration）也是符合一致性（conformance）的——但已声明的内容应当（SHOULD）成立。

声明（declaration）是资料性（informative）的，不具有约束力。事件流（event stream）才是权威：消费者（consumer）不得（MUST NOT）因为某个声明（declaration）未曾预见的事件（event）到达，或因为某项已声明（declare）的能力（capability）未被行使，就拒绝一条流（stream）或把一次运行（run）当作失败。在 `reasoning: { supported: false }` 之下仍发出推理（reasoning）事件（event）的运行（run），其生产者（producer）值得抱怨，但这条流（stream）不值得拒绝。

## 分组（group）

各分组（group）划分了协议（protocol）的功能（feature）。若某个分组（group）描述的是某个事件族（event family），则该事件族（event family）的页面约束这些事件（event）本身附带什么义务；声明（declaration）只是对它们作出预期。

| 分组（group） | 声明（declaration）什么 | 受谁约束 |
| --- | --- | --- |
| `identity` | 名称、框架（framework）、版本（version）、提供方（provider）、文档，以及一个开放的 `metadata` 对象（object） | 本页 |
| `transport` | Agent 提供哪些[传输绑定（transport binding）](transports/index.md) | [传输（transport）](transports/index.md) |
| `tools` | Agent 是否调用工具、它*提供*哪些工具，以及它是否接受应用（application）的工具 | [工具调用（tool call）](../events/tool-calls.md) |
| `output` | 结构化输出（structured output）与可产出的 MIME 类型 | — |
| `state` | 快照（snapshot）、增量（delta）、跨运行（run）的持久化（persistence）、长期记忆 | [状态（state）](../events/state.md) |
| `multiAgent` | 委派（delegation）、移交（handoff），以及它可以调用的 `subagents` | [子 Agent（subagent）](../events/subagents.md) |
| `reasoning` | 推理（reasoning）是被发出、被流式输出，还是被加密 | [推理（reasoning）](../events/reasoning.md) |
| `multimodal` | 作为 `input` 接受、作为 `output` 产出的模态（modality） | `input` 见[运行输入（run input）](run-input.md#messages)；`output` 见下文说明 |
| `execution` | 代码执行（code execution）、沙箱（sandboxing）、迭代与时间限制 | — |
| `humanInTheLoop` | 批准（approval）、干预（intervention）、反馈（feedback），以及参与中断–恢复（interrupt–resume） | [中断与恢复（interrupt、resume）](patterns/interrupt-resume.md) |
| `custom` | 标准分组（group）未覆盖的任何内容 | — |

有些字段（field）值得在 schema 中的描述之外再作说明。

`output.structuredOutput` 声明 Agent 能让自己的答案符合某个 schema，但本版本（version）的协议（protocol）既没有供消费者（consumer）提供 schema 的字段（field），也没有把输出标识为结构化的那个事件（event）。该声明（declaration）告诉应用（application）Agent 具备这项能力；schema 如何到达 Agent、塑形后的答案如何返回，都属于集成特定（integration-specific）的实现细节，消费者（consumer）不得（MUST NOT）期望任何标准事件（standard event）携带其中任何一项。

`multimodal.output` 声明 Agent *能产出*什么，但本版本（version）的协议（protocol）没有定义任何图像或音频输出：助手消息（assistant message）的内容（content）与 `TEXT_MESSAGE_CONTENT` 增量（delta）都是文本。该声明（declaration）是给应用（application）看的——应用（application）可能通过集成特定（integration-specific）通道收到这类输出——本规范（specification）不规定它如何传输。消费者（consumer）不得（MUST NOT）期望某个标准事件（standard event）携带它。

`tools.items` 列出*Agent* 提供的工具——它自己的函数、搜索、代码执行——与 `RunAgentInput.tools` 不同，后者携带的是*应用（application）*为某一次运行（run）提供的工具。二者从不合并（merge）：Agent 自己的工具不是供应用（application）执行的，而应用（application）的工具也不在这里声明。

`multiAgent.subagents` 为选择界面（selection interface）命名 Agent 可以调用的子 Agent（subagent）。它是一份定义（definition）清单，而不是调用（invocation）清单：消费者（consumer）在线上格式（wire format）中遇到的标识符（identifier）是 `subagentRunId` 取值，每次调用（invocation）一个，在运行（run）时铸造——[子 Agent（subagent）](../events/subagents.md)约束它们，本页没有任何内容能预测它们。

`transport` 的两个标志（flag）同样描述了本版本（version）未定义的机制。`transport.resumable` 说的是按序号（sequence number）恢复（resume）一条被中断的流（stream），`transport.pushNotifications` 说的是运行（run）结束之后的投递；[HTTP 绑定（binding）](transports/index.md)既不携带序号（sequence number），也不恢复（resume）流（stream），更不定义运行（run）之后的通道。Agent 可以（MAY）为自己的一种传输（transport）声明它们；消费者（consumer）不得（MUST NOT）期望任何一个标准绑定（binding）兑现它们。

## `identity.metadata` 与 `custom`

两个开放对象（open object）承载标准字段（standard field）装不下的内容。`identity.metadata` 是协议（protocol）的[元数据（metadata）](metadata.md)形状——按键（key）开放、键（key）下可放任意 JSON 值——用于集成特定（integration-specific）的身份信息（identity information）。`custom` 是容纳不符合任何标准分组（group）的能力（capability）的逃生通道（escape hatch）。二者都按键（key）开放：消费者（consumer）必须（MUST）保留其中自己不认识的内容，而不是剥离（strip）它们，与别处的元数据（metadata）完全一样。协议（protocol）对二者都不附加含义。

## 获取（retrieval）

本规范（specification）定义声明（declaration）的形状及其附带义务。它不定义消费者（consumer）如何获得声明（declaration）。本版本（version）中没有任何传输绑定（transport binding）承载能力交换（capabilities exchange），本页也不会创造一种：Agent 的能力（capability）是从客户端（client）侧 Agent 对象（object）的某个方法读取、从应用（application）定义的端点（endpoint）获取，还是静态配置，都属实现（implementation）的事。

这是刻意为之。发现协议（discovery protocol）是比声明（declaration）形状更大的承诺，而该形状即便没有它也有用。以任何方式暴露能力（capability）的实现（implementation）必须（MUST）为这些能力（capability）使用该形状。

## 错误处理（error handling）

能力（capability）对象（object）不由事件管道（event pipeline）承载，因此[处理模型（processing model）](processing.md)的剥离（strip）义务不适用于它；但该模型在*未被识别*与*畸形（malformed）*之间所作的区分适用。未被识别的成员——本版本（version）未定义的分组（group）或字段（field）——属于严格（strict）层的关切，而不是消费者（consumer）的：schema 封闭（close）了每个能力（capability）对象（object），所以这样的文档无法通过它的校验（validation），但消费者（consumer）不得（MUST NOT）因为声明（declaration）携带了这些成员就拒绝它，这样更新版 Agent 的声明（declaration）就不会在旧版消费者（consumer）那里被弹回。能力（capability）不经过事件管道（event pipeline）的执行（enforcement）阶段，因此消费者（consumer）保留还是丢弃未被识别的成员，属实现（implementation）的事，符合一致性（conformance）的各实现在这一点上并不相同。某个已知字段（field）携带了 schema 拒绝的取值——布尔该在的地方给了字符串——就是畸形（malformed）的，消费者（consumer）不得（MUST NOT）使用自己无法校验（validate）的声明（declaration）。

由于声明（declaration）是资料性（informative）的，被拒绝或缺席的声明（declaration）不得（MUST NOT）妨碍运行（run）。无法获得或校验（validate）某个 Agent 能力（capability）的消费者（consumer），按对待未作任何声明（declaration）的 Agent 的方式来处理。
