import React, { memo } from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { compactFieldStyles } from "./styles";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type NumberWidgetRenderProps = WidgetProps & {
  label?: string;
  placeholder?: string;
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
  inputProps?: Record<string, any>;
  slotProps?: TextFieldProps["slotProps"];
};

export type NumberWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<NumberWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

export const NumberWidgetRender = memo(function NumberWidgetRender({
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
  min,
  max,
  step,
  inputProps,
  slotProps,
}: NumberWidgetRenderProps) {
  if (!visible) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === "") {
      // 使用 null 而不是 undefined，避免 React Hook Form 回退到 defaultValue
      onChange(null);
    } else {
      const num = parseFloat(rawValue);
      onChange(isNaN(num) ? null : num);
    }
  };

  // 处理 NaN 和 null/undefined 值，确保传递给 input 的是有效字符串或空字符串
  const displayValue = value === null || value === undefined || Number.isNaN(value) ? "" : value;

  const mergedSlotProps: TextFieldProps["slotProps"] = {
    ...slotProps,
    htmlInput: {
      ...(min === undefined ? {} : { min }),
      ...(max === undefined ? {} : { max }),
      ...(step === undefined ? {} : { step }),
      ...(slotProps as any)?.htmlInput,
      ...(inputProps ?? {}),
    },
  };

  return (
    <TextField
      fullWidth
      type="number"
      size="small"
      label={renderLabel(label, required)}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      error={!!error}
      helperText={error || helperText}
      sx={compactFieldStyles}
      slotProps={mergedSlotProps}
    />
  );
});

// ============================================================================
// 独立组件
// ============================================================================

export const NumberWidget: React.FC<NumberWidgetProps> = ({
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
        <NumberWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default NumberWidgetRender;
