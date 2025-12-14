# SchemaForm Compute 功能优化文档

## 问题描述

### 1. Compute 字段一直刷新导致报错
当使用 `compute` 属性进行自动计算时，如果依赖字段的值为 `undefined` 或 `null`，会导致：
- 表达式计算出 `NaN` 值
- 频繁触发 `setValue` 操作
- 控制台持续报错

**示例问题场景：**
```typescript
{
  name: 'unpaid_amount_display',
  component: 'Number',
  compute: {
    expr: 'total_amount - paid_amount',
  },
}
```

当 `total_amount` 或 `paid_amount` 为 `undefined` 时，计算结果为 `NaN`，导致频繁报错。

### 2. defaultValues 清空后自动回填
当 SchemaForm 设置了 `defaultValues`，用户清空输入框后，值会自动恢复为 `defaultValues` 中的值。

## 解决方案

### 1. ✅ Compute 计算优化

#### 改进点 A: 安全的表达式求值

**优化前：**
```typescript
function evaluateCompute(expr: string, values: ValuesMap): unknown {
  try {
    const fn = new Function(
      ...Object.keys(values),
      `"use strict"; return (${expr});`
    );
    return fn(...Object.values(values));
  } catch {
    return;
  }
}
```

**优化后：**
```typescript
function evaluateCompute(expr: string, values: ValuesMap): unknown {
  try {
    // 1. 过滤掉 undefined 和 null 的值，避免计算错误
    const safeValues: ValuesMap = {};
    for (const [key, value] of Object.entries(values)) {
      // 将 undefined/null 转换为 0（适用于数学运算）
      safeValues[key] = value ?? 0;
    }
    
    const fn = new Function(
      ...Object.keys(safeValues),
      `"use strict"; return (${expr});`
    );
    const result = fn(...Object.values(safeValues));
    
    // 2. 如果结果是 NaN、Infinity 或 -Infinity，返回 undefined
    if (typeof result === 'number' && !Number.isFinite(result)) {
      return undefined;
    }
    
    return result;
  } catch (error) {
    console.warn('Compute expression evaluation failed:', expr, error);
    return undefined;
  }
}
```

**改进点：**
- ✅ 将 `undefined`/`null` 转换为 `0`，避免 `NaN` 结果
- ✅ 检测并过滤 `NaN`、`Infinity`、`-Infinity` 等无效数值
- ✅ 添加错误日志，便于调试

#### 改进点 B: 智能更新策略

**优化前：**
```typescript
useEffect(() => {
  for (const field of parsed.input.fields) {
    if (field.compute) {
      const computedValue = evaluateCompute(field.compute.expr, values);
      const currentValue = methods.getValues(field.name as string);
      if (computedValue !== currentValue) {
        methods.setValue(field.name as string, computedValue, {
          shouldValidate: false,
        });
      }
    }
  }
}, [values, parsed.input.fields, methods]);
```

**优化后：**
```typescript
useEffect(() => {
  for (const field of parsed.input.fields) {
    if (field.compute) {
      // 1. 提取表达式中涉及的字段名
      const dependencies = field.compute.dependencies || extractDependencies(field.compute.expr);
      
      // 2. 检查依赖字段是否都有值（避免 undefined 计算）
      const hasAllDependencies = dependencies.every(
        (dep) => values[dep] !== undefined && values[dep] !== null && values[dep] !== ''
      );
      
      // 3. 只有当所有依赖字段都有值时才进行计算
      if (!hasAllDependencies) {
        continue;
      }
      
      const computedValue = evaluateCompute(field.compute.expr, values);
      const currentValue = methods.getValues(field.name as string);
      
      // 4. 只有当计算结果有效且确实变化时才更新
      if (
        computedValue !== undefined && 
        computedValue !== currentValue &&
        !Number.isNaN(computedValue)
      ) {
        methods.setValue(field.name as string, computedValue, {
          shouldValidate: false,
          shouldDirty: false,    // 不标记为脏数据
          shouldTouch: false,    // 不标记为已触摸
        });
      }
    }
  }
}, [values, parsed.input.fields, methods]);

// 辅助函数：提取表达式中的依赖字段名
function extractDependencies(expr: string): string[] {
  const identifiers = expr.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
  const keywords = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'Math', 'Number', 'String', 'Boolean', 'Array', 'Object']);
  return Array.from(new Set(identifiers.filter(id => !keywords.has(id))));
}
```

**改进点：**
- ✅ 支持手动指定 `dependencies` 或自动提取
- ✅ 只在所有依赖字段都有值时才计算
- ✅ 添加额外的有效性检查
- ✅ 优化 `setValue` 选项，避免不必要的副作用

### 2. ✅ defaultValues 清空问题优化

**优化：**
```typescript
const methods = useForm({
  defaultValues: defaultValues as ValuesMap,
  resolver: resolver as any,
  mode: "onBlur",
  reValidateMode: "onBlur",
  // 重置选项：防止清空后自动回填 defaultValues
  resetOptions: {
    keepDirtyValues: true, // 保持已修改的值
  },
});
```

**改进点：**
- ✅ 添加 `keepDirtyValues: true`，保持用户修改的值
- ✅ 允许用户清空字段，不会自动回填

## 使用指南

### 推荐用法

#### 1. 明确指定 dependencies（推荐）

