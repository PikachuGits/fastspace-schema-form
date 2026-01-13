# @fastspace/schema-form

基于 TanStack Form + Valibot + MUI 的声明式表单引擎。

## 特性

- 🚀 **声明式 Schema** - 通过 JSON 配置自动生成表单
- ✅ **预设验证规则** - 内置 15+ 常用验证规则，支持扩展
- 🔄 **响应式计算** - 支持字段联动、条件显示/禁用/必填
- 🎨 **MUI Widgets** - 18 种开箱即用的表单组件
- 📦 **异步选项** - 支持远程数据加载、分页、搜索
- 🛡️ **类型安全** - 完整的 TypeScript 支持

## 安装

```bash
npm install @fastspace/schema-form
# 或
pnpm add @fastspace/schema-form
```

### Peer Dependencies

```bash
npm install @mui/material @mui/icons-material @mui/x-date-pickers \
  @emotion/react @emotion/styled dayjs react react-dom
```

## 快速开始

### 基础用法

```tsx
import { SchemaForm, type SchemaFormInstance } from '@fastspace/schema-form';
import { useRef } from 'react';
import { Button, Stack } from '@mui/material';

// 1. 定义 Schema
const schema = {
  meta: { version: '1.0.0' },
  fields: [
    {
      name: 'username',
      component: 'Text',
      defaultValue: '',
      // 声明式验证规则
      validate: [
        { type: 'required', message: '用户名必填' },
        { type: 'minLength', value: 3, message: '至少3个字符' },
      ],
      ui: {
        label: '用户名',
        placeholder: '请输入用户名',
      },
    },
    {
      name: 'email',
      component: 'Text',
      validate: [
        { type: 'required', message: '邮箱必填' },
        { type: 'email', message: '请输入有效的邮箱' },
      ],
      ui: {
        label: '邮箱',
        placeholder: 'example@domain.com',
      },
    },
  ],
};

// 2. 使用组件
function MyForm() {
  const formRef = useRef<SchemaFormInstance>(null);

  const handleSubmit = (values) => {
    console.log('提交数据:', values);
  };

  return (
    <SchemaForm
      ref={formRef}
      schema={schema}
      onSubmit={handleSubmit}
    >
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="contained" onClick={() => formRef.current?.submit()}>
          提交
        </Button>
        <Button variant="outlined" onClick={() => formRef.current?.reset()}>
          重置
        </Button>
      </Stack>
    </SchemaForm>
  );
}
```

## Schema 配置

### 字段定义 (SchemaField)

```tsx
{
  // 必填：字段名
  name: string;
  
  // 必填：组件类型
  component: 'Text' | 'Number' | 'Select' | 'Radio' | 'Checkbox' | 'Switch' |
             'Date' | 'Time' | 'DateTime' | 'Slider' | 'Rating' | 'Textarea' |
             'Password' | 'Autocomplete' | 'FormList' | 'Group' | 'Hidden' | 'Custom';
  
  // 默认值
  defaultValue?: any;
  
  // 验证规则（预设规则数组 或 Valibot Schema）
  validate?: PresetRule[] | ValibotSchema;
  
  // 选项（用于 Select/Radio/Autocomplete）
  options?: OptionItem[] | ((scope, signal) => Promise<OptionItem[]>);
  
  // 条件显示表达式
  visibleWhen?: string | ((scope) => boolean);
  
  // 条件禁用表达式
  disabledWhen?: string | ((scope) => boolean);
  
  // 条件必填表达式
  requiredWhen?: string | ((scope) => boolean);
  
  // 派生计算表达式
  compute?: string | ((scope) => any);
  
  // 栅格布局
  colSpan?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  
  // 独占一行
  independent?: boolean;
  
  // 子字段（用于 FormList/Group）
  children?: SchemaField[];
  
  // UI 属性
  ui?: {
    label?: string;
    placeholder?: string;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    // ...其他组件特定属性
  };
}
```

## 验证规则

### 方式一：声明式预设规则（推荐）

编译器自动识别预设规则数组并转换为 Valibot Schema：

```tsx
{
  name: 'email',
  component: 'Text',
  // 直接使用规则数组
  validate: [
    { type: 'required', message: '邮箱必填' },
    { type: 'email', message: '请输入有效邮箱' },
  ],
}
```

