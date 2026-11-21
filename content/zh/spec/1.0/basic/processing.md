---
title: "处理模型（processing model）"
description: "什么能存活、什么是致命的，以及中间件（middleware）相对执行（enforcement）处于何处 — 1.0"
---

有两样东西表面上相似，却绝不能被混淆：协议（protocol）未描述的素材（material），以及协议（protocol）确实描述了某个东西、但取值是错的。前者是协议（protocol）生长的方式。后者是一个 bug。

## 规则（rule）

**未被识别的素材（material）不是错误。畸形（malformed）的已知取值才是。**

- 类型为本实现（implementation）所不识别的事件（event）不得（MUST NOT）中止运行（run）。
- 某事件（event）上未描述的属性（property）不得（MUST NOT）中止运行（run）。
- 实现（implementation）不认识的联合（union）成员——一种新类型的内容片段（content part）、在其发布（release）之后才命名的一个结果（outcome）——不得（MUST NOT）中止运行（run）。
- 协议（protocol）*确实*描述的字段（field）若携带 schema 拒绝的取值，必须（MUST）是致命的：消费者（consumer）必须（MUST）让运行（run）失败，而不是修复（repair）、强制转换（coerce）或忽略（ignore）该取值。

这种不对称是刻意的。某个事件（event）类型在实现（implementation）发布（release）之后才加入，这是可以预期的——发送方更新，旧的一方没有依据说它无效。但 `messageId` 里装着一个数字并不是更新的协议（protocol）；那是一个缺陷（defect），悄悄把它强制转换（coerce）掉的消费者（consumer）会把该缺陷（defect）藏起来，直到它以更难诊断的形式浮现。

## 每种传输（transport）给出相同的答案

这些规则约束的是协议（protocol），而不是某种线上格式（wire format）。支持不止一种传输（transport）的消费者（consumer）必须（MUST）对同一个事件（event）作出相同的判定，无论它是怎么到达的：一条流（stream）若作为 JSON 能存活，作为 protobuf 也必须（MUST）能存活；若失败，也必须（MUST）以同样的方式失败——除非二进制编码本身无法表达判定所依赖的那点差异，也就是本页下文提到的两种情形（无法命名的信封（envelope）变体，以及 protobuf 会实体化出来的那些缺席）。

这就为读取器（reader）能自行决定的事情划定了界限。把字节变成事件（event）是读取器（reader）的全部职责——某个帧（frame）的字节完全映射不到任何事件（event）就是解码失败（decode failure），这个判断确实属于读取器（reader）。而一个成功读出的事件（event）是否携带实现（implementation）认得的东西，则不属于它：那个问题属于每种传输（transport）共享的那一个阶段（stage）。同时也做校验（validate）的读取器（reader）会让自己的传输（transport）比其他传输（transport）严格（strict）得多，于是生产者（producer）对内容类型（content type）的选择就决定了某次运行（run）能否存活。

二进制情形需要一处迁就。文本读取器（reader）可以把一个未知类型的事件（event）传递下去，因为类型是以字符串传输的，共享阶段（stage）可以按名称丢弃（drop）它。二进制读取器（reader）做不到：一个它未曾针对编译过的信封（envelope）变体不携带任何可以传递下去的名称。这样的帧（frame）必须（MUST）被丢弃（drop），并给出告警（warning），而不是让运行（run）失败——这正是共享阶段（stage）本该给出的答案，只是改用了一种无法推迟该问题的传输（transport）的措辞。

> [!NOTE]
> 只要二进制编码给某个字段（field）不留存在性（presence），它就无法兑现这一点。在 protobuf 中，这同时涵盖必需（required）的标量（scalar）与必需（required）的数组（array）：生产者（producer）省略的必需（required）字符串会以空字符串到达，必需（required）数组会以空数组到达，而二者都会被接受，同一事件（event）以 JSON 形式出现时却会被当作畸形（malformed）拒绝。schema 本就禁止省略它们，所以这改变的是一个有缺陷的生产者（producer）如何被诊断，而不是一个符合一致性（conformance）的生产者（producer）可以发送什么。

