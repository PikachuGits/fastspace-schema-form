import React, { memo } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  type SelectProps,
} from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";

// ============================================================================
// Types
// ============================================================================

export type OptionItem = {
  label: string;
  value: string | number | boolean | null;
  key?: string | number;
  listLabel?: React.ReactNode;
  disabled?: boolean;
};

export type SelectWidgetRenderProps = WidgetProps & {
  label?: string;
  placeholder?: string;
  helperText?: string;
  multiple?: boolean;
  selectProps?: Partial<SelectProps>;
};

export type SelectWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<SelectWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

export const SelectWidgetRender = memo(function SelectWidgetRender({
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  visible = true,
  options = [],
  label,
  placeholder,
  helperText,
  multiple = false,
  selectProps,
}: SelectWidgetRenderProps) {
  if (!visible) return null;

  // 生成唯一 ID
  const labelId = `select-${label || "field"}-label`;

  // 规范化选项
  const normalizedOptions: OptionItem[] = Array.isArray(options)
    ? options.map((opt) =>
      typeof opt === "object"
        ? opt
        : { label: String(opt), value: opt }
    )
    : [];

  // 判断是否应该收缩标签
  const hasValue = multiple
    ? Array.isArray(value) && value.length > 0
    : value !== undefined && value !== null && value !== "";
  const shouldShrink = !!placeholder || hasValue;

  return (
    <FormControl
      fullWidth
      error={!!error}
      disabled={disabled}
      required={required}
    >
      {label && (
        <InputLabel id={labelId} shrink={shouldShrink}>
          {label}
        </InputLabel>
      )}
      <Select
        labelId={labelId}
        label={label}
        value={value ?? (multiple ? [] : "")}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        multiple={multiple}
        displayEmpty={!!placeholder}
        {...selectProps}
      >
        {placeholder && !multiple && (
          <MenuItem value="" disabled>
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {normalizedOptions.map((opt) => (
          <MenuItem
            key={opt.key ?? String(opt.value)}
            value={opt.value as any}
            disabled={opt.disabled}
          >
            {opt.listLabel ?? opt.label}
          </MenuItem>
        ))}
      </Select>
      {(error || helperText) && (
        <FormHelperText>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
});

// ============================================================================
// 独立组件
// ============================================================================

export const SelectWidget: React.FC<SelectWidgetProps> = ({
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
        <SelectWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default SelectWidgetRender;
