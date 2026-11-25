# 术语表

本表是译文用词的唯一依据。规则见 [TRANSLATING.md](./TRANSLATING.md)：标「不译」的词保持英文原样；其余术语**每处出现**都写成「中文（原文）」。

## 协议与规范

| 原文 | 译文 | 说明 |
| --- | --- | --- |
| spec / specification | 规范（specification） | |
| protocol | 协议（protocol） | |
| normative | 规范性（normative） | |
| informative | 资料性（informative） | 非规范性说明 |
| schema | schema | 不译 |
| JSON Schema | JSON Schema | 不译 |
| `$ref` / `$defs` / `additionalProperties` / `unevaluatedProperties` | 原样 | 不译 |
| closed object | 封闭对象（closed object） | schema 拒绝未列出的成员 |
| open object | 开放对象（open object） | |
| mixin | 混入（mixin） | |
| discriminator | 判别字段（discriminator） | |
| union / discriminated union | 联合（union）/ 可辨识联合（discriminated union） | |
| field | 字段（field） | 字段名本身不译 |
| required / optional | 必需（required）/ 可选（optional） | |
| enum / enumeration | 枚举（enum） | 枚举值本身不译 |
| anchor | 锚点（anchor） | |
| conformance | 一致性（conformance） | |
| conformance suite | 一致性测试套件（conformance suite） | |
| fixture | 夹具（fixture） | |
| golden / golden file | 基准（golden）/ 基准文件（golden file） | |
| byte-for-byte | 逐字节（byte-for-byte） | |
| cross-language | 跨语言（cross-language） | |
| compatibility | 兼容性（compatibility） | |
| backward compatible / forward compatible | 向后兼容（backward compatible）/ 向前兼容（forward compatible） | |
| frozen | 已冻结（frozen） | |
| draft | 草案（draft） | |
| deprecated / deprecation | 已弃用（deprecated）/ 弃用（deprecation） | |
| retired shape | 已退役形状（retired shape） | 0.x 中移除的事件形状 |
| shim | 兼容垫片（shim） | |
| adapter | 适配器（adapter） | |
| validator | 校验器（validator） | |
| validation | 校验（validation） | |
| strict / lenient | 严格（strict）/ 宽容（lenient） | |
| unknown field | 未知字段（unknown field） | |
| malformed | 畸形（malformed） | |
| warning | 告警（warning） | |
| strip | 剥离（strip） | |
| ignore | 忽略（ignore） | |
| provenance | 来源（provenance） | |
| attribution | 归属（attribution） | |
| ownership | 所有权（ownership） | |
| idempotent | 幂等（idempotent） | |
| wire format | 线上格式（wire format） | |
| in-band / out-of-band | 带内（in-band）/ 带外（out-of-band） | |
| framing | 分帧（framing） | |
| truncation | 截断（truncation） | |
| chunked | 分块（chunked） | |
| keep-alive | 保活（keep-alive） | |
| coalesce | 合并（coalesce） | |
| shorthand / expansion | 简写（shorthand）/ 展开（expansion） | |

## 运行与事件

| 原文 | 译文 | 说明 |
| --- | --- | --- |
| agent | Agent | 不译 |
| subagent | 子 Agent（subagent） | |
| run / running | 运行（run）/ 正在运行（running） | 一次 `RunAgentInput` 触发的完整执行 |
| run input | 运行输入（run input） | `RunAgentInput` |
| parent run | 父运行（parent run） | |
| run lifecycle | 运行生命周期（run lifecycle） | |
| lifecycle event | 生命周期事件（lifecycle event） | |
| step | 步骤（step） | |
| thread | 线程（thread） | 对话容器，对应 `threadId` |
| event | 事件（event） | |
| event stream | 事件流（event stream） | |
| event family | 事件族（event family） | |
| stream | 流（stream） | |
| message | 消息（message） | |
| text message | 文本消息（text message） | |
| message role | 消息角色（role） | 角色值 `system`/`user`/`assistant`/`tool` 不译 |
| content part | 内容片段（content part） | |
| multimodal | 多模态（multimodal） | |
| tool call | 工具调用（tool call） | |
| tool call chunk | 工具调用分片（tool call chunk） | |
| tool result | 工具结果（tool result） | |
| frontend tool | 前端工具（frontend tool） | |
| backend tool | 后端工具（backend tool） | |
| args / arguments | 参数（args） | 字段名不译 |
| state | 状态（state） | |
| snapshot | 快照（snapshot） | |
| delta | 增量（delta） | |
| JSON Patch | JSON Patch | 不译 |
| messages snapshot | 消息快照（messages snapshot） | |
| reasoning | 推理（reasoning） | |
| reasoning span | 推理区间（reasoning span） | |
| encrypted value | 加密值（encrypted value） | |
| thinking | thinking | 不译，指 0.x 的 `THINKING_*` 事件族 |
| activity | 活动（activity） | |
| generative UI | 生成式 UI（generative UI） | |
| declarative UI | 声明式 UI（declarative UI） | |
| raw event | 原始事件（raw event） | |
| custom event | 自定义事件（custom event） | |
| passthrough | 透传（passthrough） | |
| metadata | 元数据（metadata） | |
| capability / capabilities | 能力（capability） | |
| serialization | 序列化（serialization） | |
| serialized | 已序列化（serialized） | |
| JSON-serializable | 可 JSON 序列化（JSON-serializable） | |
| serializer | 序列化器（serializer） | |
| streaming | 流式（streaming） | 动词 `stream` / `streams` 译「流式发送（stream）」 |
| streamable | 可流式（streamable） | |
| compaction / compact | 压缩（compaction）/ 压缩（compact） | 按原文词形分别标注 |
| compression | 压缩（compression） | 与 `compaction` 区分 |