## 消费者（consumer）如何处理未被识别的素材（material）

向应用代码（application code）暴露事件（event）的消费者（consumer）不得（MUST NOT）把未被识别的素材（material）当作协议（protocol）描述过的内容投递出去。读入这类素材（material）之后，这样的消费者（consumer）必须（MUST）做以下之一：

- **丢弃（drop）它**，如果整个事件（event）都是未被识别的类型。消费者（consumer）应当（SHOULD）发出指明该类型的告警（warning）。
- **剥离（strip）它**，如果它是某个本来有效的事件（event）上的未知属性（property）或未被识别的联合（union）成员。消费者（consumer）应当（SHOULD）发出指明被移除路径（path）的告警（warning）。

消费者（consumer）不得（MUST NOT）让被剥离（strip）的属性（property）残留在应用代码（application code）收到的值里，也不得（MUST NOT）让被丢弃（drop）的事件（event）到达那里。

这只在 schema 封闭（close）对象（object）的地方适用，而凡是它描述协议（protocol）自有对象（object）之处，都是封闭的。在 schema 刻意让对象（object）保持开放的地方，它未描述的成员根本不是未被识别的素材（material），必须（MUST）保留。JSON Patch 操作（operation）就是这种情形：RFC 6902 第 4 节要求操作忽略它未定义的成员，而不是拒绝它们，因此一个多带了 `value` 的 `remove` 仍是合法的补丁（patch），并会完整到达。在那里做剥离（strip）的消费者（consumer）删掉的是一致（conformant）的数据，它发出的告警（warning）毫无所指。

这条约束的是管道（pipeline），不是解析器（parser）。只解析事件（event）的库层（library layer）——比如各 SDK 中生成的模型（model）——会刻意保留未知属性（property），好让它上方的中间件（middleware）仍能看到它们。提供这种解析器（parser）却没有执行（enforcement）阶段的 SDK 尚未满足这条规则；目前是 Python 与 .NET，它们的模型（model）以宽容（lenient）方式解析，没有任何在应用代码（application code）之前执行剥离（strip）的阶段（stage）。

> [!NOTE]
> 有一种情形参考实现（reference implementation）尚未满足：schema 为封闭字符串取值集合的字段（field）——例如消息（message）的 `role`——是作为叶节点（leaf）检查的，因此那里未被识别的取值是致命的，而不是被剥离（strip）。.NET 的转换器（converter）也以同样方式拒绝未知的角色或结果（outcome）。上面的规则才是协议（protocol）的要求；这两者都是相对该规则的缺口（gap），而不是对它的一种软化。

剥离（strip）会一路向下，它移除什么取决于无法识别的取值位于何处：

- 位于**可选（optional）**位置时，该字段（field）被移除，它周围的一切都保留下来。
- 位于**必需（required）**位置时，改为移除*包含*它的那个值。若某个媒体片段（media part）的来源（source）是本实现（implementation）从未听说过的类型，该片段（part）会被整体移除——留下一个没有来源（source）的片段（part）会给校验器（validator）交出它必须视为畸形（malformed）的东西，把一个新增变成致命错误。
- 位于**列表（list）**内部时，无法识别的元素被丢弃（drop），列表本身保留。

## 中间件（middleware）处于何处

中间件（middleware）——消费者（consumer）为翻译、观察或改写流（stream）而安装的任何东西——必须（MUST）在执行（enforcement）之前运行，而执行（enforcement）必须（MUST）在校验（verification）之前、在应用代码（application code）看到任何内容之前运行。

```
producer → compatibility boundary → middleware → enforcement
         → chunk expansion → verification → application
```

兼容边界（compatibility boundary）是针对协议（protocol）已退役形状（retired shape）的常开翻译器。它必须（MUST）最先看到流（stream），因为已退役形状（retired shape）可能就是一个 chunk，而更早遇到它的阶段（stage）要么会在它上面失败，要么会把它变成该边界（boundary）再也认不出的东西。中间件*链*（chain）可以（MAY）在自己的各阶段（stage）之间展开（expand）chunk，好让每个阶段（stage）都收到 start/content/end 形式——参考实现（reference implementation）的链式辅助工具（chaining helper）正是这么做的。因此中间件（middleware）必须（MUST）对两种形式都有准备：它看到什么取决于它在链（chain）中的位置。

