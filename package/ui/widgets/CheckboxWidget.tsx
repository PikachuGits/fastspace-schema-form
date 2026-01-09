import React, { memo } from "react";
import {
  FormControl,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  type CheckboxProps,
} from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { formControlStyles } from "./styles";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type CheckboxWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  checkboxProps?: Partial<CheckboxProps>;
};

export type CheckboxWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<CheckboxWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

export const CheckboxWidgetRender = memo(function CheckboxWidgetRender({
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  visible = true,
  label,
  helperText,
  checkboxProps,
}: CheckboxWidgetRenderProps) {
  if (!visible) return null;

  return (
    <FormControl
      error={!!error}
      disabled={disabled}
      required={required}
      sx={formControlStyles}
    >
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            disabled={disabled}
            {...checkboxProps}
          />
        }
        label={renderLabel(label, required)}
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

export const CheckboxWidget: React.FC<CheckboxWidgetProps> = ({
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
        <CheckboxWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default CheckboxWidgetRender;
