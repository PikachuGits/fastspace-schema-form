# Widgets 与扩展机制

Widget 是“字段渲染的最小单元”，负责把 RHF 的 `field` 与 MUI 组件绑定起来。Schema 里的 `component` 最终会映射到一个 Widget 组件。

## 1. Widget 接口

核心类型：

- `WidgetProps`：`src/types.ts:283`
- `WidgetComponent`：`src/types.ts:317`

`WidgetProps` 关键字段：

- `field`：RHF `Controller` 注入的字段对象（value/onChange/onBlur/ref）
- `fieldProps`：透传属性（Schema 的 `ui.props` + `fieldProps` 合并后再注入，同时注入 disabled/required/readOnly/placeholder）
  - 合并发生在 `FieldRenderer`：`src/ui/components/FieldRenderer.tsx:158`
- `options`：Select/Radio/Autocomplete 等使用
- `form`：RHF 实例（用于 `trigger`、`setValue` 等）
- `schema` / `widgets` / `optionsMap`：用于 `Group` / `FormList` 的嵌套渲染

## 2. 默认 Widget 映射

默认映射表：`src/ui/widgets/index.tsx:64`。

要点：

- `Select` 与 `Autocomplete` 统一使用 `AutocompleteWidget`（`src/ui/widgets/index.tsx:71`）
- 同时提供大小写与部分兼容写法（如 `formlist`、`formList`）

## 3. SchemaForm 如何选择 Widget

### 3.1 顶层字段

`FieldRenderer` 的映射逻辑（`src/ui/components/FieldRenderer.tsx:121`）：

- `const Widget = widgets[field.component] ?? widgets.Text`

即：

- Schema 写 `component: "Text"` → `defaultWidgets.Text`
- Schema 写自定义字符串 `component: "MyWidget"` → 你需要在 `SchemaForm` 的 `widgets` prop 中提供同名映射

### 3.2 嵌套字段（Group / FormList）

`Group` 与 `FormList` 不直接绑定 RHF `Controller`，因为它们本质上是“布局/容器”：

- `FieldRenderer` 对其走“嵌套分支”（`src/ui/components/FieldRenderer.tsx:129`）
- 通过传入 `schema` / `widgets` / `optionsMap` 让容器内部继续渲染子字段

## 4. 选项数据的三种来源

对 “有 options 概念” 的 Widget（Select/Radio/Autocomplete）：

1. `optionsMap[field.name]`（异步请求结果，优先级最高）
2. `field.ui.options`（静态选项）
3. 默认 `[]`

见 `src/ui/components/FieldRenderer.tsx:123`。

### 4.1 `ui.optionRequest`：SchemaForm 统一加载

`SchemaForm` 内部的 `useAsyncOptions` 会扫描所有字段（`parsed.allFields`）并执行请求（`src/ui/SchemaForm.tsx:70`）。

触发规则：

- 字段配置了 `ui.optionRequest`
- 且满足“首次加载/依赖变化”（依赖来自 `field.dependencies`）

### 4.2 `ui.remoteConfig`：AutocompleteWidget 自己加载

`AutocompleteWidget` 支持远程搜索/分页（`src/ui/widgets/AutocompleteWidget.tsx:279`），通过 `RemoteConfig.fetchOptions(keyword, page, pageSize)` 拉取数据。

它与 `ui.optionRequest` 的区别：

- `remoteConfig`：面向“输入即搜索 + 分页”，Widget 内部维护 `localOptions`
- `optionRequest`：面向“依赖驱动的联动选项”（如省市区级联），由 SchemaForm 统一加载并下发 `optionsMap`

## 5. 内置 Widgets 行为要点

### 5.1 AutocompleteWidget（含 Select）

实现：`src/ui/widgets/AutocompleteWidget.tsx`。

- 单选返回 `option.value`，多选返回 `value[]`（`src/ui/widgets/AutocompleteWidget.tsx:469`）
- 触发校验：每次选择后会 `form?.trigger(field.name)`（`src/ui/widgets/AutocompleteWidget.tsx:485`）
- 支持 `OptionItem.key` 避免 key 冲突（`src/ui/widgets/AutocompleteWidget.tsx:525`）

### 5.2 FormListWidget

实现：`src/ui/widgets/FormListWidget.tsx`。

- 使用 `useFieldArray` 管理行（`src/ui/widgets/FormListWidget.tsx:97`）
- 支持新增/删除/复制（`src/ui/widgets/FormListWidget.tsx:167`、`src/ui/widgets/FormListWidget.tsx:174`）
- 行内 compute：由字段 blur 触发（`src/ui/widgets/FormListWidget.tsx:248`）

### 5.3 GroupWidget

实现：`src/ui/widgets/GroupWidget.tsx`。

- 用于把多个字段在一行内布局（内部也是 `Grid container`）
- 优先使用上层传入的 `values`（避免全量订阅），否则回退 `form.watch()`（`src/ui/widgets/GroupWidget.tsx:43`）

### 5.4 CustomWidget

实现：`src/ui/widgets/CustomWidget.tsx`。

三种模式（由 `fieldProps` 驱动）：

- `children` 是函数：返回一个 render props，可直接拿到 `field/form/values`（`src/ui/widgets/CustomWidget.tsx:19`）
- `component: Component`：渲染自定义组件并注入 `field` 等（`src/ui/widgets/CustomWidget.tsx:35`）
- 都没有：降级为 `TextField`

## 6. 自定义 Widget（推荐方式）

### 6.1 编写 Widget

你只需要实现一个 `WidgetComponent`：

```tsx
import { TextField } from "@mui/material";
import type { WidgetComponent } from "@fastspace/schema-form";

export const UppercaseTextWidget: WidgetComponent = ({ field, label, error, helperText, fieldProps }) => {
  return (
    <TextField
      {...field}
      label={label}
      error={error}
      helperText={helperText}
      value={typeof field.value === "string" ? field.value.toUpperCase() : field.value ?? ""}
      disabled={fieldProps?.disabled}
      fullWidth
      size="small"
    />
  );
};
```

### 6.2 注入到 SchemaForm

```tsx
<SchemaForm
  schema={schema}
  widgets={{
    UppercaseText: UppercaseTextWidget,
  }}
/>
```

然后在 schema 中使用：

```ts
{ name: "title", component: "UppercaseText" }
```

