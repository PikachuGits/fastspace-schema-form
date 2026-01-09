import React, { memo } from "react";
import {
  FormControl,
  FormLabel,
  FormHelperText,
  Rating,
  Box,
} from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { formControlStyles, FIELD_HEIGHT } from "./styles";
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
  /** 内联模式：label 和 rating 在同一行 */
  inline?: boolean;
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
  size = "small",
  readOnly = false,
  inline = true,
}: RatingWidgetRenderProps) {
  if (!visible) return null;

  const ratingElement = (
    <Rating
      value={value ?? 0}
      onChange={(_, v) => onChange(v)}
      sx={{ py: 0 }}
      disabled={disabled}
      readOnly={readOnly}
      max={max}
      precision={precision}
      size={size}
    />
  );

  // 内联模式（默认）
  if (inline) {
    return (
      <FormControl
        error={!!error}
        disabled={disabled}
        sx={{
          ...formControlStyles,
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
          {ratingElement}
        </Box>
        {(error || helperText) && (
          <FormHelperText>{error || helperText}</FormHelperText>
        )}
      </FormControl>
    );
  }

  // 纵向模式
  return (
    <FormControl error={!!error} disabled={disabled} sx={formControlStyles}>
      {label && (
        <FormLabel sx={{ mb: 0.5 }}>{renderLabel(label, required)}</FormLabel>
      )}
      <Box>{ratingElement}</Box>
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
