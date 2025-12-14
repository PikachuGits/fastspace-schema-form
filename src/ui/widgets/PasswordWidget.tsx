import { TextField } from "@mui/material";
import type { WidgetComponent } from "../../types";
import { compactFieldStyles } from "./styles";
import { renderLabel } from "./utils";

/** 密码输入 */
export const PasswordWidget: WidgetComponent = ({
  field,
  label,
  error,
  helperText,
  fieldProps,
}) => (
  <TextField
    {...field}
    value={field.value ?? ""}
    type="password"
    label={renderLabel(label, fieldProps?.required)}
    error={error}
    helperText={helperText}
    fullWidth
    size="small"
    sx={compactFieldStyles}
    disabled={fieldProps?.disabled}
    required={fieldProps?.required}
    {...fieldProps}
  />
);

