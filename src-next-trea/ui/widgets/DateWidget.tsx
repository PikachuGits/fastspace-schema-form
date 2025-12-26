import React, { memo } from "react";
import { TextField } from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";

// ============================================================================
// Types
// ============================================================================

export type DateWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  type?: "date" | "time" | "datetime-local";
  min?: string;
  max?: string;
  inputProps?: Record<string, any>;
};

export type DateWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<DateWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

/**
 * 日期/时间输入渲染组件
 *
 * 使用原生 HTML5 日期输入 (性能最佳)
 * 如需更丰富的日期选择器，可自定义实现
 */
export const DateWidgetRender = memo(function DateWidgetRender({
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  visible = true,
  label,
  helperText,
  type = "date",
  min,
  max,
  inputProps,
}: DateWidgetRenderProps) {
  if (!visible) return null;

  // 格式化值用于显示
  const formatValue = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (val instanceof Date) {
      if (type === "date") {
        return val.toISOString().split("T")[0];
      }
      if (type === "time") {
        return val.toTimeString().slice(0, 5);
      }
      // datetime-local
      return val.toISOString().slice(0, 16);
    }
    return String(val);
  };

  return (
    <TextField
      fullWidth
      type={type}
      label={label}
      value={formatValue(value)}
      onChange={(e) => onChange(e.target.value || null)}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      error={!!error}
      helperText={error || helperText}
      slotProps={{
        input: {
          inputProps: { min, max },
          ...inputProps,
        },
        inputLabel: { shrink: true },
      }}
    />
  );
});

// ============================================================================
// 独立组件
// ============================================================================

export const DateWidget: React.FC<DateWidgetProps> = ({
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
        <DateWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default DateWidgetRender;
