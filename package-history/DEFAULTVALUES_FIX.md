# SchemaForm defaultValues 自动回填问题修复

## 🐛 问题描述

### 现象
当 SchemaForm 设置了 `defaultValues` 后，用户在表单中删除某个字段的值，该值会自动被重新填充回来。

### 用户期望
`defaultValues` 应该只在表单加载时填充一次，不应该在后续用户操作中自动回填。

## 🔍 问题根源分析

### 问题代码

```typescript
// ❌ 问题代码
const SettlementStatementFormMUI: FC<Props> = ({ initialValues, formRef }) => {
  const [fileList, setFileList] = useState<any[]>([]);
  
  return (
    <SchemaForm
      ref={formRef}
      schema={schema}
      spacing={2}
      defaultValues={{ ...(initialValues ?? {}), pathlist: fileList }}
      //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //           每次渲染都创建新对象，引用不断变化
    />
  );
};
```

### 问题原因

1. **对象字面量每次都创建新引用**
   ```typescript
   // 每次组件渲染时都会创建新对象
   defaultValues={{ ...(initialValues ?? {}), pathlist: fileList }}
   ```

2. **fileList 是响应式 state**
   - 当用户上传/删除文件时，`fileList` 会变化
   - 导致 `defaultValues` 的引用也跟着变化

3. **React Hook Form 的行为**
   - 当 `defaultValues` 的引用变化时，RHF 认为这是一个新表单
   - 会重新初始化表单，导致用户输入的值被覆盖

### 触发链路

```
用户删除文件
  ↓
fileList state 更新
  ↓
组件重新渲染
  ↓
defaultValues 创建新对象（新引用）
  ↓
React Hook Form 检测到 defaultValues 变化
  ↓
重新初始化表单
  ↓
用户输入的值被 defaultValues 覆盖 ❌
```

## ✅ 解决方案

### 核心思路

**使用 `useMemo` 缓存 `defaultValues`，只在真正需要重置表单时才改变引用。**

### 修复代码

```typescript
const SettlementStatementFormMUI: FC<Props> = ({ initialValues, formRef }) => {
  const [fileList, setFileList] = useState<any[]>([]);
  
  // ✅ 使用 useMemo 缓存 defaultValues，避免引用频繁变化
  // 关键：只依赖真正会触发表单重置的标识符（如编辑的记录编号）
  // 而不是依赖整个 initialValues 对象或 fileList
  const memoizedDefaultValues = useMemo(() => {
    return {
      ...(initialValues ?? {}),
    };
    // 关键：使用稳定的标识符作为依赖
    // 使用 statement_no（结算单编号）作为唯一标识
    // 只有当编辑不同的结算单时才重新计算 defaultValues
  }, [initialValues?.statement_no ?? initialValues?.contract_id]);
  
  // 当 fileList 变化时更新表单
  useEffect(() => {
    const ids = Array.isArray(fileList)
      ? fileList.map((f: any) => f?.file_id ?? f?.id).filter((i: any) => i !== undefined && i !== null)
      : [];
    formRef.current?.setValues({ file_ids: ids } as any);
  }, [fileList, formRef]);

  return (
    <SchemaForm
      ref={formRef}
      schema={schema}
      spacing={2}
      defaultValues={memoizedDefaultValues}
      //           ^^^^^^^^^^^^^^^^^^^^^^^
      //           使用缓存的对象，引用稳定
    />
  );
};
```

### 关键改进

#### 1. 使用 `useMemo` 缓存对象引用

```typescript
const memoizedDefaultValues = useMemo(() => {
  return { ...(initialValues ?? {}) };
}, [initialValues?.statement_no]);
```

**为什么有效？**
- `useMemo` 确保只有当依赖项变化时才重新计算
- 依赖项是稳定的标识符（如 `statement_no`），而不是整个对象
- 这样可以避免不必要的重新计算

#### 2. 选择合适的依赖项

```typescript
// ❌ 错误：依赖整个对象
useMemo(() => ({ ...initialValues }), [initialValues])

// ❌ 错误：依赖 fileList
useMemo(() => ({ ...initialValues, pathlist: fileList }), [fileList])

// ✅ 正确：依赖稳定的标识符
useMemo(() => ({ ...initialValues }), [initialValues?.statement_no])
```

**依赖项选择原则：**
- ✅ 使用记录的唯一标识符（ID、编号等）
- ✅ 只在编辑不同记录时才重新计算
- ❌ 不要依赖整个对象（引用总是变化）
- ❌ 不要依赖响应式 state（如 fileList）

#### 3. 分离文件列表的更新逻辑

```typescript
// 通过 setValue 更新文件列表，而不是通过 defaultValues
useEffect(() => {
  const ids = fileList.map(f => f.file_id).filter(Boolean);
  formRef.current?.setValues({ file_ids: ids });
}, [fileList]);
```

