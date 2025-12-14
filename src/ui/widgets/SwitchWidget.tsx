import { FormControl, FormControlLabel, FormHelperText, Switch } from "@mui/material";
import type { WidgetComponent } from "../../types";
import { renderLabel } from "./utils";

/** 开关 */
export const SwitchWidget: WidgetComponent = ({ field, label, error, helperText, fieldProps }) => (
  <FormControl error={error} required={fieldProps?.required} component="fieldset">
    <FormControlLabel
      control={
        <Switch
          checked={field.value ?? false}
          disabled={fieldProps?.disabled}
          onChange={(e) => field.onChange(e.target.checked)}
          inputRef={field.ref}
        />
      }
      label={renderLabel(label, fieldProps?.required)}
    />
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
);

