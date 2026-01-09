import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { Grid, type GridSize } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import { computeFieldState } from "../../core/engine/fieldState";
import { extractDependencies, evaluateCompute, isValidComputeValue } from "../../core/engine/compute";
import type { FieldSchema, WidgetComponent, WidgetProps } from "../../types";
import { useEffect, useMemo, useRef } from "react";

type GridResponsiveStyle = GridSize | { xs?: GridSize; sm?: GridSize; md?: GridSize; lg?: GridSize; xl?: GridSize };

/**
 * 解析 colSpan 为 Grid size props
 */
function parseColSpan(colSpan: FieldSchema["colSpan"]): GridResponsiveStyle {
  if (!colSpan) {
    return { xs: 12 };
  }

  // 如果是响应式对象
  if (
    typeof colSpan === "object" &&
    ("xs" in colSpan || "sm" in colSpan || "md" in colSpan)
  ) {
    return colSpan as GridResponsiveStyle;
  }

  // 简单值
  return { xs: colSpan as GridSize };
}

/**
 * 获取字段默认值
 */
function getFieldDefaultValue(
  columns: FieldSchema[] | undefined
): Record<string, unknown> {
  if (!columns) return {};

  const defaults: Record<string, unknown> = {};
  for (const col of columns) {
    if (col.component === "Group" && col.columns) {
      // Group 内的字段平铺
      Object.assign(defaults, getFieldDefaultValue(col.columns));
    } else {
      defaults[col.name as string] = col.defaultValue ?? "";
    }
  }
  return defaults;
}

/**
 * 递归获取所有需要计算的字段配置（支持 Group 嵌套）
 */
function getAllComputeFields(columns: FieldSchema[]): { name: string; expr: string; dependencies: string[]; precision?: number; roundMode?: 'round' | 'ceil' | 'floor' }[] {
  const result: { name: string; expr: string; dependencies: string[]; precision?: number; roundMode?: 'round' | 'ceil' | 'floor' }[] = [];
  for (const col of columns) {
    if (col.component === "Group" && col.columns) {
      result.push(...getAllComputeFields(col.columns));
    } else if (col.compute) {
      result.push({
        name: col.name as string,
        expr: col.compute.expr,
        dependencies: col.compute.dependencies || extractDependencies(col.compute.expr),
        precision: col.compute.precision,
        roundMode: col.compute.roundMode,
      });
    }
  }
  return result;
}

/**
 * FormList 动态列表组件
 * 支持动态添加/删除/复制行
 */
