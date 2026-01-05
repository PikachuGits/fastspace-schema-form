import React, { memo } from "react";
import {
  Autocomplete,
  TextField,
  Chip,
  type AutocompleteProps,
} from "@mui/material";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";
import { compactFieldStyles } from "./styles";
import { renderLabel } from "./utils";

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
  autocompleteProps?: Partial<AutocompleteProps<OptionItem, boolean, boolean, boolean>>;
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
  autocompleteProps,
}: SelectWidgetRenderProps) {
  if (!visible) return null;

  // 规范化选项
  const normalizedOptions: OptionItem[] = Array.isArray(options)
    ? options.map((opt) =>
        typeof opt === "object"
          ? opt
          : { label: String(opt), value: opt }
      )
    : [];

  // 获取当前选中的值对应的 option
  const getSelectedValue = () => {
    if (multiple) {
      if (!Array.isArray(value)) return [];
      return value
        .map((v) => normalizedOptions.find((o) => o.value === v))
        .filter(Boolean) as OptionItem[];
    }
    return normalizedOptions.find((o) => o.value === value) ?? null;
  };

  return (
    <Autocomplete
      multiple={multiple}
      options={normalizedOptions}
      value={getSelectedValue()}
      onChange={(_, newValue) => {
        if (multiple) {
          const values = (newValue as OptionItem[]).map((v) => v.value);
          onChange(values);
        } else {
          const val = (newValue as OptionItem)?.value ?? null;
          onChange(val);
        }
      }}
      onBlur={onBlur}
      disabled={disabled}
      getOptionLabel={(option) => {
        if (typeof option === "string") return option;
        return (option as OptionItem).label ?? "";
      }}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      fullWidth
      size="small"
      disableCloseOnSelect={multiple}
      renderInput={(params) => (
        <TextField
          {...params}
          label={renderLabel(label, required)}
          placeholder={placeholder}
          error={!!error}
          helperText={error || helperText}
          required={required}
          sx={compactFieldStyles}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.key ?? String(option.value)}>
          {option.listLabel ?? option.label}
        </li>
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            label={option.label}
            {...getTagProps({ index })}
            key={option.key ?? String(option.value)}
            size="small"
          />
        ))
      }
      {...autocompleteProps}
    />
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
