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
import { labeledControlStyles, FIELD_HEIGHT, FONT_SIZE } from "./styles";
import { renderLabel } from "./utils";

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
  /** 内联模式：label 和 slider 在同一行 */
  inline?: boolean;
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
  required,
  visible = true,
  label,
  helperText,
  min = 0,
  max = 100,
  step = 1,
  marks,
  valueLabelDisplay = "auto",
  showValue = true,
  inline = false,
}: SliderWidgetRenderProps) {
  if (!visible) return null;

  const sliderElement = (
    <Slider
      size="small"
      sx={{ py: 0.3 }}
      value={value ?? min}
      onChange={(_, v) => onChange(v)}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      marks={marks}
      valueLabelDisplay={valueLabelDisplay}
    />
  );

  // 内联模式
  if (inline) {
    return (
      <FormControl
        fullWidth
        error={!!error}
        disabled={disabled}
        sx={{
          ...labeledControlStyles,
          minHeight: `${FIELD_HEIGHT.compact}px`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minHeight: `${FIELD_HEIGHT.compact}px`,
            gap: 2,
          }}
        >
          {label && (
            <FormLabel sx={{ mb: 0, flexShrink: 0 }}>
              {renderLabel(label, required)}
            </FormLabel>
          )}
          <Box sx={{ flex: 1, px: 1 }}>{sliderElement}</Box>
          {showValue && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: FONT_SIZE.input,
                minWidth: 32,
                textAlign: "right",
              }}
            >
              {value ?? min}
            </Typography>
          )}
        </Box>
        {(error || helperText) && (
          <FormHelperText>{error || helperText}</FormHelperText>
        )}
      </FormControl>
    );
  }

  // 默认模式
  return (
    <FormControl
      fullWidth
      error={!!error}
      disabled={disabled}
      sx={{
        ...labeledControlStyles,
      }}
    >
      {label && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 0.5,
          }}
        >
          <FormLabel>{renderLabel(label, required)}</FormLabel>
          {showValue && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: FONT_SIZE.input }}
            >
              {value ?? min}
            </Typography>
          )}
        </Box>
      )}
      {sliderElement}
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
