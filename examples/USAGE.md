# Schema Form 使用文档（基于代码扫描）

本说明基于 `package/` 源码与 `examples/` 示例汇总整理，覆盖 Schema 结构、组件参数、验证规则与常见用法。

## 快速开始

```tsx
import { SchemaForm, type SchemaFormInstance, type SchemaInput } from "@fastspace/schema-form";
import { useRef } from "react";

const schema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    { name: "username", component: "Text", ui: { label: "用户名" } },
    { name: "email", component: "Text", ui: { label: "邮箱" } },
  ],
};

export function Demo() {
  const ref = useRef<SchemaFormInstance>(null);
  return (
    <SchemaForm
      ref={ref}
      schema={schema}
      onSubmit={(values) => console.log(values)}
    />
  );
}
```

## Schema 结构

### SchemaInput

| 字段 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| `meta` | `{ version: string; compatibleWith?: string[] }` | 否 | Schema 版本与兼容信息 | `{ version: "1.0.0", compatibleWith: ["^1.0.0"] }` |
| `fields` | `SchemaField[]` | 是 | 字段列表 | `fields: [...]` |

### SchemaField（字段定义）

| 字段 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| `name` | `string` | 是 | 字段名（表单数据 key） | `"username"` |
| `component` | `string` | 是 | 组件类型 | `"Text" \| "Select" \| "FormList"` |
| `defaultValue` | `any` | 否 | 默认值 | `""` / `0` / `{}` |
| `validate` | `PresetRule[] \| ValibotSchema` | 否 | 验证规则 | `[{ type: "required" }]` |
| `options` | `any[] \| (scope, signal) => Promise<any[]> \| { fetcher, deps }` | 否 | 选项配置（选择类） | 见下方 |
| `visibleWhen` | `string \| (scope) => boolean` | 否 | 条件显示 | `"userType === 'enterprise'"` |
| `disabledWhen` | `string \| (scope) => boolean` | 否 | 条件禁用 | `"!enableAdvanced"` |
| `requiredWhen` | `string \| (scope) => boolean` | 否 | 条件必填 | `"needInvoice"` |
| `compute` | `string \| (scope) => any` | 否 | 派生计算 | `"price * count"` |
| `colSpan` | `number \| Record<string, number>` | 否 | 栅格宽度（MUI Grid） | `6` / `{ xs: 12, md: 6 }` |
| `independent` | `boolean` | 否 | 独占一行 | `true` |
| `children` | `SchemaField[]` | 否 | 子字段（Group/FormList） | `children: [...]` |
| `ui` | `Record<string, any>` | 否 | UI 配置 | `ui: { label, placeholder }` |

### options 支持的三种形式

```ts
// 1) 静态数组
options: [{ label: "北京", value: "bj" }]

// 2) 异步函数（无 deps）
options: async (scope, signal) => fetchOptions(scope, signal)

// 3) 异步函数 + deps（级联推荐）
options: { fetcher: async (scope, signal) => fetchByDeps(scope), deps: ["province"] }
```

## SchemaForm 组件

### Props

| 属性 | 类型 | 说明 |
|---|---|---|
| `schema` | `SchemaInput` | Schema 定义 |
| `defaultValues` | `Partial<T>` | 默认值 |
| `onSubmit` | `(values: T) => void \| Promise<void>` | 提交回调 |
| `onValuesChange` | `(values: T) => void` | 值变化回调 |
| `onSubmitFailed` | `(errors: any) => void` | 提交失败回调 |
| `widgets` | `WidgetRegistry` | 自定义 Widget |
| `disabled` | `boolean` | 全局禁用 |
| `readOnly` | `boolean` | 全局只读 |
| `spacing` | `number` | Grid 间距 |
| `formProps` | `Omit<FormHTMLAttributes, "onSubmit">` | 透传到 form 标签 |
| `children` | `ReactNode` | 额外内容（按钮等） |
| `sx` | `any` | 容器样式 |
| `compilerOptions` | `CompilerOptions` | 编译器配置 |
| `runtimeConfig` | `RuntimeConfig` | 运行时配置 |

### SchemaFormInstance（ref 暴露方法）

| 方法 | 签名 | 说明 |
|---|---|---|
| `submit` | `() => void` | 提交表单 |
| `reset` | `() => void` | 重置表单 |
| `getValues` | `() => T` | 获取表单值 |
| `setValue` | `(name, value) => void` | 设置单值 |
| `setValues` | `(values) => void` | 批量设置 |
| `validate` | `(name?) => Promise<boolean>` | 校验 |
| `clearErrors` | `(name?) => void` | 清除错误 |
| `getForm` | `() => TanStackForm` | 获取原始 form |
| `getRuntime` | `() => FormRuntime` | 获取运行时 |
| `getCompiledSchema` | `() => CompiledSchema` | 获取编译后 Schema |

