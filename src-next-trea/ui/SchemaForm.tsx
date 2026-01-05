import React, {
  forwardRef,
  use,
  useEffect,
  useImperativeHandle,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { Box, Paper, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/zh-cn";
import {
  useSchemaForm,
  type UseSchemaFormOptions,
} from "../react/useSchemaForm";
import { SchemaFormProvider } from "../react/SchemaFormProvider";
import { SchemaRenderer, type WidgetRegistry } from "./SchemaRenderer";
import type { SchemaInput, CompiledSchema } from "../types";
import type { FormRuntime } from "../core/runtime/Runtime";
import { DevTools } from "./DevTools";

// ============================================================================
// Types
// ============================================================================

/**
 * SchemaForm 实例方法 (通过 ref 暴露)
 */
export interface SchemaFormInstance<T = any> {
  /** 提交表单 */
  submit: () => void;
  /** 重置表单 */
  reset: () => void;
  /** 获取所有值 */
  getValues: () => T;
  /** 设置字段值 */
  setValue: (name: keyof T, value: any) => void;
  /** 批量设置值 */
  setValues: (values: Partial<T>) => void;
  /** 获取 TanStack Form 实例 */
  getForm: () => any;
  /** 获取 Runtime 实例 */
  getRuntime: () => FormRuntime;
  /** 获取编译后的 Schema */
  getCompiledSchema: () => CompiledSchema;
  /** 触发字段校验 */
  validate: (name?: string) => Promise<boolean>;
  /** 清除错误 */
  clearErrors: (name?: string) => void;
}

/**
 * SchemaForm Props
 */
export type SchemaFormProps<
  T extends Record<string, any> = Record<string, any>
> = {
  /** Schema 定义 */
  schema: SchemaInput;
  /** 默认值 */
  defaultValues?: Partial<T>;
  /** 提交回调 */
  onSubmit?: (values: T) => void | Promise<void>;
  /** 值变化回调 */
  onValuesChange?: (values: T) => void;
  /** 提交失败回调 */
  onSubmitFailed?: (errors: any) => void;
  /** 自定义 Widget 映射 */
  widgets?: WidgetRegistry;
  /** 全局禁用 */
  disabled?: boolean;
  /** 全局只读 */
  readOnly?: boolean;
  /** 栅格间距 */
  spacing?: number;
  /** form 标签的额外属性 */
  formProps?: Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit">;
  /** 子元素 (如提交按钮) */
  children?: ReactNode;
  /** 容器样式 */
  sx?: any;
  /** 编译器配置 */
  compilerOptions?: UseSchemaFormOptions<T>["compilerOptions"];
  /** 运行时配置 */
  runtimeConfig?: UseSchemaFormOptions<T>["runtimeConfig"];
};

// ============================================================================
// Component
// ============================================================================

/**
 * SchemaForm - 声明式表单组件
 *
 * 基于 Schema 自动渲染表单，内置 form 标签，通过 ref 暴露表单操作方法。
 *
 * @example
 * ```tsx
 * const formRef = useRef<SchemaFormInstance>(null);
 *
 * <SchemaForm
 *   ref={formRef}
 *   schema={schema}
 *   defaultValues={{ name: '' }}
 *   onSubmit={(values) => console.log(values)}
 * >
 *   <Button onClick={() => formRef.current?.submit()}>提交</Button>
 * </SchemaForm>
 * ```
 */
function SchemaFormInner<T extends Record<string, any> = Record<string, any>>(
  props: SchemaFormProps<T>,
  ref: React.ForwardedRef<SchemaFormInstance<T>>
) {
  const {
    schema,
    defaultValues,
    onSubmit,
    onValuesChange,
    onSubmitFailed,
    widgets,
    disabled,
    readOnly,
    spacing = 2,
    formProps,
    children,
    sx,
    compilerOptions,
    runtimeConfig,
  } = props;

  // 使用 useSchemaForm hook
  const {
    form,
    runtime,
    compiledSchema,
    handleSubmit,
    handleReset,
    getValues,
    setValue,
  } = useSchemaForm<T>({
    schema,
    defaultValues,
    onSubmit,
    onValuesChange,
    compilerOptions,
    runtimeConfig,
  });

  // 暴露实例方法
  useImperativeHandle(
    ref,
    () => ({
      submit: handleSubmit,
      reset: handleReset,
      getValues,
      setValue,
      setValues: (values: Partial<T>) => {
        for (const [key, value] of Object.entries(values)) {
          setValue(key as keyof T, value);
        }
      },
      getForm: () => form,
      getRuntime: () => runtime,
      getCompiledSchema: () => compiledSchema,
      validate: async (name?: string) => {
        if (name) {
          await form.validateField(name);
          return !form.getFieldMeta(name)?.errors?.length;
        }
        await form.validate();
        return form.state.isValid;
      },
      clearErrors: (name?: string) => {
        if (name) {
          form.setFieldMeta(name, (prev: any) => ({ ...prev, errors: [] }));
        } else {
          // 清除所有错误
          for (const fieldName of Object.keys(compiledSchema.fields)) {
            form.setFieldMeta(fieldName, (prev: any) => ({
              ...prev,
              errors: [],
            }));
          }
        }
      },
    }),
    [
      form,
      runtime,
      compiledSchema,
      handleSubmit,
      handleReset,
      getValues,
      setValue,
    ]
  );

  // 处理表单提交
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-cn">
      <SchemaFormProvider runtime={runtime}>
        <Box
          component="form"
          onSubmit={handleFormSubmit}
          sx={sx}
          {...formProps}
        >
          <SchemaRenderer
            schema={compiledSchema}
            form={form}
            widgets={widgets}
            disabled={disabled}
            readOnly={readOnly}
            spacing={spacing}
          />
          {children}
        </Box>

        {import.meta.env.DEV && <DevTools />}
      </SchemaFormProvider>
    </LocalizationProvider>
  );
}

// 使用 forwardRef 包装
export const SchemaForm = forwardRef(SchemaFormInner) as <
  T extends Record<string, any> = Record<string, any>
>(
  props: SchemaFormProps<T> & {
    ref?: React.ForwardedRef<SchemaFormInstance<T>>;
  }
) => React.ReactElement;

export default SchemaForm;
