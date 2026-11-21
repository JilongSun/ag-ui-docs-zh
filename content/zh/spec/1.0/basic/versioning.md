---
title: "版本管理与兼容性（versioning and compatibility）"
description: "与更旧的对端（peer）通信、什么可以被丢弃，以及何时丢失内容（content）需要附带告警（warning） — 1.0"
---

同一条流（stream）上的两方很少处于同一代。本页说明当二者不在同一代时，各自对对方负有什么。

## 默认（default）：新增是安全的

协议（protocol）靠新增来生长——新的事件（event）类型、新的可选（optional）字段（field）、开放联合（open union）的新成员。每一项这样的新增都必须（MUST）对更旧的一方是安全的，因为[未被识别的素材（material）会存活，而不是中止运行（run）](processing.md)。

由此推出，生产者（producer）不得（MUST NOT）把协议（protocol）已有描述位置的东西只放在某个新增里。具体而言：运行（run）的结果（outcome）、消息（message）的内容（content）、工具调用（tool call）的身份（identity）以及某次调用的结果（result），必须（MUST）在 schema 为它们描述的字段（field）中传递，绝不能只放在某个新的事件（event）类型或某个旧版消费者（consumer）会丢弃（drop）的新属性（property）里。

## 降级（downgrade）

知道对端（peer）更旧的一方可以（MAY）把流（stream）翻译成对端（peer）能理解的形状。降级（downgrade）会移除或重塑已有的内容；它不得（MUST NOT）凭空发明含义。为旧版 schema 要求的必需（required）字段（field）提供空值——在内容（content）如今缺席之处给出空字符串——属于重塑，是允许的。提供生产者（producer）从未发送过的非空值则是凭空发明含义，是被禁止的。

降级（downgrade）不得（MUST NOT）在途经时修复（repair）畸形（malformed）的取值。已知字段（field）携带 schema 拒绝的取值是致命的，把它变成某种可接受形式的兼容垫片（shim）挡住了本会被报告的缺陷（defect）。

降级（downgrade）分为两类，其差别决定是否需要告知任何人。

**无损（lossless）。** 被移除的素材（material）没有增添任何更旧一方本可据以行动的内容。对一个没有子 Agent（subagent）概念的对端（peer）剥离（strip）`subagentRunId` 在这个意义上就是无损的：事件（event）照旧到达，只是被压平成一条线程（thread）。无损的降级（downgrade）可以（MAY）静默进行。

**有损（lossy）。** 承载含义的内容（content）被丢弃或降级。移除某个生命周期事件（lifecycle event）、丢弃对端（peer）无法表示的内容片段（content part），或把结构化取值塌缩成更弱的形式，都会丢失读者本会看到的东西。有损的降级（downgrade）必须（MUST）发出告警（warning），指明丢失了什么以及为何丢失。

该告警（warning）是给开发者（developer）的，不是给终端用户的。它必须（MUST）指明被丢弃的形状，并应当（SHOULD）说明升级到什么才能消除它。实现（implementation）可以（MAY）提供关闭这些告警（warning）的办法，但不得（MUST NOT）默认关闭它们。

## 已退役形状（retired shape）

协议（protocol）曾经描述、如今不再描述的形状就是*已退役（retired）*的。退役不是删除：更旧的生产者（producer）仍在发送它，而简单丢弃（drop）它的消费者（consumer）会破坏一个本来能工作的集成（integration）。

- 已退役形状（retired shape）必须（MUST）记录在弃用注册表（deprecation registry）中，连同它的替代物、翻译所在的位置，以及翻译本身何时到期。
- 消费者（consumer）应当（SHOULD）把已退役形状（retired shape）翻译成它的替代物，而不是丢弃（drop）它。
- 该翻译必须（MUST）作为中间件（middleware）运行——在执行（enforcement）之前——因为执行（enforcement）是依据当前协议（protocol）判定的，而在当前协议（protocol）中，该已退役形状（retired shape）纯属未被识别。
- 在此过程中丢失内容（content）的翻译必须（MUST）按上面的规则发出告警（warning）。

一旦已退役形状（retired shape）的到期时间过去，实现（implementation）可以（MAY）移除该翻译，此后该形状就像其他任何东西一样属于未被识别。

## 版本协商（version negotiation）

