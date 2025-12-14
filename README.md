# 
<p align="center">
  <img src="./龙.png" alt="logo" width="120" />
</p>

## Fastspace Schema Form 组件文档
基于 JSON Schema 驱动的动态表单组件，支持验证、联动、计算字段等功能。(Mui v7 + React Hook Form + Valibot)

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm latest package](https://img.shields.io/npm/v/@fastspace/schema-form/latest.svg)](https://www.npmjs.com/package/@fastspace/schema-form)
[![npm downloads](https://img.shields.io/npm/dm/@fastspace/schema-form.svg)](https://www.npmjs.com/package/@fastspace/schema-form)
[![GitHub branch status](https://img.shields.io/github/checks-status/PikachuGits/fastspace-schema-form/HEAD)](https://github.com/PikachuGits/fastspace-schema-form/commits/HEAD/)

## 目录

- [快速开始](#快速开始)
- [组件类型](#组件类型)
- [验证规则](#验证规则)
- [条件控制](#条件控制)
- [布局配置](#布局配置)
- [FormList 动态列表](#formlist-动态列表)
- [Group 字段分组](#group-字段分组)
- [Custom 自定义组件](#custom-自定义组件)
- [计算字段](#计算字段)
- [API 参考](#api-参考)

---

## 快速开始

```tsx
import { SchemaForm, type SchemaInput, type SchemaFormInstance } from './share/Schema';

const schema: SchemaInput = {
  fields: [
    {
      name: 'username',
      component: 'Text',
      ui: { label: '用户名', placeholder: '请输入用户名' },
      rules: [
        { type: 'required', message: '用户名必填' },
        { type: 'minLength', value: 3, message: '至少3个字符' },
      ],
    },
    {
      name: 'email',
      component: 'Text',
      ui: { label: '邮箱' },
      rules: [
        { type: 'required', message: '邮箱必填' },
        { type: 'email', message: '请输入有效的邮箱' },
      ],
    },
  ],
};

function App() {
  const formRef = useRef<SchemaFormInstance>(null);

  const handleSubmit = (values) => {
    console.log('提交数据:', values);
  };

  return (
    <SchemaForm
      ref={formRef}
      schema={schema}
      onSubmit={handleSubmit}
      spacing={2}
    >
      <Button onClick={() => formRef.current?.submit()}>提交</Button>
    </SchemaForm>
  );
}
```

---

## 组件类型

### 基础输入组件

| 组件名 | 说明 | 数据类型 |
|--------|------|----------|
| `Text` | 单行文本输入 | `string` |
| `Password` | 密码输入 | `string` |
| `Number` | 数字输入 | `number` |
| `Textarea` | 多行文本 | `string` |

### 选择组件

| 组件名 | 说明 | 数据类型 |
|--------|------|----------|
| `Select` | 下拉选择（单选） | `string \| number` |
| `Autocomplete` | 自动完成（支持多选） | `string \| number \| array` |
| `Checkbox` | 复选框 | `boolean` |
| `Switch` | 开关 | `boolean` |
| `Radio` | 单选组 | `string \| number` |

### 日期时间组件

| 组件名 | 说明 | 数据类型 |
|--------|------|----------|
| `Date` | 日期选择 | `string` (YYYY-MM-DD) |
| `Time` | 时间选择 | `string` |
| `DateTime` | 日期时间选择 | `string` (YYYY-MM-DD HH:mm) |

### 其他组件

| 组件名 | 说明 | 数据类型 |
|--------|------|----------|
| `Slider` | 滑块 | `number` |
| `Rating` | 评分 | `number` |
| `Hidden` | 隐藏字段 | `any` |
| `Custom` | 自定义组件 | `any` |

### 复合组件

| 组件名 | 说明 |
|--------|------|
| `FormList` | 动态列表（可增删行） |
| `Group` | 字段分组（多字段一行） |

---

## 验证规则

### 规则类型一览

| 规则类型 | 说明 | 适用组件 | 参数 |
|----------|------|----------|------|
| `required` | 必填 | 所有 | `message?: string` |
| `minLength` | 最小长度 | Text, Password, Textarea | `value: number, message?: string` |
| `maxLength` | 最大长度 | Text, Password, Textarea | `value: number, message?: string` |
| `min` | 最小值 | Number, Slider, Rating | `value: number, message?: string` |
| `max` | 最大值 | Number, Slider, Rating | `value: number, message?: string` |
| `pattern` | 正则匹配 | Text, Password, Textarea | `value: string \| RegExp, message?: string` |
| `email` | 邮箱格式 | Text | `message?: string` |
| `url` | URL格式 | Text | `message?: string` |
| `custom` | 自定义验证 | 所有 | `validate: (value, values) => boolean \| string` |
| `array` | 数组验证 | Upload, FormList | `minItems?: number, maxItems?: number, message?: string` |

### 使用示例

#### 必填验证

```typescript
{
  name: 'username',
  component: 'Text',
  rules: [
    { type: 'required', message: '用户名不能为空' }
  ]
}
```

#### 长度验证

```typescript
{
  name: 'password',
  component: 'Password',
  rules: [
    { type: 'required', message: '密码必填' },
    { type: 'minLength', value: 6, message: '密码至少6个字符' },
    { type: 'maxLength', value: 20, message: '密码最多20个字符' }
  ]
}
```

#### 数值范围验证

```typescript
{
  name: 'age',
  component: 'Number',
  rules: [
    { type: 'required', message: '年龄必填' },
    { type: 'min', value: 0, message: '年龄不能为负数' },
    { type: 'max', value: 150, message: '年龄不能超过150' }
  ]
}
```

#### 正则验证

```typescript
{
  name: 'phone',
  component: 'Text',
  rules: [
    { type: 'required', message: '手机号必填' },
    { 
      type: 'pattern', 
      value: '^1[3-9]\\d{9}$',  // 注意转义
      message: '请输入有效的手机号' 
    }
  ]
}
```

#### 邮箱验证

```typescript
{
  name: 'email',
  component: 'Text',
  rules: [
    { type: 'required', message: '邮箱必填' },
    { type: 'email', message: '请输入有效的邮箱地址' }
  ]
}
```

#### URL 验证

```typescript
{
  name: 'website',
  component: 'Text',
  rules: [
    { type: 'url', message: '请输入有效的网址' }
  ]
}
```

#### 自定义验证

```typescript
{
  name: 'confirmPassword',
  component: 'Password',
  rules: [
    { type: 'required', message: '请确认密码' },
    {
      type: 'custom',
      validate: (value, values) => {
        if (value !== values.password) {
          return '两次密码输入不一致';  // 返回错误消息
        }
        return true;  // 返回 true 表示验证通过
      }
    }
  ]
}
```

#### Checkbox 必须勾选

```typescript
{
  name: 'agreeTerms',
  component: 'Checkbox',
  ui: { label: '我已阅读并同意服务条款' },
  rules: [
    { type: 'required', message: '请同意服务条款' }
  ]
}
```

---

## 条件控制

### visibleWhen - 条件显示

```typescript
{
  name: 'companyName',
  component: 'Text',
  ui: { label: '公司名称' },
  // 当 accountType 等于 'business' 时显示
  visibleWhen: { field: 'accountType', eq: 'business' }
}
```

### disabledWhen - 条件禁用

```typescript
{
  name: 'discount',
  component: 'Number',
  // 当 isVip 为 false 时禁用
  disabledWhen: { field: 'isVip', eq: false }
}
```

### requiredWhen - 条件必填

```typescript
{
  name: 'taxId',
  component: 'Text',
  // 当 accountType 等于 'business' 时必填
  requiredWhen: { field: 'accountType', eq: 'business' }
}
```

### 条件表达式

#### 简单条件

```typescript
// 等于
{ field: 'status', eq: 'active' }

// 不等于
{ field: 'status', ne: 'inactive' }

// 大于
{ field: 'age', gt: 18 }

// 大于等于
{ field: 'age', gte: 18 }

// 小于
{ field: 'price', lt: 100 }

// 小于等于
{ field: 'price', lte: 100 }

// 在数组中
{ field: 'type', in: ['a', 'b', 'c'] }

// 不在数组中
{ field: 'type', notIn: ['x', 'y'] }

// 为空
{ field: 'name', empty: true }

// 非空
{ field: 'name', notEmpty: true }
```

#### 复合条件

```typescript
// AND 逻辑
{
  and: [
    { field: 'type', eq: 'business' },
    { field: 'country', eq: 'CN' }
  ]
}

// OR 逻辑
{
  or: [
    { field: 'type', eq: 'vip' },
    { field: 'points', gte: 1000 }
  ]
}

// NOT 逻辑
{
  not: { field: 'status', eq: 'disabled' }
}
```

---

## 布局配置

### colSpan - 响应式布局

通过 `colSpan` 控制字段宽度（基于 12 栅格）：

```typescript
// 简单值 - 固定宽度
{ colSpan: 6 }  // 占 50%

// 响应式
{ 
  colSpan: { 
    xs: 12,   // 手机：100%
    sm: 6,    // 平板：50%
    md: 4,    // 桌面：33%
    lg: 3,    // 大屏：25%
  } 
}
```

### spacing - 间距

```tsx
<SchemaForm schema={schema} spacing={3} />
```

### newLine - 强制换行

在 `FieldSchema` 中添加 `newLine: true` 可以强制字段从新的一行开始。

```typescript
{
  name: 'is_super_admin',
  component: 'Radio',
  newLine: true,  // 👈 强制从新行开始
  ui: { ... },
  colSpan: { xs: 12, md: 6 },  // 即使宽度只有一半，也会另起一行
}
```

### Radio 行内布局 (inline)

通过在 `ui.props` 中设置 `inline: true`，可以让 Radio 组件的 Label 和选项在同一行显示。

```typescript
{
  name: 'is_super_admin',
  component: 'Radio',
  ui: {
    label: '超管状态',
    props: {
      inline: true,  // 👈 label 和 radio 选项在同一行显示
    },
    options: [
      { label: '普通用户', value: 0 },
      { label: '超级管理员', value: 1 },
    ],
  },
  colSpan: { xs: 12, md: 6 },
}
```

---

## FormList 动态列表

用于动态添加/删除表单行。

```typescript
{
  name: 'contacts',
  component: 'FormList',
  ui: { label: '联系人列表' },
  // 默认值：初始化时显示的行 (支持多行)
  defaultValue: [
    { name: '张三', phone: '13800000001' },
    { name: '李四', phone: '13800000002' }
  ],
  minItems: 1,      // 最少1行
  maxItems: 5,      // 最多5行
  addText: '添加联系人',  // 添加按钮文字
  copyable: true,   // 允许复制行
  columns: [
    {
      name: 'name',
      component: 'Text',
      ui: { label: '姓名' },
      rules: [{ type: 'required', message: '姓名必填' }],
      colSpan: { xs: 12, sm: 6 }
    },
    {
      name: 'phone',
      component: 'Text',
      ui: { label: '电话' },
      rules: [
        { type: 'required', message: '电话必填' },
        { type: 'pattern', value: '^1[3-9]\\d{9}$', message: '请输入有效的手机号' }
      ],
      colSpan: { xs: 12, sm: 6 }
    }
  ]
}
```

### FormList 配置项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `columns` | `FieldSchema[]` | - | 子字段定义 |
| `defaultValue` | `array` | `[]` | 初始值 |
| `minItems` | `number` | `0` | 最少行数 |
| `maxItems` | `number` | `Infinity` | 最多行数 |
| `addText` | `string` | `'添加一行'` | 添加按钮文字 |
| `copyable` | `boolean` | `false` | 是否可复制行 |

---

## Group 字段分组

将多个字段组合在一行显示。

```typescript
{
  name: 'addressGroup',
  component: 'Group',
  colSpan: { xs: 12 },
  columns: [
    {
      name: 'province',
      component: 'Select',
      ui: { label: '省份', options: [...] },
      colSpan: { xs: 12, sm: 4 }
    },
    {
      name: 'city',
      component: 'Select',
      ui: { label: '城市', options: [...] },
      colSpan: { xs: 12, sm: 4 }
    },
    {
      name: 'district',
      component: 'Select',
      ui: { label: '区县', options: [...] },
      colSpan: { xs: 12, sm: 4 }
    }
  ]
}
```

---

## Custom 自定义组件

用于完全自定义渲染的场景。

### 方式1：children 函数（推荐）

可以访问 `field`、`form`、`error` 等，实现完全自定义的表单控件：

```typescript
{
  name: 'customInput',
  component: 'Custom',
  colSpan: { xs: 12 },
  ui: {
    label: '自定义输入',
    props: {
      // children 是一个函数，接收 field、form、label、error、helperText 等参数
      children: ({ field, form, label, error, helperText, fieldProps }) => {
        return (
          <div>
            <label>{label}</label>
            <input
              type="text"
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              disabled={fieldProps?.disabled}
              style={{
                border: error ? '1px solid red' : '1px solid #ccc',
                padding: '8px',
                width: '100%',
              }}
            />
            {helperText && <span style={{ color: error ? 'red' : '#666' }}>{helperText}</span>}
          </div>
        );
      },
    },
  },
  rules: [{ type: 'required', message: '此字段必填' }],
}
```

#### children 函数参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `field` | `ControllerRenderProps` | RHF 字段对象，包含 `value`、`onChange`、`onBlur`、`name`、`ref` |
| `form` | `UseFormReturn` | 表单实例，可调用 `form.setValue()`、`form.trigger()` 等 |
| `values` | `Record<string, any>` | 当前表单值（通常仅包含被依赖的字段，如需全量可用 `form.getValues()`） |
| `label` | `string` | 标签文本 |
| `error` | `boolean` | 是否有错误 |
| `helperText` | `ReactNode` | 帮助/错误文本 |
| `fieldProps` | `object` | 包含 `disabled`、`required`、`readOnly` 等状态 |

### 方式2：children 静态内容

用于纯展示，不需要表单交互：

```typescript
{
  name: 'notice',
  component: 'Custom',
  colSpan: { xs: 12 },
  noSubmit: true,  // 不参与表单提交
  ui: {
    props: {
      children: (
        <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <strong>💡 提示：</strong>
          <span>这是一段提示信息</span>
        </div>
      ),
    },
  },
}
```

### 方式3：传入自定义组件

```typescript
// 先定义自定义组件
const MyCustomInput = ({ field, form, values, label, error, helperText }) => {
  return (
    <div>
      <label>{label}</label>
      <input
        value={field.value ?? ''}
        onChange={(e) => field.onChange(e.target.value)}
      />
      {error && <span style={{ color: 'red' }}>{helperText}</span>}
      {/* 可以在这里使用 values 或 form 做更多逻辑 */}
    </div>
  );
};

// 在 schema 中使用
{
  name: 'myField',
  component: 'Custom',
  ui: {
    label: '我的字段',
    props: {
      component: MyCustomInput,  // 传入组件
      // 其他 props 会透传给 MyCustomInput
      customProp: 'value',
    },
  },
}
```

### 完整示例

```typescript
{
  name: 'paymentAccount',
  component: 'Custom',
  colSpan: { xs: 12 },
  ui: {
    label: '付款账户',
    helperText: '请选择或输入付款账户',
    props: {
      children: ({ field, form, values, label, error, helperText, fieldProps }) => {
        const [accounts] = useState([
          { id: '1', name: '工商银行 **** 1234' },
          { id: '2', name: '建设银行 **** 5678' },
        ]);

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>{label}</span>
              <a href="#" style={{ fontSize: 12 }}>添加账户</a>
            </div>
            
            <select
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              disabled={fieldProps?.disabled}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: error ? '1px solid red' : '1px solid #ddd',
                borderRadius: 4,
              }}
            >
              <option value="">请选择账户</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
            
            {helperText && (
              <div style={{ fontSize: 12, color: error ? 'red' : '#999', marginTop: 4 }}>
                {helperText}
              </div>
            )}
          </div>
        );
      },
    },
  },
  rules: [{ type: 'required', message: '请选择付款账户' }],
}
```

---

## 计算字段

自动计算字段值，支持简单的数学运算表达式，以及精度和舍入控制。

### 基础用法

```typescript
{
  name: 'total',
  component: 'Number',
  readonly: true,
  ui: { 
    label: '总价',
    helperText: '自动计算: 单价 × 数量'
  },
  compute: {
    expr: 'price * quantity',  // 表达式，支持 + - * / % 等
    dependencies: ['price', 'quantity'] // 可选，指定依赖字段（默认自动分析）
  }
}
```

### 精度与舍入控制

通过 `precision` 和 `roundMode` 属性控制计算结果的精度。

*   `precision`: 保留的小数位数（整数）。
*   `roundMode`: 舍入模式，可选值：
    *   `'round'`: 四舍五入（默认）。
    *   `'ceil'`: 向上取整。
    *   `'floor'`: 向下取整。

```typescript
{
  name: 'discountedPrice',
  component: 'Number',
  readonly: true,
  ui: { label: '折后价（保留2位小数，向下取整）' },
  compute: {
    expr: 'price * discount',
    precision: 2,       // 保留两位小数
    roundMode: 'floor'  // 向下取整 (例如 10.559 -> 10.55)
  }
}
```

### 舍入模式示例

假设计算结果为 `12.3456`，`precision` 为 `2`：

| roundMode | 结果 | 说明 |
|-----------|------|------|
| `round` (默认) | `12.35` | 四舍五入 |
| `ceil` | `12.35` | 向上取整 (12.3456 -> 12.35) |
| `floor` | `12.34` | 向下取整 (12.3456 -> 12.34) |

### 高级示例：互斥计算（含税/不含税）

这是一个复杂的业务场景示例：根据用户选择的"是否含税"，自动计算"含税金额"或"不含税金额"。

*   如果选择"含税"，用户输入"含税金额"，系统自动计算"不含税金额"。
*   如果选择"不含税"，用户输入"不含税金额"，系统自动计算"含税金额"。
*   "增值税"始终由两者差值计算得出。

```typescript
{
  name: 'is_include_tax',
  component: 'Radio',
  ui: { 
    label: '是否含税', 
    options: [{ label: '含税', value: 1 }, { label: '不含税', value: 2 }] 
  },
  defaultValue: 1,
},
{
  name: 'contract_amount',
  component: 'Number',
  ui: { label: '合同额（含税）' },
  // 当选择不含税(2)时，该字段禁用且由计算得出
  disabledWhen: { field: 'is_include_tax', eq: 2 },
  compute: {
    // 仅当 is_include_tax === 2 (不含税) 时才执行计算
    // 否则保持原值 (contract_amount)
    expr: 'is_include_tax === 2 ? exclud_tax_amount * (1 + tax_rate / 100) : contract_amount',
    dependencies: ['exclud_tax_amount', 'tax_rate', 'is_include_tax'],
    precision: 2,
    roundMode: 'round',
  },
},
{
  name: 'exclud_tax_amount',
  component: 'Number',
  ui: { label: '合同额（不含税）' },
  // 当选择含税(1)时，该字段禁用且由计算得出
  disabledWhen: { field: 'is_include_tax', eq: 1 },
  compute: {
    // 仅当 is_include_tax === 1 (含税) 时才执行计算
    // 否则保持原值 (exclud_tax_amount)
    expr: 'is_include_tax === 1 ? contract_amount / (1 + tax_rate / 100) : exclud_tax_amount',
    dependencies: ['contract_amount', 'tax_rate', 'is_include_tax'],
    precision: 2,
    roundMode: 'round',
  },
},
{
  name: 'tax_rate',
  component: 'Number',
  ui: { label: '税率(%)' },
},
{
  name: 'tax_amount',
  component: 'Number',
  ui: { label: '增值税额' },
  disabled: true,
  compute: {
    expr: 'contract_amount - exclud_tax_amount',
    dependencies: ['contract_amount', 'exclud_tax_amount'],
    precision: 2,
  },
}
```

---

## 远程搜索与分页 (Autocomplete)

`Autocomplete` 组件支持远程搜索、分页加载、防抖搜索以及回显。

配置 `ui.remoteConfig` 即可开启远程模式。

```typescript
{
  name: 'userId',
  component: 'Autocomplete',
  ui: {
    label: '搜索用户',
    remoteConfig: {
      // 远程搜索函数
      fetchOptions: async (keyword, page, pageSize) => {
        const res = await api.searchUsers({ keyword, page, pageSize });
        return {
          data: res.list.map(u => ({ label: u.name, value: u.id })),
          total: res.total,
          hasMore: res.hasMore
        };
      },
      // 回显函数（用于处理默认值不在当前列表中的情况）
      fetchById: async (value) => {
        const user = await api.getUserById(value);
        return user ? { label: user.name, value: user.id } : null;
      },
      // 加载状态回调（可选，用于外部显示 loading）
      onLoadingChange: (loading) => {
        console.log('Loading:', loading);
      },
      pageSize: 20,       // 每页条数 (默认 20)
      debounceTimeout: 800 // 防抖时间 (默认 500ms)
    }
  }
}
```

### RemoteConfig 类型定义

```typescript
type RemoteConfig = {
  /** 
   * 远程获取选项列表 
   * @param keyword 搜索关键词
   * @param page 当前页码 (从1开始)
   * @param pageSize 每页条数
   */
  fetchOptions: (
    keyword: string,
    page: number,
    pageSize: number
  ) => Promise<{
    data: OptionItem[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * 根据 ID 获取单个选项（用于回显）
   * 当 field.value 有值但 options 中没有对应项时触发
   */
  fetchById?: (value: string | number) => Promise<OptionItem | null>;

  /** 加载状态变更回调 */
  onLoadingChange?: (loading: boolean) => void;

  /** 每页条数 (默认 20) */
  pageSize?: number;

  /** 搜索防抖时间 (ms, 默认 500) */
  debounceTimeout?: number;

  /** 最小搜索字符长度 (暂未实现) */
  minSearchLength?: number;
};

---

## 数据转换

### transform - 提交前转换

在表单提交前对数据进行转换，例如将数组转换为字符串，或格式化日期。

`transform` 函数接收两个参数：
1. `value`: 当前字段的值
2. `values`: 当前表单的所有值 (T)

```typescript
{
  name: 'tags',
  component: 'Select',
  ui: {
    label: '标签',
    options: [
      { label: '技术', value: 'tech' },
      { label: '生活', value: 'life' }
    ],
    props: { multiple: true } // 多选
  },
  // 提交时将数组转换为逗号分隔字符串: ['tech', 'life'] -> "tech,life"
  transform: (value) => Array.isArray(value) ? value.join(',') : value
}
```

### noSubmit - 不参与提交

用于纯 UI 展示字段，或仅用于计算的中间变量，不包含在最终提交的数据中。

```typescript
{
  name: 'tips',
  component: 'Custom',
  noSubmit: true, // 👈 提交时会自动过滤掉此字段
  ui: {
    props: {
      children: <div style={{ color: '#666' }}>请务必填写真实信息</div>
    }
  }
}
```

---

## API 参考

### SchemaFormProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `schema` | `SchemaInput` | - | Schema 定义（必填） |
| `defaultValues` | `object` | - | 默认值 |
| `onSubmit` | `(values) => void` | - | 提交回调 |
| `onValuesChange` | `(values) => void` | - | 值变化回调 |
| `grid` | `boolean` | `true` | 是否使用 Grid 布局 |
| `spacing` | `number` | `2` | 间距 |
| `disabled` | `boolean` | `false` | 全局禁用 |
| `readOnly` | `boolean` | `false` | 全局只读 |
| `widgets` | `Record<string, WidgetComponent>` | - | 自定义组件 |
| `children` | `ReactNode` | - | 子元素（如提交按钮） |

### SchemaFormInstance (ref)

| 方法 | 说明 |
|------|------|
| `submit()` | 提交表单 |
| `reset()` | 重置表单 |
| `getValues()` | 获取所有值 |
| `getFormValues()` | 获取表单值（排除 noSubmit 字段） |
| `setValue(name, value)` | 设置单个值 |
| `setValues(values)` | 批量设置值 |
| `trigger(name?)` | 触发验证 |
| `clearErrors(name?)` | 清除错误 |

### FieldSchema

| 属性 | 类型 | 说明 |
|------|------|------|
| **基础配置** | | |
| `name` | `string` | 字段名（必填，对应表单数据 key） |
| `component` | `ComponentType` | 组件类型（Text, Number, Select, ...） |
| `defaultValue` | `any` | 默认值 |
| **UI 配置** | | |
| `ui.label` | `string` | 字段标签 |
| `ui.placeholder` | `string` | 占位符 |
| `ui.helperText` | `ReactNode` | 帮助/错误提示文本 |
| `ui.tooltip` | `string` | 悬浮提示信息 |
| `ui.options` | `OptionItem[]` | 静态选项列表 (Select/Radio/Checkbox) |
| `ui.optionRequest` | `(values) => Promise` | 异步加载选项函数 |
| `ui.remoteConfig` | `RemoteConfig` | 远程搜索配置 (Autocomplete) |
| `ui.props` | `object` | 透传给底层组件的 props |
| **布局配置** | | |
| `colSpan` | `GridSize \| object` | 栅格列宽 (1-12)，支持响应式对象 `{ xs, md }` |
| `newLine` | `boolean` | 是否强制换行 |
| **验证与状态** | | |
| `rules` | `ValidationRule[]` | 验证规则数组 |
| `readonly` | `boolean` | 是否只读 |
| `disabled` | `boolean` | 是否禁用 |
| `hidden` | `boolean` | 是否隐藏 (不渲染但保留数据) |
| **条件控制** | | |
| `visibleWhen` | `ConditionExpression` | 条件显示表达式 |
| `disabledWhen` | `ConditionExpression` | 条件禁用表达式 |
| `requiredWhen` | `ConditionExpression` | 条件必填表达式 |
| **计算与数据** | | |
| `compute` | `ComputeConfig` | 自动计算配置 `{ expr, dependencies, precision }` |
| `dependencies` | `string[]` | 显式声明依赖字段 (触发重置或副作用) |
| `transform` | `(val, vals) => any` | 提交前的数据转换函数 |
| `noSubmit` | `boolean` | 是否从提交数据中排除 |
| **FormList/Group** | | |
| `columns` | `FieldSchema[]` | 子字段定义 (用于 Group/FormList) |
| `minItems` | `number` | 最小行数 (FormList) |
| `maxItems` | `number` | 最大行数 (FormList) |
| `addText` | `string` | 添加按钮文案 (FormList) |
| `sortable` | `boolean` | 是否可拖拽排序 (FormList) |
| `copyable` | `boolean` | 是否可复制行 (FormList) |

---

## 完整示例

```typescript
import { SchemaForm, type SchemaInput } from './share/Schema';

const schema: SchemaInput = {
  fields: [
    // 基础字段
    {
      name: 'username',
      component: 'Text',
      ui: { label: '用户名', placeholder: '请输入用户名' },
      colSpan: { xs: 12, md: 6 },
      rules: [
        { type: 'required', message: '用户名必填' },
        { type: 'minLength', value: 3, message: '用户名至少3个字符' },
      ],
    },

    // 邮箱验证
    {
      name: 'email',
      component: 'Text',
      ui: { label: '邮箱', placeholder: '请输入邮箱' },
      colSpan: { xs: 12, md: 6 },
      rules: [
        { type: 'required', message: '邮箱必填' },
        { type: 'email', message: '请输入有效的邮箱' },
      ],
    },

    // 下拉选择 + 条件显示
    {
      name: 'accountType',
      component: 'Select',
      defaultValue: 'personal',
      ui: {
        label: '账户类型',
        options: [
          { label: '个人账户', value: 'personal' },
          { label: '企业账户', value: 'business' },
        ],
      },
      colSpan: { xs: 12, md: 6 },
    },

    // 条件显示字段
    {
      name: 'companyName',
      component: 'Text',
      ui: { label: '公司名称' },
      colSpan: { xs: 12, md: 6 },
      visibleWhen: { field: 'accountType', eq: 'business' },
      requiredWhen: { field: 'accountType', eq: 'business' },
    },

    // 动态列表
    {
      name: 'contacts',
      component: 'FormList',
      ui: { label: '联系人' },
      colSpan: { xs: 12 },
      defaultValue: [{ name: '', phone: '' }],
      minItems: 1,
      maxItems: 3,
      columns: [
        {
          name: 'group',
          component: 'Group',
          colSpan: { xs: 12 },
          columns: [
            {
              name: 'name',
              component: 'Text',
              ui: { label: '姓名' },
              colSpan: { xs: 12, sm: 6 },
              rules: [{ type: 'required', message: '姓名必填' }],
            },
            {
              name: 'phone',
              component: 'Text',
              ui: { label: '电话' },
              colSpan: { xs: 12, sm: 6 },
              rules: [{ type: 'required', message: '电话必填' }],
            },
          ],
        },
      ],
    },

    // 计算字段
    {
      name: 'price',
      component: 'Number',
      defaultValue: 100,
      ui: { label: '单价' },
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'quantity',
      component: 'Number',
      defaultValue: 1,
      ui: { label: '数量' },
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'total',
      component: 'Number',
      readonly: true,
      ui: { label: '总价' },
      colSpan: { xs: 12, md: 4 },
      compute: { expr: 'price * quantity' },
    },

    // 协议勾选
    {
      name: 'agree',
      component: 'Checkbox',
      ui: { label: '我已阅读并同意服务条款' },
      colSpan: { xs: 12 },
      rules: [{ type: 'required', message: '请同意服务条款' }],
    },
  ],
};

```


