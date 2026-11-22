# ag-ui-docs-zh

[AG-UI（Agent User Interaction Protocol）](https://github.com/ag-ui-protocol/ag-ui) 文档的简体中文译本。

> **非官方译本。** 本仓库与 AG-UI 项目维护者无关。译文仅作参考，协议行为以[英文原文](https://docs.ag-ui.com)为准。发现译文错误请直接提 issue 或 PR。

## 范围

只翻译协议契约与概念模型，不翻译 API 参考、SDK 文档与社区流程：

| 上游 | 本文 | 进度 |
| --- | --- | --- |
| `docs/concepts/*.mdx` | [content/zh/concepts](./content/zh/concepts) | 14 / 14 |
| `docs/spec/1.0/**/*.mdx` | [content/zh/spec/1.0](./content/zh/spec/1.0) | 27 / 27 |

`docs/spec/draft/` 是 1.1 的工作区，暂不翻译；等它冻结成 1.1 再整批翻译。

## 对应上游版本

| 项目 | 值 |
| --- | --- |
| 上游仓库 | `ag-ui-protocol/ag-ui` |
| 协议版本 | `1.0.0`（tag [`ag-ui-protocol@1.0.0`](https://github.com/ag-ui-protocol/ag-ui/releases/tag/ag-ui-protocol@1.0.0)） |
| 上游 commit | [`a6f2539a2`](https://github.com/ag-ui-protocol/ag-ui/tree/a6f2539a2ad9ba016129217637b83b7068adc6c1)（2026-11-20） |
| 逐文件哈希 | [upstream.lock.json](./upstream.lock.json) |

发布节奏见文末「发布节奏」。

## 阅读顺序

1. [架构（architecture）](./content/zh/concepts/architecture.md) 与 [Agent](./content/zh/concepts/agents.md)
2. [事件（events）](./content/zh/concepts/events.md) → [消息（messages）](./content/zh/concepts/messages.md) → [工具（tools）](./content/zh/concepts/tools.md) → [状态（state）](./content/zh/concepts/state.md)
3. [中断（interrupts）](./content/zh/concepts/interrupts.md)、[子 Agent（subagents）](./content/zh/concepts/subagents.md)、[中间件（middleware）](./content/zh/concepts/middleware.md)
4. 再读 [1.0 规范概览](./content/zh/spec/1.0/index.md)，按需查具体页面

## 翻译约定

- 术语、结构对齐、代码保真、链接与组件处理规则见 [TRANSLATING.md](./TRANSLATING.md)。
- 用词以 [glossary.md](./glossary.md) 为准；术语每处出现都写作「中文（原文）」。
- 协议标识符、字段名、事件名、JSON 键永不翻译。

## 本地校验

零依赖，Node 20+ 即可：

```bash
node scripts/fetch-upstream.mjs   # 按 upstream.lock.json 拉取并校验上游原文
npm run check                     # 结构对齐 + 链接锚点 + 术语
```

CI 在每次 push 与 PR 上跑同一组检查，并要求上游哈希与锁文件一致——上游一改，CI 就会提示需要重新评估译文。

## 上游变更监视

[upstream-watch](./.github/workflows/upstream-watch.yml) 每周一 09:00（北京时间）跑一次，对比基线与上游 `main`：

| 判定 | 触发条件 | 通知 |
| --- | --- | --- |
| `spec-release` | 出现比锁定版本更新的 `ag-ui-protocol@X.Y.Z` tag，且属于 major 或 minor | issue |
| `spec` | `docs/spec/1.0/**` 有增删改 | issue |
| `concepts` | `docs/concepts/**` 有增删改 | issue |
| `draft` | 仅 `docs/spec/draft/**` 与导航变化（1.1 工作区，不翻译） | 无，只写运行摘要 |
| `none` | 范围内无变化 | 无 |

patch 版本（如 `1.0.0 → 1.0.1`）按约定不跟随，只在报告里记一笔，不触发通知。

需要行动时，在 issue「上游文档变更待处理」里给出逐文件清单，每个上游路径都映射到对应译文。**报告是增量的**：issue body 里记录了上次报告到的提交，之后每次只列那之后的新变化，不会重复列同一页。

本地预演（用本地 clone，不联网）：

```bash
npm run watch -- --local-repo ../ag-ui                    # 对比 clone 的 HEAD
npm run watch -- --local-repo ../ag-ui --head origin/main # 对比上游主干
```

> GitHub 在仓库连续 60 天无活动后会暂停定时工作流，重新启用即可；`workflow_dispatch` 可随时手动触发。

## 发布节奏

只跟随上游**大版本与小版本**（例如 1.0 → 1.1），不跟随每次 commit 与 patch。同步完成后打形如 `v1.0.0-zh.1` 的标签，并在 README 更新「对应上游版本」。

## 许可

译文以 MIT 许可发布，见 [LICENSE](./LICENSE)。上游文档同样为 MIT，版权归 AG-UI 项目贡献者；署名与许可原文见 [NOTICE](./NOTICE)。
