import React, { memo, useState, useCallback, useEffect, useRef, forwardRef } from "react";
import {
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  Box,
  Typography,
  styled,
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
  disabled?: boolean;
  key?: string | number;
  /** 列表展示文本 (允许与选中后回显的 label 不一致) */
  listLabel?: React.ReactNode;
  [key: string]: unknown;
};

export type RemoteConfig = {
  /** 获取数据的函数 */
  fetchOptions: (
    keyword: string,
    page: number,
    pageSize: number
  ) => Promise<{
    data: OptionItem[];
    total: number;
    hasMore: boolean;
  }>;
  /** 每页条数 */
  pageSize?: number;
  /** 搜索防抖时间 (ms) */
  debounceTimeout?: number;
  /** 最小搜索字符数 */
  minSearchLength?: number;
  /** 加载状态回调 */
  onLoadingChange?: (loading: boolean) => void;
  /** 根据 ID 获取选项 (用于回显) */
  fetchById?: (value: string | number) => Promise<OptionItem | null>;
};

export type AutocompleteWidgetRenderProps = WidgetProps & {
  label?: string;
  placeholder?: string;
  helperText?: string;
  multiple?: boolean;
  freeSolo?: boolean;
  loading?: boolean;
  /** 远程搜索配置 */
  remoteConfig?: RemoteConfig;
};

export type AutocompleteWidgetProps = {
  form: any;
  name: string;
  validate?: any;
} & Omit<AutocompleteWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// Styled Components
// ============================================================================

