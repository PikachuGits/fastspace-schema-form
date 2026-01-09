import React, { memo } from "react";
import { TextField, Box } from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { compactFieldStyles } from "./styles";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type CustomWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  /** 自定义渲染函数 */
  children?:
  | React.ReactNode
  | ((props: WidgetProps & Record<string, any>) => React.ReactNode);
  /** 自定义组件 */
  component?: React.ComponentType<WidgetProps & Record<string, any>>;
  /** 传递给自定义组件的额外属性 */
  componentProps?: Record<string, any>;
};

export type CustomWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<CustomWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

/**
 * 自定义组件渲染
 *
 * 支持三种方式渲染自定义内容：
 * 1. children 函数：接收完整的 props，返回 ReactNode
 * 2. children ReactNode：直接渲染
 * 3. component：自定义组件
 */
export const CustomWidgetRender = memo(function CustomWidgetRender({
  value,
  onChange,
  onBlur,
  name,
  error,
  disabled,
  required,
  visible = true,
  label,
  helperText,
  children,
  component: Component,
  componentProps = {},
  ...rest
}: CustomWidgetRenderProps) {
  if (!visible) return null;

  const widgetProps: WidgetProps = {
    value,
    onChange,
    onBlur,
    name,
    error,
    disabled,
    required,
    visible,
  };

  // 如果提供了 children（函数或 ReactNode）
  if (children !== undefined) {
    if (typeof children === "function") {
      return (
        <Box>
          {children({
            ...widgetProps,
            label,
            helperText,
            ...rest,
            ...componentProps,
          })}
        </Box>
      );
    }
    return <Box>{children}</Box>;
  }

  // 如果提供了自定义组件
  if (Component) {
    return (
      <Component
        {...widgetProps}
        label={label}
        helperText={helperText}
        {...rest}
        {...componentProps}
      />
    );
  }

  // 降级为 TextField
  return (
    <TextField
      fullWidth
      name={name}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      label={renderLabel(label, required)}
      error={!!error}
      helperText={error || helperText}
      disabled={disabled}
      required={required}
      size="small"
      sx={compactFieldStyles}
      {...componentProps}
    />
  );
});

// ============================================================================
// 独立组件 (带 FieldAdapter)
// ============================================================================

/**
 * 自定义组件
 *
 * 允许用户完全自定义表单控件的渲染
 *
 * @example
 * ```tsx
 * // 使用 children 函数
 * <CustomWidget
 *   form={form}
 *   name="custom"
 *   children={({ value, onChange }) => (
 *     <MyCustomInput value={value} onChange={onChange} />
 *   )}
 * />
 *
 * // 使用 component
 * <CustomWidget
 *   form={form}
 *   name="custom"
 *   component={MyCustomInput}
 *   componentProps={{ variant: 'outlined' }}
 * />
 * ```
 */
export const CustomWidget: React.FC<CustomWidgetProps> = ({
  form,
  name,
  validate,
  ...uiProps
}) => {
  return (
    <FieldAdapter
      form={form}
      name={name}
      validate={validate}
      render={(props: WidgetProps) => (
        <CustomWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default CustomWidgetRender;

