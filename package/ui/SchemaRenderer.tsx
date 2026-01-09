import React, { memo, useMemo, useCallback } from "react";
import { Grid } from "@mui/material";
import type { CompiledSchema, LayoutNode, FieldConfig } from "../types";
import { FieldAdapter, type WidgetProps } from "./FieldAdapter";
import { defaultWidgets } from "./widgets";
import { LayoutContext } from "./layout/LayoutContext";

// ============================================================================
// Types
// ============================================================================

export type WidgetRegistry = Record<string, React.ComponentType<any>>;

export type SchemaRendererProps = {
  /** 编译后的 Schema */
  schema: CompiledSchema;
  /** TanStack Form 实例 */
  form: any;
  /** 自定义 Widget 映射 (覆盖默认) */
  widgets?: WidgetRegistry;
  /** 全局禁用 */
  disabled?: boolean;
  /** 全局只读 */
  readOnly?: boolean;
  /** 栅格间距 */
  spacing?: number;
};

export type FieldRendererProps = {
  field: FieldConfig;
  form: any;
  widgets: WidgetRegistry;
  disabled?: boolean;
  readOnly?: boolean;
  layoutChildren?: LayoutNode[];
};

// ============================================================================
// Utils
// ============================================================================

/**
 * 解析 colSpan 配置
 */
function parseColSpan(
  colSpan?: number | Record<string, number>
): Record<string, number> {
  if (!colSpan) return { xs: 12 };
  if (typeof colSpan === "number") return { xs: colSpan };
  return colSpan;
}

// ============================================================================
// FieldRenderer - 单个字段渲染器
// ============================================================================

const FieldRenderer = memo(function FieldRenderer({
  field,
  form,
  widgets,
  disabled,
  readOnly,
  layoutChildren,
}: FieldRendererProps) {
  // 获取对应的 Widget
  const Widget = widgets[field.component];

  if (!Widget) {
    console.warn(
      `[SchemaRenderer] Unknown widget type: "${field.component}" for field "${field.name}"`
    );
    return null;
  }

  // 解析 colSpan
  const colSpan = parseColSpan(field.props?.colSpan);

  // 提取 UI 属性
  const uiProps = field.props || {};

  // 是否独占一行
  const independent = uiProps.independent === true;

  // independent 模式：组件独占一行，但宽度仍由 colSpan 控制
  if (independent) {
    return (
      <Grid size={12}>
        <Grid container>
          <Grid size={colSpan}>
            <FieldAdapter
              form={form}
              name={field.name}
              validate={field.validate}
              fieldProps={{
                disabled: disabled || uiProps.disabled,
                readOnly: readOnly || uiProps.readOnly,
                layoutChildren,
              }}
              render={(props: WidgetProps) => (
                <Widget
                  {...props}
                  {...uiProps}
                  label={uiProps.label}
                  placeholder={uiProps.placeholder}
                  helperText={uiProps.helperText}
                  options={
                    props.options?.length ? props.options : uiProps.options
                  }
                />
              )}
            />
          </Grid>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid size={colSpan}>
      <FieldAdapter
        form={form}
        name={field.name}
        validate={field.validate}
        fieldProps={{
          disabled: disabled || uiProps.disabled,
          readOnly: readOnly || uiProps.readOnly,
          layoutChildren,
        }}
        render={(props: WidgetProps) => (
          <Widget
            {...props}
            {...uiProps}
            label={uiProps.label}
            placeholder={uiProps.placeholder}
            helperText={uiProps.helperText}
            options={props.options?.length ? props.options : uiProps.options}
          />
        )}
      />
    </Grid>
  );
});

// ============================================================================
// LayoutRenderer - 布局节点渲染器
// ============================================================================

export type LayoutRendererProps = {
  nodes: LayoutNode[];
  fields: Record<string, FieldConfig>;
  form: any;
  widgets: WidgetRegistry;
  disabled?: boolean;
  readOnly?: boolean;
  spacing?: number;
};

/**
 * 布局渲染器
 *
 * 根据 LayoutNode 递归渲染字段和容器
 *
 * @example
 * ```tsx
 * <LayoutRenderer
 *   nodes={compiledSchema.layout}
 *   fields={compiledSchema.fields}
 *   form={form}
 *   widgets={widgets}
 * />
 * ```
 */
export const LayoutRenderer = memo(function LayoutRenderer({
  nodes,
  fields,
  form,
  widgets,
  disabled,
  readOnly,
  spacing = 2,
}: LayoutRendererProps) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === "field" && node.field) {
          const field = fields[node.field];
          if (!field) return null;

          return (
            <FieldRenderer
              key={field.name}
              field={field}
              form={form}
              widgets={widgets}
              disabled={disabled}
              readOnly={readOnly}
              layoutChildren={node.children}
            />
          );
        }

        if (node.type === "container" && node.children) {
          // 容器节点 (Grid, Stack, Card 等)
          const ContainerComponent = node.component;
          const containerProps = node.props || {};

          if (ContainerComponent === "Grid") {
            return (
              <Grid
                key={`container-${index}`}
                container
                spacing={containerProps.spacing ?? spacing}
                {...containerProps}
              >
                <LayoutRenderer
                  nodes={node.children}
                  fields={fields}
                  form={form}
                  widgets={widgets}
                  disabled={disabled}
                  readOnly={readOnly}
                  spacing={spacing}
                />
              </Grid>
            );
          }

          // 其他容器类型直接渲染子节点
          return (
            <React.Fragment key={`container-${index}`}>
              <LayoutRenderer
                nodes={node.children}
                fields={fields}
                form={form}
                widgets={widgets}
                disabled={disabled}
                readOnly={readOnly}
                spacing={spacing}
              />
            </React.Fragment>
          );
        }

        return null;
      })}
    </>
  );
});

