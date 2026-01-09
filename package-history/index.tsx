// ============================================================================
// Schema Form - 核心导出
// ============================================================================

export type { FieldState, FieldStatesMap } from "./core";
// 核心工具
export {
  buildValibotSchema,
  computeAllFieldStates,
  computeFieldState,
  createDynamicResolver,
  evaluateCondition,
  extractDependencies,
  getDownstreamFields,
  getWatchFields,
  mergeDefaultValues,
  parseSchema,
} from "./core";

// 类型导出
export type {
  ComponentType,
  CompoundCondition,
  // 计算配置
  ComputeConfig,
  // 条件表达式
  ConditionExpression,
  FieldSchema,
  LayoutConfig,
  // 选项
  OptionItem,
  ParsedSchema,
  // 表单实例
  SchemaFormInstance,
  // Schema 类型
  SchemaInput,
  SimpleCondition,
  // 验证规则
  ValidationRule,
  WidgetComponent,
  // Widget 类型
  WidgetProps,
} from "./types";

// 主组件
export { SchemaForm } from "./ui/SchemaForm";
// 布局组件
export { GridLayout, StackLayout } from "./ui/layout";
export type { GridLayoutProps, StackLayoutProps } from "./ui/layout";

// 字段渲染组件
export { FieldRenderer } from "./ui/components";
export type { FieldRendererProps } from "./ui/components";

// Widgets
export {
  AutocompleteWidget,
  CheckboxWidget,
  compactFieldStyles,
  CustomWidget,
  DATE_FORMAT,
  DATETIME_FORMAT,
  DateTimeWidget,
  DateWidget,
  defaultWidgets,
  FormListWidget,
  GroupWidget,
  HiddenWidget,
  NumberWidget,
  PasswordWidget,
  RadioWidget,
  RatingWidget,
  SelectWidget,
  SliderWidget,
  SwitchWidget,
  TextareaWidget,
  TextWidget,
  TimeWidget,
} from "./ui/widgets";
