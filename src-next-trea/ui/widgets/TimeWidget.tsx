import React, { memo } from "react";
import { TimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/zh-cn";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { compactFieldStyles, TIME_FORMAT } from "./styles";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type TimeWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  format?: string;
  ampm?: boolean;
};

export type TimeWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<TimeWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

export const TimeWidgetRender = memo(function TimeWidgetRender({
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  visible = true,
  label,
  helperText,
  format = TIME_FORMAT,
  ampm = false,
}: TimeWidgetRenderProps) {
  if (!visible) return null;

  // 将字符串值转换为 Dayjs 对象
  const timeValue: Dayjs | null = value ? dayjs(value, format) : null;

  return (
    <LocalizationProvider adapterLocale="zh-cn" dateAdapter={AdapterDayjs}>
      <TimePicker
        value={timeValue}
        onChange={(val) => onChange(val?.isValid() ? val.format(format) : null)}
        format={format}
        ampm={ampm}
        disabled={disabled}
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

export const TimeWidget: React.FC<TimeWidgetProps> = ({
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
        <TimeWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default TimeWidgetRender;

