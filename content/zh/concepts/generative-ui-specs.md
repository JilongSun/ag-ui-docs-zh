---
title: "生成式 UI"
description: "理解 AG-UI 与生成式 UI规范之间的关系"
---

## **AG-UI 与生成式 UI规范**

最近发布的若干规范使 Agent 能够返回生成式 UI，从而提升了 Agent&lt;-&gt;User 对话的能力（capability）与灵活性。

A2UI、MCP-UI 与 Open-JSON-UI 都是**生成式 UI规范。** 生成式 UI让 Agent 不仅能以文本、还能以动态 UI 组件来响应用户。

| **规范** | **来源 / 维护者** | **用途** |
| --- | --- | --- |
| **A2UI** | Google | 一种声明式、对 LLM 友好的生成式 UI规范。基于 JSONL 且支持流式，为平台无关的渲染而设计。 |
| **Open-JSON-UI** | OpenAI | 对 OpenAI 内部声明式生成式 UI schema 的开放标准化。 |
| **MCP-UI** | Microsoft + Shopify | 一个完全开放的、基于 iframe 的生成式 UI标准，扩展 MCP 以支持面向用户的体验。 |

尽管名称相似，**AG-UI 并不是一种生成式 UI规范**——它是一种**用户交互协议**，在 Agent 与应用之间提供**双向的运行（run）时连接**。

AG-UI 原生支持上述所有生成式 UI规范，同时也允许开发者定义**自己的生成式 UI标准**。
