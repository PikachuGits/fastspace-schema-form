# Next-Gen Schema Form (V4)

基于 TanStack Form 的声明式表单引擎，采用三层架构设计。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 3: UI Render                       │
│  FieldAdapter, Widgets (Text, Select, Checkbox, etc.)      │
├─────────────────────────────────────────────────────────────┤
│                  Layer 2: Form Runtime                      │
│  EffectSystem, AsyncScheduler, FormRuntime                 │
├─────────────────────────────────────────────────────────────┤
│                 Layer 1: Schema Compiler                    │
│  SchemaCompiler, SafeEvaluator, DependencyAnalyzer         │
└─────────────────────────────────────────────────────────────┘
```

## 核心特性

### Layer 1: Schema Compiler
- ✅ **SafeEvaluator**: 基于 jsep 的安全表达式解释器，禁止 eval/new Function
- ✅ **DependencyAnalyzer**: Tarjan 算法检测循环依赖，孤立字段检测
- ✅ **SemVer 版本检查**: 支持 ^, ~, >= 等版本范围

### Layer 2: Form Runtime
- ✅ **EffectSystem**: Snapshot Batching + 冲突检测 + 错误边界
- ✅ **AsyncScheduler**: AbortController + StableHash + LRU 缓存
- ✅ **Meta 状态管理**: visible/disabled/required 状态追踪

### Layer 3: UI Render
- ✅ **FieldAdapter**: Selector 订阅优化
- ✅ **MUI Widgets**: Text, Number, Select, Checkbox, Switch, Radio, Date

## 快速开始

```tsx
import { useSchemaForm, SchemaFormProvider, TextWidget, SelectWidget } from './src-next-trea';
import * as v from 'valibot';

const schema = {
  meta: { version: '1.0.0' },
  fields: [
    {
      name: 'username',
      component: 'Text',
      validate: v.pipe(v.string(), v.minLength(3)),
    },
    {
      name: 'role',
      component: 'Select',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
      ],
    },
    {
      name: 'isAdmin',
      component: 'Switch',
      compute: "role === 'admin'", // 派生计算
    },
  ],
};

function MyForm() {
  const { form, runtime, handleSubmit } = useSchemaForm({
    schema,
    onSubmit: (values) => console.log(values),
  });

  return (
    <SchemaFormProvider runtime={runtime}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <TextWidget form={form} name="username" label="用户名" />
        <SelectWidget form={form} name="role" label="角色" />
        <button type="submit">提交</button>
      </form>
    </SchemaFormProvider>
  );
}
```

## API 参考

### useSchemaForm(options)

```ts
const { form, runtime, compiledSchema, handleSubmit, handleReset, getValues, setValue } = useSchemaForm({
  schema: SchemaInput,
  defaultValues?: Partial<T>,
  onSubmit?: (values: T) => void,
  onValuesChange?: (values: T) => void,
  compilerOptions?: CompilerOptions,
  runtimeConfig?: RuntimeConfig,
});
```

### Schema 规则语法

```ts
// 派生计算
{ compute: "price * quantity" }

// 条件显示
{ visibleWhen: "role === 'admin'" }

// 条件禁用
{ disabledWhen: "status === 'locked'" }

// 条件必填
{ requiredWhen: "age >= 18" }

// 异步选项
{
  options: async (scope, signal) => {
    const res = await fetch('/api/options', { signal });
    return res.json();
  }
}
```

## 目录结构

```
src-next-trea/
├── core/
│   ├── compiler/
│   │   ├── index.ts           # SchemaCompiler
│   │   ├── evaluator.ts       # SafeEvaluator
│   │   └── dependencyAnalyzer.ts
│   ├── runtime/
│   │   ├── Runtime.ts         # FormRuntime
│   │   ├── EffectSystem.ts
│   │   └── AsyncScheduler.ts
│   └── validation/
│       └── valibotAdapter.ts
├── react/
│   ├── useSchemaForm.ts
│   └── SchemaFormProvider.tsx
├── ui/
│   ├── FieldAdapter.tsx
│   └── widgets/
│       ├── index.ts
│       ├── TextWidget.tsx
│       ├── NumberWidget.tsx
│       ├── SelectWidget.tsx
│       ├── CheckboxWidget.tsx
│       ├── SwitchWidget.tsx
│       ├── RadioWidget.tsx
│       └── DateWidget.tsx
├── types.ts
├── index.ts
└── SchemaForm.example.tsx
```

## 技术栈

- **Core State**: @tanstack/react-form
- **Expression**: jsep (Interpreter Mode)
- **Validation**: valibot
- **UI**: @mui/material

## 开发计划

- [ ] FormList 组件
- [ ] 表单级校验
- [ ] DevTools 可视化面板
- [ ] 性能压测

