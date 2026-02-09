# @fastspace/schema-form 架构设计与性能分析

## 目录

- [1. 整体架构](#1-整体架构)
- [2. 核心层 (Core)](#2-核心层-core)
  - [2.1 编译器 (Compiler)](#21-编译器-compiler)
  - [2.2 运行时 (Runtime)](#22-运行时-runtime)
  - [2.3 校验系统 (Validation)](#23-校验系统-validation)
- [3. React 集成层](#3-react-集成层)
- [4. UI 层](#4-ui-层)
- [5. 性能问题与修复建议](#5-性能问题与修复建议)

---

## 1. 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    SchemaForm (入口)                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ useSchema │  │SchemaRenderer│  │  SchemaFormProvider│  │
│  │   Form    │→ │  (布局递归)   │  │  (Runtime Context) │  │
│  └──────┬───┘  └──────┬───────┘  └────────┬──────────┘  │
│         │             │                    │              │
│  ┌──────▼──────────────▼────────────────────▼──────────┐  │
│  │              FieldAdapter (字段适配器)                │  │
│  │  useSyncExternalStore → FieldMeta 订阅               │  │
│  │  form.Field → TanStack Form 字段绑定                 │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │              Widget 层 (18种内置组件)                 │  │
│  │  Text | Select | Autocomplete | FormList | ...       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌────────────────── Core 层 ──────────────────────────────┐
│  SchemaCompiler    →    FormRuntime    →    Validation   │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │ 解析 Schema  │   │ EffectSystem │   │ Valibot 适配 │  │
│  │ 提取 Rules   │   │ AsyncScheduler│  │ 预设规则注册 │  │
│  │ 依赖分析     │   │ 批量更新     │   │ 规则工厂     │  │
│  │ 拓扑排序     │   │ 级联触发     │   │              │  │
│  └─────────────┘   └──────────────┘   └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**数据流向**：`SchemaInput → Compiler → CompiledSchema → Runtime(EffectSystem + AsyncScheduler) → FieldMeta → FieldAdapter → Widget`

---

## 2. 核心层 (Core)

### 2.1 编译器 (Compiler)

#### `SchemaCompiler` (`core/compiler/index.ts`)

**职责**：将用户声明式的 `SchemaInput` 编译为运行时可执行的 `CompiledSchema`。

**设计逻辑**：

| 步骤 | 说明 |
|------|------|
| 版本检查 | 解析 SemVer，校验 `compatibleWith` 范围兼容性 |
| 字段扁平化 | 递归遍历 `fields`，将嵌套结构扁平化为 `Record<string, FieldConfig>`，同时生成 `LayoutNode[]` 布局树 |
| 规则提取 | 将 `visibleWhen / disabledWhen / requiredWhen / compute / options` 转换为统一的 `SchemaRule` |
| 依赖分析 | 字符串表达式通过 AST 解析提取依赖，函数通过源码正则匹配 `values.xxx` 模式提取 |
| 拓扑排序 | 基于依赖图 DFS 生成执行顺序，分配优先级 |

**关键方法**：

- `extractRule()`: 将 `string | function` 定义转为 `SchemaRule`，自动提取依赖
- `extractDepsFromFunction()`: 从函数源码中通过正则 `/\bvalues\.(\w+)/g` 提取依赖字段，排除自身防止自循环
- `extractOptionsRule()`: 处理三种 options 格式 (静态数组 / 异步函数 / 带 deps 的对象)

#### `SafeEvaluator` (`core/compiler/evaluator.ts`)

**职责**：安全地解释执行字符串表达式（禁止 `eval` / `new Function`）。

**设计逻辑**：

- 基于 `jsep` 库解析表达式为 AST
- 递归遍历 AST 节点进行求值，支持: `Literal / Identifier / BinaryExpression / UnaryExpression / MemberExpression / CallExpression / ConditionalExpression / ArrayExpression`
- **安全机制**:
  - 黑名单属性: `__proto__`, `constructor`, `prototype` 等
  - 黑名单全局: `eval`, `Function`, `fetch`, `window` 等
  - 白名单全局: `Math`, `Number`, `String`, `JSON`, `parseInt` 等
  - `MemberExpression` 访问时检查 `hasOwnProperty` 防止原型链污染
  - 函数调用时检查 `__` 前缀和 `constructor` 名称

#### `DependencyAnalyzer` (`core/compiler/dependencyAnalyzer.ts`)

**职责**：分析规则间的依赖关系，检测循环依赖，生成拓扑排序。

**设计逻辑**：

- 构建正向图 (Dep → Target) 和反向图 (Target → Dep)
- 生成反向依赖索引 `dependencyMap: Map<string, SchemaRule[]>` — 这是运行时触发规则的核心数据结构
- **Tarjan 算法**检测强连通分量 (SCC)，size > 1 的 SCC 即为循环依赖
- DFS 拓扑排序生成执行优先级

#### `SchemaLinter` (`core/compiler/schemaLinter.ts`)

**职责**：编译时静态检查 Schema 问题。

检查项: 字段名重复 / 未知组件类型 / 表达式语法错误 / Select 无 options / FormList 无 children

---

### 2.2 运行时 (Runtime)

#### `FormRuntime` (`core/runtime/Runtime.ts`)

**职责**：统一管理 `EffectSystem` + `AsyncScheduler` 的门面 (Facade)。

**设计逻辑**：

- 构造时创建 `AsyncScheduler` 和 `EffectSystem`
- 提供 `notifyChange()` / `subscribe()` / `getFieldMeta()` 等简洁 API
- `destroy()` 清理所有异步任务和缓存

#### `EffectSystem` (`core/runtime/EffectSystem.ts`)

**职责**：调度所有派生规则、条件判断和联动逻辑。是整个表单联动的心脏。

**设计逻辑**：

| 机制 | 说明 |
|------|------|
| Snapshot Batching | 基于不可变快照计算，防止规则执行期间被其他规则干扰 |
| Microtask 调度 | `queueMicrotask` 合并同一事件循环内的多次字段变更 |
| 优先级排序 | 规则按拓扑排序的优先级执行，确保依赖链正确 |
| 级联触发 | derive 规则改变字段值后，自动查找并触发下游依赖规则 (递归，最大深度 10) |
| Deep Freeze | `EvalScope` 执行前深度冻结，防止规则意外修改状态 |
| Error Boundary | 单条规则失败不阻断其他规则执行 |
| Conflict Resolution | 同目标多规则时，高优先级（或后执行）覆盖 |

**核心流程 `flushUpdates(depth)`**：

```
1. 取不可变快照 (deepFreeze + cloneDeep)
2. 按优先级排序规则
3. 执行规则:
   - derive → 收集值更新
   - gate → 收集 meta 更新 (visible/disabled/required)
   - options → 异步调度 (不阻塞)
   - effect → 执行副作用
4. commitUpdates → 应用变更，返回值变化的字段列表
5. 级联: 对值变化字段查找下游规则 → 递归 flushUpdates(depth+1)
```

**FieldMeta 订阅机制**：

- `metaCache: Map<string, FieldMeta>` 存储每个字段的 visible/disabled/required/options/error
- `listeners: Map<string, Set<() => void>>` 字段级订阅
- `notifyListeners()` 通知指定字段的订阅者
- 前端通过 `useSyncExternalStore` 订阅，实现细粒度更新

#### `AsyncScheduler` (`core/runtime/AsyncScheduler.ts`)

**职责**：异步任务调度与缓存管理。

**设计逻辑**：

| 特性 | 说明 |
|------|------|
| Race Control | `AbortController` + 版本哈希双重检查，防止过期请求覆盖 |
| 缓存 | `Map<string, CacheEntry>` + staleTime (默认 5 分钟) + LRU 淘汰 (默认 100 条) |
| 请求去重 | `pendingPromises: Map` 相同 cacheKey 的请求复用同一 Promise |
| 超时控制 | `setTimeout` + `AbortController` 联动 (默认 30 秒) |
| Stable Hash | 对象键排序后 JSON 序列化，确保相同内容生成相同 hash |

---

### 2.3 校验系统 (Validation)

#### `presets.ts` — 预设规则注册表

**设计逻辑**：

- `RuleFactory: (config) => v.PipeItem` — 规则工厂模式，统一返回 valibot 管道项
- `ValidationPresetRegistry` — 可实例化的注册表，支持 `register / override / registerAll`
- 全局默认注册表 `globalValidationRegistry` 包含 14 种内置规则
- `presetToSchema()` 将 `PresetRule[]` 转为 `v.pipe(baseSchema, ...checks)`
- `resolveValidate()` 自动检测格式 (PresetRule[] 或 valibot schema)

#### `valibotAdapter.ts` — TanStack Form 适配器

- `valibotValidator()` 返回 `({value}) => string | undefined` 格式的校验函数
- 自动检测并转换 PresetRule[] 格式

#### `rulesAdapter.ts` — 声明式规则适配器

- `rulesToValibot()` 将老版本声明式规则转为 valibot schema
- `inferFieldType()` 从组件名推断字段类型 (text/number/boolean/select/date/array)

---

## 3. React 集成层

### `useSchemaForm` (`react/useSchemaForm.ts`)

**职责**：主 Hook，整合编译、表单、运行时的全生命周期。

**设计逻辑**：

```
1. useMemo → 编译 Schema (schemaInput 引用变化时)
2. useMemo → 合并默认值 (schema defaults + user defaults)
3. useForm → 创建 TanStack Form 实例
4. useMemo → 创建 FormRuntime (延迟初始化)
5. useEffect → mount 时 runtime.initialize()，unmount 时 runtime.destroy()
6. useEffect → 可选: form.store.subscribe() 监听值变化
7. useCallback → 暴露 handleSubmit / handleReset / getValues / setValue
```

### `SchemaFormProvider` (`react/SchemaFormProvider.tsx`)

**职责**：通过 React Context 向子组件提供 `FormRuntime` 实例。

### `FieldAdapter` (`ui/FieldAdapter.tsx`)

**职责**：将 TanStack Form 字段与 Runtime Meta 状态桥接到 Widget 组件。

**设计逻辑**：

- `useFieldMeta(name)` — 通过 `useSyncExternalStore` 订阅 Runtime 的 FieldMeta
- `form.Field` — TanStack Form 字段绑定 (value / handleChange / handleBlur / errors)
- `onChange` 拦截 — 调用 `runtime.notifyChange(name)` 触发联动
- `validators` — 通过 `useMemo` 合并动态 required 和静态 validate 规则
- 不可见时 (`meta.isVisible === false`) 直接返回 `null`

### `useValidationPresets` (`react/useValidationPresets.tsx`)

**职责**：在 React 组件中管理验证预设。支持全局/独立注册表。

---

## 4. UI 层

### `SchemaForm` (`ui/SchemaForm.tsx`)

**职责**：声明式表单入口组件。

- 包装 `useSchemaForm` + `SchemaFormProvider` + `SchemaRenderer`
- `forwardRef` + `useImperativeHandle` 暴露 `SchemaFormInstance` 操作接口
- 内置 `LocalizationProvider` (dayjs 中文)
- DEV 模式自动挂载 `DevTools`

### `SchemaRenderer` (`ui/SchemaRenderer.tsx`)

**职责**：根据 `CompiledSchema.layout` 递归渲染字段。

**设计逻辑**：

- `mergedWidgets = defaultWidgets + customWidgets`
- `LayoutRenderer` 递归遍历 `LayoutNode[]`
  - `type: "field"` → `FieldRenderer` (memo 优化)
  - `type: "container"` → Grid / Fragment 包裹后递归
- `FieldRenderer`:
  - 订阅 `useFieldMeta` 控制可见性 (不可见跳过整个 Grid)
  - 解析 `colSpan` / `independent` 布局配置
  - `options` 优先使用 Runtime Meta 的 (异步加载)，fallback 到 UI props 的 (静态)

### `AutocompleteWidget` (`ui/widgets/AutocompleteWidget.tsx`)

**最复杂的 Widget 组件**，设计逻辑：

| 功能模块 | 说明 |
|---------|------|
| 远程搜索 | `remoteConfig.fetchOptions` + 防抖 + 分页 |
| 无限滚动 | `InfiniteAutocompleteListbox` 自定义 Listbox + 触底加载 |
| 回显 | `fetchById` 初始回显 + `selectedOptionsRef` 防丢失 |
| 搜索清空 | `searchClearConfig` 控制关闭/选中/缓存行为 |
| Suffix 按钮 | `suffixButton` / `showAddSuffix` 替代下拉箭头 |
| 本地/远程模式 | `remoteConfig` 有无决定 `inputValue` 是否受控 + `filterOptions` 策略 |

### `DevTools` (`ui/DevTools.tsx`)

**仅 DEV 模式**，提供 Traces / Fields / State 三个面板。通过 `setInterval` 轮询数据。

---

## 5. 性能问题与修复建议

### P0 - 严重 (可能导致内存泄漏或卡顿)

#### 5.1 `useSchemaForm` 中 `form.store.subscribe` 过度触发

**文件**: `react/useSchemaForm.ts` L134-143

```typescript
const unsubscribe = form.store.subscribe(() => {
  const values = form.state.values;
  onValuesChange(values);
});
```

**问题**: `form.store.subscribe` 监听 TanStack Form Store 的**所有状态变更**（包括 meta、validation、isDirty 等），不仅仅是值变化。每次任何字段 blur/focus/validate 都会触发 `onValuesChange`。

**影响**: 高频触发回调，如果 `onValuesChange` 内有 setState 或网络请求，会导致严重性能问题。

**修复建议**:

```typescript
useEffect(() => {
  if (!onValuesChange) return;
  let prevValues = form.state.values;
  const unsubscribe = form.store.subscribe(() => {
    const currentValues = form.state.values;
    // 仅在 values 引用变化时触发
    if (currentValues !== prevValues) {
      prevValues = currentValues;
      onValuesChange(currentValues);
    }
  });
  return unsubscribe;
}, [form, onValuesChange]);
```

---

#### 5.2 `EffectSystem.deepFreeze` 对大表单的性能开销

**文件**: `core/runtime/EffectSystem.ts` `deepFreeze()` + `cloneDeep()`

**问题**: `flushUpdates` 每次执行都会 `cloneDeep` + `deepFreeze` 整个 `form.state.values`。对于有 FormList (大量行数据) 的表单，深拷贝 + 深冻结的开销很大，且每次字段变化都会触发。

**影响**: FormList 100+ 行时，每次单字段变化可能需要数十毫秒的深拷贝。

**修复建议**:

```typescript
// 方案 A: 仅在 DEV 模式下 freeze，生产环境跳过
private flushUpdates(depth = 0): void {
  const clonedValues = this.cloneDeep(this.form.state.values);
  const snapshotValues = this.config.enableTracing 
    ? this.deepFreeze(clonedValues) 
    : clonedValues;
  // ...
}

// 方案 B: 使用 structuredClone 替代手写 cloneDeep（浏览器原生，性能更优）
const clonedValues = structuredClone(this.form.state.values);
```

---

#### 5.3 `FormRuntime.destroy()` 未清理 `metaCache` 和 `pendingRules`

**文件**: `core/runtime/Runtime.ts` L148-153, `core/runtime/EffectSystem.ts`

```typescript
destroy(): void {
  this.asyncScheduler.cancelAll();
  this.asyncScheduler.clearCache();
  this.effectSystem.clearTraces();
  this.effectSystem.clearListeners();
  // ← 缺少 metaCache.clear() 和 pendingRules.clear()
}
```

**问题**: `FormRuntime.destroy()` 清理了 listeners 和 traces，但 `EffectSystem` 的 `metaCache` (存储所有字段 Meta 对象) 和 `pendingRules` (可能正在 microtask 队列中等待执行的规则集合) 未被清理。如果 Runtime 被重建（如 schema 变化触发 `useSchemaForm` 重新创建），旧的 `metaCache` 中的 FieldMeta 对象引用可能被 React 组件的 `useSyncExternalStore` 闭包持有，导致内存泄漏。此外，`isBatching` 标志位未重置，残留的 microtask 可能在新 Runtime 初始化后执行旧的 `flushUpdates`。

**影响**: 内存泄漏 + schema 动态切换时可能出现旧规则"幽灵执行"。

**修复建议**:

```typescript
// EffectSystem 添加完整的 destroy 方法
destroy(): void {
  this.clearListeners();
  this.clearTraces();
  this.metaCache.clear();
  this.pendingRules.clear();
  this.isBatching = false; // 防止残留 microtask 继续执行
}

// Runtime.destroy() 调用它
destroy(): void {
  this.asyncScheduler.cancelAll();
  this.asyncScheduler.clearCache();
  this.effectSystem.destroy();
}
```

---

#### 5.4 `AutocompleteWidget` 中 `useEffect` 依赖 `localOptions` 导致无限循环风险

**文件**: `ui/widgets/AutocompleteWidget.tsx` L599-639

```typescript
// 初始回显
useEffect(() => {
  const config = remoteConfigRef.current;
  if (!config?.fetchById || !value) return;
  const values = Array.isArray(value) ? value : [value];
  const missingValues = values.filter(
    (v) => !localOptions.some((o) => o.value === v)  // ← 读取 localOptions
  );
  if (missingValues.length === 0) return;

  Promise.all(missingValues.map(...)).then((items) => {
    setLocalOptions((prev) => { ... });  // ← 修改 localOptions
  });
}, [value, localOptions]);  // ← 同时依赖 localOptions
```

**问题**: 此 effect 依赖 `localOptions` 并在内部通过 `setLocalOptions` 修改它。正常路径下有 `missingValues.length === 0` 的 early return 保护。但有以下风险场景：

1. `fetchById` 返回的 OptionItem 对象的 `value` 字段类型不一致（如接口返回 `number` 而本地存储的是 `string`），导致 `some()` 对比永远为 false
2. `fetchById` 返回 null (接口异常)，`validItems` 为空不会修改 localOptions，但下一次渲染 localOptions 引用可能已变（被其他 setState 修改），再次触发 effect

虽然目前有 `missingValues` 检查作为保底，但这是一个 **脆弱的防线**。

**修复建议**:

```typescript
// 方案: 使用 ref 读取 localOptions 的最新值，将 localOptions 从依赖中移除
const localOptionsRef = useRef(localOptions);
localOptionsRef.current = localOptions;

useEffect(() => {
  const config = remoteConfigRef.current;
  if (!config?.fetchById || !value) return;
  const values = Array.isArray(value) ? value : [value];
  const missingValues = values.filter(
    (v) => !localOptionsRef.current.some((o) => o.value === v)
  );
  if (missingValues.length === 0) return;
  // ... 保持原有 fetch 逻辑
}, [value]); // 仅依赖 value，更安全
```

---

### P1 - 中等 (性能优化)

#### 5.5 DevTools 使用 `setInterval` 轮询

**文件**: `ui/DevTools.tsx` L143-164, `react/useRuntimeTraces.tsx`

**问题**: `FieldsView` 和 `StateView` 使用 `setInterval(update, 500)` 轮询 Runtime 状态。`useRuntimeTraces` 也使用 500ms 轮询。即使表单无任何操作，也每秒触发 6 次状态更新和重渲染。

**影响**: DEV 模式下持续的无意义渲染和 GC 压力。

**修复建议**:

```typescript
// 方案: 使用 Runtime 的订阅机制替代轮询
useEffect(() => {
  const unsubscribes: (() => void)[] = [];
  const fieldNames = Object.keys(runtime.getAllMeta());
  for (const name of fieldNames) {
    unsubscribes.push(runtime.subscribe(name, () => update()));
  }
  return () => unsubscribes.forEach(fn => fn());
}, [runtime]);
```

---

#### 5.6 `SchemaRenderer` 中 `render` 函数作为 prop 导致子组件每次重渲染

**文件**: `ui/SchemaRenderer.tsx` L98-149 (`FieldRenderer`)

**问题**: `FieldAdapter` 的 `render` prop 是一个内联箭头函数 `(props) => <Widget ... />`。即使 `FieldRenderer` 使用了 `memo`，每次父级重渲染都会创建新的 `render` 函数引用，导致 `FieldAdapter` 的 `memo` 失效。

**影响**: 表单重渲染时，所有字段都会重新执行 render 函数。

**修复建议**:

```typescript
// 方案: 将 render 提取为 useCallback 或使用 children 模式
// 由于 render 依赖 Widget/uiProps/disabled 等，可以用 useMemo 缓存
const renderWidget = useCallback(
  (props: WidgetProps) => (
    <Widget {...props} {...uiProps} 
      options={props.options?.length ? props.options : uiProps.options} 
    />
  ),
  [Widget, uiProps, disabled, readOnly]
);
```

> **注意**: 此问题影响有限，因为 `FieldAdapter` 内部通过 `useSyncExternalStore` 和 `form.Field` 有自己的优化路径。但在字段数量大 (50+) 时值得优化。

---

#### 5.7 `valibotValidator` 每次校验都检测 `isPresetRulesArray`

**文件**: `core/validation/valibotAdapter.ts` L20-38

**问题**: 每次字段 onChange/onBlur 校验时，都会执行 `isPresetRulesArray(schemaOrRules)` 检测。虽然检测本身很轻量，但 `presetToSchema()` 会在每次校验时重新创建 valibot schema。

**修复建议**:

```typescript
// 在 validator 创建时一次性转换，而不是每次校验时
export const valibotValidator = (schemaOrRules: any) => {
  const schema = isPresetRulesArray(schemaOrRules)
    ? presetToSchema(schemaOrRules)
    : schemaOrRules;
  
  return ({ value }: { value: any }) => {
    if (!schema) return undefined;
    const result = safeParse(schema, value);
    if (result.success) return undefined;
    return result.issues[0]?.message;
  };
};
```

---

#### 5.8 `EffectSystem.logTrace` 使用 `Array.shift()` 截断日志

**文件**: `core/runtime/EffectSystem.ts` L653-657

```typescript
while (this.traces.length > this.config.maxTraceCount) {
  this.traces.shift(); // O(n) 操作
}
```

**问题**: `Array.shift()` 是 O(n) 操作（需要移动所有元素）。当 `maxTraceCount` 设置较大（默认 1000）且规则执行频繁时，每次 `shift()` 都需要移动约 1000 个元素。在高频级联场景下（如拖动 Slider 触发实时计算），这会成为性能瓶颈。

**修复建议**:

```typescript
// 方案 A: 使用 splice 批量截断 (比逐个 shift 快)
if (this.traces.length > this.config.maxTraceCount) {
  const excess = this.traces.length - this.config.maxTraceCount;
  this.traces.splice(0, excess);
}

// 方案 B: 使用环形缓冲区 (O(1) 写入，最优方案)
// 需要修改 traces 的数据结构
```

---

### P2 - 轻微 (代码健壮性)

#### 5.9 `AsyncScheduler.cancelAll()` 未清除超时定时器

**文件**: `core/runtime/AsyncScheduler.ts` L213-219

**问题**: `cancelAll()` abort 了所有请求并清除了 `activeRequests` 和 `pendingPromises`，但 `schedule()` 中创建的 `setTimeout(timeoutId)` 可能仍在运行。虽然 abort 后 controller 已失效不会造成功能问题，但残留的定时器是资源浪费。

**修复建议**:

```typescript
// 方案: 在 RequestState 中保存 timeoutId
type RequestState = {
  controller: AbortController;
  hash: string;
  startTime: number;
  timeoutId: ReturnType<typeof setTimeout>; // 新增
};

cancelAll(): void {
  for (const [, request] of this.activeRequests) {
    request.controller.abort();
    clearTimeout(request.timeoutId); // 清除定时器
  }
  this.activeRequests.clear();
  this.pendingPromises.clear();
}
```

---

#### 5.10 `EffectSystem.cloneDeep` 不处理 `Date`、`RegExp`、`Map`、`Set` 等特殊对象

**文件**: `core/runtime/EffectSystem.ts` L545-557

**问题**: `cloneDeep` 只处理普通对象和数组。如果表单值中包含 `Date` 对象（DateWidget 的值），深拷贝后会变成空对象 `{}`。

**修复建议**:

```typescript
private cloneDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags) as unknown as T;
  if (Array.isArray(obj)) {
    return obj.map(item => this.cloneDeep(item)) as unknown as T;
  }
  // ... 原有逻辑
}
```

---

#### 5.11 `useValidationPresetsContext` 中条件调用 Hook

**文件**: `react/useValidationPresets.tsx` L277-285

```typescript
export function useValidationPresetsContext(): UseValidationPresetsReturn {
  const context = useContext(ValidationPresetsContext);
  if (!context) {
    return useValidationPresets(); // ← 条件调用 Hook，违反 Rules of Hooks
  }
  return context;
}
```

**问题**: 条件调用 `useValidationPresets()` 违反 React Hooks 规则。虽然 eslint 已通过注释禁用检查，但在 React 严格模式或并发模式下可能导致不可预测的行为。

**修复建议**:

```typescript
export function useValidationPresetsContext(): UseValidationPresetsReturn {
  const context = useContext(ValidationPresetsContext);
  // 始终调用 hook，但根据 context 决定使用哪个结果
  const fallback = useValidationPresets();
  return context ?? fallback;
}
```

---

### 总结优先级

| 优先级 | 问题 | 影响 | 修复难度 |
|--------|------|------|---------|
| **P0** | 5.1 store.subscribe 过度触发 | 高频回调导致卡顿 | 低 |
| **P0** | 5.2 deepFreeze 大表单开销 | FormList 大数据量卡顿 | 低 |
| **P0** | 5.3 destroy 未清理 metaCache / pendingRules | 内存泄漏 + 幽灵执行 | 低 |
| **P0** | 5.4 useEffect 依赖 localOptions | 无限循环风险 | 中 |
| **P1** | 5.5 DevTools 轮询 | DEV 持续渲染 | 中 |
| **P1** | 5.6 render prop 导致重渲染 | 大表单渲染开销 | 中 |
| **P1** | 5.7 validator 重复创建 schema | 校验性能 | 低 |
| **P1** | 5.8 traces.shift() 性能 | 高频场景卡顿 | 低 |
| **P2** | 5.9 cancelAll 未清超时 | 资源浪费 | 低 |
| **P2** | 5.10 cloneDeep 不支持 Date | Date 字段值丢失 | 低 |
| **P2** | 5.11 条件调用 Hook | 潜在 Hooks 规则违反 | 低 |
