/**
 * Next-Gen Schema Form Widgets (V4)
 *
 * 基于 MUI 的表单组件库
 */

import type { WidgetProps } from "../FieldAdapter";

// ============================================================================
// 组件导出
// ============================================================================

// 文本输入
export {
  TextWidget,
  TextWidgetRender,
  type TextWidgetProps,
  type TextWidgetRenderProps,
} from "./TextWidget";

// 密码输入
export {
  PasswordWidget,
  PasswordWidgetRender,
  type PasswordWidgetProps,
  type PasswordWidgetRenderProps,
} from "./PasswordWidget";

// 多行文本
export {
  TextareaWidget,
  TextareaWidgetRender,
  type TextareaWidgetProps,
  type TextareaWidgetRenderProps,
} from "./TextareaWidget";

// 数字输入
export {
  NumberWidget,
  NumberWidgetRender,
  type NumberWidgetProps,
} from "./NumberWidget";

// 下拉选择
export {
  SelectWidget,
  SelectWidgetRender,
  type SelectWidgetProps,
  type SelectWidgetRenderProps,
  type OptionItem,
  type ButtonConfig as SelectButtonConfig,
  type SuffixButtonRender as SelectSuffixButtonRender,
} from "./SelectWidget";

// 复选框
export {
  CheckboxWidget,
  CheckboxWidgetRender,
  type CheckboxWidgetProps,
} from "./CheckboxWidget";

// 开关
export {
  SwitchWidget,
  SwitchWidgetRender,
  type SwitchWidgetProps,
} from "./SwitchWidget";

// 单选按钮组
export {
  RadioWidget,
  RadioWidgetRender,
  type RadioWidgetProps,
} from "./RadioWidget";

// 日期选择
export {
  DateWidget,
  DateWidgetRender,
  type DateWidgetProps,
} from "./DateWidget";

// 时间选择
export {
  TimeWidget,
  TimeWidgetRender,
  type TimeWidgetProps,
  type TimeWidgetRenderProps,
} from "./TimeWidget";

// 日期时间选择
export {
  DateTimeWidget,
  DateTimeWidgetRender,
  type DateTimeWidgetProps,
  type DateTimeWidgetRenderProps,
} from "./DateTimeWidget";

// 滑块
export {
  SliderWidget,
  SliderWidgetRender,
  type SliderWidgetProps,
  type SliderWidgetRenderProps,
} from "./SliderWidget";

// 评分
export {
  RatingWidget,
  RatingWidgetRender,
  type RatingWidgetProps,
  type RatingWidgetRenderProps,
} from "./RatingWidget";

// 隐藏字段
export {
  HiddenWidget,
  HiddenWidgetRender,
  type HiddenWidgetProps,
  type HiddenWidgetRenderProps,
} from "./HiddenWidget";

// 分组
export {
  GroupWidget,
  GroupWidgetRender,
  type GroupWidgetProps,
  type GroupWidgetRenderProps,
} from "./GroupWidget";

// 自定义组件
export {
  CustomWidget,
  CustomWidgetRender,
  type CustomWidgetProps,
  type CustomWidgetRenderProps,
} from "./CustomWidget";

// 列表 (FormList)
export {
  FormListWidget,
  FormListWidgetRender,
  type FormListWidgetRenderProps,
  type FormListWidgetProps,
} from "./FormListWidget";

// 自动完成
export {
  AutocompleteWidget,
  AutocompleteWidgetRender,
  type AutocompleteWidgetProps,
  type AutocompleteWidgetRenderProps,
  type OptionItem as AutocompleteOptionItem,
  type RemoteConfig,
  type ButtonConfig as AutocompleteButtonConfig,
  type SuffixButtonRender as AutocompleteSuffixButtonRender,
  type SearchClearConfig,
  type OnAddOptionSuccess,
} from "./AutocompleteWidget";

// ============================================================================
// 公共模块
// ============================================================================

// 样式系统
export {
  // 样式常量
  FIELD_HEIGHT,
  FONT_SIZE,
  SPACING,
  // 预定义样式
  compactFieldStyles,
  formControlStyles,
  inlineLayoutStyles,
  labeledControlStyles,
  // 日期格式
  DATE_FORMAT,
  TIME_FORMAT,
  DATETIME_FORMAT,
  // 主题配置
  defaultWidgetTheme,
  createWidgetStyles,
  type WidgetThemeConfig,
} from "./styles";

export { renderLabel, parseColSpan } from "./utils";

// ============================================================================
// Widget 注册表
// ============================================================================

import { TextWidgetRender } from "./TextWidget";
import { PasswordWidgetRender } from "./PasswordWidget";
import { TextareaWidgetRender } from "./TextareaWidget";
import { NumberWidgetRender } from "./NumberWidget";
import { SelectWidgetRender } from "./SelectWidget";
import { CheckboxWidgetRender } from "./CheckboxWidget";
import { SwitchWidgetRender } from "./SwitchWidget";
import { RadioWidgetRender } from "./RadioWidget";
import { DateWidgetRender } from "./DateWidget";
import { TimeWidgetRender } from "./TimeWidget";
import { DateTimeWidgetRender } from "./DateTimeWidget";
import { SliderWidgetRender } from "./SliderWidget";
import { RatingWidgetRender } from "./RatingWidget";
import { HiddenWidgetRender } from "./HiddenWidget";
import { GroupWidgetRender } from "./GroupWidget";
import { CustomWidgetRender } from "./CustomWidget";
import { FormListWidgetRender } from "./FormListWidget";
import { AutocompleteWidgetRender } from "./AutocompleteWidget";

/**
 * Widget 渲染函数类型
 * 接收 WidgetProps 和额外的 UI 属性
 */
export type WidgetRenderFn = React.ComponentType<
  WidgetProps & Record<string, any>
>;

/**
 * 默认 Widget 映射表
 * 用于根据 component 类型自动选择对应的 Widget
 *
 * 使用 *Render 版本的组件 (纯渲染函数)，接收 WidgetProps
 */
export const defaultWidgets: Record<string, WidgetRenderFn> = {
  // 文本类
  Text: TextWidgetRender,
  Password: PasswordWidgetRender,
  Textarea: TextareaWidgetRender,

  // 数值类
  Number: NumberWidgetRender,
  Slider: SliderWidgetRender,
  Rating: RatingWidgetRender,

  // 选择类
  Select: SelectWidgetRender,
  Autocomplete: AutocompleteWidgetRender,
  Radio: RadioWidgetRender,

  // 布尔类
  Checkbox: CheckboxWidgetRender,
  Switch: SwitchWidgetRender,

  // 日期时间类
  Date: DateWidgetRender,
  Time: TimeWidgetRender,
  DateTime: DateTimeWidgetRender,

  // 列表/组合类
  FormList: FormListWidgetRender,
  Group: GroupWidgetRender,

  // 特殊类型
  Hidden: HiddenWidgetRender,
  Custom: CustomWidgetRender,
};

/**
 * 获取 Widget 组件
 */
export function getWidget(type: string): WidgetRenderFn | undefined {
  return defaultWidgets[type];
}

/**
 * 注册自定义 Widget
 */
export function registerWidget(type: string, widget: WidgetRenderFn): void {
  defaultWidgets[type] = widget;
}

/**
 * 批量注册 Widget
 */
export function registerWidgets(
  widgets: Record<string, WidgetRenderFn>
): void {
  Object.assign(defaultWidgets, widgets);
}

/**
 * 获取所有已注册的 Widget 类型
 */
export function getRegisteredWidgetTypes(): string[] {
  return Object.keys(defaultWidgets);
}
