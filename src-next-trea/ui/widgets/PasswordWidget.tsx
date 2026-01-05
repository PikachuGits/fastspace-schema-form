import React, { memo, useState } from "react";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { compactFieldStyles } from "./styles";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type PasswordWidgetRenderProps = WidgetProps & {
  label?: string;
  placeholder?: string;
  helperText?: string;
};

export type PasswordWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<PasswordWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

export const PasswordWidgetRender = memo(function PasswordWidgetRender({
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  visible = true,
  label,
  placeholder,
  helperText,
}: PasswordWidgetRenderProps) {
  const [showPassword, setShowPassword] = useState(false);

  if (!visible) return null;

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <TextField
      fullWidth
      label={renderLabel(label, required)}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      error={!!error}
      helperText={error || helperText}
      type={showPassword ? "text" : "password"}
      size="small"
      sx={compactFieldStyles}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
});

// ============================================================================
// 独立组件
// ============================================================================

export const PasswordWidget: React.FC<PasswordWidgetProps> = ({
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
        <PasswordWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default PasswordWidgetRender;
