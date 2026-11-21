---
title: "schema 文件"
description: "机器可读的 schema、它的地址，以及如何使用它 — 1.0"
---

schema 对结构具有权威性：哪些字段（field）存在、哪些是必需（required）、每个字段（field）携带什么类型，以及判别字段（discriminator）可以取哪些值。本页告诉你去哪里取它。

## 该文件

- **[schema.json](https://docs.ag-ui.com/spec/1.0/schema.json)** — 完整的 1.0 schema —— 每一个事件（event）、消息（message），以及运行输入（run input）。

```
https://ag-ui.com/spec/1.0/schema.json
```

该文件在自己的 `$id` 中声明了这一地址，因此遵循引用的校验器（validator）无需配置即可针对它解析引用。该地址直接提供该文件：工具与 schema 之间没有任何重定向，而且响应带有跨源头，因此基于浏览器的工具也能读取它。

它是 [JSON Schema draft 2020-12](https://json-schema.org/draft/2020-12/release-notes)。每个定义都可通过锚点（anchor）到达 —— `#TextMessageStartEvent`、`#RunAgentInput` —— 因此工具可以直接定位一种形状，而无需切分文件。

## 使用它

```bash
curl -sS https://ag-ui.com/spec/1.0/schema.json -o ag-ui-1.0.json
```

针对整个 schema 校验一个事件（event），让判别字段（discriminator）挑选成员；或者在你已经知道形状时，针对单个锚点（anchor）校验。

schema 在协议（protocol）严格之处也严格：它会封闭自己固定了形状的对象，因此针对它运行的校验器（validator）会拒绝协议（protocol）未描述的材料。按设计开放的对象（open object）保持开放 —— `metadata` 与 JSON Patch 操作就在其中 —— 因为协议（protocol）会携带消费者（consumer）放在那里的任何东西。这种严格性是供编写与测试使用的。*运行时*的消费者（consumer）做法恰恰相反 —— 它接受不被识别的材料并将其剥离（strip），这是[处理模型](basic/processing.md)的要求。不要把严格的 schema 接入接收路径，然后把结果称为一致性（conformance）。

## schema 不说什么

顺序、生命周期（lifecycle）、归属（attribution）、错误处理与兼容性（compatibility）都是行为性的，任何 JSON Schema 都无法表达它们。它们在本文档的其他页面中规定，从[概述](index.md)开始。
