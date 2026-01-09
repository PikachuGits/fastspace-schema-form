import { memo } from 'react';
import Grid from '@mui/material/Grid';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { computeFieldState } from '../../core/engine/fieldState';
import type { FieldSchema, OptionItem, WidgetComponent, WidgetProps, ConditionExpression } from '../../types';

export interface FieldRendererProps<T extends FieldValues = FieldValues> {
  /** 字段 Schema */
  field: FieldSchema<T>;
  /** 字段索引 */
  index: number;
  /** 当前表单值 */
  values: Record<string, unknown>;
  /** 表单方法 */
  form: UseFormReturn<T>;
  /** 全局禁用 */
  disabled?: boolean;
  /** 全局只读 */
  readOnly?: boolean;
  /** Widget 映射 */
  widgets: Record<string, WidgetComponent>;
  /** 选项映射 */
  optionsMap: Record<string, OptionItem[]>;
  /** 是否使用 Grid 包装 */
  useGrid?: boolean;
}

/**
 * 解析 colSpan 为 Grid size props
 */
function parseColSpan(colSpan: FieldSchema['colSpan']) {
  if (colSpan === undefined || colSpan === null) {
    return { xs: 12 };
  }

  if (typeof colSpan === 'object') {
    return colSpan;
  }

  return { xs: colSpan };
}

/**
 * 获取字段依赖的表单值 Key
 */
function getFieldDependencies(field: FieldSchema): string[] {
  const deps = new Set<string>();

  const collectDeps = (f: FieldSchema) => {
    const visit = (cond: ConditionExpression | undefined) => {
      if (!cond) return;
      if (typeof cond === 'function') {
        deps.add('*'); // 函数类型依赖无法确定，标记为所有
        return;
      }
      if ('field' in cond) {
        deps.add(cond.field);
      }
      if ('and' in cond && Array.isArray(cond.and)) {
        cond.and.forEach(visit);
      }
      if ('or' in cond && Array.isArray(cond.or)) {
        cond.or.forEach(visit);
      }
      if ('not' in cond) {
        visit(cond.not);
      }
    };

    visit(f.visibleWhen);
    visit(f.disabledWhen);
    visit(f.requiredWhen);

    if (f.dependencies) {
      f.dependencies.forEach((d) => deps.add(d));
    }
  };

  collectDeps(field);

  // 如果是 Group，需要收集所有子字段的依赖
  if (field.component === 'Group' && field.columns) {
    const collectChildrenDeps = (columns: FieldSchema[]) => {
      columns.forEach(child => {
        collectDeps(child);
        if (child.component === 'Group' && child.columns) {
          collectChildrenDeps(child.columns);
        }
      });
    };
    collectChildrenDeps(field.columns);
  }

  return Array.from(deps);
}

/**
 * 字段渲染器组件
 * 负责根据 Schema 渲染单个表单字段
 */
function FieldRendererInner<T extends FieldValues = FieldValues>({
  field,
  index,
  values,
  form,
  disabled = false,
  readOnly = false,
  widgets,
  optionsMap,
  useGrid = true,
}: FieldRendererProps<T>) {
  // 计算字段状态
  const state = computeFieldState(field as FieldSchema, values, disabled, readOnly);

  // 不可见则不渲染
  if (!state.visible) {
    return null;
  }

  // 获取 Widget 组件
  const Widget = widgets[field.component] ?? widgets.Text;
  const options = optionsMap[field.name as string] ?? field.ui?.options ?? [];

  // Group 和 FormList 需要特殊处理
  const isNestedComponent = field.component === 'Group' || field.component === 'FormList';

  // 渲染内容
  const content = isNestedComponent ? (
    <Widget
      field={
        {
          name: field.name,
          value: undefined,
          onChange: () => { },
          onBlur: () => { },
          ref: () => { },
        } as WidgetProps['field']
      }
      form={form as WidgetProps['form']}
      globalDisabled={disabled}
      globalReadOnly={readOnly}
      label={field.ui?.label}
      optionsMap={optionsMap}
      schema={field as WidgetProps['schema']}
      widgets={widgets as WidgetProps['widgets']}
      values={values}
    />
  ) : (
    <Controller
      control={form.control}
      name={field.name}
      render={({ field: rhfField, fieldState }) => {
        return (
          <Widget
            error={!!fieldState.error}
            field={rhfField as WidgetProps['field']}
            fieldProps={{
              ...field.ui?.props,
              ...field.fieldProps,
              disabled: state.disabled,
              required: state.required,
              readOnly: state.readonly,
              placeholder: field.ui?.placeholder,
            }}
            form={form as WidgetProps['form']}
            helperText={fieldState.error?.message ?? field.ui?.helperText}
            label={field.ui?.label}
            options={options}
            values={values}
            schema={field as WidgetProps['schema']}
          />
        );
      }}
    />
  );

  // 使用 Grid 包装
  if (useGrid) {
    const gridSize = parseColSpan(field.colSpan);
    return (
      <Grid key={`${String(field.name)}-${index}`} size={gridSize}>
        {content}
      </Grid>
    );
  }

  return content;
}

export const FieldRenderer = memo(FieldRendererInner, (prev, next) => {
  // 1. 基础属性浅比较
  if (
    prev.field !== next.field ||
    prev.index !== next.index ||
    prev.disabled !== next.disabled ||
    prev.readOnly !== next.readOnly ||
    prev.useGrid !== next.useGrid ||
    prev.widgets !== next.widgets ||
    prev.form !== next.form // form 实例通常是稳定的
  ) {
    return false;
  }

  // 2. 比较 optionsMap
  // 注意：optionsMap 可能会变（新的对象），但我们只关心当前字段的 options
  const prevOptions = prev.optionsMap[prev.field.name as string];
  const nextOptions = next.optionsMap[next.field.name as string];
  if (prevOptions !== nextOptions) {
    return false;
  }

  // 3. 比较 values (关键优化)
  // 只有当影响当前字段状态的依赖值发生变化时，才重新渲染
  const deps = getFieldDependencies(next.field as FieldSchema);

  // 如果包含函数类型的依赖，无法确定依赖关系，必须更新
  if (deps.includes('*')) {
    return false;
  }

  // 检查依赖值是否变化
  for (const dep of deps) {
    if (prev.values[dep] !== next.values[dep]) {
      return false;
    }
  }

  return true;
}) as typeof FieldRendererInner;
