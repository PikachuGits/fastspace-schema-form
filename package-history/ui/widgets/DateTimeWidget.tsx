import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import type { WidgetComponent } from "../../types";
import { compactFieldStyles, DATETIME_FORMAT } from "./styles";
import { renderLabel } from "./utils";

/** 日期时间选择 */
export const DateTimeWidget: WidgetComponent = ({
  field,
  label,
  error,
  helperText,
  fieldProps,
}) => (
  <LocalizationProvider adapterLocale="zh-cn" dateAdapter={AdapterDayjs}>
    <DateTimePicker
      value={field.value ? dayjs(field.value) : null}
      onChange={(val) =>
        field.onChange(val?.isValid() ? val.format(DATETIME_FORMAT) : "")
      }
      format={DATETIME_FORMAT}
      disabled={fieldProps?.disabled}
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
      {...fieldProps}
    />
  </LocalizationProvider>
);

