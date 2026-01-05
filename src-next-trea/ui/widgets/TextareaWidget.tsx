import React, { memo } from "react";
import { TextField } from "@mui/material";
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
}: TextareaWidgetRenderProps) {
  if (!visible) return null;

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
      rows={rows}
      maxRows={maxRows}
      size="small"
      sx={compactFieldStyles}
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
