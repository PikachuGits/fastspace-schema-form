import React, { memo } from "react";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  Box,
  type RadioProps,
} from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import type { OptionItem } from "./SelectWidget";
import { formControlStyles, FIELD_HEIGHT } from "./styles";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type RadioWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  /** 选项横向排列，默认 false（纵向） */
  row?: boolean;
  /** label 和组件在同一行，默认 false（label 在上） */
  inline?: boolean;
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
        typeof opt === "object" ? opt : { label: String(opt), value: opt }
      )
    : [];

  const radioGroupContent = (
    <RadioGroup
      row={row}
      value={value ?? ""}
      onChange={(e) => {
        const strValue = e.target.value;
        const originalOption = normalizedOptions.find(
          (o) => String(o.value) === strValue
        );
        onChange(originalOption ? originalOption.value : strValue);
      }}
      onBlur={onBlur}
      sx={{
        gap: row ? 0.5 : 0,
        "& .MuiFormControlLabel-root": {
          marginRight: row ? 2 : 0,
          marginLeft: 0,
        },
      }}
    >
      {normalizedOptions.map((opt) => (
        <FormControlLabel
          key={opt.key ?? String(opt.value)}
          value={String(opt.value)}
          control={
            <Radio size="small" disabled={opt.disabled} {...radioProps} />
          }
          label={opt.listLabel ?? opt.label}
          disabled={opt.disabled || disabled}
        />
      ))}
    </RadioGroup>
  );

  // inline 模式：label 和组件在同一行
  if (inline) {
    return (
      <FormControl
        component="fieldset"
        error={!!error}
        disabled={disabled}
        required={required}
        sx={{
          ...formControlStyles,
          position: "relative",
          pb: error || helperText ? 2.5 : 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: row ? "center" : "flex-start",
            minHeight: `${FIELD_HEIGHT.compact}px`,
          }}
        >
          {label && (
            <FormLabel
              component="legend"
              sx={{
                mb: 0,
                mr: 2,
                flexShrink: 0,
                pt: row ? 0 : 1,
              }}
            >
              {renderLabel(label, required)}
            </FormLabel>
          )}
          {radioGroupContent}
        </Box>
        {(error || helperText) && (
          <FormHelperText
            sx={{ position: "absolute", bottom: 0, left: 0, m: 0 }}
          >
            {error || helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  }

  // 默认模式：label 在上
  return (
    <FormControl
      component="fieldset"
      error={!!error}
      disabled={disabled}
      required={required}
      sx={formControlStyles}
    >
      {label && (
        <FormLabel component="legend" sx={{ mb: 0.5 }}>
          {renderLabel(label, required)}
        </FormLabel>
      )}
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
