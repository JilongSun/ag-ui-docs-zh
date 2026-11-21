---
title: "状态（state）管理"
description: "理解 AG-UI 中 Agent 与前端（frontend）之间的状态（state）同步"
---

# 状态（state）管理

状态（state）管理是 AG-UI 协议的一项核心特性，它使 Agent 与前端（frontend）应用之间能够实时同步。通过提供高效的状态（state）共享与更新机制，AG-UI 为 AI Agent 与人类用户无缝协作的协同体验奠定了基础。

## 共享状态（state）架构

在 AG-UI 中，状态（state）是一个结构化数据对象，它：

1. 在与 Agent 的多次交互之间持续存在
2. 可被 Agent 和前端（frontend）双方访问
3. 随着交互推进实时更新
4. 为双方的决策提供上下文

这种共享状态（state）架构建立了一条双向通信通道，其中：

- Agent 可以访问应用的当前状态（state），以做出有依据的决策
- 前端（frontend）可以观察 Agent 内部状态（state）的变化，并对其做出反应
- 双方都可以修改状态（state），从而形成协作式工作流

## 状态（state）同步方法

AG-UI 提供两种互补的状态（state）同步方法：

### 状态（state）快照（snapshot）

`STATE_SNAPSHOT` 事件（event）传递 Agent 当前状态（state）的完整表示：

```typescript
interface StateSnapshotEvent {
  type: EventType.STATE_SNAPSHOT
  snapshot: any // Complete state object
}
```

快照（snapshot）通常用于：

- 在交互开始时建立初始状态（state）
- 在连接中断（interruption）之后确保同步
- 发生需要整体刷新的重大状态（state）变化时
- 为后续的增量（delta）更新建立新的基线

当前端（frontend）收到 `STATE_SNAPSHOT` 事件（event）时，应当用快照（snapshot）的内容完全替换其现有的状态（state）模型。

### 状态（state）增量（delta）

`STATE_DELTA` 事件（event）使用 JSON Patch 格式（RFC 6902）传递对状态（state）的增量（delta）更新：

```typescript
interface StateDeltaEvent {
  type: EventType.STATE_DELTA
  delta: JsonPatchOperation[] // Array of JSON Patch operations
}
```

增量（delta）在带宽上更高效，只发送发生变化的内容，而不是整个状态（state）。这种做法在以下场景中尤其有价值：

- 流式交互过程中频繁的小幅更新
- 大部分属性保持不变的大型状态（state）对象
- 若以完整快照（snapshot）发送则效率低下的高频更新

## JSON Patch 格式

AG-UI 使用 JSON Patch 格式（RFC 6902）表示状态（state）增量（delta），该格式定义了表达 JSON 文档变更的标准化方式：

```typescript
interface JsonPatchOperation {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test"
  path: string // JSON Pointer (RFC 6901) to the target location
  value?: any // The value to apply (for add, replace)
  from?: string // Source path (for move, copy)
}
```

常用操作包括：

1. **add**：向对象或数组添加一个值

   ```json
   { "op": "add", "path": "/user/preferences", "value": { "theme": "dark" } }
   ```

2. **replace**：替换一个值

   ```json
   { "op": "replace", "path": "/conversation_state", "value": "paused" }
   ```

3. **remove**：移除一个值

   ```json
   { "op": "remove", "path": "/temporary_data" }
   ```

4. **move**：把一个值从一个位置移动到另一个位置
   ```json
   { "op": "move", "path": "/completed_items", "from": "/pending_items/0" }
   ```

前端（frontend）应按顺序应用这些补丁，以维持准确的状态（state）表示。如果在应用补丁之后检测到不一致，前端（frontend）可以请求一份新的 `STATE_SNAPSHOT`。

## AG-UI 中的状态（state）处理

在 AG-UI 的实现中，状态（state）增量（delta）使用 `fast-json-patch` 库来应用：

