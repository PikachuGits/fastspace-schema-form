import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";

export interface StackLayoutProps {
  /** 间距 */
  spacing?: number;
  /** 子元素 */
  children: ReactNode;
}

/**
 * Stack 布局组件
 * 使用 MUI Stack 实现垂直堆叠布局
 */
export const StackLayout = ({ spacing = 2, children }: StackLayoutProps) => (
  <Stack spacing={spacing}>{children}</Stack>
);

