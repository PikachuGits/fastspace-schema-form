import React, { memo } from "react";
import { Box, Typography, Grid, Divider, Card, CardContent } from "@mui/material";
import type { WidgetProps } from "../FieldAdapter";
import { useLayoutContext } from "../layout/LayoutContext";
import { LayoutRenderer } from "../layout";
import type { LayoutNode } from "../../types";
import { renderLabel } from "./utils";

// ============================================================================
// Types
// ============================================================================

export type GroupWidgetRenderProps = WidgetProps & {
  label?: string;
  helperText?: string;
  /** 布局子节点 (由 SchemaRenderer 传入) */
  layoutChildren?: LayoutNode[];
  /** 显示样式: card 卡片 | divider 分割线 | none 无边框 */
  variant?: "card" | "divider" | "none";
  /** 是否折叠 (TODO: 未实现) */
  collapsible?: boolean;
  /** Grid 间距 */
  spacing?: number;
};

export type GroupWidgetProps = {
  form: any;
  name: string;
} & Omit<GroupWidgetRenderProps, keyof WidgetProps>;

// ============================================================================
// 纯渲染组件
// ============================================================================

/**
 * 分组组件渲染
 *
 * 将多个字段组合在一起，支持不同的显示样式
 */
export const GroupWidgetRender = memo(function GroupWidgetRender({
  visible = true,
  disabled,
  label,
  helperText,
  layoutChildren,
  variant = "divider",
  spacing = 2,
  required,
}: GroupWidgetRenderProps) {
  if (!visible) return null;

  const { renderField } = useLayoutContext();

  // 渲染子字段
  const renderContent = () => (
    <Grid container spacing={spacing}>
      {layoutChildren && (
        <LayoutRenderer layout={layoutChildren} renderField={renderField} />
      )}
    </Grid>
  );

  // 根据 variant 渲染不同样式
  if (variant === "card") {
    return (
      <Card variant="outlined" sx={{ width: "100%" }}>
        <CardContent>
          {label && (
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {renderLabel(label, required)}
            </Typography>
          )}
          {helperText && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {helperText}
            </Typography>
          )}
          {renderContent()}
        </CardContent>
      </Card>
    );
  }

  if (variant === "divider") {
    return (
      <Box sx={{ width: "100%" }}>
        {label && (
          <>
            <Divider sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {renderLabel(label, required)}
              </Typography>
            </Divider>
            {helperText && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {helperText}
              </Typography>
            )}
          </>
        )}
        {renderContent()}
      </Box>
    );
  }

  // variant === "none"
  return (
    <Box sx={{ width: "100%" }}>
      {label && (
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {renderLabel(label, required)}
        </Typography>
      )}
      {helperText && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {helperText}
        </Typography>
      )}
      {renderContent()}
    </Box>
  );
});

// ============================================================================
// 独立组件
// ============================================================================

/**
 * 分组组件
 *
 * 用于将多个表单字段组织在一起
 *
 * @example
 * ```tsx
 * // Schema 配置
 * {
 *   name: 'personalInfo',
 *   component: 'Group',
 *   ui: {
 *     label: '个人信息',
 *     variant: 'card',
 *   },
 *   children: [
 *     { name: 'name', component: 'Text', ui: { label: '姓名' } },
 *     { name: 'age', component: 'Number', ui: { label: '年龄' } },
 *   ],
 * }
 * ```
 */
export const GroupWidget: React.FC<GroupWidgetProps> = (props) => {
  // GroupWidget 不需要 FieldAdapter，因为它本身不是一个表单字段
  // 它只是一个布局容器
  return <GroupWidgetRender {...(props as GroupWidgetRenderProps)} />;
};

export default GroupWidgetRender;

