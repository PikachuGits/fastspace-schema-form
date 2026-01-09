import type { WidgetComponent } from "../../types";

/** 隐藏字段 */
export const HiddenWidget: WidgetComponent = ({ field }) => (
  <input type="hidden" {...field} value={field.value ?? ""} />
);

