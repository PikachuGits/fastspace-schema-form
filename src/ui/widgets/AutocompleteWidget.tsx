import {
  Autocomplete,
  CircularProgress,
  FormControl,
  TextField,
  styled,
  Box,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState, forwardRef, useRef } from "react";
import type { OptionItem, WidgetComponent } from "../../types";
import { compactFieldStyles } from "./styles";

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

export interface InfiniteListboxProps
  extends React.HTMLAttributes<HTMLElement> {
  fetchingMore?: boolean;
  hasMore?: boolean;
  showNoMore?: boolean;
  empty?: boolean;
  error?: boolean;
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
    ...other
  } = props;

  return (
    <StyledUl {...other} ref={ref}>
      {children}

      {empty && !fetchingMore && (
        <Box
          component="li"
          className="MuiAutocomplete-option MuiAutocomplete-listboxStatus"
          sx={{
            py: 2,
            justifyContent: "center",
            pointerEvents: "none",
            cursor: "default",
          }}
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
          sx={{
            py: 2,
            color: "error.main",
            justifyContent: "center",
            pointerEvents: "none",
            cursor: "default",
          }}
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
            pointerEvents: "none",
            color: "text.secondary",
            cursor: "default",
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
          sx={{
            py: 1.5,
            justifyContent: "center",
            pointerEvents: "none",
            cursor: "default",
          }}
        >
          <Typography variant="caption" color="text.disabled">
            没有更多数据了
          </Typography>
        </Box>
      )}
    </StyledUl>
  );
});

