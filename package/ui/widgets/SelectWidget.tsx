import React, { memo, useState, useCallback } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
  OutlinedInput,
  ListSubheader,
} from "@mui/material";
import { Clear as ClearIcon, Add as AddIcon } from "@mui/icons-material";
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
  [key: string]: unknown;
};

/** Suffix 按钮配置 */
export type ButtonConfig = {
  /** 按钮文本 */
  text?: string;
  /** 按钮图标 */
  icon?: React.ReactNode;
  /** 点击回调 */
  onClick: () => void;
  /** 按钮提示 */
  tooltip?: string;
  /** 是否禁用 */
  disabled?: boolean;
};

/** Suffix 按钮渲染函数 */
export type SuffixButtonRender = (hasOptions: boolean) => ButtonConfig | false | null;

export type SelectWidgetRenderProps = WidgetProps & {
  label?: string;
  placeholder?: string;
  helperText?: string;
  /** 是否多选，默认 false */
  multiple?: boolean;
  /** 是否显示清空按钮，默认 false */
  clearable?: boolean;
  /** 指定选项显示文本的字段，默认 "label" */
  optionLabelProp?: string;
  /** 指定选项绑定值的字段，默认 "value" */
  optionValueProp?: string;
  /** 无数据时下拉面板提示文本，默认 "暂无选项" */
  emptyText?: string;
  /** 是否显示添加按钮（函数式控制），默认 false */
  showAddSuffix?: boolean | SuffixButtonRender;
  /** 添加新选项后自动选中，默认 false */
  autoSelectNewOption?: boolean;
  /** 添加选项成功回调 */
  onAddOptionSuccess?: (
    newOption: OptionItem,
    context: {
      appendLocalOption: (option: OptionItem) => void;
    }
  ) => void;
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
  placeholder = "请选择",
  helperText,
  multiple = false,
  clearable = false,
  optionLabelProp = "label",
  optionValueProp = "value",
  emptyText = "暂无选项",
  showAddSuffix = false,
  autoSelectNewOption = false,
  onAddOptionSuccess,
}: SelectWidgetRenderProps) {
  if (!visible) return null;

  // 本地选项状态（用于动态追加）
  const [localOptions, setLocalOptions] = useState<OptionItem[]>([]);

  // 合并选项：外部 options + 本地追加的
  const mergedOptions = [...(options as OptionItem[]), ...localOptions];

  // 规范化选项
  const normalizedOptions: OptionItem[] = Array.isArray(mergedOptions)
    ? mergedOptions.map((opt) => {
        if (typeof opt === "object") {
          return {
            ...opt,
            label: String(opt[optionLabelProp] ?? opt.label ?? ""),
            value: opt[optionValueProp] ?? opt.value,
          };
        }
        return { label: String(opt), value: opt };
      })
    : [];

  const hasOptions = normalizedOptions.length > 0;

  // 获取选中值的显示文本
  const getSelectedLabel = (val: unknown): string => {
    const opt = normalizedOptions.find((o) => o.value === val);
    return opt?.label ?? String(val);
  };

  // 处理值变化
  const handleChange = (event: any) => {
    const newValue = event.target.value;
    onChange(newValue);
  };

  // 清空选中值
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : null);
  };

  // 追加本地选项
  const appendLocalOption = useCallback(
    (option: OptionItem) => {
      setLocalOptions((prev) => [...prev, option]);

      // 自动选中新选项
      if (autoSelectNewOption) {
        if (multiple) {
          const currentValues = Array.isArray(value) ? value : [];
          onChange([...currentValues, option.value]);
        } else {
          onChange(option.value);
        }
      }
    },
    [autoSelectNewOption, multiple, value, onChange]
  );

  // 处理 suffix 按钮配置
  const getSuffixConfig = (): ButtonConfig | null => {
    if (!showAddSuffix) return null;

    if (typeof showAddSuffix === "function") {
      const result = showAddSuffix(hasOptions);
      if (!result || result === false) return null;
      return result;
    }

    // 布尔值 true，返回默认配置
    return {
      icon: <AddIcon fontSize="small" />,
      onClick: () => {
        // 默认行为：触发 onAddOptionSuccess
        if (onAddOptionSuccess) {
          onAddOptionSuccess({} as OptionItem, { appendLocalOption });
        }
      },
      tooltip: "添加选项",
    };
  };

  const suffixConfig = getSuffixConfig();
  const showSuffix = !!suffixConfig;

  // 判断是否有值
  const hasValue = multiple
    ? Array.isArray(value) && value.length > 0
    : value !== null && value !== undefined && value !== "";

  // 生成唯一的 label id
  const labelId = `select-label-${label || "default"}`;

  return (
    <FormControl
      fullWidth
      size="small"
      error={!!error}
      disabled={disabled}
      required={required}
      sx={compactFieldStyles}
    >
      {label && (
        <InputLabel id={labelId} required={required}>
          {renderLabel(label, required)}
        </InputLabel>
      )}
      <Select
        labelId={labelId}
        multiple={multiple}
        value={multiple ? (Array.isArray(value) ? value : []) : (value ?? "")}
        onChange={handleChange}
        onBlur={onBlur}
        input={<OutlinedInput label={label} />}
        displayEmpty={!label}
        renderValue={(selected) => {
          if (multiple) {
            const selectedArray = selected as unknown[];
            if (selectedArray.length === 0) {
              return (
                <Typography color="text.secondary" sx={{ opacity: 0.6 }}>
                  {placeholder}
                </Typography>
              );
            }
            return (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selectedArray.map((val) => (
                  <Chip
                    key={String(val)}
                    label={getSelectedLabel(val)}
                    size="small"
                    onMouseDown={(e) => e.stopPropagation()}
                    onDelete={
                      !disabled
                        ? (e) => {
                            e.stopPropagation();
                            const newValue = selectedArray.filter((v) => v !== val);
                            onChange(newValue);
                          }
                        : undefined
                    }
                  />
                ))}
              </Box>
            );
          }

          if (!selected && selected !== 0) {
            return (
              <Typography color="text.secondary" sx={{ opacity: 0.6 }}>
                {placeholder}
              </Typography>
            );
          }

          return getSelectedLabel(selected);
        }}
        endAdornment={
          <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
            {/* 清空按钮 */}
            {clearable && hasValue && !disabled && (
              <IconButton
                size="small"
                onClick={handleClear}
                sx={{ p: 0.5, mr: 0.5 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
            {/* Suffix 按钮 */}
            {showSuffix && suffixConfig && (
              <Tooltip title={suffixConfig.tooltip || ""}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    suffixConfig.onClick();
                  }}
                  disabled={suffixConfig.disabled}
                  sx={{ p: 0.5 }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {suffixConfig.icon || <AddIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 260,
            },
          },
        }}
      >
        {/* 无选项提示 */}
        {!hasOptions && (
          <MenuItem disabled value="">
            <Typography color="text.secondary" sx={{ py: 1 }}>
              {emptyText}
            </Typography>
          </MenuItem>
        )}

        {/* 选项列表 */}
        {normalizedOptions.map((option) => (
          <MenuItem
            key={option.key ?? String(option.value)}
            value={option.value as string | number}
            disabled={option.disabled}
          >
            {option.listLabel ?? option.label}
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