### 内置预设规则

| 规则类型 | 说明 | 参数 |
|---------|------|------|
| `required` | 必填 | - |
| `email` | 邮箱格式 | - |
| `phone` | 手机号（中国大陆） | - |
| `url` | URL 格式 | - |
| `idCard` | 身份证号（18位） | - |
| `minLength` | 最小长度 | `value: number` |
| `maxLength` | 最大长度 | `value: number` |
| `min` | 最小值 | `value: number` |
| `max` | 最大值 | `value: number` |
| `pattern` | 正则匹配 | `value: RegExp \| string` |
| `integer` | 整数 | - |
| `positive` | 正数 | - |
| `negative` | 负数 | - |
| `alphanumeric` | 字母数字 | - |
| `chinese` | 中文字符 | - |

### 方式二：直接使用 Valibot

```tsx
import * as v from 'valibot';

{
  name: 'password',
  component: 'Password',
  validate: v.pipe(
    v.string('请输入密码'),
    v.nonEmpty('密码不能为空'),
    v.minLength(8, '密码至少8位'),
    v.regex(/[A-Z]/, '需包含大写字母'),
    v.regex(/[0-9]/, '需包含数字'),
  ),
}
```

### 扩展预设规则

```tsx
import { registerPresetRule, overridePresetRule } from '@fastspace/schema-form';
import * as v from 'valibot';

// 注册新规则
registerPresetRule('bankCard', (config) =>
  v.check(
    (val) => !val || /^\d{16,19}$/.test(String(val).replace(/\s/g, '')),
    config?.message ?? '请输入有效的银行卡号'
  )
);

// 覆盖默认规则（如限制邮箱后缀）
overridePresetRule('email', (config) =>
  v.check(
    (val) => !val || /@(company\.com|qq\.com)$/.test(String(val)),
    config?.message ?? '只支持公司邮箱或QQ邮箱'
  )
);
```

## 条件逻辑

### 条件显示 (visibleWhen)

```tsx
{
  name: 'companyName',
  component: 'Text',
  // 仅当 userType 为 'enterprise' 时显示
  visibleWhen: "userType === 'enterprise'",
  ui: { label: '公司名称' },
}
```

### 条件禁用 (disabledWhen)

```tsx
{
  name: 'discount',
  component: 'Number',
  // 总价低于 1000 时禁用折扣
  disabledWhen: 'totalPrice < 1000',
  ui: { label: '折扣' },
}
```

### 条件必填 (requiredWhen)

```tsx
{
  name: 'phone',
  component: 'Text',
  // 选择短信通知时必填
  requiredWhen: "notifyMethod === 'sms'",
  ui: { label: '手机号' },
}
```

### 派生计算 (compute)

```tsx
{
  name: 'totalPrice',
  component: 'Number',
  // 自动计算：单价 × 数量
  compute: 'unitPrice * quantity',
  disabledWhen: 'true', // 禁止手动修改
  ui: { label: '总价' },
}
```

## 组件类型

### 文本类

| 组件 | 说明 | 特有属性 |
|-----|------|---------|
| `Text` | 单行文本 | `maxLength`, `prefix`, `suffix` |
| `Password` | 密码输入 | `showToggle` |
| `Textarea` | 多行文本 | `rows`, `maxRows`, `maxLength` |

### 数值类

| 组件 | 说明 | 特有属性 |
|-----|------|---------|
| `Number` | 数字输入 | `min`, `max`, `step`, `precision` |
| `Slider` | 滑块 | `min`, `max`, `step`, `marks`, `inline` |
| `Rating` | 评分 | `max`, `precision`, `inline` |

### 选择类

| 组件 | 说明 | 特有属性 |
|-----|------|---------|
| `Select` | 下拉选择 | `options`, `multiple`, `clearable` |
| `Radio` | 单选按钮组 | `options`, `row`, `inline` |
| `Autocomplete` | 自动完成 | `options`, `remoteConfig`, `multiple`, `freeSolo` |

### 布尔类

| 组件 | 说明 | 特有属性 |
|-----|------|---------|
| `Checkbox` | 复选框 | `inline` |
| `Switch` | 开关 | `inline` |

