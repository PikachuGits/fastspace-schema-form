import { TextField } from '@mui/material';
import type { WidgetComponent } from '../../types';
import { compactFieldStyles } from './styles';
import { renderLabel } from "./utils";

/** 数字输入 */
export const NumberWidget: WidgetComponent = ({ field, label, error, helperText, fieldProps }) => (
  <TextField
    name={field.name}
    ref={field.ref}
    value={field.value ?? ''}
    onChange={(e) => {
      const v = e.target.value;
      // ✅ 关键修复：使用 null 而不是 undefined
      // React Hook Form 在值为 undefined 时会回退到 defaultValue
      // 使用 null 可以明确表示"用户清空了这个字段"
      field.onChange(v === '' ? null : Number(v));
    }}
    onBlur={field.onBlur}
    type="number"
    label={renderLabel(label, fieldProps?.required)}
    error={error}
    helperText={helperText}
    fullWidth
    size="small"
    sx={compactFieldStyles}
    disabled={fieldProps?.disabled}
    required={fieldProps?.required}
    {...fieldProps}
  />
);
