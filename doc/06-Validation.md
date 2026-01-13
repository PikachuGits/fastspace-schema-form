# 校验体系（Valibot）

本库的校验统一使用 Valibot，提供三种使用方式：

1. **预设规则数组** `[{type:'xxx'}]` - 简洁声明式（推荐）
2. **直接使用 Valibot** - 完全自定义，最灵活
3. **声明式规则 (rulesToValibot)** - 老版本兼容

核心实现：
- `package/core/validation/valibotAdapter.ts` - Valibot 适配器
- `package/core/validation/presets.ts` - 预设规则系统
- `package/react/useValidationPresets.ts` - React Hook

## 1. 快速上手

### 1.1 使用预设规则数组（推荐）

直接在 `validate` 字段使用 `[{type: 'xxx'}]` 格式，框架自动识别并转换：

```tsx
const schema = {
  fields: [
    {
      name: "email",
      component: "Text",
      // 直接使用预设规则数组
      validate: [
        { type: "required", message: "邮箱必填" },
        { type: "email", message: "请输入有效邮箱" },
      ],
    },
    {
      name: "phone",
      component: "Text",
      // 带参数的规则
      validate: [
        { type: "required", message: "手机号必填" },
        { type: "minLength", value: 11, message: "手机号必须11位" },
        { type: "phone", message: "请输入有效手机号" },
      ],
    },
    {
      name: "age",
      component: "Number",
      // 数值验证
      validate: [
        { type: "required", message: "年龄必填" },
        { type: "min", value: 0, message: "年龄不能为负" },
        { type: "max", value: 150, message: "年龄不能超过150" },
        { type: "integer", message: "年龄必须是整数" },
      ],
    },
  ],
};
```

### 1.2 直接使用 Valibot（高度自定义）

```tsx
import * as v from "valibot";

const schema = {
  fields: [
    {
      name: "email",
      component: "Text",
      validate: v.pipe(
        v.string("请输入邮箱"),
        v.nonEmpty("邮箱不能为空"),
        v.email("请输入有效的邮箱")
      ),
    },
  ],
};
```

## 2. 预设规则系统

### 2.1 内置预设规则

| 规则名 | 说明 | 参数 |
|--------|------|------|
| `required` | 必填 | - |
| `email` | 邮箱格式 | - |
| `phone` | 中国大陆手机号 | - |
| `url` | URL 格式 | - |
| `idCard` | 中国大陆身份证 | - |
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

### 2.2 规则格式

```typescript
// 规则格式
type PresetRule = {
  type: string;      // 规则类型（必填）
  value?: any;       // 规则参数（如 minLength 的长度）
  message?: string;  // 自定义错误消息
};

// 使用示例
validate: [
  { type: "required" },                                    // 无参数
  { type: "required", message: "自定义错误消息" },          // 自定义消息
  { type: "minLength", value: 5 },                         // 带参数
  { type: "pattern", value: /^\d+$/, message: "只能输入数字" }, // 正则
]
```

### 2.3 使用 Hook 扩展/覆盖规则

```tsx
import { useValidationPresets } from "@package/react/useValidationPresets";
import * as v from "valibot";

function MyForm() {
  const { toSchema, override, register } = useValidationPresets({
    extend: {
      // 覆盖默认 email - 只允许特定后缀
      email: (config) =>
        v.check(
          (val) => !val || /@(163|qq|gmail)\.com$/.test(String(val)),
          config?.message ?? "只支持 163、QQ、Gmail 邮箱"
        ),
    },
  });

  // 动态注册新规则
  useEffect(() => {
    register("companyEmail", (config) =>
      v.check(
        (val) => !val || /@mycompany\.com$/.test(String(val)),
        config?.message ?? "请使用公司邮箱"
      )
    );
  }, []);

  // 使用预设规则（通过 Hook）
  const schema = {
    fields: [
      {
        name: "email",
        component: "Text",
        // 方式1: 直接使用数组（推荐）
        validate: [
          { type: "required", message: "邮箱必填" },
          { type: "email" },
        ],
      },
      {
        name: "companyEmail",
        component: "Text",
        // 方式2: 使用 toSchema 函数
        validate: toSchema([
          { type: "required" },
          { type: "companyEmail" },
        ]),
      },
    ],
  };

  return <SchemaForm schema={schema} />;
}
```

### 2.4 使用 Provider 全局配置