阶段（stage）之间的展开（expansion）会收窄一项保证，而这种收窄是明说的，不是隐藏的：展开（expansion）合成（synthesize）的事件（event）只携带协议（protocol）定义的内容，因此 *chunk 上*未被识别的字段（field）只有在上述规范顺序（canonical order）下才能存活到执行（enforcement）——并挣得它的告警（warning）。过早展开的链（chain）会静默地丢失它们。符合一致性（conformance）的生产者（producer）从不发出这类字段（field），所以丢失的是来自更新协议版本（protocol version）、穿越了一条过早展开的链（chain）的素材（material）。展开（expansion）本应负责投递的素材（material）——增量（delta）、开启字段（opener field）、元数据（metadata）、`rawEvent`、归属（attribution）——都完好无损地传递过去；chunk 的 `timestamp` 则不然，因为合成（synthesize）出来的事件（event）并不是那个 chunk，而且与未知字段（field）一样，只有在规范顺序（canonical order）下，它才会在展开（expansion）之前被判定。

chunk 本身就是一个事件（event），必须（MUST）被当作一个事件（event）来判定：无论哪个阶段（stage）先遇到畸形（malformed）的 chunk——在上述规范顺序（canonical order）下是执行（enforcement），在中间件链（middleware chain）提前展开（expand）之处是展开（expansion）——都必须（MUST）拒绝它而不是修复（repair）它，并且不得（MUST NOT）归一化（normalise）、填默认值或掩盖一个执行（enforcement）会拒绝的畸形（malformed）已知取值。用默认值替换畸形（malformed）角色的消费者（consumer），让同一个生产者（producer）缺陷（defect）在明文发送时是致命的、以 chunk 形式发送时却不可见，于是生产者（producer）恰好用了哪种形式，决定了它的 bug 是否曾被报告。

校验（verification）必须（MUST）在展开（expansion）之后运行，因为它检查的东西——消息（message）与调用（call）先开启、再继续、最后关闭——只有在 chunk 变成它所代表的事件（event）之后才存在。

这个顺序在两个方向上都是承重的：

- 中间件（middleware）必须（MUST）在执行（enforcement）移除素材（material）之前看到它。兼容垫片（shim）存在的意义正是翻译当前协议（protocol）未描述的某种形状；如果执行（enforcement）先剥离（strip）了那种形状，垫片（shim）收到的就是一个无可翻译的事件（event），而这次运行（run）会丢失无人能恢复的数据。
- 应用代码（application code）不得（MUST NOT）看到执行（enforcement）会移除的素材（material）。一旦各翻译器（translator）都有过机会，仍然未被识别的东西就是未被识别的，到此为止。

消费者（consumer）必须（MUST）在每一条为应用代码（application code）产生事件（event）的路径上应用这一顺序，包括重连（reconnect）与重放（replay）。跳过执行（enforcement）的路径是保证上的一个洞，而不是一种优化。

## 出站素材（outgoing material）

同一套边界（boundary）也适用于消费者（consumer）发送的内容。在传输（transmission）之前，消费者（consumer）必须（MUST）从运行输入（run input）中移除未被识别的素材（material），应当（SHOULD）就自己移除了什么发出告警（warning），并且必须（MUST）在任何内容发出之前把畸形（malformed）的已知字段（field）视为致命。

接收运行输入（run input）的生产者（producer）必须（MUST）对它应用同样的不对称性：未被识别的素材（material）不会让输入无效，畸形（malformed）的已知字段（field）则会。

## 生产者（producer）不得做什么

生产者（producer）不得（MUST NOT）抱着消费者（consumer）会忽略（ignore）它的期望，发出协议（protocol）未描述的事件（event）类型。未被识别的事件（event）得以存活，是为了让协议（protocol）能新增它们，而不是为了让生产者（producer）借流（stream）夹带私有信令；`CUSTOM` 与 `RAW` 正是为此而存在，并且由 schema 描述。
