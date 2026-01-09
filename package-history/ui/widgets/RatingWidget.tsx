import { FormControl, FormLabel, Rating } from "@mui/material";
import type { WidgetComponent } from "../../types";

/** 评分 */
export const RatingWidget: WidgetComponent = ({ field, label, fieldProps }) => (
  <FormControl>
    {label && <FormLabel>{label}</FormLabel>}
    <Rating
      value={field.value ?? 0}
      onChange={(_, v) => field.onChange(v)}
      disabled={fieldProps?.disabled}
      readOnly={fieldProps?.readOnly}
      {...fieldProps}
    />
  </FormControl>
);