```typescript
case EventType.STATE_DELTA: {
  const { delta } = event as StateDeltaEvent;

  try {
    // Apply the JSON Patch operations to the current state without mutating the original
    const result = applyPatch(state, delta, true, false);
    state = result.newDocument;
    return emitUpdate({ state });
  } catch (error: unknown) {
    console.warn(
      `Failed to apply state patch:\n` +
      `Current state: ${JSON.stringify(state, null, 2)}\n` +
      `Patch operations: ${JSON.stringify(delta, null, 2)}\n` +
      `Error: ${errorMessage}`
    );
    return emitNoUpdate();
  }
}
```

该实现确保：

- 补丁以原子方式应用（全部成功，或全部不应用）
- 应用过程中不会改变原始状态（state）
- 错误会被捕获并妥善处理

## 人在回路（human in the loop）协作

共享状态（state）系统是 AG-UI 中人在回路（human in the loop）工作流的基础。它使以下成为可能：

1. **实时可见性**：用户可以观察 Agent 的思考过程和当前状态（state）
2. **上下文感知**：Agent 可以访问用户的操作、偏好以及应用状态（state）
3. **协同决策**：人与 AI 都能为不断演进的状态（state）做出贡献
4. **反馈回路**：人可以通过修改状态（state）属性来纠正或引导 Agent

例如，Agent 可以在状态（state）中写入一项建议的操作：

```json
{
  "proposal": {
    "action": "send_email",
    "recipient": "client@example.com",
    "content": "Draft email content..."
  }
}
```

前端（frontend）可以把这项建议展示给用户，用户随后可以在执行前批准、拒绝或修改它。

## CopilotKit 实现

[CopilotKit](https://docs.copilotkit.ai) 是一个广受欢迎的构建 AI 助手的框架，它通过“共享状态（state）”特性利用了 AG-UI 的状态（state）管理系统。该实现使 Agent（尤其是 LangGraph Agent）与前端（frontend）应用之间能够双向同步状态（state）。

CopilotKit 的共享状态（state）系统通过以下方式实现：

```jsx
// In the frontend React application
const { state: agentState, setState: setAgentState } = useCoAgent({
  name: "agent",
  initialState: { someProperty: "initialValue" },
})
```

该 hook 建立了与 Agent 状态（state）的实时连接，从而支持：

1. 在前端（frontend）读取 Agent 的当前状态（state）
2. 从前端（frontend）更新 Agent 的状态（state）
3. 根据 Agent 的状态（state）渲染 UI 组件

在后端，LangGraph Agent 可以使用以下方式发出状态（state）更新：

```python
# In the LangGraph agent
async def tool_node(self, state: ResearchState, config: RunnableConfig):
    # Update state with new information
    tool_state = {
        "title": new_state.get("title", ""),
        "outline": new_state.get("outline", {}),
        "sections": new_state.get("sections", []),
        # Other state properties...
    }

    # Emit updated state to frontend
    await copilotkit_emit_state(config, tool_state)

    return tool_state
```

这些状态（state）更新通过 AG-UI 的状态（state）快照（snapshot）与增量（delta）机制传输（transport），从而在 Agent 与前端（frontend）之间形成无缝的共享上下文。

## 最佳实践

在 AG-UI 中实现状态（state）管理时：

1. **审慎使用快照（snapshot）**：只有在建立基线确有必要时，才应发送完整快照（snapshot）。
2. **增量（delta）变更优先使用增量（delta）**：小幅状态（state）更新应使用增量（delta），以尽量减少数据传输（transport）。
3. **精心设计状态（state）结构**：设计状态（state）对象时要支持局部更新，并尽量减少补丁的复杂度。
4. **处理状态（state）冲突**：实现用于解决 Agent 与前端（frontend）更新冲突的策略。
5. **包含错误恢复**：提供在检测到不一致时重新同步状态（state）的机制。
6. **考虑安全影响**：避免在共享状态（state）中存储敏感信息。

## 结语

AG-UI 的状态（state）管理系统为构建人与 AI Agent 协同工作的协作式应用提供了强大的基础。通过快照（snapshot）和 JSON Patch 增量（delta）在前端（frontend）与后端之间高效同步状态（state），AG-UI 使融合人类直觉与 AI 能力（capability）两者优势的复杂人在回路（human in the loop）工作流成为可能。

CopilotKit 等框架中的实现表明，这种共享状态（state）的做法能够创造出比全自主系统或传统用户界面都更为有效的协作体验。
