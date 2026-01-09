/**
 * Schema Form 内置 Widget 组件
 *
 * 统一接口：
 * - field: RHF Controller 字段对象
 * - label: 标签文本
 * - error: 是否有错误
 * - helperText: 帮助/错误文本
 * - options: 选项数组（用于 Select 等）
 * - fieldProps: 透传属性
 * - form: 表单实例
 * - schema: 字段 Schema（用于 Group/FormList）
 * - widgets: Widget 映射（用于嵌套渲染）
 */

import type { WidgetComponent } from '../../types';

// 导入所有 Widget 组件
export { AutocompleteWidget } from './AutocompleteWidget';
export { CheckboxWidget } from './CheckboxWidget';
export { CustomWidget } from './CustomWidget';
export { DateTimeWidget } from './DateTimeWidget';
export { DateWidget } from './DateWidget';
export { FormListWidget } from './FormListWidget';
export { GroupWidget } from './GroupWidget';
export { HiddenWidget } from './HiddenWidget';
export { NumberWidget } from './NumberWidget';
export { PasswordWidget } from './PasswordWidget';
export { RadioWidget } from './RadioWidget';
export { RatingWidget } from './RatingWidget';
export { SliderWidget } from './SliderWidget';
/** @deprecated Select 已合并到 AutocompleteWidget，保留导出以兼容旧代码 */
export { AutocompleteWidget as SelectWidget } from './AutocompleteWidget';
export { SwitchWidget } from './SwitchWidget';
export { TextareaWidget } from './TextareaWidget';
export { TextWidget } from './TextWidget';
export { TimeWidget } from './TimeWidget';

// 导出样式
export { compactFieldStyles, DATE_FORMAT, DATETIME_FORMAT } from './styles';

// 导入用于构建默认映射
import { AutocompleteWidget } from './AutocompleteWidget';
import { CheckboxWidget } from './CheckboxWidget';
import { CustomWidget } from './CustomWidget';
import { DateTimeWidget } from './DateTimeWidget';
import { DateWidget } from './DateWidget';
import { FormListWidget } from './FormListWidget';
import { GroupWidget } from './GroupWidget';
import { HiddenWidget } from './HiddenWidget';
import { NumberWidget } from './NumberWidget';
import { PasswordWidget } from './PasswordWidget';
import { RadioWidget } from './RadioWidget';
import { RatingWidget } from './RatingWidget';
import { SliderWidget } from './SliderWidget';
import { SwitchWidget } from './SwitchWidget';
import { TextareaWidget } from './TextareaWidget';
import { TextWidget } from './TextWidget';
import { TimeWidget } from './TimeWidget';

/**
 * 默认 Widget 映射表
 */
export const defaultWidgets: Record<string, WidgetComponent> = {
  // 标准大小写
  Hidden: HiddenWidget,
  Text: TextWidget,
  Password: PasswordWidget,
  Number: NumberWidget,
  Textarea: TextareaWidget,
  Select: AutocompleteWidget, // Select 和 Autocomplete 统一使用 AutocompleteWidget
  Autocomplete: AutocompleteWidget,
  Checkbox: CheckboxWidget,
  Switch: SwitchWidget,
  Radio: RadioWidget,
  Slider: SliderWidget,
  Rating: RatingWidget,
  Date: DateWidget,
  Time: TimeWidget,
  DateTime: DateTimeWidget,
  Custom: CustomWidget,
  Group: GroupWidget,
  FormList: FormListWidget,
  // 兼容小写
  hidden: HiddenWidget,
  text: TextWidget,
  password: PasswordWidget,
  number: NumberWidget,
  textarea: TextareaWidget,
  select: AutocompleteWidget, // select 和 autocomplete 统一使用 AutocompleteWidget
  autocomplete: AutocompleteWidget,
  checkbox: CheckboxWidget,
  switch: SwitchWidget,
  radio: RadioWidget,
  slider: SliderWidget,
  rating: RatingWidget,
  date: DateWidget,
  time: TimeWidget,
  datetime: DateTimeWidget,
  custom: CustomWidget,
  group: GroupWidget,
  formList: FormListWidget,
  formlist: FormListWidget,
};
