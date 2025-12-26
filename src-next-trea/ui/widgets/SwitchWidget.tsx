import React, { memo } from "react";
import {
  FormControl,
  FormControlLabel,
  Switch,
  FormHelperText,
  type SwitchProps,
} from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";

// ============================================================================
// Types
// ============================================================================

export type SwitchWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  switchProps?: Partial<SwitchProps>;
};

export type SwitchWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<SwitchWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

export const SwitchWidgetRender = memo(function SwitchWidgetRender({
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  visible = true,
  label,
  helperText,
  switchProps,
}: SwitchWidgetRenderProps) {
  if (!visible) return null;

  return (
    <FormControl
      error={!!error}
      disabled={disabled}
      required={required}
    >
      <FormControlLabel
        control={
          <Switch
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            disabled={disabled}
            {...switchProps}
          />
        }
        label={label || ""}
      />
      {(error || helperText) && (
        <FormHelperText>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
});

// ============================================================================
// 独立组件
// ============================================================================

export const SwitchWidget: React.FC<SwitchWidgetProps> = ({
  form,
  name,
  validate,
  ...uiProps
}) => {
  return (
    <FieldAdapter
      form={form}
      name={name}
      validate={validate}
      render={(props: WidgetProps) => (
        <SwitchWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default SwitchWidgetRender;
