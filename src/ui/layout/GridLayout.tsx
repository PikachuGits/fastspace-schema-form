import Grid from "@mui/material/Grid";
import type { ReactNode } from "react";

export interface GridLayoutProps {
  /** 间距 */
  spacing?: number;
  /** 子元素 */
  children: ReactNode;
}

/**
 * Grid 布局组件
 * 使用 MUI Grid 实现响应式网格布局
 */
export const GridLayout = ({ spacing = 2, children }: GridLayoutProps) => (
  <Grid container spacing={spacing}>
    {children}
  </Grid>
);