const StyledUl = styled("ul")(({ theme }) => ({
  padding: theme.spacing(0.5),
  margin: 0,
  listStyle: "none",
  maxHeight: 260,
  overflow: "auto",

  "& .MuiAutocomplete-option": {
    minHeight: 36,
    padding: theme.spacing(0.75, 1.5),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    fontSize: 14,
    borderRadius: theme.shape.borderRadius,
    cursor: "pointer",
    transition: theme.transitions.create(["background-color"], {
      duration: theme.transitions.duration.shortest,
    }),
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    '&[aria-selected="true"]': {
      backgroundColor: theme.palette.action.selected,
    },
    '&[aria-disabled="true"]': {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },

  "& .MuiAutocomplete-listboxStatus": {
    cursor: "default",
    pointerEvents: "none",
  },
}));

interface InfiniteListboxProps extends React.HTMLAttributes<HTMLElement> {
  fetchingMore?: boolean;
  hasMore?: boolean;
  showNoMore?: boolean;
  empty?: boolean;
  error?: boolean;
}

const InfiniteAutocompleteListbox = forwardRef<HTMLUListElement, InfiniteListboxProps>(
  (props, ref) => {
    const { children, fetchingMore, hasMore = true, showNoMore, empty, error, ...other } = props;

    return (
      <StyledUl {...other} ref={ref}>
        {children}

        {empty && !fetchingMore && (
          <Box
            component="li"
            className="MuiAutocomplete-option MuiAutocomplete-listboxStatus"
            sx={{ py: 2, justifyContent: "center" }}
          >
            <Typography variant="body2" color="text.secondary">
              暂无数据
            </Typography>
          </Box>
        )}

        {error && (
          <Box
            component="li"
            className="MuiAutocomplete-option MuiAutocomplete-listboxStatus"
            sx={{ py: 2, color: "error.main", justifyContent: "center" }}
          >
            <Typography variant="body2">加载失败，请重试</Typography>
          </Box>
        )}

        {fetchingMore && (
          <Box
            component="li"
            className="MuiAutocomplete-option MuiAutocomplete-listboxStatus"
            sx={{
              py: 1.5,
              gap: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <CircularProgress size={16} color="inherit" />
            <Typography variant="body2">加载中…</Typography>
          </Box>
        )}

        {!hasMore && showNoMore && !fetchingMore && !empty && (
          <Box
            component="li"
            className="MuiAutocomplete-option MuiAutocomplete-listboxStatus"
            sx={{ py: 1.5, justifyContent: "center" }}
          >
            <Typography variant="caption" color="text.disabled">
              没有更多数据了
            </Typography>
          </Box>
        )}
      </StyledUl>
    );
  }
);

// ============================================================================
// 纯渲染组件
// ============================================================================

export const AutocompleteWidgetRender = memo(function AutocompleteWidgetRender({
    value,
    onChange,
    onBlur,
    options = [],
    disabled,
    visible = true,
    required,
    error,
    label,
    placeholder,
    helperText,
    multiple = false,
  freeSolo = false,
  loading: userLoading = false,
  remoteConfig,
}: AutocompleteWidgetRenderProps) {
    if (!visible) return null;

  // 远程配置 ref
  const remoteConfigRef = useRef(remoteConfig);
  remoteConfigRef.current = remoteConfig;

  // 本地状态
  const [localOptions, setLocalOptions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 记录选中的选项
  const selectedOptionsRef = useRef<OptionItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 当前使用的选项
  const currentOptions = remoteConfig ? localOptions : options;
  const pageSize = remoteConfig?.pageSize ?? 20;

  // 规范化选项
  const normalizedOptions = currentOptions.map((opt) =>
    typeof opt === "object" ? opt : { label: String(opt), value: opt }
  );

  // 远程加载函数
  const fetchOptions = useCallback(
    async (keyword: string, pageNum: number, isLoadMore = false) => {
      const config = remoteConfigRef.current;
      if (!config) return;

      if (!isLoadMore) {
        setPage(1);
        setHasMore(true);
      }

      if (isLoadMore) {
        setFetchingMore(true);
      } else {
        setLoading(true);
      }

      config.onLoadingChange?.(true);

      try {
        const res = await config.fetchOptions(keyword, pageNum, pageSize);

        if (isLoadMore) {
          setLocalOptions((prev) => {
            const newItems = res.data.filter(
              (newItem) => !prev.some((prevItem) => prevItem.value === newItem.value)
            );
            return [...prev, ...newItems];
          });
        } else {
          // 合并选中项防止回显丢失
          const newOptions = [...res.data];
          const currentValues = Array.isArray(value) ? value : value ? [value] : [];

          selectedOptionsRef.current.forEach((selectedItem) => {
            if (
              currentValues.includes(selectedItem.value) &&
              !newOptions.some((o) => o.value === selectedItem.value)
            ) {
              newOptions.push(selectedItem);
            }
          });

          setLocalOptions(newOptions);
        }
        setHasMore(res.hasMore);
      } catch (err) {
        console.error("Failed to fetch options:", err);
      } finally {
        if (isLoadMore) {
          setFetchingMore(false);
        } else {
          setLoading(false);
        }
        config.onLoadingChange?.(false);
      }
    },
    [pageSize, value]
  );

  // 初始回显
  useEffect(() => {
    const config = remoteConfigRef.current;
    if (!config?.fetchById || !value) return;

    const values = Array.isArray(value) ? value : [value];
    const missingValues = values.filter(
      (v) => !localOptions.some((o) => o.value === v)
    );

    if (missingValues.length === 0) return;

    Promise.all(
      missingValues.map(async (v) => {
        try {
          return await config.fetchById!(v as string | number);
        } catch {
          return null;
        }
      })
    ).then((items) => {
      const validItems = items.filter((item): item is OptionItem => item !== null);
      if (validItems.length > 0) {
        setLocalOptions((prev) => {
          const newOptions = [...prev];
          validItems.forEach((item) => {
            if (!newOptions.some((o) => o.value === item.value)) {
              newOptions.push(item);
            }
          });
          return newOptions;
        });
        validItems.forEach((item) => {
          if (!selectedOptionsRef.current.some((s) => s.value === item.value)) {
            selectedOptionsRef.current.push(item);
          }
        });
      }
    });
  }, [value, localOptions]);

  // 打开时加载
  const handleOpen = () => {
    setOpen(true);
    setInputValue("");
    if (remoteConfig) {
      fetchOptions("", 1, false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  // 输入变化
  const handleInputChange = (
    _event: React.SyntheticEvent,
    newInputValue: string,
    reason: string
  ) => {
    if (reason === "reset") return;
    setInputValue(newInputValue);

    if (!remoteConfig) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (reason === "input" || reason === "clear") {
      debounceRef.current = setTimeout(() => {
        fetchOptions(newInputValue, 1, false);
      }, remoteConfig.debounceTimeout ?? 500);
    }
  };

  // 滚动加载
  const handleScroll = (event: React.SyntheticEvent) => {
    const listboxNode = event.currentTarget;
    if (
      !loading &&
      !fetchingMore &&
      hasMore &&
      listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 20
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOptions(inputValue, nextPage, true);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // 获取选中值
    const getValue = () => {
        if (multiple) {
            if (!Array.isArray(value)) return [];
      return value
        .map((v) => normalizedOptions.find((o) => o.value === v) || { label: String(v), value: v })
        .filter(Boolean);
        }
    return normalizedOptions.find((o) => o.value === value) || (value ? { label: String(value), value } : null);
    };

    return (
        <Autocomplete
            multiple={multiple}
      freeSolo={freeSolo}
      disableCloseOnSelect={multiple}
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
            options={normalizedOptions}
      loading={loading || userLoading}
      filterOptions={remoteConfig ? (x) => x : undefined}
      inputValue={remoteConfig ? inputValue : undefined}
      onInputChange={remoteConfig ? handleInputChange : undefined}
      getOptionLabel={(option) => (option as OptionItem)?.label || String((option as OptionItem)?.value) || ""}
      isOptionEqualToValue={(option, val) => (option as OptionItem).value === (val as OptionItem).value}
            value={getValue()}
            onChange={(_, newValue) => {
                if (multiple) {
          const values = (newValue as OptionItem[]).map((v) => v.value);
          onChange(values);
          // 保存选中项
          selectedOptionsRef.current = newValue as OptionItem[];
                } else {
          const val = (newValue as OptionItem)?.value ?? null;
          onChange(val);
          if (newValue) {
            selectedOptionsRef.current = [newValue as OptionItem];
          }
                }
            }}
            onBlur={onBlur}
            disabled={disabled}
      slots={{
        listbox: remoteConfig ? InfiniteAutocompleteListbox : undefined,
      }}
      slotProps={{
        listbox: {
          onScroll: remoteConfig ? handleScroll : undefined,
          style: { maxHeight: 260 },
          ...(remoteConfig
            ? {
                fetchingMore,
                hasMore,
                showNoMore: localOptions.length > 0,
                empty: localOptions.length === 0 && !loading && !fetchingMore,
                error: false,
              }
            : {}),
        } as any,
        chip: {
          size: "small",
          variant: "outlined",
        },
      }}
      renderOption={(props, option) => (
        <li {...props} key={(option as OptionItem).key ?? String((option as OptionItem).value)}>
          {(option as OptionItem).listLabel ?? (option as OptionItem).label}
        </li>
            )}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                    <Chip
            label={(option as OptionItem).label}
                        {...getTagProps({ index })}
            key={(option as OptionItem).key ?? String((option as OptionItem).value)}
                        size="small"
                    />
                ))
            }
      renderInput={(params) => (
        <TextField
          {...params}
          label={renderLabel(label, required)}
          placeholder={placeholder}
          error={!!error}
          helperText={error || helperText}
          required={required}
          size="small"
          sx={compactFieldStyles}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading || userLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            } as any,
          }}
        />
      )}
    />
  );
});

// ============================================================================
// 独立组件 (带 FieldAdapter)
// ============================================================================

export const AutocompleteWidget: React.FC<AutocompleteWidgetProps> = ({
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
      render={(props: WidgetProps) => <AutocompleteWidgetRender {...props} {...uiProps} />}
        />
    );
};

export default AutocompleteWidgetRender;
