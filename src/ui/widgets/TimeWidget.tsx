import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import "dayjs/locale/zh-cn";
import type { WidgetComponent } from "../../types";
import { compactFieldStyles } from "./styles";
import { renderLabel } from "./utils";

/** 时间选择 */
export const TimeWidget: WidgetComponent = ({
  field,
  label,
  error,
  helperText,
  fieldProps,
}) => (
  <LocalizationProvider adapterLocale="zh-cn" dateAdapter={AdapterDayjs}>
    <TimePicker
      disabled={fieldProps?.disabled}
      onChange={(v) => field.onChange(v)}
      slotProps={{
        textField: {
          fullWidth: true,
          label: renderLabel(label, fieldProps?.required),
          error,
          helperText,
          required: fieldProps?.required,
          size: "small",
          sx: compactFieldStyles,
        },
      }}
      value={field.value ?? null}
      {...fieldProps}
    />
  </LocalizationProvider>
);