// ============================================================================
// SchemaRenderer - 主组件
// ============================================================================

/**
 * Schema 渲染器
 *
 * 根据编译后的 Schema 自动渲染表单字段
 *
 * @example
 * ```tsx
 * <SchemaRenderer
 *   schema={compiledSchema}
 *   form={form}
 *   widgets={{ CustomWidget: MyCustomWidget }}
 * />
 * ```
 */
export const SchemaRenderer = memo(function SchemaRenderer({
  schema,
  form,
  widgets: customWidgets,
  disabled,
  readOnly,
  spacing = 2,
}: SchemaRendererProps) {
  // 合并 Widget 映射
  const mergedWidgets = useMemo(
    () => ({
      ...defaultWidgets,
      ...customWidgets,
    }),
    [customWidgets]
  );

  // 如果没有 layout，按字段顺序渲染
  const layoutNodes = useMemo(() => {
    if (schema.layout && schema.layout.length > 0) {
      return schema.layout;
    }

    // 默认布局：所有字段平铺
    return Object.keys(schema.fields).map(
      (fieldName): LayoutNode => ({
        type: "field",
        field: fieldName,
      })
    );
  }, [schema.layout, schema.fields]);

  // 提供 renderField 给子组件 (如 FormList) 使用
  const renderField = useCallback(
    (fieldPath: string, layoutChildren?: LayoutNode[]) => {
      let field = schema.fields[fieldPath];

      // 尝试处理数组路径: contacts[0].name -> contacts.name
      if (!field) {
        // 将所有 [number] 替换为空字符串，还原为 Schema 路径
        // 例如: contacts[0].name -> contacts.name
        // 例如: users[0].address[1].city -> users.address.city
        const schemaPath = fieldPath.replace(/\[\d+\]/g, "");
        const schemaField = schema.fields[schemaPath];
        if (schemaField) {
          // 动态创建 field 配置，使用实际的数据路径
          // 这样 FieldAdapter 就会绑定到 contacts[0].name
          field = { ...schemaField, name: fieldPath };
        }
      }

      if (!field) return null;
      return (
        <FieldRenderer
          key={field.name}
          field={field}
          form={form}
          widgets={mergedWidgets}
          disabled={disabled}
          readOnly={readOnly}
          layoutChildren={layoutChildren}
        />
      );
    },
    [schema.fields, form, mergedWidgets, disabled, readOnly]
  );

  return (
    <LayoutContext.Provider value={{ renderField }}>
      <Grid container spacing={spacing}>
        <LayoutRenderer
          nodes={layoutNodes}
          fields={schema.fields}
          form={form}
          widgets={mergedWidgets}
          disabled={disabled}
          readOnly={readOnly}
          spacing={spacing}
        />
      </Grid>
    </LayoutContext.Provider>
  );
});

export default SchemaRenderer;
