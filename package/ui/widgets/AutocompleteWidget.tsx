import React, {
  memo,
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
} from "react";
import {
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  Box,
  Typography,
  Button,
  IconButton,
  InputAdornment,
  Tooltip,
  styled,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Replay as ReplayIcon,
} from "@mui/icons-material";
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
export type SuffixButtonRender = (
  searchValue: string,
  hasOptions: boolean
) => ButtonConfig | false | null;

/** 添加选项成功回调 */
export type OnAddOptionSuccess = (
  newOption: OptionItem,
  context: {
    /** 是否为远程模式 */
    isRemote: boolean;
    /** 刷新远程数据 (仅远程模式) */
    refreshRemote?: () => void;
    /** 追加本地选项 (仅本地模式) */
    appendLocalOption?: (option: OptionItem) => void;
  }
) => void;

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
  /** 每页条数，默认 20 */
  pageSize?: number;
  /** 搜索防抖时间 (ms)，默认 500 */
  debounceTimeout?: number;
  /** 最小搜索字符数，默认 0 */
  minSearchLength?: number;
  /** 加载状态回调 */
  onLoadingChange?: (loading: boolean) => void;
  /** 根据 ID 获取选项 (用于回显) */
  fetchById?: (value: string | number) => Promise<OptionItem | null>;
};

/** 搜索清空相关配置 */
export type SearchClearConfig = {
  /** 关闭面板后保持搜索值，默认 false */
  keepSearchOnClose?: boolean;
  /** 选中选项后保持搜索值，默认 false */
  keepSearchOnSelect?: boolean;
  /** 缓存最后一次非空搜索值，默认 false */
  cacheSearchKeyword?: boolean;
  /** 仅清空搜索值，不重置列表，默认 false */
  clearValueOnly?: boolean;
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
  /** Suffix 按钮渲染函数 */
  suffixButton?: SuffixButtonRender;
  /** 添加选项成功回调 */
  onAddOptionSuccess?: OnAddOptionSuccess;
  /** 添加新选项后自动选中，默认 false */
  autoSelectNewOption?: boolean;
  /** 每次展开时刷新数据，默认 false (仅首次加载) */
  refreshOnOpen?: boolean;
  /** 搜索清空配置 */
  searchClearConfig?: SearchClearConfig;
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
  onRetry?: () => void;
  loading?: boolean;
  /** 保存的滚动位置 */
  savedScrollTop?: number;
  /** 滚动位置保存回调 */
  onScrollPositionChange?: (scrollTop: number) => void;
}

const InfiniteAutocompleteListbox = forwardRef<
  HTMLUListElement,
  InfiniteListboxProps
