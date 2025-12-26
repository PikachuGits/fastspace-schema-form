# Schema 设计与写法

本库以 `SchemaInput` 为顶层入口（见 `src/types.ts:255`），通过 `fields` 描述表单结构。每个字段由 `FieldSchema` 描述（见 `src/types.ts:137`）。

## 1. 顶层结构：`SchemaInput`

```ts
export type SchemaInput<T extends FieldValues = FieldValues> = {
  fields: FieldSchema<T>[];
  layout?: LayoutConfig;
};
```

- `fields`：字段数组（可包含 `Group` / `FormList` 等复合字段）
- `layout`：目前仅在 `SchemaForm` 中用于读取 `spacing`（见 `src/ui/SchemaForm.tsx:520`），布局容器本身由 `grid` prop 控制（见 `src/ui/SchemaForm.tsx:526`）

## 2. 字段结构：`FieldSchema`

必填字段：

- `name`：字段名，对应表单数据 key，类型是 `Path<T>`（见 `src/types.ts:139`）
- `component`：组件类型（内置枚举或自定义字符串）（见 `src/types.ts:142`）

常用可选字段（按能力分类）：

### 2.1 UI 配置：`ui`

见 `src/types.ts:148`：

- `ui.label`：展示标签
- `ui.placeholder`：占位提示
- `ui.helperText`：辅助文案（校验错误优先显示）
- `ui.options`：静态选项（Select/Radio/Autocomplete）
- `ui.optionRequest(values)`：异步获取选项（由 `SchemaForm` 统一调度，见 `src/ui/SchemaForm.tsx:43`）
- `ui.remoteConfig`：Autocomplete 远程搜索/分页（见 `src/types.ts:87`，实现见 `src/ui/widgets/AutocompleteWidget.tsx:279`）
- `ui.props`：透传到具体 Widget 的属性

### 2.2 布局：`colSpan` / `newLine`

- `colSpan`：基于 MUI Grid 的响应式列宽（见 `src/types.ts:169`）
- `newLine`：grid 模式下强制换行（见 `src/ui/SchemaForm.tsx:494`）

### 2.3 嵌套：`columns`

用于两类复合组件：

- `Group`：把多个字段组合在一行内（见 `src/ui/widgets/GroupWidget.tsx:24`）
- `FormList`：动态列表字段（见 `src/ui/widgets/FormListWidget.tsx:84`）

`columns` 内部字段仍然是 `FieldSchema`，因此可以递归嵌套 `Group`。

### 2.4 校验：`rules`

`rules` 是数组，类型为 `ValidationRule`（见 `src/types.ts:9`）。运行时会被动态转换成 Valibot schema（见 `src/core/validation/valibotAdapter.ts:324`）。

### 2.5 条件控制：`visibleWhen` / `disabledWhen` / `requiredWhen`

条件表达式类型是 `ConditionExpression`（见 `src/types.ts:50`），支持：

- 简单条件：`{ field: "a", eq: 1 }`、`{ field: "b", notEmpty: true }`
- 复合条件：`{ and: [...] }` / `{ or: [...] }` / `{ not: ... }`
- 函数条件：`(values) => boolean`

条件求值由 `evaluateCondition` 执行（见 `src/core/engine/condition.ts:141`）。

### 2.6 计算字段：`compute`

`compute` 类型是 `ComputeConfig`（见 `src/types.ts:60`）：

- `expr`：表达式字符串（例如 `"price * quantity"`）
- `dependencies`：依赖字段名数组（建议显式填写）
- `precision` / `roundMode`：数值精度与舍入策略

主表单的计算逻辑在 `src/ui/SchemaForm.tsx:319`，FormList 行内计算在 `src/ui/widgets/FormListWidget.tsx:111`。

### 2.7 数据处理：`transform` / `noSubmit`

提交阶段会遍历 `parsed.allFields` 组装最终 payload（见 `src/ui/SchemaForm.tsx:428`）：

- `transform(value, values)`：提交前转换字段值（`values` 为全量表单值）
- `noSubmit`：该字段不参与最终提交与 `getFormValues()` 输出

### 2.8 依赖：`dependencies`

`dependencies` 是“显式依赖声明”，本项目有三处会使用它：

- 异步选项重新加载：`useAsyncOptions` 只读 `field.dependencies`（见 `src/ui/SchemaForm.tsx:76`）
- 依赖变化自动清空：仅对配置了 `dependencies` 的字段生效（见 `src/ui/SchemaForm.tsx:268`）
- watch 订阅字段集合：`getWatchFields` 会把 `dependencies` 加入 `useWatch`（见 `src/core/engine/fieldState.ts:128`）

## 3. 组件类型：`ComponentType`

内置枚举见 `src/types.ts:115`，常见包括：

- 输入：`Text` / `Password` / `Number` / `Textarea`
- 选择：`Select` / `Autocomplete` / `Radio` / `Checkbox` / `Switch`
- 时间：`Date` / `Time` / `DateTime`
- 复合：`Group` / `FormList`
- 其他：`Hidden` / `Custom`

`component` 也允许传入任意字符串，但需要你提供同名 widget（通过 `SchemaForm` 的 `widgets` prop 注入，见 `src/ui/SchemaForm.tsx:167`）。

