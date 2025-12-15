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

  /* 所有 option（即 children） */
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

    /* hover */
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },

    /* 选中态 */
    '&[aria-selected="true"]': {
      backgroundColor: theme.palette.action.selected,
    },

    /* 禁用态 */
    '&[aria-disabled="true"]': {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },

  /* 你自己加的状态行（loading / empty / error） */
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

// 更加完善的列表组件，支持三态设计与 MUI 样式对齐
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

      {/* 首次空态 */}
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

      {/* 错误态 */}
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

      {/* 加载更多 */}
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

      {/* 无更多 */}
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

/** 初始化状态枚举 */
type InitState = "idle" | "fetching" | "ready";

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
  // 从 fieldProps 中提取用户自定义的 onChange 和 multiple
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

  // 本地状态（用于远程模式）
  const [localOptions, setLocalOptions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false); // 专门用于控制滚动加载的状态
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 初始化状态：'idle' -> 'fetching' -> 'ready'
  // 用于追踪默认值回显是否完成，避免打开下拉时的闪烁
  const [initState, setInitState] = useState<InitState>("idle");

  // 记录初始 field.value，用于判断是否需要 fetchById
  const initialValueRef = useRef(field.value);
  // 标记是否是首次打开（用于优化首次打开不触发搜索）
  const hasOpenedOnceRef = useRef(false);

  // 如果有远程配置，优先使用本地 options
  const currentOptions = remoteConfig ? localOptions : options;
  const pageSize = remoteConfig?.pageSize ?? 20;

  // 记录当前选中的 options，防止搜索时丢失回显
  // 使用 ref 避免作为依赖项
  const selectedOptionsRef = useRef<OptionItem[]>([]);

  // 更新 selectedOptionsRef
  useEffect(() => {
    if (!remoteConfig) return;
    const values = Array.isArray(field.value)
      ? field.value
      : field.value
      ? [field.value]
      : [];
    if (values.length === 0) return;

    // 从 localOptions 中找到当前选中的 items 并合并到 ref
    // 注意：这里我们不直接替换，而是合并，因为 localOptions 可能会变（比如被搜索结果覆盖）
    const currentSelected = localOptions.filter((o) =>
      values.includes(o.value)
    );

    // 将新找到的 selected items 合并到 ref (去重)
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

  // 回显逻辑：如果 field.value 有值，但 options 中没有，尝试通过 fetchById 获取
  // 这个 effect 只在初始化时运行一次
  useEffect(() => {
    const config = remoteConfigRef.current;
    const initialValue = initialValueRef.current;

    // 非远程模式或没有 fetchById，直接标记为 ready
    if (!config?.fetchById) {
      setInitState("ready");
      return;
    }

    // 如果没有初始值，直接标记为 ready
    if (
      initialValue === undefined ||
      initialValue === null ||
      (Array.isArray(initialValue) && initialValue.length === 0)
    ) {
      setInitState("ready");
      return;
    }

    const values = Array.isArray(initialValue) ? initialValue : [initialValue];

    // 开始获取
    setInitState("fetching");

    // 使用 Promise.all 并行获取所有缺失的选项
    const fetchPromises = values.map(async (v) => {
      try {
        const item = await config.fetchById!(v);
        return item;
      } catch (err) {
        console.error(`Failed to fetch option for value ${v}:`, err);
        return null;
      }
    });

    Promise.all(fetchPromises).then((items) => {
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
        // 更新 selectedOptionsRef
        validItems.forEach((item) => {
          // eslint-disable-next-line eqeqeq
          if (!selectedOptionsRef.current.some((s) => s.value == item.value)) {
            selectedOptionsRef.current.push(item);
          }
        });
      }
      setInitState("ready");
    });
    // 只在挂载时运行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 远程加载函数
  const fetchOptions = useCallback(
    async (keyword: string, pageNum: number, isLoadMore = false) => {
      if (!remoteConfig) return;

      // 如果不是加载更多，先清空或重置状态
      if (!isLoadMore) {
        setPage(1);
        setHasMore(true);
      }

      // 根据请求类型设置不同的 loading 状态
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
            // 过滤重复项
            const newItems = res.data.filter(
              (newItem) =>
                !prev.some((prevItem) => prevItem.value === newItem.value)
            );
            return [...prev, ...newItems];
          });
        } else {
          // 搜索结果回来后，要合并当前选中的项，防止回显丢失
          const newOptions = [...res.data];

          // 把 ref 中记录的选中项合并进去 (如果不在搜索结果中)
          const currentValues = Array.isArray(field.value)
            ? field.value
            : field.value
            ? [field.value]
            : [];

          // 从 ref 中找当前真正被选中的项 (过滤掉 ref 中可能过期的)
          const activeSelectedItems = selectedOptionsRef.current.filter(
            // eslint-disable-next-line eqeqeq
            (o) => currentValues.includes(o.value)
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
    [remoteConfig, pageSize, field.value] // 添加 field.value 依赖，确保 fetchOptions 内部能获取最新 value
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 监听 open 变化，实现"关闭再展开刷新"
  // 关键优化：初始化未完成时不触发搜索，首次打开时如果已有选中项则不立即搜索
  useEffect(() => {
    if (!open || !remoteConfig) return;

    // 初始化未完成，等待 fetchById 完成
    if (initState !== "ready") return;

    // 首次打开且已有选中项时，不立即触发搜索（避免闪烁）
    // 但如果 localOptions 为空（说明没有可展示的数据），还是需要搜索
    const hasSelectedValue =
      field.value !== undefined &&
      field.value !== null &&
      !(Array.isArray(field.value) && field.value.length === 0);

    if (
      !hasOpenedOnceRef.current &&
      hasSelectedValue &&
      localOptions.length > 0
    ) {
      // 首次打开且有选中项且有数据，跳过搜索
      hasOpenedOnceRef.current = true;
      return;
    }

    hasOpenedOnceRef.current = true;

    // 判断 inputValue 是否等于某个选中项的 label
    const isSelectedLabel = localOptions.some(
      (o) => o.label === inputValue && field.value === o.value
    );

    let keyword = inputValue;
    // 单选且有值且输入框内容等于选中项 label
    if (!multiple && field.value && isSelectedLabel) {
      keyword = "";
    }

    fetchOptions(keyword, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initState]); // 依赖 open 和 initState

  // 处理输入变化
  const handleInputChange = (
    event: React.SyntheticEvent,
    newInputValue: string,
    reason: string
  ) => {
    // 只有在用户输入(input)或清除(clear)时才更新 inputValue
    // 防止 select/reset 等操作导致 inputValue 意外变化 (比如选中后重置为 label)
    // 但注意：MUI Autocomplete 在选中后会将 inputValue 重置为 label，这是符合预期的 (单选时)
    // 用户的问题是 "搜索列表更新后就通过更新我的输入框" -> 这通常发生在 reset

    // 如果是 reset (比如 options 变化导致重新匹配 label)，且用户正在输入(open=true)，则不更新
    if (reason === "reset" && open) {
      return;
    }

    setInputValue(newInputValue);

    if (!remoteConfig) return;

    // 清除上一次的定时器
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 只有在用户输入(input)或清除(clear)时才触发搜索
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
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        inputValue={remoteConfig ? inputValue : undefined}
        onInputChange={remoteConfig ? handleInputChange : undefined}
        options={currentOptions}
        loading={loading || (userLoading as boolean)}
        filterOptions={remoteConfig ? (x) => x : undefined} // 远程模式禁用客户端过滤
        value={
          multiple
            ? currentOptions.filter((o) =>
                (field.value ?? []).includes(o.value)
              )
            : currentOptions.find((o) => o.value === field.value) ?? null
        }
        onChange={(event, v) => {
          const nextValue = multiple
            ? (v as typeof options).map((item) => item.value)
            : (v as (typeof options)[0])?.value ?? null;

          field.onChange(nextValue);

          if (typeof userOnChange === "function") {
            userOnChange(event, v as OptionItem | OptionItem[] | null);
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
            // 传递自定义属性给 ListboxComponent (仅在远程模式下传递)
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
