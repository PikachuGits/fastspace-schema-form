# 最佳实践与常见坑

本章聚焦“在业务项目里如何用得稳、用得快、好排查”。

## 1. Schema 与引用稳定性

### 1.1 Schema 建议 useMemo 保持引用稳定

如果 Schema 在每次渲染都创建新对象，会导致：

- `parseSchema` 重新执行（`src/ui/SchemaForm.tsx:188`）
- 异步选项状态重置（`useAsyncOptions` 依赖 `fields`，见 `src/ui/SchemaForm.tsx:56`）
- FieldRenderer 的 memo 优化失效（`prev.field !== next.field`，见 `src/ui/components/FieldRenderer.tsx:193`）

示例中已明确建议缓存 Schema（见 `src/SchemaForm.example.tsx:563`）。

## 2. defaultValues 的语义（非常重要）

`SchemaForm` 会在首次渲染时把 `parsed.defaultValues + props.defaultValues` 合并并锁定到 `initialDefaultValuesRef`（见 `src/ui/SchemaForm.tsx:196`）。

这意味着：

- `defaultValues` 只用于“首次初始化”
- 后续想用新默认值“重置表单”，需要你显式调用 `ref.reset(newValues)` 或通过 key 让组件重挂载

业务侧如果把响应式 state 拼进 `defaultValues`，通常会触发表单被动重置（历史问题详见 `src/DEFAULTVALUES_FIX.md`）。

## 3. dependencies 的正确用法

本项目里 `dependencies` 不只是“语义描述”，它会驱动三类机制：

### 3.1 依赖变化自动清空（级联）

只有配置了 `field.dependencies` 的字段才会参与“依赖变更后清空值”（`src/ui/SchemaForm.tsx:268`）。

典型用法：省市区级联，`district` 依赖 `city`，当 city 变更时清空 district。

### 3.2 异步 optionRequest 重新请求

`ui.optionRequest` 的重新请求判断只看 `field.dependencies`（`src/ui/SchemaForm.tsx:76`），因此：

- 如果你期望“依赖字段变了重新拉选项”，必须填写 `dependencies`

### 3.3 watchFields（影响联动/计算触发）

`getWatchFields` 会把 `dependencies` 加入 `useWatch`（`src/core/engine/fieldState.ts:128`），从而让 `values` 更新，驱动：

- 条件状态重算（visible/disabled/required）
- auto reset（级联清空）
- compute（主表单）

## 4. compute 的坑：务必显式声明 `compute.dependencies`

主表单 compute 的计算依赖，会在运行时从表达式自动提取（`src/ui/SchemaForm.tsx:324`），但 watchFields 的收集并不会自动解析表达式，只会读取 `compute.dependencies`（`src/core/engine/fieldState.ts:141`）。

结果是：

- 如果你只写了 `compute.expr`，但没写 `compute.dependencies`，依赖字段可能不会被订阅到 `values` 中，导致 compute 不触发或触发不稳定

建议写法（示例见 `src/SchemaForm.compute.example.tsx:69`）：

```ts
compute: {
  expr: "price * quantity",
  dependencies: ["price", "quantity"],
}
```

FormList 的 compute 是“行内 blur 触发”，不依赖 watchFields（`src/ui/widgets/FormListWidget.tsx:111`），但仍建议写 `dependencies`，避免表达式解析误判。

## 5. 条件表达式的字段路径

条件引擎支持 `a.b.c` 形式的嵌套路径读取（`src/core/engine/condition.ts:24`），因此：

- 对 FormList 行内条件，可通过在 FormList 内部合并 `mergedValues` 支持行字段直读（`src/ui/widgets/FormListWidget.tsx:198`）

但函数条件 `((values) => boolean)` 无法静态分析依赖，FieldRenderer 会放弃 memo（`src/ui/components/FieldRenderer.tsx:53`），建议谨慎使用。

## 6. Autocomplete 远程搜索建议

`ui.remoteConfig` 用于“输入即搜索 + 分页”。为了保证默认值可回显：

- 建议实现 `fetchById`（`src/types.ts:107`）
- 内部会在 mount 时按默认值补齐 option（`src/ui/widgets/AutocompleteWidget.tsx:229`）

## 7. 排查手册（常见现象 → 可能原因）

- compute 不更新：缺少 `compute.dependencies`（见第 4 节）
- optionRequest 没有重拉：缺少 `field.dependencies`（见第 3.2 节）
- 某字段频繁重渲染：Schema/FieldSchema 引用不稳定（见第 1 节）或使用了函数条件
- 提交值缺字段：字段设置了 `noSubmit`（`src/ui/SchemaForm.tsx:430`）或字段名不在 `parsed.allFields`（schema 写法问题）