## Hook

### useSchemaForm

| 返回值 | 说明 |
|---|---|
| `form` | TanStack Form 实例 |
| `runtime` | Runtime 实例 |
| `compiledSchema` | 编译后的 Schema |
| `handleSubmit` | 提交 |
| `handleReset` | 重置 |
| `getValues` | 获取值 |
| `setValue` | 设置值 |

### useValidationPresets

| 方法 | 说明 |
|---|---|
| `register` | 注册规则 |
| `override` | 覆盖规则 |
| `extend` | 批量扩展 |
| `has` | 是否存在 |
| `getNames` | 规则名列表 |
| `toSchema` | 手动转换为 Valibot |

## 验证规则（内置预设）

| 规则 | 参数 | 说明 |
|---|---|---|
| `required` | - | 必填 |
| `email` | - | 邮箱 |
| `phone` | - | 中国大陆手机号 |
| `url` | - | URL |
| `idCard` | - | 中国大陆 18 位身份证 |
| `minLength` | `value: number` | 最小长度 |
| `maxLength` | `value: number` | 最大长度 |
| `min` | `value: number` | 最小值 |
| `max` | `value: number` | 最大值 |
| `pattern` | `value: RegExp \| string` | 正则匹配 |
| `integer` | - | 整数 |
| `positive` | - | 正数 |
| `negative` | - | 负数 |
| `alphanumeric` | - | 字母数字 |
| `chinese` | - | 中文字符 |

## Widget 组件与 UI 参数

说明：`ui` 中未列出的通用字段（`label`/`placeholder`/`helperText`/`disabled`/`required`/`readOnly`）均可透传。

### Text

| 参数 | 类型 | 说明 |
|---|---|---|
| `label` | `string` | 标签 |
| `placeholder` | `string` | 占位 |
| `helperText` | `string` | 辅助文本 |
| `multiline` | `boolean` | 多行 |
| `rows` | `number` | 行数 |
| `type` | `"text" \| "password" \| "email" \| "url" \| "tel"` | 输入类型 |
| `inputProps` | `Record<string, any>` | 传递给 input |
| `slotProps` | `TextFieldProps["slotProps"]` | 传递给 MUI |

### Password

| 参数 | 类型 | 说明 |
|---|---|---|
| `label` | `string` | 标签 |
| `placeholder` | `string` | 占位 |
| `helperText` | `string` | 辅助文本 |

### Textarea

| 参数 | 类型 | 说明 |
|---|---|---|
| `label` | `string` | 标签 |
| `placeholder` | `string` | 占位 |
| `helperText` | `string` | 辅助文本 |
| `rows` | `number` | 最小行数 |
| `maxRows` | `number` | 最大行数 |
| `maxLength` | `number` | 最大长度 |
| `inputProps` | `Record<string, any>` | 传递给 input |
| `slotProps` | `TextFieldProps["slotProps"]` | 传递给 MUI |

### Number

| 参数 | 类型 | 说明 |
|---|---|---|
| `label` | `string` | 标签 |
| `placeholder` | `string` | 占位 |
| `helperText` | `string` | 辅助文本 |
| `min` | `number` | 最小值 |
| `max` | `number` | 最大值 |
| `step` | `number` | 步长 |
| `inputProps` | `Record<string, any>` | 传递给 input |
| `slotProps` | `TextFieldProps["slotProps"]` | 传递给 MUI |

### Select / Autocomplete（Select 为 Autocomplete 别名）

| 参数 | 类型 | 说明 |
|---|---|---|
| `multiple` | `boolean` | 多选 |
| `freeSolo` | `boolean` | 允许自由输入 |
| `optionLabelProp` | `string` | 选项显示字段，默认 `label` |
| `optionValueProp` | `string` | 选项值字段，默认 `value` |
| `emptyText` | `string` | 无数据提示 |
| `clearable` | `boolean` | 是否显示清空 |
| `showAddSuffix` | `boolean \| (searchValue, hasOptions) => ButtonConfig` | 显示新增按钮 |
| `suffixButton` | `(searchValue, hasOptions) => ButtonConfig` | 自定义按钮 |
| `onAddOptionSuccess` | `(option, ctx) => void` | 新增成功回调 |
| `autoSelectNewOption` | `boolean` | 自动选中新增项 |
| `refreshOnOpen` | `boolean` | 打开时刷新 |
| `searchClearConfig` | `SearchClearConfig` | 搜索清空配置 |
| `remoteConfig` | `RemoteConfig` | 远程搜索配置 |

