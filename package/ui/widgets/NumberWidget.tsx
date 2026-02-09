import React, { memo, useCallback } from "react";
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
  /** 仅允许整数 (失焦时截断小数) */
  integer?: boolean;
  /** 小数位数上限 (失焦时四舍五入)，默认不限制 */
  precision?: number;
  /** 是否允许负数，默认 true */
  allowNegative?: boolean;
  inputProps?: Record<string, any>;
  slotProps?: TextFieldProps["slotProps"];
};

export type NumberWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<NumberWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 规范化数值 (失焦时调用)
 * - 去除前导零: 0100 → 100
 * - 整数模式: 3.7 → 3
 * - 小数位数: 3.14159 → 3.14 (precision=2)
 * - 禁止负数: -5 → 5
 * - 范围裁剪: clamp(min, max)
 */
function normalizeNumber(
  val: number,
  opts: {
    integer?: boolean;
    precision?: number;
    allowNegative?: boolean;
    min?: number;
    max?: number;
  }
): number {
  let n = Number(val); // Number("0100") → 100，去除前导零

  // 禁止负数
  if (opts.allowNegative === false && n < 0) {
    n = Math.abs(n);
  }

  // 整数模式
  if (opts.integer) {
    n = Math.trunc(n);
  }

  // 小数位数限制
  if (opts.precision !== undefined && opts.precision >= 0 && !opts.integer) {
    n = Number(n.toFixed(opts.precision));
  }

  // 范围裁剪
  if (opts.min !== undefined && n < opts.min) n = opts.min;
  if (opts.max !== undefined && n > opts.max) n = opts.max;

  return n;
}

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
  integer,
  precision,
  allowNegative = true,
  inputProps,
  slotProps,
}: NumberWidgetRenderProps) {
  if (!visible) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === "") {
      onChange(null);
      return;
    }
    const num = parseFloat(rawValue);
    onChange(isNaN(num) ? null : num);
  };

  // 失焦时规范化数值
  const handleBlur = useCallback(() => {
    if (value !== null && value !== undefined && !Number.isNaN(value)) {
      const normalized = normalizeNumber(Number(value), {
        integer,
        precision,
        allowNegative,
        min,
        max,
      });
      if (normalized !== Number(value)) {
        onChange(normalized);
      }
    }
    onBlur();
  }, [value, onChange, onBlur, integer, precision, allowNegative, min, max]);

  // 处理 NaN 和 null/undefined 值
  const displayValue =
    value === null || value === undefined || Number.isNaN(value) ? "" : value;

  // 根据配置推导 HTML input 属性
  const effectiveMin = allowNegative === false && (min === undefined || min < 0) ? 0 : min;
  const effectiveStep = step ?? (integer ? 1 : undefined);

  const mergedSlotProps: TextFieldProps["slotProps"] = {
    ...slotProps,
    htmlInput: {
      ...(effectiveMin === undefined ? {} : { min: effectiveMin }),
      ...(max === undefined ? {} : { max }),
      ...(effectiveStep === undefined ? {} : { step: effectiveStep }),
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
      onBlur={handleBlur}
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
