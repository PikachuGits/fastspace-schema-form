import React, { memo, useMemo, useCallback } from "react";
import { TimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/zh-cn";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { compactFieldStyles, TIME_FORMAT } from "./styles";
import { renderLabel } from "./utils";

// 启用 customParseFormat 插件以支持精确的时间格式解析
dayjs.extend(customParseFormat);

// ============================================================================
// Types
// ============================================================================

export type TimeWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  format?: string;
  ampm?: boolean;
  /** 分钟步长，默认 1 */
  minutesStep?: number;
  /** 秒步长，默认无 */
  secondsStep?: number;
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
  minutesStep = 1,
  secondsStep,
}: TimeWidgetRenderProps) {
  if (!visible) return null;

  // 将字符串值转换为 Dayjs 对象
  const timeValue: Dayjs | null = useMemo(() => {
    if (!value) return null;
    // 使用 strict 模式解析时间字符串
    const parsed = dayjs(value, format, true);
    if (parsed.isValid()) return parsed;
    // 尝试作为完整日期时间解析（兼容其他格式）
    const fallback = dayjs(value);
    return fallback.isValid() ? fallback : null;
  }, [value, format]);

  // 处理时间变化
  const handleChange = useCallback(
    (newValue: Dayjs | null) => {
      if (!newValue || !newValue.isValid()) {
        onChange(null);
        return;
      }
      // 格式化为字符串存储
      onChange(newValue.format(format));
    },
    [onChange, format]
  );

  return (
    <LocalizationProvider adapterLocale="zh-cn" dateAdapter={AdapterDayjs}>
      <TimePicker
        value={timeValue}
        onChange={handleChange}
        format={format}
        ampm={ampm}
        disabled={disabled}
        minutesStep={minutesStep}
        {...(secondsStep ? { secondsStep } : {})}
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
          // 修复时间选择器点击问题
          actionBar: {
            actions: ["clear", "accept"],
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
