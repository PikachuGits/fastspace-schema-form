import React, { memo } from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";

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
      onChange(undefined);
    } else {
      const num = parseFloat(rawValue);
      onChange(isNaN(num) ? undefined : num);
    }
  };

  return (
    <TextField
      fullWidth
      type="number"
      label={label}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      error={!!error}
      helperText={error || helperText}
      slotProps={{
        input: {
          inputProps: { min, max, step },
          ...inputProps,
        },
        ...slotProps,
      }}
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
