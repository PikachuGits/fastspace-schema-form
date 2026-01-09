import { useForm } from "@tanstack/react-form";
import { useMemo, useEffect, useCallback } from "react";
import {
  schemaCompiler,
  SchemaCompiler,
  type CompilerOptions,
} from "../core/compiler";
import { FormRuntime, type RuntimeConfig } from "../core/runtime/Runtime";
import type { SchemaInput, CompiledSchema, FieldConfig } from "../types";

// ============================================================================
// Types
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFormApi = any;

export type UseSchemaFormOptions<
  T extends Record<string, any> = Record<string, any>
> = {
  /** Schema 输入 */
  schema: SchemaInput;
  /** 默认值 */
  defaultValues?: Partial<T>;
  /** 提交回调 */
  onSubmit?: (values: T) => void | Promise<void>;
  /** 值变化回调 */
  onValuesChange?: (values: T) => void;
  /** 编译器配置 */
  compilerOptions?: CompilerOptions;
  /** 运行时配置 */
  runtimeConfig?: RuntimeConfig;
  /** TanStack Form 额外配置 */
  formOptions?: Record<string, any>;
};

export type UseSchemaFormReturn<
  T extends Record<string, any> = Record<string, any>
> = {
  /** TanStack Form 实例 */
  form: AnyFormApi;
  /** 运行时实例 */
  runtime: FormRuntime;
  /** 编译后的 Schema */
  compiledSchema: CompiledSchema;
  /** 提交表单 */
  handleSubmit: () => void;
  /** 重置表单 */
  handleReset: () => void;
  /** 获取表单值 */
  getValues: () => T;
  /** 设置字段值 */
  setValue: (name: keyof T, value: any) => void;
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Schema Form 主 Hook (V4)
 *
 * 整合 Schema 编译、TanStack Form 和 Runtime
 *
 * @example
 * ```tsx
 * const { form, runtime } = useSchemaForm({
 *   schema: mySchema,
 *   defaultValues: { name: '' },
 *   onSubmit: (values) => console.log(values),
 * });
 * ```
 */
export function useSchemaForm<
  T extends Record<string, any> = Record<string, any>
>(options: UseSchemaFormOptions<T>): UseSchemaFormReturn<T> {
  const {
    schema: schemaInput,
    defaultValues = {} as Partial<T>,
    onSubmit,
    onValuesChange,
    compilerOptions,
    runtimeConfig,
    formOptions,
  } = options;

  // 1. 编译 Schema (只在 SchemaInput 引用变化时重新编译)
  const compiledSchema = useMemo(() => {
    const compiler = compilerOptions
      ? new SchemaCompiler(compilerOptions)
      : schemaCompiler;
    return compiler.compile(schemaInput);
  }, [schemaInput, compilerOptions]);

  // 2. 计算完整的默认值 (合并 Schema 默认值)
  const mergedDefaultValues = useMemo(() => {
    const schemaDefaults: Record<string, any> = {};
    const fields = compiledSchema.fields as Record<string, FieldConfig>;
    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
      if (fieldConfig.defaultValue !== undefined) {
        schemaDefaults[fieldName] = fieldConfig.defaultValue;
      }
    }
    return { ...schemaDefaults, ...defaultValues } as T;
  }, [compiledSchema, defaultValues]);

  // 3. 初始化 TanStack Form
  const form = useForm({
    defaultValues: mergedDefaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit?.(value as T);
    },
    ...formOptions,
  });

  // 4. 初始化 Runtime
  const runtime = useMemo(() => {
    return new FormRuntime(compiledSchema, form as any, {
      autoInitialize: false, // 延迟初始化
      ...runtimeConfig,
    });
  }, [compiledSchema, form, runtimeConfig]);

  // 5. 在 mount 时初始化 Runtime
  useEffect(() => {
    runtime.initialize();

    return () => {
      runtime.destroy();
    };
  }, [runtime]);

  // 6. 监听值变化 (可选)
  useEffect(() => {
    if (!onValuesChange) return;

    // 使用 form.subscribe 监听状态变化
    const unsubscribe = form.store.subscribe(() => {
      const values = form.state.values;
      onValuesChange(values);
    });

    return unsubscribe;
  }, [form, onValuesChange]);

  // 7. 辅助方法
  const handleSubmit = useCallback(() => {
    form.handleSubmit();
  }, [form]);

  const handleReset = useCallback(() => {
    form.reset();
    runtime.invalidateAndRefresh();
  }, [form, runtime]);

  const getValues = useCallback(() => {
    return form.state.values;
  }, [form]);

  const setValue = useCallback(
    (name: keyof T, value: any) => {
      form.setFieldValue(name as string, value);
      runtime.notifyChange(name as string);
    },
    [form, runtime]
  );

  return {
    form,
    runtime,
    compiledSchema,
    handleSubmit,
    handleReset,
    getValues,
    setValue,
  };
}
