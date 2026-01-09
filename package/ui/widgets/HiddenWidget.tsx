import React, { memo } from "react";
import { FieldAdapter, type WidgetProps } from "../FieldAdapter";

// ============================================================================
// Types
// ============================================================================

export type HiddenWidgetRenderProps = WidgetProps;

export type HiddenWidgetProps = {
  form: any;
  name: string;
  validate?: any;
};

// ============================================================================
// 纯渲染组件
// ============================================================================

/**
 * 隐藏字段渲染组件
 *
 * 渲染一个隐藏的 input 元素，用于存储不可见的表单数据
 */
export const HiddenWidgetRender = memo(function HiddenWidgetRender({
  value,
  onChange,
  name,
}: HiddenWidgetRenderProps) {
  return (
    <input
      type="hidden"
      name={name}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
});

// ============================================================================
// 独立组件 (带 FieldAdapter)
// ============================================================================

export const HiddenWidget: React.FC<HiddenWidgetProps> = ({
  form,
  name,
  validate,
}) => {
  return (
    <FieldAdapter
      form={form}
      name={name}
      validate={validate}
      render={(props: WidgetProps) => <HiddenWidgetRender {...props} />}
    />
  );
};

export default HiddenWidgetRender;

