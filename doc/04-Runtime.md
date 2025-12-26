# 运行时链路（Schema → 渲染 → 联动/计算 → 校验/提交）

本章从 `SchemaForm` 内部实现出发，梳理一次完整的运行时路径，便于你定位“为什么字段会重渲染/为什么会触发请求/为什么校验规则会变化”等问题。

核心实现文件：`src/ui/SchemaForm.tsx`。

## 1. 初始化阶段

### 1.1 Schema 解析（预处理）

`SchemaForm` 对输入 `schema` 进行解析缓存：

- `parseSchema(schema)`：构建 `fieldMap`、`dependencyGraph`、`defaultValues`、`allFields`（见 `src/ui/SchemaForm.tsx:188`）
- 实现位于 `src/core/parser/schemaParser.ts:49`

解析时做了三件事：

- 扁平化字段：递归收集 `columns`（`Group` 等嵌套）得到 `allFields`（`src/core/parser/schemaParser.ts:57`）
- 收集默认值：读取字段 `defaultValue` 汇总到 `parsed.defaultValues`（`src/core/parser/schemaParser.ts:65`）
- 构建依赖图：综合 `dependencies`、条件表达式依赖、计算表达式依赖（`src/core/parser/schemaParser.ts:79`）

### 1.2 defaultValues 只在首次生效

`SchemaForm` 使用 `initialDefaultValuesRef`，把 Schema 默认值与外部 `defaultValues` 合并后“锁定”为首次默认值（见 `src/ui/SchemaForm.tsx:196`）。

结果是：

- 首次渲染时，`react-hook-form` 初始化 defaultValues
- 之后父组件即使传入新的 `defaultValues` 引用，也不会自动重置表单

### 1.3 动态校验 resolver

校验通过 `createDynamicResolver(parsed)` 创建（见 `src/ui/SchemaForm.tsx:211`），并作为 RHF resolver 注入：

- `useForm({ resolver, mode: "onBlur" })`（见 `src/ui/SchemaForm.tsx:215`）
- resolver 会在每次校验时根据“当前 values”动态生成 Valibot schema（见 `src/core/validation/valibotAdapter.ts:357`）

## 2. 订阅与渲染阶段（性能关键）

### 2.1 watchFields：只订阅“引擎所需字段”

`SchemaForm` 不做全量 `watch()`，而是用 `getWatchFields(parsed)` 计算需要订阅的字段集合（见 `src/ui/SchemaForm.tsx:223`），然后：

- `useWatch({ name: watchFields })`（见 `src/ui/SchemaForm.tsx:232`）
- 将 watch 返回的数组映射回 `values` 对象（仅包含依赖字段）（见 `src/ui/SchemaForm.tsx:239`）

`getWatchFields` 的来源（`src/core/engine/fieldState.ts:123`）：

- `field.dependencies`
- 条件依赖：`visibleWhen` / `disabledWhen` / `requiredWhen`（可静态提取时）
- 计算依赖：仅当 `field.compute.dependencies` 显式提供时才会加入

这会直接影响：

- 条件状态是否会随某字段变化而刷新
- compute 是否能在依赖变化时触发（见“最佳实践”章节）

### 2.2 异步选项加载：`useAsyncOptions`

`useAsyncOptions(parsed.allFields, values)` 输出 `optionsMap`（见 `src/ui/SchemaForm.tsx:250`）。

特点：

- 只处理配置了 `ui.optionRequest` 的字段（`src/ui/SchemaForm.tsx:72`）
- 依赖变化判定只看 `field.dependencies`（`src/ui/SchemaForm.tsx:76`）
- 通过 requestId 解决竞态，保证“最后一次请求结果”胜出（`src/ui/SchemaForm.tsx:115`）

### 2.3 字段渲染：`FieldRenderer`

顶层字段遍历在 `src/ui/SchemaForm.tsx:487`，每个字段交给 `FieldRenderer`：

- `FieldRenderer` 会计算字段运行时状态：`visible/disabled/required/readonly`（`src/ui/components/FieldRenderer.tsx:113`）
- 不可见则直接不渲染（`src/ui/components/FieldRenderer.tsx:116`）
- 通过 RHF `Controller` 绑定到具体 Widget（`src/ui/components/FieldRenderer.tsx:150`）
- `options` 来源优先级：`optionsMap[field.name]` → `field.ui.options`（`src/ui/components/FieldRenderer.tsx:123`）

渲染优化：

- `FieldRenderer` 使用 `memo`，并仅在“依赖字段值变化”时重渲染（`src/ui/components/FieldRenderer.tsx:191`）
- 依赖收集基于条件表达式与 `field.dependencies`（`src/ui/components/FieldRenderer.tsx:47`）

## 3. 联动与副作用

### 3.1 依赖变化自动清空（级联）

当 `values`（依赖字段）变化时，SchemaForm 会扫描所有字段：

- 仅对“显式配置了 `field.dependencies` 的字段”生效（避免误伤 `visibleWhen` 等场景）
- 若其依赖字段本次发生变化，并且当前字段有值，则清空为 `null`（`src/ui/SchemaForm.tsx:267`）

### 3.2 onValuesChange 回调

虽然内部只订阅了依赖字段，但回调会用 `methods.getValues()` 取全量数据（`src/ui/SchemaForm.tsx:315`）。

触发频率：依赖字段变化时触发（不是每个字段变化都触发）。

### 3.3 compute 自动计算（主表单）

`computeFieldsInfo` 预计算所有 compute 字段及依赖（`src/ui/SchemaForm.tsx:319`），随后：

- 若依赖快照变化且依赖值完整，则计算 `evaluateCompute`（`src/ui/SchemaForm.tsx:364`、`src/core/engine/compute.ts:42`）
- 批量更新采用 `methods.reset({ ...currentValues, ...updates })`（`src/ui/SchemaForm.tsx:400`）

### 3.4 compute 自动计算（FormList 行内）

`FormListWidget` 的计算触发是“行内字段 onBlur 触发”，而不是 watch（`src/ui/widgets/FormListWidget.tsx:111`）：

- 当某字段 blur，若它是其他 compute 字段的依赖，则在当前行计算并 `setValue` 更新
- 依赖来自 `compute.dependencies` 或表达式提取（`src/ui/widgets/FormListWidget.tsx:62`）

## 4. 提交阶段

`handleSubmit` 会遍历 `parsed.allFields` 组装 payload（`src/ui/SchemaForm.tsx:428`）：

- 跳过 `noSubmit`
- 优先使用 RHF 校验后的 `data[name]`，缺失则回退 `methods.getValues()`（`src/ui/SchemaForm.tsx:437`）
- 若有 `transform` 则在提交前转换（`src/ui/SchemaForm.tsx:439`）

同时通过 `ref` 暴露：

- `submit()`：触发 RHF `handleSubmit`（`src/ui/SchemaForm.tsx:459`）
- `getFormValues()`：按 `noSubmit` 过滤后的全量值（`src/ui/SchemaForm.tsx:462`）
- `setValues()`：批量 setValue（`src/ui/SchemaForm.tsx:472`）

