---
title: "原始事件与自定义事件（raw and custom events）"
description: "两个逃生通道，以及阻止它们变成第二个协议（protocol）的限制 —— 1.0"
---

有两种事件（event）类型承载协议（protocol）没有建模的东西：`RAW`，一个未经翻译直通的原生提供方（provider）事件（event）；以及 `CUSTOM`，应用（application）自己的事件（event）。两者都是独立的——它们不开启也不关闭任何属于自己的项，且可以（MAY）出现在一次已打开运行（run）内的任何位置，不过 `CUSTOM` 与 `RAW` 不同，它确实会在自己的通道内结束一条已打开的[分片流（chunk stream）](../basic/patterns/streaming.md#关闭分块chunk流stream)。它们的限制正是关键所在：本页的一切，都是为了让这些逃生通道无法悄悄变成第二个协议（protocol）。

## `RAW`

把原生提供方（provider）事件（event）未经翻译地直通，供需要协议（protocol）未建模细节的消费者（consumer）使用。

```json
{
  "type": "RAW",
  "event": { "…the provider's own event…": true },
  "source": "openai"
}
```

- `event` 是必需（REQUIRED）的，可以是任何 JSON 值；`source` 是可选（OPTIONAL）的，指明它来自哪个提供方（provider）或框架。
- 消费者（consumer）不得（MUST NOT）从 `RAW` 事件（event）推导协议（protocol）行为：其中没有任何东西会开启、关闭或修改本规范（specification）跟踪的任何东西。
- 生产者（producer）应当（SHOULD）把 `RAW` 与标准事件（event）一同发出，而绝不取而代之。一个*只*用 `RAW` 表达某事物的生产者（producer），并没有把它放进协议（protocol）。

同一份载荷也作为普通事件（event）上的 `rawEvent` 字段传输——那种写法把来源（provenance）附加到一个已翻译的事件（event）上，而 `RAW` 承载的是没有已翻译事件（event）与之对应的材料。

## `CUSTOM`

协议（protocol）为应用（application）自有事件（event）提供的扩展点。

```json
{
  "type": "CUSTOM",
  "name": "com.example.cart-updated",
  "value": { "items": 3 }
}
```

- `name` 与 `value` 是必需（REQUIRED）的——没有名称，消费者（consumer）无法路由该值；而没有载荷的事件（event）什么也说明不了。
- 不认识某个 `name` 的消费者（consumer）必须（MUST）忽略该事件（event）。这是协议（protocol）允许的流量，而不是[未识别材料（unrecognised material）](../basic/processing.md)：不剥离（strip）任何东西，也不产生任何告警（warning）。
- 名称属于应用（application）空间。生产者（producer）应当（SHOULD）给自己发明的名称加上厂商或应用（application）标识符前缀，这样两个扩展同一条流（stream）的参与方不会撞名；不带前缀的名称保留给协议（protocol）自身将来使用。
- 消费者（consumer）对已识别的 `CUSTOM` 事件（event）所做的任何事都在协议（protocol）之外。生产者（producer）不得（MUST NOT）依赖 `CUSTOM` 事件（event）来承载本规范（specification）指派给标准事件（event）的语义——一个符合规范（conformance）的消费者（consumer）被允许忽略的自定义「消息（message）」，并不是一条消息（message）。

## 数据类型

[`RawEvent`](../schema.md#rawevent) 与 [`CustomEvent`](../schema.md#customevent) 由 [schema 参考](../schema.md)定义。

## 安全考量

透传（passthrough）内容按定义就是没有经过校验的：没有任何 schema 约束 `event` 或 `value`，而 `RAW` 载荷来源于提供方（provider）取得它们的任何地方。消费者（consumer）必须（MUST）把两者都当作不受信任的输入（input）——绝不作为标记渲染、绝不执行、绝不授予权威——并且应当（SHOULD）以审视它所概括的网络流量时同样的怀疑态度，对待 `RAW` 载荷。
