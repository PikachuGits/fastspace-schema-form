import type { ReactNode } from "react";

/**
 * 渲染带必填星号的 Label
 * 星号位于 Label 前面，放大并居中
 */
export const renderLabel = (label: ReactNode, required?: boolean) => {
  if (!required) return label;

  return (
    <span style={{ display: "flex", alignItems: "center" }}>
      <span
        style={{
          color: "#d32f2f",
          marginRight: "4px",
          fontSize: "20px",
          fontWeight: "bold",
          lineHeight: "1",
          paddingTop: "4px",
        }}
      >
        *
      </span>
      {label}
    </span>
  );
};
