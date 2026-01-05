import React, { memo } from "react";
import { FormControl, FormLabel, FormHelperText, Rating, Box } from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type RatingWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  max?: number;
  precision?: number;
  size?: "small" | "medium" | "large";
  readOnly?: boolean;
};

export type RatingWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<RatingWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

export const RatingWidgetRender = memo(function RatingWidgetRender({
  value,
  onChange,
  error,
  disabled,
  required,
  visible = true,
  label,
  helperText,
  max = 5,
  precision = 1,
  size = "medium",
  readOnly = false,
}: RatingWidgetRenderProps) {
  if (!visible) return null;

  return (
    <FormControl error={!!error} disabled={disabled}>
      {label && (
        <FormLabel sx={{ mb: 0.5 }}>{renderLabel(label, required)}</FormLabel>
      )}
      <Box>
        <Rating
          value={value ?? 0}
          onChange={(_, v) => onChange(v)}
          disabled={disabled}
          readOnly={readOnly}
          max={max}
          precision={precision}
          size={size}
        />
      </Box>
      {(error || helperText) && (
        <FormHelperText>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
});

// ============================================================================
// 独立组件 (带 FieldAdapter)
// ============================================================================

export const RatingWidget: React.FC<RatingWidgetProps> = ({
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
        <RatingWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default RatingWidgetRender;