## 📊 修复效果对比

### 修复前

| 操作 | 表现 | 问题 |
|------|------|------|
| 用户输入文本 | 输入后被清空 | ❌ 体验差 |
| 用户删除文件 | 触发表单重置 | ❌ 丢失输入 |
| 编辑模式 | 数据正常回显 | ✅ 正常 |

### 修复后

| 操作 | 表现 | 效果 |
|------|------|------|
| 用户输入文本 | 保持输入 | ✅ 正常 |
| 用户删除文件 | 不影响其他字段 | ✅ 正常 |
| 编辑模式 | 数据正常回显 | ✅ 正常 |
| 切换编辑记录 | 正确重置表单 | ✅ 正常 |

## 🎯 最佳实践

### ✅ 推荐做法

#### 1. 使用 useMemo 缓存 defaultValues

```typescript
const memoizedDefaultValues = useMemo(() => {
  return {
    ...initialValues,
    // 其他默认值
  };
}, [
  // 只依赖稳定的标识符
  initialValues?.id,
  initialValues?.code,
]);
```

#### 2. 选择合适的依赖项

```typescript
// 场景 1: 编辑模式（有唯一标识符）
useMemo(() => ({ ...initialValues }), [initialValues?.id])

// 场景 2: 新建模式（无标识符）
useMemo(() => ({ ...initialValues }), []) // 空数组，只计算一次

// 场景 3: 多个可能的标识符
useMemo(() => ({ ...initialValues }), [
  initialValues?.id ?? initialValues?.code ?? initialValues?.name
])
```

#### 3. 动态值通过 setValue 更新

```typescript
// ✅ 正确：通过 setValue 更新动态值
useEffect(() => {
  if (formRef.current) {
    formRef.current.setValue('dynamic_field', dynamicValue);
  }
}, [dynamicValue]);

// ❌ 错误：将动态值放入 defaultValues
const defaultValues = useMemo(() => ({
  ...initialValues,
  dynamic_field: dynamicValue, // ❌ 会导致频繁重置
}), [dynamicValue]);
```

### ❌ 避免的做法

#### 1. 直接使用对象字面量

```typescript
// ❌ 每次渲染都创建新对象
<SchemaForm
  defaultValues={{ ...initialValues, extra: value }}
/>
```

#### 2. 依赖不稳定的值

```typescript
// ❌ 依赖整个对象
useMemo(() => ({ ...initialValues }), [initialValues])

// ❌ 依赖数组/对象
useMemo(() => ({ ...initialValues }), [fileList])

// ❌ 依赖计算值
useMemo(() => ({ ...initialValues }), [initialValues?.items?.length])
```

#### 3. 在 defaultValues 中包含动态值

```typescript
// ❌ 包含响应式 state
const defaultValues = useMemo(() => ({
  ...initialValues,
  pathlist: fileList, // ❌ fileList 变化会导致重置
}), [fileList]);
```

## 🔍 调试技巧

### 1. 检查 defaultValues 是否频繁变化

```typescript
const memoizedDefaultValues = useMemo(() => {
  console.log('🔄 defaultValues 重新计算');
  return { ...initialValues };
}, [initialValues?.id]);

// 如果看到频繁的日志输出，说明依赖项选择不当
```

### 2. 使用 React DevTools

1. 打开 React DevTools
2. 选中 SchemaForm 组件
3. 观察 `defaultValues` prop 的变化
4. 如果频繁变化（引用不同），说明有问题

### 3. 添加表单值监听

```typescript
<SchemaForm
  ref={formRef}
  schema={schema}
  defaultValues={memoizedDefaultValues}
  onValuesChange={(values) => {
    console.log('📝 表单值变化:', values);
  }}
/>
```

## 📚 相关文档

- [React Hook Form - defaultValues](https://react-hook-form.com/api/useform/#defaultValues)
- [React - useMemo](https://react.dev/reference/react/useMemo)
- [SchemaForm Compute 优化](./COMPUTE_OPTIMIZATION.md)

## 🎓 总结

### 核心原则

1. **defaultValues 应该是稳定的引用**
   - 使用 `useMemo` 缓存
   - 只在真正需要重置时才改变

2. **选择合适的依赖项**
   - 使用唯一标识符（ID、编号等）
   - 避免依赖整个对象或数组

3. **动态值通过 setValue 更新**
   - 不要将动态值放入 `defaultValues`
   - 使用 `formRef.current.setValue()` 更新

### 记住这个公式

```typescript
// ✅ 正确的模式
const memoizedDefaultValues = useMemo(
  () => ({ ...initialValues }),
  [initialValues?.唯一标识符]
);

// 动态值单独处理
useEffect(() => {
  formRef.current?.setValue('动态字段', 动态值);
}, [动态值]);
```

---

**修复完成！** 现在用户可以自由地删除/清空字段，不会被自动回填了。✅

