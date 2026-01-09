import React, { memo, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
  Grid,
  Divider,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { WidgetProps } from "../FieldAdapter";
import { LayoutRenderer } from "../layout";
import { useLayoutContext } from "../layout/LayoutContext";
import type { LayoutNode } from "../../types";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type FormListWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  /** 布局子节点 (由 SchemaRenderer 传入) */
  layoutChildren?: LayoutNode[];
  /** 最小行数 */
  minItems?: number;
  /** 最大行数 */
  maxItems?: number;
  /** 添加按钮文案 */
  addText?: string;
  /** 是否可复制 */
  copyable?: boolean;
  /** 空状态提示 */
  emptyText?: string;
  /** 显示行号 */
  showIndex?: boolean;
  /** 每行的默认值 */
  itemDefaultValue?: Record<string, any>;
};

export type FormListWidgetProps = {
  form: any;
  name: string;
} & Omit<FormListWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

/**
 * FormList 动态列表组件
 *
 * 支持动态添加/删除/复制行
 */
export const FormListWidgetRender = memo(function FormListWidgetRender({
  value,
  onChange,
  name,
  layoutChildren,
  label,
  helperText,
  disabled,
  visible = true,
  minItems = 0,
  maxItems = Infinity,
  addText = "添加一项",
  copyable = false,
  emptyText = "暂无数据",
  showIndex = false,
  itemDefaultValue = {},
  required,
}: FormListWidgetRenderProps) {
  if (!visible) return null;

  const list = Array.isArray(value) ? value : [];
  const { renderField } = useLayoutContext();

  const canAdd = list.length < maxItems && !disabled;
  const canRemove = list.length > minItems && !disabled;

  // 添加行
  const handleAdd = useCallback(() => {
    if (!canAdd) return;
    onChange([...list, { ...itemDefaultValue }]);
  }, [canAdd, list, onChange, itemDefaultValue]);

  // 复制行
  const handleCopy = useCallback(
    (index: number) => {
      if (!canAdd) return;
      const rowData = list[index];
      onChange([...list, { ...rowData }]);
    },
    [canAdd, list, onChange]
  );

  // 删除行
  const handleRemove = useCallback(
    (index: number) => {
      if (!canRemove) return;
      onChange(list.filter((_, i) => i !== index));
    },
    [canRemove, list, onChange]
  );

  // 创建行级 renderField，将路径转换为数组索引形式
  const createItemRenderField = useCallback(
    (index: number) => (path: string, children?: LayoutNode[]) => {
      let newPath = path;
      // 检查 path 是否以父列表名称开头 (绝对路径情况)
      if (name && path.startsWith(name + ".")) {
        // 将 "name." 替换为 "name[index]."
        newPath = `${name}[${index}]${path.substring(name.length)}`;
      } else if (name && !path.includes(".")) {
        // 相对路径情况 (且不是其他绝对路径): 直接拼接
        newPath = `${name}[${index}].${path}`;
      }
      return renderField(newPath, children);
    },
    [name, renderField]
  );

  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      {/* 标题 */}
      {label && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {renderLabel(label, required)}
            {maxItems !== Infinity && (
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                ({list.length}/{maxItems})
              </Typography>
            )}
          </Typography>
        </Box>
      )}

      {/* 帮助文本 */}
      {helperText && (
        <Typography variant="body2" color="text.secondary">
          {helperText}
        </Typography>
      )}

      {/* 空状态 */}
      {list.length === 0 && (
        <Box
          sx={{
            p: 3,
            textAlign: "center",
            color: "text.secondary",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Typography variant="body2">{emptyText}</Typography>
        </Box>
      )}

      {/* 列表项 */}
      {list.map((_, index) => (
        <Card key={index} variant="outlined">
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              {/* 行号 */}
              {showIndex && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    minWidth: 24,
                    pt: 1,
                    fontWeight: "bold",
                  }}
                >
                  #{index + 1}
                </Typography>
              )}

              {/* 字段内容 */}
              <Box flexGrow={1}>
                {layoutChildren && (
                  <Grid container spacing={2}>
                    <LayoutRenderer
                      layout={layoutChildren}
                      renderField={createItemRenderField(index)}
                    />
                  </Grid>
                )}
              </Box>

              {/* 操作按钮 */}
              <Stack direction="row" spacing={0.5} sx={{ pt: 0.5 }}>
                {copyable && canAdd && (
                  <Tooltip title="复制此行">
                    <IconButton
                      onClick={() => handleCopy(index)}
                      size="small"
                      color="primary"
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {canRemove && (
                  <Tooltip title="删除此行">
                    <IconButton
                      onClick={() => handleRemove(index)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {/* 添加按钮 */}
      {canAdd && (
        <Divider>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAdd}
            variant="text"
            size="small"
            disabled={disabled}
          >
            {addText}
          </Button>
        </Divider>
      )}
    </Stack>
  );
});

// ============================================================================
// 导出
// ============================================================================

/**
 * FormList 动态列表组件
 *
 * 用于管理动态数组数据，支持添加、删除、复制行
 *
 * @example
 * ```tsx
 * // Schema 配置
 * {
 *   name: 'users',
 *   component: 'FormList',
 *   ui: {
 *     label: '用户列表',
 *     minItems: 1,
 *     maxItems: 5,
 *     addText: '添加用户',
 *     copyable: true,
 *   },
 *   children: [
 *     { name: 'name', component: 'Text', ui: { label: '姓名' } },
 *     { name: 'age', component: 'Number', ui: { label: '年龄' } },
 *   ],
 * }
 * ```
 */
export const FormListWidget = FormListWidgetRender;

export default FormListWidgetRender;