### 日期时间类

| 组件 | 说明 | 特有属性 |
|-----|------|---------|
| `Date` | 日期选择 | `format`, `minDate`, `maxDate` |
| `Time` | 时间选择 | `format`, `ampm`, `minutesStep` |
| `DateTime` | 日期时间 | `format`, `minDateTime`, `maxDateTime` |

### 容器类

| 组件 | 说明 | 特有属性 |
|-----|------|---------|
| `Group` | 分组容器 | `style` ('card' \| 'divider' \| 'none'), `title` |
| `FormList` | 动态列表 | `minItems`, `maxItems`, `addText`, `showIndex` |

### 特殊类型

| 组件 | 说明 | 特有属性 |
|-----|------|---------|
| `Hidden` | 隐藏字段 | - |
| `Custom` | 自定义渲染 | `render` |

## Autocomplete 远程数据

```tsx
{
  name: 'city',
  component: 'Autocomplete',
  ui: {
    label: '城市',
    placeholder: '输入搜索...',
    // 远程配置
    remoteConfig: {
      // 获取选项列表
      fetchOptions: async ({ keyword, pageNum, pageSize }, signal) => {
        const res = await fetch(
          `/api/cities?keyword=${keyword}&page=${pageNum}&size=${pageSize}`,
          { signal }
        );
        const data = await res.json();
        return {
          options: data.list,
          hasMore: data.hasMore,
        };
      },
      // 根据 ID 获取详情（用于回显）
      fetchById: async (id, signal) => {
        const res = await fetch(`/api/cities/${id}`, { signal });
        return res.json();
      },
      pageSize: 20,
      debounceTimeout: 300,
    },
    // 每次打开下拉时刷新
    refreshOnOpen: true,
    // 缓存搜索关键词
    cacheSearchKeyword: true,
  },
}
```

## 动态选项（级联选择）

```tsx
const schema = {
  fields: [
    {
      name: 'province',
      component: 'Select',
      options: [
        { label: '浙江省', value: 'zj' },
        { label: '江苏省', value: 'js' },
      ],
      ui: { label: '省份' },
    },
    {
      name: 'city',
      component: 'Select',
      // 异步选项，依赖 province
      options: async (scope, signal) => {
        const province = scope.values.province;
        if (!province) return [];
        const res = await fetch(`/api/cities?province=${province}`, { signal });
        return res.json();
      },
      ui: { label: '城市' },
    },
  ],
};
```

## FormList 动态列表

```tsx
{
  name: 'contacts',
  component: 'FormList',
  defaultValue: [{ name: '', phone: '' }],
  ui: {
    label: '联系人列表',
    addText: '添加联系人',
    minItems: 1,
    maxItems: 5,
    showIndex: true,
    showCopy: true,
  },
  children: [
    {
      name: 'name',
      component: 'Text',
      colSpan: 6,
      validate: [{ type: 'required', message: '姓名必填' }],
      ui: { label: '姓名' },
    },
    {
      name: 'phone',
      component: 'Text',
      colSpan: 6,
      validate: [{ type: 'phone', message: '手机号格式不正确' }],
      ui: { label: '手机号' },
    },
  ],
}
```

## 布局配置

### 栅格布局

```tsx
// 响应式栅格
{
  name: 'field1',
  component: 'Text',
  colSpan: { xs: 12, md: 6 }, // 移动端占满，桌面端占一半
}

// 固定宽度
{
  name: 'field2',
  component: 'Text',
  colSpan: 4, // 占 4/12
}
```

### 独占一行

```tsx
{
  name: 'description',
  component: 'Textarea',
  colSpan: 6,      // 实际宽度 6/12
  independent: true, // 但独占一行
}
```

## API 参考

### SchemaForm Props

| 属性 | 类型 | 说明 |
|-----|------|------|
| `schema` | `SchemaInput` | Schema 定义 |
| `defaultValues` | `Partial<T>` | 默认值 |
| `onSubmit` | `(values: T) => void` | 提交回调 |
| `onValuesChange` | `(values: T) => void` | 值变化回调 |
| `widgets` | `WidgetRegistry` | 自定义 Widget |
| `disabled` | `boolean` | 全局禁用 |
| `readOnly` | `boolean` | 全局只读 |
| `spacing` | `number` | 栅格间距 |