/** 自动完成（支持多选、远程搜索、分页） */
export const AutocompleteWidget: WidgetComponent = ({
  field,
  label,
  error,
  helperText,
  options = [],
  fieldProps,
  form,
  schema,
}) => {
  const {
    onChange: userOnChange,
    multiple = false,
    loading: userLoading,
    ...restFieldProps
  } = fieldProps ?? {};

  // 远程配置
  const remoteConfig = schema?.ui?.remoteConfig;
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

  // 记录打开前的值，用于关闭时回填
  const valueBeforeOpenRef = useRef<unknown>(null);
  // 标记本次打开是否已选择新值
  const hasSelectedRef = useRef(false);

  // 如果有远程配置，优先使用本地 options
  const currentOptions = remoteConfig ? localOptions : options;
  const pageSize = remoteConfig?.pageSize ?? 20;

  // 记录当前选中的 options（用于搜索后保持回显）
  const selectedOptionsRef = useRef<OptionItem[]>([]);

  // 更新 selectedOptionsRef：确保选中项不会因搜索而丢失
  useEffect(() => {
    if (!remoteConfig) return;
    const values = Array.isArray(field.value)
      ? field.value
      : field.value
        ? [field.value]
        : [];
    if (values.length === 0) return;

    const currentSelected = localOptions.filter((o) =>
      values.includes(o.value)
    );

    const newSelected = [...selectedOptionsRef.current];
    let changed = false;
    currentSelected.forEach((item) => {
      // eslint-disable-next-line eqeqeq
      if (!newSelected.some((s) => s.value == item.value)) {
        newSelected.push(item);
        changed = true;
      }
    });

    if (changed) {
      selectedOptionsRef.current = newSelected;
    }
  }, [field.value, localOptions, remoteConfig]);

  // 初始回显：如果有默认值，通过 fetchById 获取对应的 option
  useEffect(() => {
    const config = remoteConfigRef.current;
    if (!config?.fetchById || !field.value) return;

    const values = Array.isArray(field.value) ? field.value : [field.value];
    // 检查是否已经在 localOptions 中
    const missingValues = values.filter(
      // eslint-disable-next-line eqeqeq
      (v) => !localOptions.some((o) => o.value == v)
    );

    if (missingValues.length === 0) return;

    // 获取缺失的选项
    Promise.all(
      missingValues.map(async (v) => {
        try {
          return await config.fetchById!(v);
        } catch (err) {
          console.error(`Failed to fetch option for value ${v}:`, err);
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
            // eslint-disable-next-line eqeqeq
            if (!newOptions.some((o) => o.value == item.value)) {
              newOptions.push(item);
            }
          });
          return newOptions;
        });
        // 同步更新 ref
        validItems.forEach((item) => {
          // eslint-disable-next-line eqeqeq
          if (!selectedOptionsRef.current.some((s) => s.value == item.value)) {
            selectedOptionsRef.current.push(item);
          }
        });
      }
    });
  }, [field.value, localOptions]);

  // 远程加载函数
  const fetchOptions = useCallback(
    async (keyword: string, pageNum: number, isLoadMore = false) => {
      if (!remoteConfig) return;

      if (!isLoadMore) {
        setPage(1);
        setHasMore(true);
      }

      if (isLoadMore) {
        setFetchingMore(true);
      } else {
        setLoading(true);
      }

      remoteConfig.onLoadingChange?.(true);
      try {
        const res = await remoteConfig.fetchOptions(keyword, pageNum, pageSize);
        if (isLoadMore) {
          setLocalOptions((prev) => {
            const newItems = res.data.filter(
              (newItem) =>
                !prev.some((prevItem) => prevItem.value === newItem.value)
            );
            return [...prev, ...newItems];
          });
        } else {
          // 搜索结果需要合并当前选中项，防止回显丢失
          const newOptions = [...res.data];
          const currentValues = Array.isArray(field.value)
            ? field.value
            : field.value
              ? [field.value]
              : [];

          const activeSelectedItems = selectedOptionsRef.current.filter((o) =>
            currentValues.includes(o.value)
          );

          activeSelectedItems.forEach((selectedItem) => {
            // eslint-disable-next-line eqeqeq
            if (!newOptions.some((o) => o.value == selectedItem.value)) {
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
        remoteConfig.onLoadingChange?.(false);
      }
    },
    [remoteConfig, pageSize, field.value]
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 打开时：清空输入框，触发空搜索（加载全部数据）
  const handleOpen = () => {
    // 记录打开前的值
    valueBeforeOpenRef.current = field.value;
    hasSelectedRef.current = false;

    setOpen(true);

    // 清空输入框
    setInputValue("");

    // 触发搜索（加载初始数据）
    if (remoteConfig) {
      fetchOptions("", 1, false);
    }
  };

  // 关闭时：如果没有选择新值，回填原来的 label
  const handleClose = () => {
    setOpen(false);

    // 如果没有选择新值，回填原来的 inputValue
    if (!hasSelectedRef.current && !multiple) {
      const currentValue = field.value;
      if (currentValue !== null && currentValue !== undefined) {
        // 找到对应的 option 并回填 label
        const selectedOption = currentOptions.find(
          (o) => o.value === currentValue
        );
        if (selectedOption) {
          setInputValue(selectedOption.label);
        }
      }
    }
  };

  // 处理输入变化
  const handleInputChange = (
    _event: React.SyntheticEvent,
    newInputValue: string,
    reason: string
  ) => {
    // reset 时（如选中后 MUI 自动重置）不处理
    if (reason === "reset") {
      return;
    }

    setInputValue(newInputValue);

    if (!remoteConfig) return;

    // 清除上一次的定时器
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 用户输入或清除时触发搜索
    if (reason === "input" || reason === "clear") {
      debounceRef.current = setTimeout(() => {
        fetchOptions(newInputValue, 1, false);
      }, remoteConfig.debounceTimeout ?? 500);
    }
  };

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // 滚动加载
  const handleScroll = (event: React.SyntheticEvent) => {
    const listboxNode = event.currentTarget;
    if (
      !loading &&
      !fetchingMore &&
      hasMore &&
      listboxNode.scrollTop + listboxNode.clientHeight >=
      listboxNode.scrollHeight - 20
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOptions(inputValue, nextPage, true);
    }
  };

  // 获取当前选中的值对应的 option
  const getSelectedValue = () => {
    if (multiple) {
      return currentOptions.filter((o) =>
        (field.value ?? []).includes(o.value)
      );
    }
    return currentOptions.find((o) => o.value === field.value) ?? null;
  };

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
        multiple={multiple as boolean}
        disableCloseOnSelect={multiple as boolean}
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
        inputValue={remoteConfig ? inputValue : undefined}
        onInputChange={remoteConfig ? handleInputChange : undefined}
        options={currentOptions}
        loading={loading || (userLoading as boolean)}
        filterOptions={remoteConfig ? (x) => x : undefined}
        value={getSelectedValue()}
        onChange={(event, v) => {
          // 标记已选择
          hasSelectedRef.current = true;

          const nextValue = multiple
            ? (v as typeof options).map((item) => item.value)
            : (v as (typeof options)[0])?.value ?? null;

          field.onChange(nextValue);

          // 单选时，选中后更新 inputValue 为选中项的 label
          if (!multiple && v) {
            setInputValue((v as OptionItem).label);
          }

          if (typeof userOnChange === "function") {
            // 注意：MUI Autocomplete 的 onChange 第二个参数是选中的 OptionItem 或 OptionItem[]
            // 但这里我们需要确保类型安全，并传递正确的数据
            userOnChange(event, v);
          }
          form?.trigger(field.name);
        }}
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
            sx: {
              height: 22,
              fontSize: 12,
              borderRadius: 1,
              backgroundColor: "background.paper",

              "& .MuiChip-label": {
                px: 0.75,
              },

              "& .MuiChip-deleteIcon": {
                fontSize: 16,
                marginRight: 0.25,
              },
            },
          },
        }}
        getOptionLabel={(o) => o?.label ?? ""}
        getOptionKey={(o) => {
          const k = o?.key ?? o?.value;
          return typeof k === "string" || typeof k === "number" ? k : String(k);
        }}
        isOptionEqualToValue={(opt, val) => opt?.value === val?.value}
        size="small"
        disabled={restFieldProps?.disabled}
        renderOption={(props, option) => {
          return (
            <li {...props} key={option.key ?? (option.value as any)}>
              {option.listLabel ?? option.label}
            </li>
          );
        }}
        // renderOption 仅在需要 listLabel 时才有必要
        // 如果只需要自定义 key，getOptionKey 已经足够
        // 如果需要 listLabel 功能，取消下面的注释：
        // renderOption={(props, option) => (
        //   <li {...props} key={option.key ?? option.value}>
        //     {option.listLabel ?? option.label}
        //   </li>
        // )}
        renderInput={(params) => (
          <TextField
            {...params}
            error={error}
            fullWidth
            helperText={helperText}
            label={label}
            onBlur={() => {
              field.onBlur?.();
              form?.trigger(field.name);
            }}
            required={restFieldProps?.required}
            size="small"
            sx={compactFieldStyles}
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading || userLoading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              } as any,
            }}
          />
        )}
      />
    </FormControl>
  );
};