export const FormListWidget: WidgetComponent = ({
  schema,
  form,
  widgets = {},
  optionsMap = {},
  globalDisabled = false,
  globalReadOnly = false,
  label,
}) => {
  if (!schema || !form || !widgets) {
    return null;
  }

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: schema.name,
  });

  // 预计算 compute 字段信息
  const computeFieldsInfo = useMemo(() => {
    if (!schema.columns) return [];
    return getAllComputeFields(schema.columns);
  }, [schema.columns]);

  /**
   * 处理行内计算（在 onBlur 时触发）
   */
  const handleRowCompute = (rowIndex: number, triggerFieldName: string) => {
    // 1. 检查是否有字段依赖于触发字段
    const hasDependency = computeFieldsInfo.some(info =>
      info.dependencies.includes(triggerFieldName)
    );

    if (!hasDependency) return;

    // 2. 获取当前行数据
    const rowValues = form.getValues(`${schema.name}.${rowIndex}`) as Record<string, unknown>;
    if (!rowValues) return;

    // 3. 执行计算
    computeFieldsInfo.forEach(({ name, expr, dependencies, precision, roundMode }) => {
      // 如果当前字段就是触发字段，跳过（避免自循环，虽然一般不会发生）
      if (name === triggerFieldName) return;

      // 检查该字段是否依赖于触发字段
      if (!dependencies.includes(triggerFieldName)) return;

      // 检查所有依赖是否有效
      const hasAllDependencies = dependencies.every((dep) => isValidComputeValue(rowValues[dep]));
      if (!hasAllDependencies) return;

      // 计算新值
      const computedValue = evaluateCompute(expr, rowValues, dependencies, precision, roundMode);
      const currentValue = rowValues[name];

      // 更新值
      if (
        computedValue !== undefined &&
        computedValue !== currentValue &&
        !Number.isNaN(computedValue) &&
        (typeof computedValue !== 'number' ||
          typeof currentValue !== 'number' ||
          Math.abs(computedValue - currentValue) > 0.0001)
      ) {
        form.setValue(`${schema.name}.${rowIndex}.${name}`, computedValue, {
          shouldValidate: true, // 计算更新通常需要触发验证
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    });
  };

  const values = form.watch();
  const {
    columns = [],
    minItems = 0,
    maxItems = Infinity,
    addText = "添加一行",
    copyable = false,
  } = schema;

  // 添加行
  const handleAdd = () => {
    if (fields.length >= maxItems) return;
    const defaultRow = getFieldDefaultValue(columns);
    append(defaultRow as Record<string, unknown>);
  };

  // 复制行
  const handleCopy = (index: number) => {
    if (fields.length >= maxItems) return;
    const rowValues = form.getValues(`${schema.name}.${index}` as string);
    append(rowValues as Record<string, unknown>);
  };

  // 删除行
  const handleRemove = (index: number) => {
    if (fields.length <= minItems) return;
    remove(index);
  };

  // 渲染单个字段
  const renderField = (
    childField: FieldSchema,
    rowIndex: number,
    fieldIndex: number
  ) => {
    const fieldName = `${schema.name}.${rowIndex}.${childField.name}` as string;

    // 计算字段状态
    // 注意：FormList 内部字段的条件判断应该基于当前行的数据
    const rowValues = (values?.[schema.name as string] as any[])?.[rowIndex] || {};
    // 合并当前行数据和全局数据，以便支持跨层级依赖（可选，根据需求决定优先级）
    const mergedValues = { ...values, ...rowValues };

    const state = computeFieldState(
      childField as FieldSchema,
      mergedValues,
      globalDisabled,
      globalReadOnly
    );

    if (!state.visible) {
      return null;
    }

    // Group 嵌套
    if (childField.component === "Group") {
      return (
        <Grid
          key={`${fieldName}-${fieldIndex}`}
          size={parseColSpan(childField.colSpan)}
        >
          <Grid container spacing={2}>
            {childField.columns?.map((groupChild, groupIdx) =>
              renderField(
                { ...groupChild, name: groupChild.name } as FieldSchema,
                rowIndex,
                groupIdx
              )
            )}
          </Grid>
        </Grid>
      );
    }

    const Widget = widgets[childField.component] ?? widgets.Text;
    if (!Widget) return null;

    const options =
      optionsMap[childField.name as string] ?? childField.ui?.options ?? [];
    const gridSize = parseColSpan(childField.colSpan);

    return (
      <Grid key={`${fieldName}-${fieldIndex}`} size={gridSize}>
        <Controller
          control={form.control}
          name={fieldName}
          render={({ field: rhfField, fieldState }) => (
            <Widget
              error={!!fieldState.error}
              field={{
                ...rhfField,
                onBlur: (e: any) => {
                  rhfField.onBlur(); // 调用原始 onBlur
                  handleRowCompute(rowIndex, childField.name as string); // 触发计算
                }
              } as WidgetProps["field"]}
              fieldProps={{
                ...childField.ui?.props,
                disabled: state.disabled,
                required: state.required,
                readOnly: state.readonly,
                placeholder: childField.ui?.placeholder,
              }}
              form={form}
              helperText={
                fieldState.error?.message ?? childField.ui?.helperText
              }
              label={childField.ui?.label}
              options={options}
            />
          )}
        />
      </Grid>
    );
  };

  return (
    <Box>
      {label && (
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {label}
        </Typography>
      )}

      {fields.map((item, rowIndex) => (
        <Paper
          key={item.id}
          variant="outlined"
          sx={{ p: 2, mb: 2, position: "relative" }}
        >
          {/* 行操作按钮 */}
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              gap: 0.5,
            }}
          >
            {copyable && fields.length < maxItems && !globalDisabled && (
              <IconButton
                size="small"
                onClick={() => handleCopy(rowIndex)}
                title="复制"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            )}
            {fields.length > minItems && !globalDisabled && (
              <IconButton
                size="small"
                onClick={() => handleRemove(rowIndex)}
                color="error"
                title="删除"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {/* 字段内容 */}
          <Grid container spacing={2} sx={{ pr: 6 }}>
            {columns.map((col, colIdx) => renderField(col, rowIndex, colIdx))}
          </Grid>
        </Paper>
      ))}

      {/* 添加按钮 */}
      {fields.length < maxItems && !globalDisabled && (
        <>
          <Divider sx={{ my: 2 }}>
            <Button
              variant="text"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              {addText}
            </Button>
          </Divider>
        </>
      )}
    </Box>
  );
};
