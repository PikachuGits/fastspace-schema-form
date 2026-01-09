import { TextField } from "@mui/material";
import type { WidgetComponent } from "../../types";
import { compactFieldStyles } from "./styles";
import { renderLabel } from "./utils";

/** 多行文本 */
export const TextareaWidget: WidgetComponent = ({
  field,
  label,
  error,
  helperText,
  fieldProps,
}) => (
  <TextField
    {...field}
    value={field.value ?? ""}
    label={renderLabel(label, fieldProps?.required)}
    multiline
    rows={4}
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

