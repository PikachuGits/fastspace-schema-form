import React, { memo } from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { compactFieldStyles } from "./styles";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type TextareaWidgetRenderProps = WidgetProps & {
  label?: string;
  placeholder?: string;
  helperText?: string;
  rows?: number;
  maxRows?: number;
  maxLength?: number;
  inputProps?: Record<string, any>;
  slotProps?: TextFieldProps["slotProps"];
};

export type TextareaWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<TextareaWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

export const TextareaWidgetRender = memo(function TextareaWidgetRender({
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
  rows = 4,
  maxRows,
  maxLength,
  inputProps,
  slotProps,
}: TextareaWidgetRenderProps) {
  if (!visible) return null;

  // 使用 minRows + maxRows 实现自动扩展，避免 rows + maxRows 冲突警告
  // 当设置了 maxRows 时，使用 minRows 替代 rows
  const textFieldProps = maxRows
    ? { minRows: rows, maxRows }
    : { rows };

  const mergedInputSlotProps = {
    ...(inputProps ?? {}),
    inputProps: {
      ...(inputProps as any)?.inputProps,
      ...(maxLength === undefined ? {} : { maxLength }),
    },
  };

  return (
    <TextField
      fullWidth
      label={renderLabel(label, required)}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      error={!!error}
      helperText={error || helperText}
      multiline
      {...textFieldProps}
      size="small"
      sx={compactFieldStyles}
      slotProps={{
        input: mergedInputSlotProps,
        ...slotProps,
      }}
    />
  );
});

// ============================================================================
// 独立组件
// ============================================================================

export const TextareaWidget: React.FC<TextareaWidgetProps> = ({
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
        <TextareaWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default TextareaWidgetRender;
