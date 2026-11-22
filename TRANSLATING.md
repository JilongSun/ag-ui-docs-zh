# 翻译规范

本仓库是 [ag-ui-protocol/ag-ui](https://github.com/ag-ui-protocol/ag-ui) 文档的简体中文译本。译文属于**资料性**翻译：出现歧义时，以英文原文为准。

## 一、范围

只翻译两处，其余一律不译：

| 上游路径 | 本文路径 | 说明 |
| --- | --- | --- |
| `docs/concepts/*.mdx` | `content/zh/concepts/*.md` | 概念说明，持续更新 |
| `docs/spec/1.0/**/*.mdx` | `content/zh/spec/1.0/**/*.md` | 1.0 规范（已冻结） |

`docs/spec/draft/` 是 1.1 的工作区，**不译**；等它冻结成 1.1 再整批翻译。

文件名与目录结构必须与上游一致，只把扩展名 `.mdx` 换成 `.md`。这个一一对应关系是 CI 结构校验的基础，不要改名、不要合并、不要新增页面。

## 二、忠实度

1. **不增、不删、不改写**。不加译者注、不加总结、不合并段落、不省略示例。
2. **结构逐项对齐**：标题的层级与顺序、代码围栏的数量与语言标记、表格行数、列表项数、段落数，都必须与原文一致。行数不必一致——英文按 80 列硬换行，中文段落单行成段即可。
3. 原文的强调标记按原位保留：`code`、**bold**、*italic*、链接。

## 三、术语

1. 术语以 [glossary.md](./glossary.md) 为准。
2. 每处出现都标注原文，形式为「中文（原文）」，括号用全角：

   > 状态（state）在运行（run）生命周期（lifecycle）内累积。

   同一句内重复出现同样标注，不省略。
3. 注释里写「不译」的词（`agent`、`schema`、`JSON Patch`、`SSE`、`Protobuf` 等）保持英文原样，不加中文标注。
4. 协议标识符**永不翻译**：事件名（`RUN_STARTED`）、字段名（`subagentRunId`）、类型名（`TextMessageContentEvent`）、JSON 键、枚举值、包名、URL。
5. RFC 2119 / BCP 14 关键词按下表处理，并且每处都标注原文：

   | 原文 | 译文 |
   | --- | --- |
   | MUST / MUST NOT | 必须（MUST）/ 不得（MUST NOT） |
   | SHOULD / SHOULD NOT | 应当（SHOULD）/ 不应（SHOULD NOT） |
   | MAY | 可以（MAY） |
   | REQUIRED | 必需（REQUIRED） |
   | OPTIONAL | 可选（OPTIONAL） |

   原文用粗体强调的规范性关键词，译文保持粗体：**必须（MUST）**。

## 四、代码

1. 代码块内容逐字节保留，包括缩进、空行、注释符号。
2. 只有注释可以翻译，且必须仍是注释：
   - `// …`、`# …`、`/* … */`、`<!-- … -->`、Mermaid 的 `Note over …:` 文本。
3. 字符串字面量、字段名、事件名、URL、命令行参数**不译**，即使它们在注释里出现。
4. 围栏的语言标记（`ts`、`json`、`bash`、`mermaid`）保持原样。

## 五、组件与提示块

上游用 Mintlify 组件。译文统一改成纯 Markdown，保证 GitHub 和任意静态站点都能正确渲染：

| 上游 | 译文 |
| --- | --- |
| `<Note>…</Note>` | `> [!NOTE]` + 每行加 `> ` |
| `<Warning>…</Warning>` | `> [!WARNING]` + 每行加 `> ` |
| `<Tip>…</Tip>` | `> [!TIP]` + 每行加 `> ` |
| `<CardGroup cols={n}>` 内的一组 `<Card>` | 一组列表项，每项 `- **[标题](链接)** — 描述` |
| `{/* 注释 */}` | `<!-- 注释 -->` |

数量必须守恒：原文几处 `<Note>`，译文就有几处 `> [!NOTE]`；原文每个 `<Card>` 的 `href` 都要作为链接目标出现在译文里。

## 六、链接

| 原文目标 | 译文处理 |
| --- | --- |
| `/concepts/x`、`/concepts/x#anchor` | 相对路径指向 `content/zh/concepts/x.md`，锚点保留 |
| `/spec/1.0/x`、`/spec/1.0/x#anchor` | 相对路径指向 `content/zh/spec/1.0/x.md`，锚点保留 |
| `/quickstart/…`、`/sdk/…`、`/integrations/…`、`/drafts/…`、`/spec/draft/…` 等未翻译区域 | 改成 `https://docs.ag-ui.com<原路径>` |
| `/spec/1.0/schema.json` | 改成 `https://docs.ag-ui.com/spec/1.0/schema.json` |
| `#anchor`（页内） | 不动 |
| `https://…` 外链 | 不动 |

相对路径以**目标文件**为准，例如从 `content/zh/spec/1.0/events/state.md` 指向 `content/zh/concepts/state.md`，写 `../../../concepts/state.md`。

锚点不要手改：译文里统一保留英文原锚点（如 `#frontend-tools`），保存后运行 `npm run remap-anchors`，脚本会按标题顺序把锚点映射成译文标题生成的 slug（如 `#前端工具frontend-tools`）。CI 会校验锚点确实存在于目标文件。

## 七、frontmatter

只保留两个键，值译成中文，键名不变：

```yaml
---
title: "状态（state）管理"
description: "理解 AG-UI 中 Agent 与前端（frontend）之间的状态（state）同步"
---
```

不要把上游 SHA、抓取时间写进每页 frontmatter——这些集中记录在 [upstream.lock.json](./upstream.lock.json)。

## 八、提交前自检

```bash
node scripts/fetch-upstream.mjs   # 首次或上游 SHA 变更后
node scripts/check-parity.mjs    # 结构、代码、组件
npm run remap-anchors            # 把英文锚点映射到译文标题
node scripts/check-links.mjs     # 链接与锚点
node scripts/check-terms.mjs     # 术语与禁用译法
node scripts/check-coverage.mjs   # 上游每个文件都有译文
```

四项全绿才能提交。

## 九、发布节奏

只跟随上游**大版本与小版本**（例如 1.0 → 1.1），不跟随每次 commit 与 patch。每次同步在 README 里更新「对应上游 commit」，并打形如 `v1.0.0-zh.1` 的标签。

上游变化由每周的 [upstream-watch](./.github/workflows/upstream-watch.yml) 汇总成 issue。收到 issue 后：

1. 只处理 issue 里列出的**已译页面**；`draft/` 与未翻译区域的条目忽略。
2. 判断是措辞微调还是语义变化——只有语义变化才动译文。
3. 改完后按「八、提交前自检」跑完四项检查，把 `upstream.lock.json` 与译文放在同一个 commit 里推进到新 SHA。
4. 关掉 issue。