## 控制流与人机协作

| 原文 | 译文 | 说明 |
| --- | --- | --- |
| interrupt | 中断（interrupt） | 人在回路的暂停点，对应 `Interrupt` 类型 |
| interruption | 中断（interruption） | 通用中断，不等于协议的 `interrupt` |
| interrupt outcome | 中断结果（interrupt outcome） | `RUN_FINISHED.outcome` |
| outcome | 结果（outcome） | |
| human in the loop | 人在回路（human in the loop） | |
| approval | 批准（approval） | |
| resume | 恢复（resume） | 从中断处继续运行 |
| continuation | 续跑（continuation） | 与 `resume` 的继续运行操作区分 |
| restore | 恢复（restore） | 恢复历史/状态，不是继续运行 |
| suspension | 挂起（suspension） | |
| cancelled | 已取消（cancelled） | |
| nesting | 嵌套（nesting） | |
| parallelism | 并行（parallelism） | |
| termination | 终止（termination） | |
| branch / branching | 分支（branch）/ 分支化（branching） | 按原文词形分别标注 |

## 传输与版本

| 原文 | 译文 | 说明 |
| --- | --- | --- |
| transport | 传输（transport） | |
| transport-agnostic | 传输无关（transport-agnostic） | |
| transfer / transmission / transmitted | 传输 / 传递 | **不是术语，不加原文标注**；只有协议概念 transport 才写「传输（transport）」 |
| stream / streamed / streaming | 流式发送 / 流式 / 流式 | **不是术语**；不要写成「流式传输」再标 (transport) |
| binding | 绑定（binding） | |
| SSE | SSE | 不译 |
| HTTP POST | HTTP POST | 不译 |
| Protobuf / binary | Protobuf / 二进制（binary） | |
| negotiation | 协商（negotiation） | |
| version | 版本（version） | |
| protocol version | 协议版本（protocol version） | |
| `protocolVersion` | 原样 | 不译 |
| major / minor / patch | 主版本（major）/ 次版本（minor）/ 补丁版本（patch） | |
| degrade / downgrade | 降级（degrade）/ 降级（downgrade） | 按原文词形分别标注 |
| release | 发布（release） | |
| reconnect | 重连（reconnect） | |
| retry | 重试（retry） | |
| heartbeat | 心跳（heartbeat） | |

## 角色与通用词

| 原文 | 译文 | 说明 |
| --- | --- | --- |
| client / server | 客户端（client）/ 服务端（server） | |
| frontend / front-end | 前端（frontend） | |
| producer / consumer | 生产者（producer）/ 消费者（consumer） | |
| peer | 对端（peer） | |
| boundary | 边界（boundary） | 兼容层边界 |
| middleware | 中间件（middleware） | |
| MCP / A2A | MCP / A2A | 不译 |
| Dojo | Dojo | 不译，官方演示应用 |

## 规范性关键词（BCP 14）

| 原文 | 译文 |
| --- | --- |
| MUST / MUST NOT | 必须（MUST）/ 不得（MUST NOT） |
| SHOULD / SHOULD NOT | 应当（SHOULD）/ 不应（SHOULD NOT） |
| MAY | 可以（MAY） |
| REQUIRED | 必需（REQUIRED） |
| OPTIONAL | 可选（OPTIONAL） |

## 易混提醒

中文会把多个英文词收敛成同一个词，标注时必须回到原文看**实际用的是哪个词**：

| 中文 | 可能是 | 判断依据 |
| --- | --- | --- |
| 传输 | `transport`（协议概念）/ `transfer`、`transmission`（普通词语） | 原文讲 SSE、Protobuf 这类绑定 → `transport`，加标注；讲"数据传过去" → 普通词语，**不加标注** |
| 流式 | `stream` 词族 | 标注用原文词形（`streamed` / `streaming` / `streamable`），**不要标成 transport** |

`npm run audit:terms` 会校验这三组易混词，标注词未出现在对应原文小节时会报出来。

## 禁用译法

CI 会直接拒绝下列写法：

| 禁用 | 应为 |
| --- | --- |
| 智能体、子智能体 | Agent、子 Agent（subagent） |
| 串流 | 流（stream） |
| 讯息 | 消息（message） |
| schema（schema）、JSON Patch（JSON Patch） | schema、JSON Patch（不译词不加标注） |
