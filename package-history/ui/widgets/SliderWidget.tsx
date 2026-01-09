import { FormControl, FormLabel, Slider } from "@mui/material";
import type { WidgetComponent } from "../../types";

/** 滑块 */
export const SliderWidget: WidgetComponent = ({ field, label, fieldProps }) => (
  <FormControl fullWidth>
    {label && <FormLabel>{label}</FormLabel>}
    <Slider
      value={field.value ?? 0}
      onChange={(_, v) => field.onChange(v)}
      disabled={fieldProps?.disabled}
      {...fieldProps}
    />
  </FormControl>
);

