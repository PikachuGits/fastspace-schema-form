# Next-Gen Schema Form 架构重构计划 (TanStack Form) - V4 (最终工程规格说明书)

本计划基于 @tanstack/react-form 重写 Schema Form，在 V3 的基础上补充了**行为约定、边界说明与工程护栏**，确保架构在长期维护中的一致性与健壮性。

## 1. 核心架构设计 (The "Three Layers")

### 1.1 Layer 1: Schema Compiler (Core)

* **职责**：纯函数逻辑，负责静态分析与编译防御。

* **核心产物 (`CompiledSchema`)**：

  * `meta`: 版本与兼容性信息。

  * `fields`: 扁平化的字段配置 Map。

  * `rules`: 标准化的规则集合 (AST Evaluators)。

  * `dependencyMap`: 反向依赖索引。

  * `staticAnalysisReport`: 依赖环与孤立节点报告。

* **增强策略**：

  * **Compile-time Cycle Detection**: Tarjan 算法检测依赖环，报错输出链路。

  * **Secure AST Interpreter**: 基于 `jsep` 的白名单解释器，**禁止** **`new Function`**，杜绝原型链攻击。

### 1.2 Layer 2: Form Runtime (Headless)

* **职责**：状态管理与副作用调度。

* **核心模块**：

  * **EffectSystem (Immutable & Observable)**：

    * **Snapshot Batching**: 基于 State Snapshot 计算，最后合并提交。

    * **Conflict Resolution**:

      * 同一 Target 被多个规则写入时，**高优先级覆盖低优先级**。

      * 同优先级冲突：**开发环境报警 (Console Warn)，保留最后执行结果**。

      * 执行顺序由 Compiler 输出的 topologicalOrder + priority 决定，Runtime 不自行排序。(避免未来有人在 Runtime 又排序一次，破坏确定性)

    * **Runtime Freezing**: 传入 `evaluator` 的 `scope` 对象在运行时执行 **浅冻结 (Object.freeze)**，禁止规则修改上下文。

      * 注释: 浅冻结仅防止直接赋值，不防止嵌套对象变更；规则不得依赖可变嵌套状态。

        * 否则未来可能有人写：scope.values.user.name = 'x'

  * **AsyncScheduler**:

    * **Race Control**: `AbortController` + `VersionHash`。

    * VersionHash = stable hash(deps values snapshot)，确保同值不触发无效请求。

  * **Error Boundary**:

    * 规则执行失败（如类型错误）时：**记录 Error Trace，保留字段原值，不阻断表单，不自动重试**。UI 层可通过 DevTools 查看失败原因。

  * **State Persistence**: UI 卸载后 State 保持活跃。

### 1.3 Layer 3: UI Render (Adapter)

* **职责**：纯投影层。

* **优化策略**：

  * **Selector Subscription**: `useField(name, state => state.value)`。

  * **Virtualization Rehydration**: 组件重新挂载时，**直接从 Runtime 读取当前 State**，不触发重新计算或校验（除非依赖变更）。

***

## 2. 行为约定与边界说明 (Engineering Guardrails)

### 2.1 EvalScope 不可变性

```typescript
export type EvalScope = Readonly<{
  values: Record<string, any>;
  meta: Record<string, any>;
  context: Record<string, any>;
}>;
```

* **约定**：`evaluator` 必须是**纯函数**。Runtime 会对 scope 进行 `Object.freeze()`。

* **违规后果**：尝试修改 scope 属性将在严格模式下抛出 TypeError。

### 2.2 Schema 版本控制

* **语义**：`version` 遵循 **SemVer** 规范。

* **兼容性**：`compatibleWith` 接受 SemVer Range (e.g., `^1.0.0`)。

* **迁移规划**：未来版本将支持 `migrationHooks` (Pre-compile transform)。

### 2.3 虚拟化与卸载

* **约定**：UI 组件的卸载 (Unmount) **不等于** 字段销毁。

* **行为**：

  * Effect 依然在后台运行。

  * Validator 依然生效。

  * UI 重挂载时仅做 Projection (Sync)，无副作用。

***

## 3. 技术选型与依赖

* **Core State**: `@tanstack/react-form`

* **Expression**: `jsep` (Interpreter Mode).

* **Utils**: `lodash-es`.

* **Validation**: `valibot`.

***

## 4. 实施阶段 (Implementation Phases)

### Phase 1: 安全 Compiler 与静态分析

1. **AST Interpreter**: 实现 `SafeEvaluator`。
2. **Dependency Analyzer**: 实现 Cycle Detection。
3. **Compiler Core**: 实现 Schema Normalization 与 Version Check。

### Phase 2: 健壮 Runtime

1. **EffectSystem**: 实现 Snapshot Batching 与 Conflict Resolution。
2. **AsyncScheduler**: 实现 Abort/Hash 机制。
3. **Error Handling**: 实现 `EffectTrace` 与 Error Boundary。

### Phase 3: 高性能 UI

1. **Field Adapter**: 封装 `useField` + Selector。
2. **Widgets**: 迁移基础组件。

### Phase 4: 验证与工具链

1. **Stress Test**: 复杂联动测试。
2. **DevTools**: 开发 EffectTrace 可视化面板。

