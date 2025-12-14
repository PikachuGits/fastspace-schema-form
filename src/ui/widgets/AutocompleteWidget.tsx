import { Autocomplete, CircularProgress, FormControl, TextField, styled, Box, Typography } from '@mui/material';
import { useCallback, useEffect, useState, forwardRef, useRef } from 'react';
import type { OptionItem, WidgetComponent } from '../../types';
import { compactFieldStyles } from './styles';

const StyledUl = styled('ul')(({ theme }) => ({
  padding: theme.spacing(0.5),
  margin: 0,
  listStyle: 'none',
  maxHeight: 260,
  overflow: 'auto',

  /* 所有 option（即 children） */
  '& .MuiAutocomplete-option': {
    minHeight: 36,
    padding: theme.spacing(0.75, 1.5),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: 14,
    borderRadius: theme.shape.borderRadius,
    cursor: 'pointer',

    transition: theme.transitions.create(['background-color'], {
      duration: theme.transitions.duration.shortest,
    }),

    /* hover */
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },

    /* 选中态 */
    '&[aria-selected="true"]': {
      backgroundColor: theme.palette.action.selected,
    },

    /* 禁用态 */
    '&[aria-disabled="true"]': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  /* 你自己加的状态行（loading / empty / error） */
  '& .MuiAutocomplete-listboxStatus': {
    cursor: 'default',
    pointerEvents: 'none',
  },
}));

export interface InfiniteListboxProps extends React.HTMLAttributes<HTMLElement> {
  fetchingMore?: boolean;
  hasMore?: boolean;
  showNoMore?: boolean;
  empty?: boolean;
  error?: boolean;
}

// 更加完善的列表组件，支持三态设计与 MUI 样式对齐
const InfiniteAutocompleteListbox = forwardRef<HTMLUListElement, InfiniteListboxProps>((props, ref) => {
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
          sx={{ py: 2, justifyContent: 'center', pointerEvents: 'none', cursor: 'default' }}
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
          sx={{ py: 2, color: 'error.main', justifyContent: 'center', pointerEvents: 'none', cursor: 'default' }}
        >
          <Typography variant="body2">
            加载失败，请重试
          </Typography>
        </Box>
      )}

      {/* 加载更多 */}
      {fetchingMore && (
        <Box
          component="li"
          className="MuiAutocomplete-option MuiAutocomplete-listboxStatus"
          sx={{ py: 1.5, gap: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: 'text.secondary', cursor: 'default' }}
        >
          <CircularProgress size={16} color="inherit" />
          <Typography variant="body2">
            加载中…
          </Typography>
        </Box>
      )}

      {/* 无更多 */}
      {!hasMore && showNoMore && !fetchingMore && !empty && (
        <Box
          component="li"
          className="MuiAutocomplete-option MuiAutocomplete-listboxStatus"
          sx={{ py: 1.5, justifyContent: 'center', pointerEvents: 'none', cursor: 'default' }}
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
  // 从 fieldProps 中提取用户自定义的 onChange 和 multiple
  const { onChange: userOnChange, multiple = false, loading: userLoading, ...restFieldProps } = fieldProps ?? {};

  // 远程配置
  const remoteConfig = schema?.ui?.remoteConfig;

  // 本地状态（用于远程模式）
  const [localOptions, setLocalOptions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false); // 专门用于控制滚动加载的状态
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 如果有远程配置，优先使用本地 options
  const currentOptions = remoteConfig ? localOptions : options;
  const pageSize = remoteConfig?.pageSize ?? 20;

  // 回显逻辑：如果 field.value 有值，但 options 中没有，尝试通过 fetchById 获取
  useEffect(() => {
    if (!remoteConfig?.fetchById || !field.value) return;

    const values = Array.isArray(field.value) ? field.value : [field.value];
    const missingValues = values.filter(
      (v) => !localOptions.some((o) => o.value === v)
    );

    if (missingValues.length === 0) return;

    // 逐个获取缺失的选项 (可以优化为批量获取，如果 API 支持)
    missingValues.forEach(async (v) => {
      try {
        const item = await remoteConfig.fetchById!(v);
        if (item) {
          setLocalOptions((prev) => {
            // 防止重复添加
            if (prev.some((o) => o.value === item.value)) return prev;
            return [...prev, item];
          });
        }
      } catch (err) {
        console.error(`Failed to fetch option for value ${v}:`, err);
      }
    });
  }, [field.value, remoteConfig, localOptions]);

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
              newItem => !prev.some(prevItem => prevItem.value === newItem.value)
            );
            return [...prev, ...newItems];
          });
        } else {
          setLocalOptions(res.data);
        }
        setHasMore(res.hasMore);
      } catch (err) {
        console.error('Failed to fetch options:', err);
      } finally {
        if (isLoadMore) {
          setFetchingMore(false);
        } else {
          setLoading(false);
        }
        remoteConfig.onLoadingChange?.(false);
      }
    },
    [remoteConfig, pageSize]
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 监听 open 变化，实现"关闭再展开刷新"
  useEffect(() => {
    if (open && remoteConfig) {
      // 打开时立即触发一次搜索（使用当前输入值）
      fetchOptions(inputValue, 1, false);
    }
  }, [open]); // 只依赖 open，不依赖 inputValue

  // 处理输入变化
  const handleInputChange = (event: React.SyntheticEvent, newInputValue: string, reason: string) => {
    setInputValue(newInputValue);

    if (!remoteConfig) return;

    // 清除上一次的定时器
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 只有在用户输入(input)或清除(clear)时才触发搜索
    // 避免 select 选中(reset)时触发搜索导致列表重置
    if (reason === 'input' || reason === 'clear') {
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
      listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 20
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
            ? currentOptions.filter((o) => (field.value ?? []).includes(o.value))
            : currentOptions.find((o) => o.value === field.value) ?? null
        }
        onChange={(event, v) => {
          const nextValue = multiple
            ? (v as typeof options).map((item) => item.value)
            : (v as (typeof options)[0])?.value ?? null;

          field.onChange(nextValue);

          if (typeof userOnChange === 'function') {
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
            size: 'small',
            variant: 'outlined',
            sx: {
              height: 22,
              fontSize: 12,
              borderRadius: 1,
              backgroundColor: 'background.paper',

              '& .MuiChip-label': {
                px: 0.75,
              },

              '& .MuiChip-deleteIcon': {
                fontSize: 16,
                marginRight: 0.25,
              },
            },
          },
        }}
        getOptionLabel={(o) => o?.label ?? ''}
        isOptionEqualToValue={(opt, val) => opt?.value === val?.value}
        size="small"
        disabled={restFieldProps?.disabled}
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
                    {(loading || userLoading) ? <CircularProgress color="inherit" size={20} /> : null}
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
