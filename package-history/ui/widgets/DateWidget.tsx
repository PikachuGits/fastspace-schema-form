import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import type { WidgetComponent } from "../../types";
import { compactFieldStyles, DATE_FORMAT } from "./styles";
import { renderLabel } from "./utils";

/** 日期选择 */
export const DateWidget: WidgetComponent = ({
  field,
  label,
  error,
  helperText,
  fieldProps,
  form,
}) => (
  <LocalizationProvider adapterLocale="zh-cn" dateAdapter={AdapterDayjs}>
    <DatePicker
      value={field.value ? dayjs(field.value) : null}
      onChange={(val) =>
        field.onChange(val?.isValid() ? val.format(DATE_FORMAT) : "")
      }
      onClose={() => form?.trigger(field.name)}
      format={DATE_FORMAT}
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
          onBlur: () => form?.trigger(field.name),
        },
      }}
      {...fieldProps}
    />
  </LocalizationProvider>
);

