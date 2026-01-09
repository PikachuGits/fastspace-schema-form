import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  styled,
} from '@mui/material';
import type { WidgetComponent } from '../../types';
import { renderLabel } from "./utils";

const Item = styled(Box)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  // padding: theme.spacing(1),
  textAlign: 'center',
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));
/** 单选组 */
export const RadioWidget: WidgetComponent = ({ field, label, options = [], error, helperText, fieldProps }) => {
  // 将字符串值转换回原始类型（数字/布尔值）
  const parseValue = (strValue: string) => {
    const option = options.find((o) => String(o.value) === strValue);
    return option?.value ?? strValue;
  };

  // 当前选中的值，转为字符串用于 RadioGroup
  const currentValue = field.value !== undefined && field.value !== null ? String(field.value) : '';

  // 是否使用行内布局（label 和 radio 在同一行）
  const inline = fieldProps?.inline === true;

  const radioGroup = (
    <RadioGroup
      row
      onChange={(e) => {
        const parsedValue = parseValue(e.target.value);
        field.onChange(parsedValue);
      }}
      value={currentValue}
      sx={inline ? { flexWrap: 'nowrap' } : undefined}
    >
      {options.map((o) => (
        <FormControlLabel
          control={<Radio size="small" />}
          disabled={o.disabled}
          key={String(o.value)}
          label={o.label}
          value={String(o.value)}
        />
      ))}
    </RadioGroup>
  );

  return (
    <FormControl
      component="fieldset"
      disabled={fieldProps?.disabled}
      error={error}
      required={fieldProps?.required}
      sx={{
        width: '100%',
        '& .MuiFormLabel-root': {
          fontSize: 14,
          '&.Mui-focused': { color: 'primary.main' },
        },
        '& .MuiFormControlLabel-label': {
          fontSize: 14,
        },
        '& .MuiFormHelperText-root': {
          marginTop: '4px',
          fontSize: 12,
        },
      }}
    >
      {inline ? (
        // 行内布局：label 和 radio 在同一行
        <Stack direction="row" spacing={2} alignItems="center">
          <Item>
            {label && (
              <FormLabel component="legend" required={false} sx={{ mb: 0, flexShrink: 0 }}>
                {renderLabel(label, fieldProps?.required)}
              </FormLabel>
            )}
          </Item>
          <Item>{radioGroup}</Item>
        </Stack>
      ) : (
        // 默认布局：label 在上，radio 在下
        <Stack spacing={0}>
          {label && <FormLabel component="legend" required={false}>{renderLabel(label, fieldProps?.required)}</FormLabel>}
          {radioGroup}
        </Stack>
      )}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};
