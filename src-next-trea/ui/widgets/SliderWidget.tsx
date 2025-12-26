import React, { memo } from "react";
import {
  FormControl,
  FormLabel,
  FormHelperText,
  Slider,
  Box,
  Typography,
} from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";

// ============================================================================
// Types
// ============================================================================

export type SliderWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
  marks?: boolean | { value: number; label?: string }[];
  valueLabelDisplay?: "on" | "auto" | "off";
  showValue?: boolean;
};

export type SliderWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<SliderWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

export const SliderWidgetRender = memo(function SliderWidgetRender({
  value,
  onChange,
  error,
  disabled,
  visible = true,
  label,
  helperText,
  min = 0,
  max = 100,
  step = 1,
  marks,
  valueLabelDisplay = "auto",
  showValue = true,
}: SliderWidgetRenderProps) {
  if (!visible) return null;

  return (
    <FormControl fullWidth error={!!error} disabled={disabled}>
      {label && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <FormLabel>{label}</FormLabel>
          {showValue && (
            <Typography variant="body2" color="text.secondary">
              {value ?? min}
            </Typography>
          )}
        </Box>
      )}
      <Slider
        value={value ?? min}
        onChange={(_, v) => onChange(v)}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        marks={marks}
        valueLabelDisplay={valueLabelDisplay}
      />
      {(error || helperText) && (
        <FormHelperText>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
});

// ============================================================================
// 独立组件 (带 FieldAdapter)
// ============================================================================

export const SliderWidget: React.FC<SliderWidgetProps> = ({
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
        <SliderWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default SliderWidgetRender;

