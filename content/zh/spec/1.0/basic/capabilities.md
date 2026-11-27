---
title: "能力（capability）"
description: "Agent 在运行（run）前对自身的声明、一项声明所附带的义务，以及它不附带什么 — 1.0"
---

一次运行（run）向消费者（consumer）展示某个 Agent *做了什么*。能力（capability）让消费者在要求 Agent 做事之前先了解它*能做什么*：它是否流式输出推理（reasoning）、是否会为批准而暂停、接受哪些模态、可以委派给哪些子 Agent（subagent）。应用用它们来塑造自己提供的界面——只在接受文件的地方显示文件选择器，只在支持中断（interrupt）的地方提供批准入口——而不是靠试错去发现支持情况。

[schema](../schema.md#agentcapabilities) 定义其形状：`AgentCapabilities`，一组可选（OPTIONAL）的分组，每个分组是一个由可选（OPTIONAL）字段构成的对象。本页说明一项声明附带什么义务。它刻意不规定消费者如何*获得*声明——参见[获取](#获取)。

## 声明

每个分组，以及分组内的每个字段，都是可选（OPTIONAL）的。生产者（producer）声明自己有话要说的部分，省略其余部分。字段引用的记录保留各自的必需（required）项：一个 `SubagentInfo` 需要它的 `name`，而 `tools.items` 中的一个条目是一个 `Tool`。

**被省略的字段意味着未声明，而不是不支持。** 对 `reasoning` 一字未提的 Agent 并没有说自己不能推理；消费者不得（MUST NOT）从某项能力的声明缺席推断出该能力不存在。Agent 若想表明某项内容*不*受支持，那些布尔字段正是用来显式携带 `false` 的。

生产者应当（SHOULD）只声明它确实做到的事。声明是向应用说明如何为一次运行做准备；Agent 不兑现的声明会误导建立在它之上的界面。并没有义务把所有为真的事情都声明出来——最小化的声明也是符合一致性（conformance）的——但已声明的内容应当（SHOULD）成立。

声明是资料性的，不具有约束力。事件流才是权威：消费者不得（MUST NOT）因为某个声明未曾预见的事件（event）到达，或因为某项已声明的能力未被行使，就拒绝一条流或把一次运行当作失败。在 `reasoning: { supported: false }` 之下仍发出推理事件的运行，其生产者值得抱怨，但这条流不值得拒绝。

## 分组

各分组划分了协议的功能。若某个分组描述的是某个事件族（event family），则该事件族的页面约束这些事件本身附带什么义务；声明只是对它们作出预期。

| 分组 | 声明什么 | 受谁约束 |
| --- | --- | --- |
| `identity` | 名称、框架、版本、提供方、文档，以及一个开放的 `metadata` 对象 | 本页 |
| `transport` | Agent 提供哪些[传输绑定](transports/index.md) | [传输（transport）](transports/index.md) |
| `tools` | Agent 是否调用工具、它*提供*哪些工具，以及它是否接受应用的工具 | [工具调用（tool call）](../events/tool-calls.md) |
| `output` | 结构化输出与可产出的 MIME 类型 | — |
| `state` | 快照（snapshot）、增量（delta）、跨运行的持久化、长期记忆 | [状态（state）](../events/state.md) |
| `multiAgent` | 委派、移交，以及它可以调用的 `subagents` | [子 Agent](../events/subagents.md) |
| `reasoning` | 推理是被发出、被流式输出，还是被加密 | [推理](../events/reasoning.md) |
| `multimodal` | 作为 `input` 接受、作为 `output` 产出的模态 | `input` 见[运行输入（run input）](run-input.md#messages)；`output` 见下文说明 |
| `execution` | 代码执行、沙箱、迭代与时间限制 | — |
| `humanInTheLoop` | 批准、干预、反馈，以及参与中断–恢复（interrupt–resume） | [中断与恢复（interrupt、resume）](patterns/interrupt-resume.md) |
| `custom` | 标准分组未覆盖的任何内容 | — |

有些字段值得在 schema 中的描述之外再作说明。

`output.structuredOutput` 声明 Agent 能让自己的答案符合某个 schema，但本版本的协议既没有供消费者提供 schema 的字段，也没有把输出标识为结构化的那个事件。该声明告诉应用 Agent 具备这项能力；schema 如何到达 Agent、塑形后的答案如何返回，都属于集成特定的实现细节，消费者不得（MUST NOT）期望任何标准事件携带其中任何一项。

`multimodal.output` 声明 Agent *能产出*什么，但本版本的协议没有定义任何图像或音频输出：助手消息的内容与 `TEXT_MESSAGE_CONTENT` 增量都是文本。该声明是给应用看的——应用可能通过集成特定通道收到这类输出——本规范不规定它如何传输。消费者不得（MUST NOT）期望某个标准事件携带它。

`tools.items` 列出*Agent* 提供的工具——它自己的函数、搜索、代码执行——与 `RunAgentInput.tools` 不同，后者携带的是*应用*为某一次运行提供的工具。二者从不合并：Agent 自己的工具不是供应用执行的，而应用的工具也不在这里声明。

`multiAgent.subagents` 为选择界面命名 Agent 可以调用的子 Agent。它是一份定义清单，而不是调用清单：消费者在线上（wire）遇到的标识符是 `subagentRunId` 取值，每次调用一个，在运行时铸造——[子 Agent](../events/subagents.md)约束它们，本页没有任何内容能预测它们。

`transport` 的两个标志同样描述了本版本未定义的机制。`transport.resumable` 说的是按序号恢复（resume）一条被中断的流，`transport.pushNotifications` 说的是运行结束之后的投递；[HTTP 绑定（binding）](transports/index.md)既不携带序号，也不恢复流，更不定义运行之后的通道。Agent 可以（MAY）为自己的一种传输声明它们；消费者不得（MUST NOT）期望任何一个标准绑定兑现它们。

## `identity.metadata` 与 `custom`

两个开放对象承载标准字段装不下的内容。`identity.metadata` 是协议的[元数据（metadata）](metadata.md)形状——按键开放、键下可放任意 JSON 值——用于集成特定的身份信息。`custom` 是容纳不符合任何标准分组的能力的逃生通道。二者都按键开放：消费者必须（MUST）保留其中自己不认识的内容，而不是剥离它们，与别处的元数据完全一样。协议对二者都不附加含义。

## 获取

本规范定义声明的形状及其附带义务。它不定义消费者如何获得声明。本版本中没有任何传输绑定承载能力交换，本页也不会创造一种：Agent 的能力是从客户端（client）侧 Agent 对象的某个方法读取、从应用定义的端点获取，还是静态配置，都属实现的事。

这是刻意为之。发现协议是比声明形状更大的承诺，而该形状即便没有它也有用。以任何方式暴露能力的实现必须（MUST）为这些能力使用该形状。

## 错误处理

能力对象不由事件管道承载，因此[处理模型](processing.md)的剥离义务不适用于它；但该模型在*未被识别*与*畸形*之间所作的区分适用。未被识别的成员——本版本未定义的分组或字段——属于严格层的关切，而不是消费者的：schema 封闭了每个能力对象，所以这样的文档无法通过它的校验，但消费者不得（MUST NOT）因为声明携带了这些成员就拒绝它，这样更新版 Agent 的声明就不会在旧版消费者那里被弹回。能力不经过事件管道的执行阶段，因此消费者保留还是丢弃未被识别的成员，属实现的事，符合一致性的各实现在这一点上并不相同。某个已知字段携带了 schema 拒绝的取值——布尔该在的地方给了字符串——就是畸形的，消费者不得（MUST NOT）使用自己无法校验的声明。

由于声明是资料性的，被拒绝或缺席的声明不得（MUST NOT）妨碍运行。无法获得或校验某个 Agent 能力的消费者，按对待未作任何声明的 Agent 的方式来处理。
