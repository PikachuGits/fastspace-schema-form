import { TextField } from "@mui/material";
import type { WidgetComponent } from "../../types";
import { compactFieldStyles } from "./styles";
import { renderLabel } from "./utils";

/** 自定义组件 */
export const CustomWidget: WidgetComponent = ({
  field,
  label,
  error,
  helperText,
  fieldProps,
  form,
  values,
}) => {
  const { children, component: Component, ...rest } = (fieldProps ?? {}) as any;

  // 如果提供了 children（函数或 ReactNode）
  if (children !== undefined) {
    if (typeof children === "function") {
      return children({
        field,
        label,
        error,
        helperText,
        form,
        values,
        fieldProps: rest,
      });
    }
    return <>{children}</>;
  }

  // 如果提供了自定义组件
  if (Component) {
    return (
      <Component
        field={field}
        label={label}
        error={error}
        helperText={helperText}
        form={form}
        values={values}
        {...rest}
      />
    );
  }

  // 降级为 TextField
  return (
    <TextField
      {...field}
      label={renderLabel(label, rest?.required)}
      error={error}
      helperText={helperText}
      fullWidth
      size="small"
      sx={compactFieldStyles}
      {...rest}
    />
  );
};