### SchemaFormInstance 方法

```tsx
const formRef = useRef<SchemaFormInstance>(null);

// 提交表单
formRef.current?.submit();

// 重置表单
formRef.current?.reset();

// 获取所有值
const values = formRef.current?.getValues();

// 设置单个字段值
formRef.current?.setValue('fieldName', value);

// 批量设置值
formRef.current?.setValues({ field1: value1, field2: value2 });

// 校验表单（返回是否通过）
const isValid = await formRef.current?.validate();

// 校验单个字段
const isFieldValid = await formRef.current?.validate('fieldName');

// 清除所有错误
formRef.current?.clearErrors();

// 清除单个字段错误
formRef.current?.clearErrors('fieldName');

// 获取内部实例
const form = formRef.current?.getForm();      // TanStack Form 实例
const runtime = formRef.current?.getRuntime(); // Runtime 实例
const schema = formRef.current?.getCompiledSchema(); // 编译后的 Schema
```

### useSchemaForm Hook

```tsx
import { useSchemaForm } from '@fastspace/schema-form';

const {
  form,            // TanStack Form 实例
  runtime,         // Runtime 实例
  compiledSchema,  // 编译后的 Schema
  handleSubmit,    // 提交方法
  handleReset,     // 重置方法
  getValues,       // 获取值方法
  setValue,        // 设置值方法
} = useSchemaForm({
  schema,
  defaultValues,
  onSubmit,
  onValuesChange,
  compilerOptions,
  runtimeConfig,
});
```

### useValidationPresets Hook

```tsx
import { useValidationPresets } from '@fastspace/schema-form';

const {
  register,  // 注册新规则
  override,  // 覆盖规则
  extend,    // 批量扩展
  has,       // 检查规则是否存在
  getNames,  // 获取所有规则名
  toSchema,  // 手动转换为 Valibot Schema
} = useValidationPresets({
  isolated: false,  // 是否使用独立注册表
  extend: {},       // 初始扩展规则
});
```

## 自定义 Widget

```tsx
import { WidgetProps, registerWidget } from '@fastspace/schema-form';

// 1. 定义 Widget 组件
function MyCustomWidget(props: WidgetProps & { customProp?: string }) {
  const { value, onChange, onBlur, error, label, customProp } = props;
  
  return (
    <div>
      <label>{label}</label>
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  );
}

// 2. 注册 Widget
registerWidget('MyCustom', MyCustomWidget);

// 3. 在 Schema 中使用
{
  name: 'custom',
  component: 'MyCustom',
  ui: {
    label: '自定义字段',
    customProp: 'value',
  },
}
```

## 目录结构

```
package/
├── core/                    # 核心模块
│   ├── compiler/           # Schema 编译器
│   │   ├── index.ts        # SchemaCompiler
│   │   ├── evaluator.ts    # 表达式求值器
│   │   ├── dependencyAnalyzer.ts  # 依赖分析
│   │   └── schemaLinter.ts # Schema 检查器
│   ├── runtime/            # 运行时
│   │   ├── Runtime.ts      # FormRuntime
│   │   ├── EffectSystem.ts # 副作用系统
│   │   └── AsyncScheduler.ts  # 异步调度器
│   └── validation/         # 验证模块
│       ├── valibotAdapter.ts   # Valibot 适配器
│       ├── rulesAdapter.ts     # 规则适配器
│       └── presets.ts          # 预设规则
├── react/                  # React 集成
│   ├── useSchemaForm.ts    # 主 Hook
│   ├── useValidationPresets.ts  # 验证预设 Hook
│   └── SchemaFormProvider.tsx   # Context Provider
├── ui/                     # UI 组件
│   ├── SchemaForm.tsx      # 主表单组件
│   ├── SchemaRenderer.tsx  # 渲染器
│   ├── FieldAdapter.tsx    # 字段适配器
│   ├── DevTools.tsx        # 开发工具
│   ├── layout/             # 布局组件
│   └── widgets/            # Widget 组件库
├── types.ts                # 类型定义
└── index.ts                # 入口文件
```

## License

MIT
