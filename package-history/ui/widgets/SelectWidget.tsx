import { Autocomplete, FormControl, TextField } from '@mui/material';
import type { OptionItem, WidgetComponent } from '../../types';
import { compactFieldStyles } from './styles';
import { renderLabel } from "./utils";

/** 下拉选择（基于 Autocomplete） */
export const SelectWidget: WidgetComponent = ({ field, label, error, helperText, options = [], fieldProps, form }) => {
  // 从 fieldProps 中提取用户自定义的 onChange
  const { onChange: userOnChange, ...restFieldProps } = fieldProps ?? {};

  return (
    <FormControl
      fullWidth
      error={error}
      required={restFieldProps?.required}
      disabled={restFieldProps?.disabled}
      size="small"
      sx={compactFieldStyles}
    >
      <Autocomplete
        options={options}
        value={options.find((o) => o.value === field.value) ?? null}
        onChange={(event, v) => {
          // ✅ 关键修复：使用 null 而不是 undefined
          // React Hook Form 在值为 undefined 时会回退到 defaultValue
          const nextValue = v?.value ?? null;
          // 先更新表单值
          field.onChange(nextValue);
          // 调用用户自定义的 onChange
          if (typeof userOnChange === 'function') {
            userOnChange(event, v as OptionItem | null);
          }
          form?.trigger(field.name);
        }}
        getOptionLabel={(o) => o?.label ?? ''}
        getOptionKey={(o) => {
          const k = o?.key ?? o?.value;
          return (typeof k === 'string' || typeof k === 'number') ? k : String(k);
        }}
        isOptionEqualToValue={(opt, val) => opt?.value === val?.value}
        size="small"
        disabled={restFieldProps?.disabled}
        onClose={() => form?.trigger(field.name)}
        renderOption={(props, option) => {
          return (
            <li {...props} key={option.key ?? option.value as any}>
              {option.listLabel ?? option.label}
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            error={error}
            fullWidth
            helperText={helperText}
            label={renderLabel(label, restFieldProps?.required)}
            onBlur={() => {
              field.onBlur?.();
              form?.trigger(field.name);
            }}
            required={restFieldProps?.required}
            size="small"
            sx={compactFieldStyles}
          />
        )}
      />
    </FormControl>
  );
};