#### OptionItem

| 字段 | 类型 | 说明 |
|---|---|---|
| `label` | `string` | 选项显示 |
| `value` | `string \| number \| boolean \| null` | 选项值 |
| `disabled` | `boolean` | 禁用 |
| `key` | `string \| number` | 可选 key |
| `listLabel` | `ReactNode` | 列表展示文本 |

#### RemoteConfig

| 字段 | 类型 | 说明 |
|---|---|---|
| `fetchOptions` | `(keyword, page, pageSize) => Promise<{data,total,hasMore}>` | 搜索接口 |
| `fetchById` | `(value) => Promise<OptionItem \| null>` | 回显接口 |
| `pageSize` | `number` | 每页条数 |
| `debounceTimeout` | `number` | 防抖时间 |
| `minSearchLength` | `number` | 最小搜索字符 |
| `onLoadingChange` | `(loading) => void` | 加载回调 |

#### SearchClearConfig

| 字段 | 类型 | 说明 |
|---|---|---|
| `keepSearchOnClose` | `boolean` | 关闭面板不清空 |
| `keepSearchOnSelect` | `boolean` | 选中后不清空 |
| `cacheSearchKeyword` | `boolean` | 缓存搜索词 |
| `clearValueOnly` | `boolean` | 仅清空值 |

### Radio

| 参数 | 类型 | 说明 |
|---|---|---|
| `row` | `boolean` | 横向排列 |
| `inline` | `boolean` | label 与组件同行 |
| `radioProps` | `Partial<RadioProps>` | 透传 |

### Checkbox

| 参数 | 类型 | 说明 |
|---|---|---|
| `checkboxProps` | `Partial<CheckboxProps>` | 透传 |

### Switch

| 参数 | 类型 | 说明 |
|---|---|---|
| `switchProps` | `Partial<SwitchProps>` | 透传 |

### Slider

| 参数 | 类型 | 说明 |
|---|---|---|
| `min` | `number` | 最小值 |
| `max` | `number` | 最大值 |
| `step` | `number` | 步长 |
| `marks` | `boolean \| { value; label? }[]` | 刻度 |
| `valueLabelDisplay` | `"on" \| "auto" \| "off"` | 值显示 |
| `showValue` | `boolean` | 显示当前值 |
| `inline` | `boolean` | label 与组件同行 |

### Rating

| 参数 | 类型 | 说明 |
|---|---|---|
| `max` | `number` | 最大评分 |
| `precision` | `number` | 精度 |
| `size` | `"small" \| "medium" \| "large"` | 尺寸 |
| `readOnly` | `boolean` | 只读 |
| `inline` | `boolean` | label 与组件同行 |

### Date

| 参数 | 类型 | 说明 |
|---|---|---|
| `format` | `string` | 日期格式 |
| `min` | `string` | 最小日期 |
| `max` | `string` | 最大日期 |

### Time

| 参数 | 类型 | 说明 |
|---|---|---|
| `format` | `string` | 时间格式 |
| `ampm` | `boolean` | 12/24 小时 |
| `minutesStep` | `number` | 分钟步长 |
| `secondsStep` | `number` | 秒步长 |

### DateTime

| 参数 | 类型 | 说明 |
|---|---|---|
| `format` | `string` | 日期时间格式 |
| `minDateTime` | `string` | 最小日期时间 |
| `maxDateTime` | `string` | 最大日期时间 |
| `ampm` | `boolean` | 12/24 小时 |

### FormList

| 参数 | 类型 | 说明 |
|---|---|---|
| `minItems` | `number` | 最小行数 |
| `maxItems` | `number` | 最大行数 |
| `addText` | `string` | 添加按钮文案 |
| `copyable` | `boolean` | 允许复制 |
| `emptyText` | `string` | 空状态提示 |
| `showIndex` | `boolean` | 显示行号 |
| `itemDefaultValue` | `Record<string, any>` | 每行默认值 |

### Group

| 参数 | 类型 | 说明 |
|---|---|---|
| `variant` | `"card" \| "divider" \| "none"` | 展示样式 |
| `spacing` | `number` | Grid 间距 |
| `collapsible` | `boolean` | 预留（未实现） |

### Custom

| 参数 | 类型 | 说明 |
|---|---|---|
| `children` | `ReactNode \| (props) => ReactNode` | 自定义渲染 |
| `component` | `React.ComponentType` | 自定义组件 |
| `componentProps` | `Record<string, any>` | 组件额外参数 |

### Hidden

| 参数 | 类型 | 说明 |
|---|---|---|
| - | - | 无 UI 参数 |
