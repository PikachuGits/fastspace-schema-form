import { Box } from "@mui/material";
import type { ReactNode } from "react";

/**
 * 渲染带必填标识的标签
 *
 * @param label - 标签文本
 * @param required - 是否必填
 * @returns 带星号标识的标签
 */
export const renderLabel = (label: ReactNode, required?: boolean) => {
  if (!required) return label;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        "&::before": {
          content: '"✱"',
          color: "error.main",
          mr: "4px",
          fontSize: "0.5em",
          alignSelf: "center",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      {label}
    </Box>
  );
};

/**
 * 解析 colSpan 为 Grid size props
 */
export function parseColSpan(
  colSpan?: number | Record<string, number>
): Record<string, number> {
  if (!colSpan) {
    return { xs: 12 };
  }

  // 如果是响应式对象
  if (
    typeof colSpan === "object" &&
    ("xs" in colSpan || "sm" in colSpan || "md" in colSpan)
  ) {
    return colSpan;
  }

  // 简单值
  return { xs: colSpan as number };
}