```typescript
{
  name: 'unpaid_amount_display',
  component: 'Number',
  disabled: true,
  ui: {
    label: '未支付金额',
    helperText: '自动计算: 结算总金额 - 已支付金额',
  },
  compute: {
    expr: 'total_amount - paid_amount',
    dependencies: ['total_amount', 'paid_amount'], // ✅ 明确指定
  },
}
```

#### 2. 自动提取 dependencies

```typescript
{
  name: 'total_price',
  component: 'Number',
  disabled: true,
  ui: { label: '总价' },
  compute: {
    expr: 'price * quantity', // 自动提取 ['price', 'quantity']
  },
}
```

### 复杂计算示例

#### 示例 1: 带条件的计算

```typescript
{
  name: 'discount_price',
  component: 'Number',
  disabled: true,
  ui: { label: '折扣价' },
  compute: {
    expr: 'is_vip ? price * 0.8 : price',
    dependencies: ['is_vip', 'price'],
  },
}
```

#### 示例 2: 多字段计算

```typescript
{
  name: 'total_cost',
  component: 'Number',
  disabled: true,
  ui: { label: '总成本' },
  compute: {
    expr: 'product_cost + shipping_cost + tax_amount',
    dependencies: ['product_cost', 'shipping_cost', 'tax_amount'],
  },
}
```

#### 示例 3: 使用 Math 函数

```typescript
{
  name: 'discount_percentage',
  component: 'Number',
  disabled: true,
  ui: { label: '折扣比例' },
  compute: {
    expr: 'Math.round((original_price - sale_price) / original_price * 100)',
    dependencies: ['original_price', 'sale_price'],
  },
}
```

## 类型定义更新

### ComputeConfig 类型

```typescript
/** 计算配置 */
export type ComputeConfig = {
  /** 表达式字符串，如 "price * quantity" */
  expr: string;
  /** 依赖字段（可选，自动从 expr 解析） */
  dependencies?: string[];  // ✅ 从 deps 改为 dependencies
};
```

## 性能优化建议

1. **明确指定 dependencies**：避免不必要的正则解析
2. **使用简单表达式**：复杂计算建议在表单外部处理
3. **避免循环依赖**：不要让计算字段互相依赖

## 注意事项

⚠️ **重要提示：**

1. **依赖字段必须有值**：只有当所有 dependencies 都有值时才会触发计算
2. **undefined/null 被视为 0**：在数学运算中，空值会被转换为 0
3. **计算字段通常设为 disabled**：避免用户手动修改
4. **noSubmit 可选**：计算字段可以参与提交，也可以设置 `noSubmit: true`

## 完整示例

```typescript
const schema: SchemaInput = {
  fields: [
    {
      name: 'price',
      component: 'Number',
      ui: { label: '单价', props: { inputProps: { step: '0.01', min: 0 } } },
      rules: [{ type: 'required', message: '请输入单价' }],
    },
    {
      name: 'quantity',
      component: 'Number',
      ui: { label: '数量', props: { inputProps: { step: '1', min: 1 } } },
      rules: [{ type: 'required', message: '请输入数量' }],
    },
    {
      name: 'subtotal',
      component: 'Number',
      disabled: true,
      ui: {
        label: '小计',
        helperText: '自动计算: 单价 × 数量',
      },
      compute: {
        expr: 'price * quantity',
        dependencies: ['price', 'quantity'],
      },
    },
    {
      name: 'tax_rate',
      component: 'Number',
      defaultValue: 0.13,
      ui: { label: '税率', props: { inputProps: { step: '0.01', min: 0, max: 1 } } },
    },
    {
      name: 'tax_amount',
      component: 'Number',
      disabled: true,
      ui: {
        label: '税额',
        helperText: '自动计算: 小计 × 税率',
      },
      compute: {
        expr: 'subtotal * tax_rate',
        dependencies: ['subtotal', 'tax_rate'],
      },
    },
    {
      name: 'total',
      component: 'Number',
      disabled: true,
      ui: {
        label: '合计',
        helperText: '自动计算: 小计 + 税额',
      },
      compute: {
        expr: 'subtotal + tax_amount',
        dependencies: ['subtotal', 'tax_amount'],
      },
    },
  ],
};
```

## 常见问题

### Q1: 为什么我的计算字段不更新？
**A:** 检查以下几点：
1. 所有 `dependencies` 字段是否都有值？
2. 表达式是否正确？
3. 是否有语法错误？

### Q2: 计算结果显示 0，但我期望是空值？
**A:** 当依赖字段为空时，会被转换为 0。如果需要空值，可以使用条件表达式：
```typescript
expr: 'total_amount && paid_amount ? total_amount - paid_amount : null'
```

### Q3: 如何禁用自动计算？
**A:** 移除 `compute` 属性即可。

### Q4: 计算字段能否被手动修改？
**A:** 可以，只需移除 `disabled: true` 即可，但通常不建议这样做。

## 总结

通过这些优化，SchemaForm 的 compute 功能现在更加：
- ✅ **健壮**：处理 undefined/null 值，避免 NaN 错误
- ✅ **智能**：只在依赖字段有值时才计算
- ✅ **高效**：减少不必要的更新
- ✅ **可控**：支持手动指定依赖或自动提取
- ✅ **灵活**：允许用户清空字段，不会自动回填