版本（version）以带内（in-band）方式传输，搭载在开启交互（exchange）每一侧的那两条消息（message）上，这样被记录下来的交互（exchange）始终自我描述，也不需要任何传输（transport）来承载它：

- 消费者（consumer）在 [`RunAgentInput.protocolVersion`](run-input.md#protocolversion) 上声明自己所说的协议版本（protocol version）。
- 生产者（producer）在 `RUN_STARTED.protocolVersion` 上声明*它*所说的版本（version）——是它自己的版本（version），绝不是对输入的回显。这两处声明就是协商（negotiation）的全部：每一方只说明自己一次，消费者（consumer）在降级（downgrade）发生的那一刻就能看到。
- 这两个字段（field）在 schema 中都是可选（optional）的，因为缺席本身有含义：对端（peer）来自协议（protocol）携带版本（version）之前。实现本版本（version）的实现（implementation）必须（MUST）发送自己的声明（declaration），除非消费者（consumer）知道自己的对端（peer）早于该字段（field），于是省略它，而不是把一个未知的输入成员交给旧解析器（parser）。
- 取值是本规范（specification）发布的版本标识符（version identifier）——即某个已冻结（frozen）版本（version）所处的区段，`MAJOR.MINOR`，按数字逐段比较（因此 `1.10` 比 `1.9` 更新）。一方无法解释的声明（declaration）按更新的声明（declaration）处理：继续，并应当（SHOULD）发出告警（warning）。
- 生产者（producer）遇到**它所实现的主线（line）的更新次版本（minor）**时，必须（MUST）服务这次运行（run）——按上面的规则，新增是安全的——以自己的版本（version）作答，并应当（SHOULD）发出告警（warning）。它只可以对来自它未实现的主线（major line）的声明（declaration），在 `RUN_STARTED` 之前予以拒绝；同一主线（line）的更新次版本（minor）在构造上就是可服务的，不得（MUST NOT）因其版本（version）而被拒绝。消费者（consumer）遇到更新的生产者（producer）声明（declaration）时，按[处理模型（processing model）](processing.md)继续，并应当（SHOULD）发出告警（warning）。
- 声明（declaration）命名的是该次运行（run）的流（stream）*说*的是什么，而不是谁在转发它：原样转发某次运行（run）的代理（proxy）声明原始生产者（producer）所说的版本（version），而做了翻译的代理（proxy）声明它自己发出的版本（version）。在[承载多次运行（run）的流（stream）](../events/lifecycle.md#一条流stream上的多次运行run)上，每次运行（run）的 `RUN_STARTED` 声明它自己那次运行（run），这正是混合年代历史的重放（replay）得以忠实的方式；实时生成运行（run）的生产者（producer）不会在流（stream）中途改变自己所说的版本（version）。
- 传输（transport）可以（MAY）把该声明（declaration）镜像进自己的信封（envelope）——比如某个媒体类型参数（media-type parameter）——供无法读取正文（body）的中间方（intermediaries）使用。带内（in-band）字段（field）才是权威；做镜像的绑定（binding）自行定义不匹配时如何处理。

当一方知道对方的版本（version）时——无论是带内（in-band）声明的还是配置的——它可以（MAY）据此选择降级（downgrade）。不知道时，它必须（MUST）把对端（peer）当作当前版本来行事：向下猜测只会毫无理由地降级（degrade）流（stream）。

按版本（version）选定的降级（downgrade）必须（MUST）是对流（stream）的纯粹变换。它不得（MUST NOT）改变运行（run）的结果（outcome）、改动标识符（identifier）或重排事件（event）。

## 生产者（producer）负有什么

- 在 `RUN_STARTED` 上声明自己所说的协议版本（protocol version）。
- 只发出当前协议（protocol）描述的形状。
- 省略没有取值的可选（optional）字段（field），而不是发送 `null`。
- 绝不依赖消费者（consumer）理解某项新增。

## 消费者（consumer）负有什么

- 在运行输入（run input）上声明自己所说的协议版本（protocol version），对已知早于该字段（field）的对端（peer）除外。
- 在未被识别的事件（event）、属性（property）与联合（union）成员面前存活；在畸形（malformed）的已知取值上失败。
- 在执行（enforcement）之前运行中间件（middleware），在应用代码（application code）之前执行（enforcement）。
- 翻译丢失内容（content）时发出告警（warning）。
- 绝不把执行（enforcement）本会移除的素材（material）呈现给应用代码（application code）。