```tsx
import { ValidationPresetsProvider } from "@package/react/useValidationPresets";
import * as v from "valibot";

function App() {
  return (
    <ValidationPresetsProvider
      extend={{
        // 全局覆盖 email 规则
        email: (config) =>
          v.check(
            (val) => !val || /@company\.com$/.test(String(val)),
            "请使用公司邮箱"
          ),
        // 全局添加新规则
        employeeId: (config) =>
          v.check(
            (val) => !val || /^EMP\d{6}$/.test(String(val)),
            "员工编号格式不正确"
          ),
      }}
    >
      <MyForms />
    </ValidationPresetsProvider>
  );
}
```

### 2.5 创建独立注册表（隔离作用域）

```tsx
import { createValidationRegistry } from "@package/core/validation/presets";
import * as v from "valibot";

// 创建独立注册表，不影响全局
const registry = createValidationRegistry({
  // 自定义规则
  projectCode: (config) =>
    v.check(
      (val) => !val || /^PRJ-\d{4}$/.test(String(val)),
      "项目编号格式：PRJ-0000"
    ),
});

// 使用
const schema = registry.toSchema(
  [{ type: "required" }, { type: "projectCode" }],
  { label: "项目编号" }
);
```

### 2.6 规则工厂参数

每个规则工厂函数接收 `RuleConfig` 参数：

```typescript
type RuleConfig = {
  value?: any;      // 规则参数值 (如 minLength 的长度)
  message?: string; // 自定义错误消息
  label?: string;   // 字段标签 (用于默认消息)
};
```

自定义规则示例：

```tsx
import { registerPresetRule } from "@package";
import * as v from "valibot";

// 添加银行卡号验证
registerPresetRule("bankCard", (config) =>
  v.check(
    (val) => {
      if (!val) return true; // 允许空值
      const str = String(val).replace(/\s/g, "");
      return /^\d{16,19}$/.test(str);
    },
    config?.message ?? `${config?.label ?? "该字段"}必须是有效的银行卡号`
  )
);

// 使用
const schema = {
  fields: [{
    name: "cardNumber",
    component: "Text",
    validate: [
      { type: "required", message: "银行卡号必填" },
      { type: "bankCard", message: "请输入正确的银行卡号" },
    ],
  }],
};
```

## 3. 声明式规则 (rulesToValibot)

这是老版本兼容方式，将声明式规则数组转换为 Valibot schema：

```tsx
import { rulesToValibot } from "@package/core/validation/rulesAdapter";

const schema = rulesToValibot(
  [
    { type: "required", message: "此字段必填" },
    { type: "minLength", value: 3, message: "至少3个字符" },
    { type: "email", message: "请输入有效邮箱" },
  ],
  { label: "邮箱", fieldType: "text" }
);
```

## 4. 动态校验

### 4.1 requiredWhen

条件必填，运行时动态判断：

```tsx
{
  name: "companyName",
  component: "Text",
  requiredWhen: "userType === 'enterprise'",
}
```

### 4.2 visibleWhen / Hidden 字段跳过校验

- `Hidden` 组件或 `hidden: true` 的字段不参与校验
- `visibleWhen` 条件不满足时跳过校验

## 5. 自定义校验

使用 Valibot 的 `v.check` 创建自定义校验：

```tsx
validate: v.pipe(
  v.string(),
  v.check(
    (val) => {
      // 自定义校验逻辑
      return someCustomValidation(val);
    },
    "自定义错误消息"
  )
)
```

## 6. API 导出

### 核心函数

| 函数 | 说明 |
|------|------|
| `presetToSchema(rules, options)` | 预设规则转 Valibot schema |
| `registerPresetRule(name, factory)` | 注册新的全局预设规则 |
| `overridePresetRule(name, factory)` | 覆盖全局预设规则 |
| `createValidationRegistry(extend)` | 创建独立验证注册表 |
| `isPresetRuleArray(value)` | 检测是否为预设规则数组 |
| `rulesToValibot(rules, options)` | 声明式规则转 Valibot schema |

### Hook

| Hook | 说明 |
|------|------|
| `useValidationPresets(options)` | 验证预设 Hook |
| `useValidationPresetsContext()` | 使用 Provider 中的预设 |

### 组件

| 组件 | 说明 |
|------|------|
| `ValidationPresetsProvider` | 全局预设配置 Provider |
