import React, { memo } from "react";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/zh-cn";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { compactFieldStyles, DATETIME_FORMAT } from "./styles";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type DateTimeWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  format?: string;
  minDateTime?: string;
  maxDateTime?: string;
  ampm?: boolean;
};

export type DateTimeWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<DateTimeWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

export const DateTimeWidgetRender = memo(function DateTimeWidgetRender({
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  visible = true,
  label,
  helperText,
  format = DATETIME_FORMAT,
  minDateTime,
  maxDateTime,
  ampm = false,
}: DateTimeWidgetRenderProps) {
  if (!visible) return null;

  // 将字符串值转换为 Dayjs 对象
  const dateTimeValue: Dayjs | null = value ? dayjs(value) : null;
  const minValue = minDateTime ? dayjs(minDateTime) : undefined;
  const maxValue = maxDateTime ? dayjs(maxDateTime) : undefined;

  return (
    <LocalizationProvider adapterLocale="zh-cn" dateAdapter={AdapterDayjs}>
      <DateTimePicker
        value={dateTimeValue}
        onChange={(val) => onChange(val?.isValid() ? val.format(format) : null)}
        format={format}
        ampm={ampm}
        disabled={disabled}
        minDateTime={minValue}
        maxDateTime={maxValue}
        slotProps={{
          textField: {
            fullWidth: true,
            label: renderLabel(label, required),
            error: !!error,
            helperText: error || helperText,
            required,
            size: "small",
            sx: compactFieldStyles,
            onBlur,
          },
        }}
      />
    </LocalizationProvider>
  );
});

// ============================================================================
// 独立组件 (带 FieldAdapter)
// ============================================================================

export const DateTimeWidget: React.FC<DateTimeWidgetProps> = ({
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
        <DateTimeWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default DateTimeWidgetRender;