>((props, ref) => {
  const {
    children,
    fetchingMore,
    hasMore = true,
    showNoMore,
    empty,
    error,
    onRetry,
    loading,
    savedScrollTop,
    onScrollPositionChange,
    ...other
  } = props;

  const innerRef = useRef<HTMLUListElement>(null);

  // 合并 ref
  React.useImperativeHandle(ref, () => innerRef.current as HTMLUListElement);

  // 恢复滚动位置 (加载更多完成后)
  React.useLayoutEffect(() => {
    if (
      savedScrollTop !== undefined &&
      savedScrollTop > 0 &&
      innerRef.current &&
      !fetchingMore
    ) {
      innerRef.current.scrollTop = savedScrollTop;
    }
  }, [fetchingMore, savedScrollTop]);

  return (
    <StyledUl {...other} ref={innerRef}>
      {/* 加载中状态 (首次加载) */}
      {loading && !fetchingMore && (
        <Box
          component="li"
          className="MuiAutocomplete-option MuiAutocomplete-listboxStatus"
          sx={{
            py: 2,
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

      {/* 列表内容 */}
      {!loading && children}

      {/* 空数据状态 */}
      {empty && !loading && !fetchingMore && !error && (
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

      {/* 加载失败状态 */}
      {error && !loading && (
        <Box
          component="li"
          className="MuiAutocomplete-option"
          sx={{
            py: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            cursor: "default",
          }}
        >
          <Typography variant="body2" color="error.main">
            加载失败
          </Typography>
          {onRetry && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              sx={{ pointerEvents: "auto" }}
            >
              重试
            </Button>
          )}
        </Box>
      )}

      {/* 加载更多状态 */}
      {fetchingMore && !error && (
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

      {/* 已加载全部状态 */}
      {!hasMore &&
        showNoMore &&
        !fetchingMore &&
        !empty &&
        !loading &&
        !error && (
          <Box
            component="li"
            className="MuiAutocomplete-option MuiAutocomplete-listboxStatus"
            sx={{ py: 1.5, justifyContent: "center" }}
          >
            <Typography variant="caption" color="text.disabled">
              已加载全部
            </Typography>
          </Box>
        )}
    </StyledUl>
  );
});

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
  suffixButton,
  onAddOptionSuccess,
  autoSelectNewOption = false,
  refreshOnOpen = false,
  searchClearConfig = {},
}: AutocompleteWidgetRenderProps) {
  if (!visible) return null;

  const {
    keepSearchOnClose = false,
    keepSearchOnSelect = false,
    cacheSearchKeyword = false,
    clearValueOnly = false,
  } = searchClearConfig;

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
  const [fetchError, setFetchError] = useState(false);
  const [cachedKeyword, setCachedKeyword] = useState<string>("");
  const [showRestoreHint, setShowRestoreHint] = useState(false);
  // 保存滚动位置 (用于加载更多时恢复)
  const [savedScrollTop, setSavedScrollTop] = useState<number>(0);
  // 本地搜索输入值 (用于计算过滤后的选项数量)
  const [localInputValue, setLocalInputValue] = useState("");

  // 记录选中的选项
  const selectedOptionsRef = useRef<OptionItem[]>([]);
  // 标记本次打开是否已选择新值
  const hasSelectedRef = useRef(false);
  // 标记是否已首次加载
  const hasInitialLoadRef = useRef(false);
  // 当前搜索关键词 ref (用于防止竞态)
  const currentKeywordRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 当前使用的选项
  const currentOptions = remoteConfig ? localOptions : options;
  const pageSize = remoteConfig?.pageSize ?? 20;

  // 计算实际显示的选项数量 (考虑本地过滤)
  const filteredOptionsCount = React.useMemo(() => {
    if (remoteConfig) {
      // 远程模式：选项已经是过滤后的
      return currentOptions.length;
    }
    // 本地模式：模拟 MUI Autocomplete 的默认过滤逻辑
    if (!localInputValue) {
      return currentOptions.length;
    }
    const searchLower = localInputValue.toLowerCase();
    return currentOptions.filter((opt) => {
      const optionLabel = typeof opt === "object" ? opt.label : String(opt);
      return optionLabel.toLowerCase().includes(searchLower);
    }).length;
  }, [currentOptions, localInputValue, remoteConfig]);

  const hasOptions = filteredOptionsCount > 0;

  // 规范化选项
  const normalizedOptions = currentOptions.map((opt) =>
    typeof opt === "object" ? opt : { label: String(opt), value: opt }
  );

  // 更新 selectedOptionsRef：确保选中项不会因搜索而丢失
  useEffect(() => {
    if (!remoteConfig) return;
    const values = Array.isArray(value) ? value : value ? [value] : [];
    if (values.length === 0) return;

    const currentSelected = localOptions.filter((o) =>
      values.includes(o.value)
    );
    const newSelected = [...selectedOptionsRef.current];
    let changed = false;

    currentSelected.forEach((item) => {
      if (!newSelected.some((s) => s.value === item.value)) {
        newSelected.push(item);
        changed = true;
      }
    });

    if (changed) {
      selectedOptionsRef.current = newSelected;
    }
  }, [value, localOptions, remoteConfig]);

  // 远程加载函数
  const fetchOptions = useCallback(
    async (keyword: string, pageNum: number, isLoadMore = false) => {
      const config = remoteConfigRef.current;
      if (!config) return;

      // 更新当前关键词
      currentKeywordRef.current = keyword;

      // 检查最小搜索字符数
      if (config.minSearchLength && keyword.length < config.minSearchLength) {
        if (!isLoadMore) {
          setLocalOptions([]);
          setHasMore(true);
        }
        return;
      }

      if (!isLoadMore) {
        setPage(1);
        setHasMore(true);
        setFetchError(false);
      }

      if (isLoadMore) {
        setFetchingMore(true);
      } else {
        setLoading(true);
      }

      config.onLoadingChange?.(true);

      try {
        const res = await config.fetchOptions(keyword, pageNum, pageSize);

        // 检查关键词是否已过期 (用户可能已经输入新关键词)
        if (keyword !== currentKeywordRef.current && !isLoadMore) {
          return;
        }

        if (isLoadMore) {
          setLocalOptions((prev) => {
            const newItems = res.data.filter(
              (newItem) =>
                !prev.some((prevItem) => prevItem.value === newItem.value)
            );
            return [...prev, ...newItems];
          });
        } else {
          // 合并选中项防止回显丢失
          const newOptions = [...res.data];
          const currentValues = Array.isArray(value)
            ? value
            : value
            ? [value]
            : [];

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
        setFetchError(false);
      } catch (err) {
        console.error("Failed to fetch options:", err);
        setFetchError(true);
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

  // 重试加载
  const handleRetry = useCallback(() => {
    if (fetchingMore) {
      fetchOptions(inputValue, page, true);
    } else {
      fetchOptions(inputValue, 1, false);
    }
  }, [fetchOptions, inputValue, page, fetchingMore]);

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
      const validItems = items.filter(
        (item): item is OptionItem => item !== null
      );
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

  // 清空搜索值
  const clearSearch = useCallback(
    (resetList = true) => {
      // 缓存当前搜索值
      if (cacheSearchKeyword && inputValue.trim()) {
        setCachedKeyword(inputValue);
      }
      setInputValue("");
      if (resetList && !clearValueOnly && remoteConfig) {
        fetchOptions("", 1, false);
      }
    },
    [cacheSearchKeyword, inputValue, clearValueOnly, remoteConfig, fetchOptions]
  );

  // 恢复缓存的搜索值
  const restoreCachedKeyword = useCallback(() => {
    if (cachedKeyword) {
      setInputValue(cachedKeyword);
      if (remoteConfig) {
        fetchOptions(cachedKeyword, 1, false);
      }
      setShowRestoreHint(false);
    }
  }, [cachedKeyword, remoteConfig, fetchOptions]);

  // 打开时加载
  const handleOpen = () => {
    hasSelectedRef.current = false;
    setOpen(true);
    setFetchError(false);

    // 如果没有 keepSearchOnClose，清空搜索值
    if (!keepSearchOnClose) {
      setInputValue("");
    }

    if (remoteConfig) {
      // 根据 refreshOnOpen 决定是否每次都刷新
      if (refreshOnOpen || !hasInitialLoadRef.current) {
        fetchOptions(keepSearchOnClose ? inputValue : "", 1, false);
        hasInitialLoadRef.current = true;
      }
    }
  };

  const handleClose = () => {
    setOpen(false);

    // 如果没有选择新值且需要清空搜索值
    if (!hasSelectedRef.current && !multiple && remoteConfig) {
      if (!keepSearchOnClose) {
        // 清空搜索值
        if (cacheSearchKeyword && inputValue.trim()) {
          setCachedKeyword(inputValue);
        }

        const currentValue = value;
        if (currentValue !== null && currentValue !== undefined) {
          // 回填选中项的 label
          const selectedOption =
            localOptions.find((o) => o.value === currentValue) ||
            selectedOptionsRef.current.find((o) => o.value === currentValue);

          if (selectedOption) {
            setInputValue(selectedOption.label);
          } else {
            setInputValue("");
          }
        } else {
          setInputValue("");
        }
      }
    } else if (
      !keepSearchOnClose &&
      !keepSearchOnSelect &&
      hasSelectedRef.current
    ) {
      // 选中后清空搜索值
      clearSearch(!clearValueOnly);
    }
  };

  // 输入变化
  const handleInputChange = (
    _event: React.SyntheticEvent,
    newInputValue: string,
    reason: string
  ) => {
    if (reason === "reset") return;
    setInputValue(newInputValue);
    setShowRestoreHint(false);
    // 更新本地输入值 (用于计算过滤后的选项数量)
    setLocalInputValue(newInputValue);

    if (!remoteConfig) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (reason === "input" || reason === "clear") {
      // 重置分页和加载更多状态
      setPage(1);
      setHasMore(true);
      setFetchError(false);
      // 重置滚动位置
      setSavedScrollTop(0);

      debounceRef.current = setTimeout(() => {
        fetchOptions(newInputValue, 1, false);
      }, remoteConfig.debounceTimeout ?? 500);
    }
  };

  // 滚动加载
  const handleScroll = (event: React.SyntheticEvent) => {
    const listboxNode = event.currentTarget as HTMLElement;
    // 保存当前滚动位置
    setSavedScrollTop(listboxNode.scrollTop);

    if (
      !loading &&
      !fetchingMore &&
      hasMore &&
      !fetchError && // 加载失败时不触发
      listboxNode.scrollTop + listboxNode.clientHeight >=
        listboxNode.scrollHeight - 20
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
        .map(
          (v) =>
            normalizedOptions.find((o) => o.value === v) || {
              label: String(v),
              value: v,
            }
        )
        .filter(Boolean);
    }
    return (
      normalizedOptions.find((o) => o.value === value) ||
      (value ? { label: String(value), value } : null)
    );
  };

  // 追加本地选项
  const appendLocalOption = useCallback(
    (option: OptionItem) => {
      if (remoteConfig) {
        // 远程模式：触发刷新
        fetchOptions(inputValue, 1, false);
      } else {
        // 本地模式：直接追加（需要外部处理 options 更新）
        setLocalOptions((prev) => [...prev, option]);
      }

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
    [
      remoteConfig,
      fetchOptions,
      inputValue,
      autoSelectNewOption,
      multiple,
      value,
      onChange,
    ]
  );

  // 处理 suffix 按钮
  const getSuffixConfig = (): ButtonConfig | null => {
    if (!suffixButton) return null;
    const result = suffixButton(inputValue, hasOptions);
    // result 可能是 ButtonConfig | false | null
    if (result === false || result === null || result === undefined)
      return null;
    return result as ButtonConfig;
  };
  const suffixConfig = getSuffixConfig();
  const showSuffix = !!suffixConfig;

  // 构建 endAdornment
  const buildEndAdornment = (defaultEndAdornment: React.ReactNode) => {
    const elements: React.ReactNode[] = [];

    // Loading 图标
    if (loading || userLoading) {
      elements.push(
        <CircularProgress key="loading" color="inherit" size={20} />
      );
    }

    // 恢复搜索按钮
    if (
      cacheSearchKeyword &&
      cachedKeyword &&
      !inputValue &&
      showRestoreHint &&
      !disabled
    ) {
      elements.push(
        <Tooltip key="restore" title="恢复上次搜索">
          <IconButton
            size="small"
            onClick={restoreCachedKeyword}
            sx={{ p: 0.5 }}
          >
            <ReplayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    // Suffix 按钮
    if (showSuffix && suffixConfig) {
      const {
        text,
        icon,
        onClick,
        tooltip,
        disabled: btnDisabled,
      } = suffixConfig;
      const btn = (
        <IconButton
          key="suffix"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          disabled={btnDisabled}
          sx={{ p: 0.5 }}
        >
          {icon || <AddIcon fontSize="small" />}
        </IconButton>
      );

      elements.push(
        tooltip ? (
          <Tooltip key="suffix-tooltip" title={tooltip}>
            {btn}
          </Tooltip>
        ) : (
          btn
        )
      );
    }

    elements.push(defaultEndAdornment);

    return <>{elements}</>;
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
      onInputChange={handleInputChange}
      getOptionLabel={(option) =>
        (option as OptionItem)?.label ||
        String((option as OptionItem)?.value) ||
        ""
      }
      isOptionEqualToValue={(option, val) =>
        (option as OptionItem).value === (val as OptionItem).value
      }
      value={getValue()}
      onChange={(_, newValue) => {
        // 标记已选择
        hasSelectedRef.current = true;

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
            // 单选时，选中后更新 inputValue 为选中项的 label
            if (!keepSearchOnSelect) {
              setInputValue((newValue as OptionItem).label);
            }
          }
        }

        // 选中后清空搜索值（如果配置了）
        if (!keepSearchOnSelect && remoteConfig) {
          // 延迟清空，等待关闭面板
          setTimeout(() => {
            if (!multiple) {
              const selectedLabel = (newValue as OptionItem)?.label || "";
              setInputValue(selectedLabel);
            }
          }, 0);
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
                error: fetchError,
                onRetry: handleRetry,
                loading,
                savedScrollTop,
              }
            : {}),
        } as any,
        chip: {
          size: "small",
          variant: "outlined",
        },
      }}
      renderOption={(props, option) => (
        <li
          {...props}
          key={
            (option as OptionItem).key ?? String((option as OptionItem).value)
          }
        >
          {(option as OptionItem).listLabel ?? (option as OptionItem).label}
        </li>
      )}
      renderValue={(tagValue, getTagProps) =>
        tagValue.map((option: OptionItem, index: number) => (
          <Chip
            label={option.label}
            {...getTagProps({ index })}
            key={option.key ?? String(option.value)}
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
          onMouseEnter={() => {
            if (cacheSearchKeyword && cachedKeyword && !inputValue) {
              setShowRestoreHint(true);
            }
          }}
          onMouseLeave={() => {
            setShowRestoreHint(false);
          }}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: buildEndAdornment(params.InputProps.endAdornment),
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
      render={(props: WidgetProps) => (
        <AutocompleteWidgetRender {...props} {...uiProps} />
      )}
    />
  );
};

export default AutocompleteWidgetRender;
