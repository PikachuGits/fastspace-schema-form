import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Controller } from "react-hook-form";
import { computeFieldState } from "../../core/engine/fieldState";
import type { FieldSchema, WidgetComponent, WidgetProps } from "../../types";

/**
 * 解析 colSpan 为 Grid size props
 */
function parseColSpan(colSpan: FieldSchema["colSpan"]) {
  if (!colSpan) {
    return { xs: 12 };
  }

  // 如果是响应式对象
  if (typeof colSpan === "object" && ("xs" in colSpan || "sm" in colSpan || "md" in colSpan)) {
    return colSpan;
  }

  // 简单值
  return { xs: colSpan };
}

/**
 * Group 分组组件
 * 将多个字段组合在一行内显示
 */
export const GroupWidget: WidgetComponent = ({
  schema,
  form,
  widgets = {},
  optionsMap = {},
  globalDisabled = false,
  globalReadOnly = false,
  values: propValues,
}) => {
  if (!schema?.columns || !form || !widgets) {
    return null;
  }

  // 优先使用传入的 values (优化)，否则回退到 form.watch() (全量订阅)
  const values = propValues || form.watch();

  return (
    <Box sx={{ width: '100%' }}>
      {schema.ui?.label && (
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          {schema.ui.label}
        </Typography>
      )}
      <Grid container spacing={2}>
        {schema.columns.map((childField, idx) => {
          // 计算字段状态
          const state = computeFieldState(
            childField as FieldSchema,
            values,
            globalDisabled,
            globalReadOnly
          );

          if (!state.visible) {
            return null;
          }

          // 获取 Widget
          const Widget = widgets[childField.component] ?? widgets.Text;
          if (!Widget) {
            return null;
          }

          const options = optionsMap[childField.name as string] ?? childField.ui?.options ?? [];
          const gridSize = parseColSpan(childField.colSpan);

          // 嵌套 Group 或 FormList
          if (childField.component === "Group" || childField.component === "FormList") {
            return (
              <Grid key={`${String(childField.name)}-${idx}`} size={gridSize as any}>
                <Widget
                  field={{ name: childField.name, value: undefined, onChange: () => { }, onBlur: () => { }, ref: () => { } } as WidgetProps["field"]}
                  form={form}
                  globalDisabled={globalDisabled}
                  globalReadOnly={globalReadOnly}
                  optionsMap={optionsMap}
                  schema={childField}
                  widgets={widgets}
                  values={values}
                />
              </Grid>
            );
          }

          return (
            <Grid key={`${String(childField.name)}-${idx}`} size={gridSize as any}>
              <Controller
                control={form.control}
                name={childField.name}
                render={({ field: rhfField, fieldState }) => (
                  <Widget
                    error={!!fieldState.error}
                    field={rhfField as WidgetProps["field"]}
                    fieldProps={{
                      ...childField.ui?.props,
                      disabled: state.disabled,
                      required: state.required,
                      readOnly: state.readonly,
                      placeholder: childField.ui?.placeholder,
                    }}
                    form={form}
                    helperText={fieldState.error?.message ?? childField.ui?.helperText}
                    label={childField.ui?.label}
                    options={options}
                    values={values}
                  />
                )}
              />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

