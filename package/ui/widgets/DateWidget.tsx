import React, { memo } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/zh-cn";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { compactFieldStyles, DATE_FORMAT } from "./styles";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type DateWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  format?: string;
  min?: string;
  max?: string;
};

export type DateWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<DateWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

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
  format = DATE_FORMAT,
  min,
  max,
}: DateWidgetRenderProps) {
  if (!visible) return null;

  const dateValue: Dayjs | null = value ? dayjs(value) : null;
  const minDate = min ? dayjs(min) : undefined;
  const maxDate = max ? dayjs(max) : undefined;

  return (
    <LocalizationProvider adapterLocale="zh-cn" dateAdapter={AdapterDayjs}>
      <DatePicker
        value={dateValue}
        onChange={(val) => onChange(val?.isValid() ? val.format(format) : null)}
        format={format}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
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
