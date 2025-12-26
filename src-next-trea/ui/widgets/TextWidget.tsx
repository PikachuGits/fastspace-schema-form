import React, { memo } from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";

// ============================================================================
// Types
// ============================================================================

/**
 * 纯渲染组件 Props (用于 SchemaRenderer)
 */
export type TextWidgetRenderProps = WidgetProps & {
  label?: string;
  placeholder?: string;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
  type?: "text" | "password" | "email" | "url" | "tel";
  inputProps?: Record<string, any>;
  slotProps?: TextFieldProps["slotProps"];
};

/**
 * 独立组件 Props (带 form/name)
 */
export type TextWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<TextWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件 (用于 SchemaRenderer)
// ============================================================================

/**
 * 文本输入渲染组件
 *
 * 接收 WidgetProps，不包含 FieldAdapter
 */
export const TextWidgetRender = memo(function TextWidgetRender({
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  visible = true,
  label,
  placeholder,
  helperText,
  multiline = false,
  rows = 4,
  type = "text",
  inputProps,
  slotProps,
}: TextWidgetRenderProps) {
  if (!visible) return null;

  return (
    <TextField
      fullWidth
      label={label}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      error={!!error}
      helperText={error || helperText}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      type={type}
      slotProps={{
        input: inputProps,
        ...slotProps,
      }}
    />
  );
});

// ============================================================================
// 独立组件 (带 FieldAdapter)
// ============================================================================

/**
 * 文本输入组件 (MUI TextField)
 *
 * 包含 FieldAdapter，可独立使用
 *
 * @example
 * ```tsx
 * <TextWidget form={form} name="username" label="用户名" />
 * ```
 */
export const TextWidget: React.FC<TextWidgetProps> = ({
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
        <TextWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

// 默认导出渲染组件，用于 defaultWidgets 注册
export default TextWidgetRender;
