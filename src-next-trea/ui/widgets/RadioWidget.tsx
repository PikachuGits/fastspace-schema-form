import React, { memo } from "react";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  type RadioProps,
  Stack,
} from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import type { OptionItem } from "./SelectWidget";

// ============================================================================
// Types
// ============================================================================

export type RadioWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  row?: boolean;
  inline?: boolean; // label 和选项在同一行
  radioProps?: Partial<RadioProps>;
};

export type RadioWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<RadioWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

export const RadioWidgetRender = memo(function RadioWidgetRender({
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  visible = true,
  options = [],
  label,
  helperText,
  row = false,
  inline = false,
  radioProps,
}: RadioWidgetRenderProps) {
  if (!visible) return null;

  // 规范化选项
  const normalizedOptions: OptionItem[] = Array.isArray(options)
    ? options.map((opt) =>
        typeof opt === "object"
          ? opt
          : { label: String(opt), value: opt }
      )
    : [];

  const radioGroupContent = (
    <RadioGroup
      row={row}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    >
      {normalizedOptions.map((opt) => (
        <FormControlLabel
          key={opt.key ?? String(opt.value)}
          value={opt.value}
          control={<Radio disabled={opt.disabled} {...radioProps} />}
          label={opt.listLabel ?? opt.label}
          disabled={opt.disabled || disabled}
        />
      ))}
    </RadioGroup>
  );

  // inline 模式：label 和选项在同一行
  if (inline && label) {
    return (
      <FormControl
        component="fieldset"
        error={!!error}
        disabled={disabled}
        required={required}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <FormLabel component="legend" sx={{ mb: 0 }}>
            {label}
          </FormLabel>
          {radioGroupContent}
        </Stack>
        {(error || helperText) && (
          <FormHelperText>{error || helperText}</FormHelperText>
        )}
      </FormControl>
    );
  }

  return (
    <FormControl
      component="fieldset"
      error={!!error}
      disabled={disabled}
      required={required}
    >
      {label && <FormLabel component="legend">{label}</FormLabel>}
      {radioGroupContent}
      {(error || helperText) && (
        <FormHelperText>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
});

// ============================================================================
// 独立组件
// ============================================================================

export const RadioWidget: React.FC<RadioWidgetProps> = ({
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
        <RadioWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default RadioWidgetRender;
