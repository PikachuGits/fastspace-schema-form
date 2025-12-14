import type { GridSize } from '@mui/material/Grid';
import type { ControllerRenderProps, FieldValues, Path, UseFormReturn } from 'react-hook-form';

// ============================================================================
// 验证规则类型 - 集成到 Schema 中
// ============================================================================

/** 基础验证规则 */
export type ValidationRule =
  | { type: 'required'; message?: string }
  | { type: 'minLength'; value: number; message?: string }
  | { type: 'maxLength'; value: number; message?: string }
  | { type: 'min'; value: number; message?: string }
  | { type: 'max'; value: number; message?: string }
  | { type: 'pattern'; value: string | RegExp; message?: string }
  | { type: 'email'; message?: string }
  | { type: 'url'; message?: string }
  | {
    type: 'custom';
    validate: (value: unknown, values: unknown) => boolean | string;
  }
  | { type: 'array'; minItems?: number; maxItems?: number; message?: string };

// ============================================================================
// 条件表达式类型 - 用于 visibleWhen / disabledWhen / requiredWhen
// ============================================================================

/** 简单条件：单字段比较 */
export type SimpleCondition = {
  field: string;
  eq?: unknown; // 等于
  ne?: unknown; // 不等于
  gt?: number; // 大于
  gte?: number; // 大于等于
  lt?: number; // 小于
  lte?: number; // 小于等于
  in?: unknown[]; // 在数组中
  notIn?: unknown[]; // 不在数组中
  empty?: boolean; // 是否为空
  notEmpty?: boolean; // 是否非空
};

/** 复合条件：支持逻辑运算 */
export type CompoundCondition =
  | { and: ConditionExpression[] }
  | { or: ConditionExpression[] }
  | { not: ConditionExpression };

/** 条件表达式：简单或复合或函数 */
export type ConditionExpression =
  | SimpleCondition
  | CompoundCondition
  | ((values: Record<string, unknown>) => boolean);

// ============================================================================
// 计算表达式类型 - 用于 compute
// ============================================================================

/** 计算配置 */
export type ComputeConfig = {
  /** 表达式字符串，如 "price * quantity" */
  expr: string;
  /** 依赖字段（可选，自动从 expr 解析） */
  dependencies?: string[];
  /** 小数精度（可选，默认为不处理） */
  precision?: number;
  /** 舍入模式（可选，默认为 'round' 四舍五入） */
  roundMode?: 'round' | 'ceil' | 'floor';
};

// ============================================================================
// 选项类型
// ============================================================================

export type OptionItem = {
  label: string;
  value: string | number | boolean | null;
  disabled?: boolean;
  [key: string]: unknown;
};

/** 远程加载配置 (分页/搜索) */
export type RemoteConfig = {
  /** 获取数据的函数 */
  fetchOptions: (
    keyword: string,
    page: number,
    pageSize: number
  ) => Promise<{
    data: OptionItem[];
    total: number;
    hasMore: boolean;
  }>;
  /** 每页条数 */
  pageSize?: number;
  /** 搜索防抖时间 (ms) */
  debounceTimeout?: number;
  /** 最小搜索字符数 */
  minSearchLength?: number;
  /** 加载状态回调 */
  onLoadingChange?: (loading: boolean) => void;
  /** 根据 ID 获取选项 (用于回显) */
  fetchById?: (value: string | number) => Promise<OptionItem | null>;
};

// ============================================================================
// 字段 Schema 类型
// ============================================================================

/** 支持的组件类型 */
export type ComponentType =
  | 'Text'
  | 'Number'
  | 'Password'
  | 'Textarea'
  | 'Select'
  | 'Autocomplete'
  | 'Checkbox'
  | 'Switch'
  | 'Radio'
  | 'Slider'
  | 'Rating'
  | 'Date'
  | 'Time'
  | 'DateTime'
  | 'Upload'
  | 'Hidden'
  | 'Custom'
  | 'Group'
  | 'FormList';

/** 字段 Schema 定义 */
export type FieldSchema<T extends FieldValues = FieldValues> = {
  /** 字段名（对应表单数据的 key） */
  name: Path<T>;

  /** 组件类型 */
  component: ComponentType | string;

  /** 默认值 */
  defaultValue?: unknown;

  // ============ UI 配置 ============
  ui?: {
    /** 标签 */
    label?: string;
    /** 占位符 */
    placeholder?: string;
    /** 帮助文本 */
    helperText?: string;
    /** 提示信息 */
    tooltip?: string;
    /** 选项（用于 Select/Radio 等） */
    options?: OptionItem[];
    /** 异步获取选项 */
    optionRequest?: (values: T) => Promise<OptionItem[]>;
    /** 远程搜索/分页配置 (Autocomplete 专用) */
    remoteConfig?: RemoteConfig;
    /** 组件透传属性 */
    props?: Record<string, unknown>;
  };

  // ============ 布局配置 ============
  /** 列跨度（基于 MUI Grid），支持响应式 */
  colSpan?:
  | GridSize
  | {
    xs?: GridSize;
    sm?: GridSize;
    md?: GridSize;
    lg?: GridSize;
    xl?: GridSize;
  };

  /** 强制从新行开始 */
  newLine?: boolean;

  // ============ 嵌套字段（用于 Group/FormList） ============
  /** 子字段定义 */
  columns?: FieldSchema<T>[];

  // ============ FormList 特有配置 ============
  /** 最小行数 */
  minItems?: number;
  /** 最大行数 */
  maxItems?: number;
  /** 添加按钮文案 */
  addText?: string;
  /** 是否可拖拽排序 */
  sortable?: boolean;
  /** 是否可复制 */
  copyable?: boolean;

  // ============ 验证规则 - 集成到 Schema ============
  /** 验证规则数组 */
  rules?: ValidationRule[];

  // ============ 条件控制 ============
  /** 条件显示 */
  visibleWhen?: ConditionExpression;
  /** 条件禁用 */
  disabledWhen?: ConditionExpression;
  /** 条件必填 */
  requiredWhen?: ConditionExpression;

  // ============ 静态状态 ============
  /** 只读 */
  readonly?: boolean;
  /** 禁用 */
  disabled?: boolean;
  /** 隐藏（不渲染） */
  hidden?: boolean;

  // ============ 计算字段 ============
  /** 自动计算配置 */
  compute?: ComputeConfig;

  // ============ 数据处理 ============
  /** 提交前转换 */
  transform?: (value: unknown, values: T) => unknown;
  /** 不参与提交 */
  noSubmit?: boolean;

  // ============ 依赖配置 ============
  /** 依赖字段（用于触发重新计算/校验） */
  dependencies?: string[];
};

// ============================================================================
// 布局配置类型
// ============================================================================

export type LayoutConfig = {
  /** 布局类型 */
  type: 'grid' | 'stack';
  /** 列数（仅 grid） */
  columns?: number;
  /** 区域定义（CSS Grid Area 风格） */
  areas?: string[][];
  /** 间距 */
  spacing?: number;
};

// ============================================================================
// Schema 输入类型（顶层）
// ============================================================================

export type SchemaInput<T extends FieldValues = FieldValues> = {
  /** 字段定义 */
  fields: FieldSchema<T>[];
  /** 布局配置（可选，默认使用 colSpan 响应式布局） */
  layout?: LayoutConfig;
};

// ============================================================================
// 解析后的 Schema 类型（内部使用）
// ============================================================================

export type ParsedSchema<T extends FieldValues = FieldValues> = {
  /** 原始输入 */
  input: SchemaInput<T>;
  /** 字段索引（name -> FieldSchema） */
  fieldMap: Map<string, FieldSchema<T>>;
  /** 依赖图（field -> dependents） */
  dependencyGraph: Map<string, Set<string>>;
  /** 默认值 */
  defaultValues: Partial<T>;
  /** 扁平化的所有字段列表 (包含嵌套字段) */
  allFields: FieldSchema<T>[];
};

// ============================================================================
// Widget Props 类型
// ============================================================================

export type WidgetProps<T extends FieldValues = FieldValues> = {
  /** React Hook Form 字段对象 */
  field: ControllerRenderProps<T>;
  /** 标签 */
  label?: string;
  /** 是否有错误 */
  error?: boolean;
  /** 帮助/错误文本 */
  helperText?: React.ReactNode;
  /** 选项（用于 Select 等） */
  options?: OptionItem[];
  /** 透传属性 */
  fieldProps?: Record<string, unknown> & {
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
  };
  /** 表单实例 */
  form?: UseFormReturn<T>;
  /** 字段 Schema（用于 Group/FormList） */
  schema?: FieldSchema<T>;
  /** Widget 映射（用于嵌套渲染） */
  widgets?: Record<string, WidgetComponent<T>>;
  /** 选项映射（用于嵌套渲染） */
  optionsMap?: Record<string, OptionItem[]>;
  /** 全局禁用 */
  globalDisabled?: boolean;
  /** 全局只读 */
  globalReadOnly?: boolean;
  /** 当前表单值 (优化) */
  values?: Record<string, unknown>;
};

/** Widget 组件类型 */
export type WidgetComponent<T extends FieldValues = FieldValues> = React.ComponentType<WidgetProps<T>>;

// ============================================================================
// 表单实例类型（Ref）
// ============================================================================

export type SchemaFormInstance<T extends FieldValues = FieldValues> = UseFormReturn<T> & {
  /** 提交表单 */
  submit: () => Promise<void> | boolean;
  /** 获取表单值（排除 noSubmit 字段） */
  getFormValues: () => Partial<T>;
  /** 批量设置值 */
  setValues: (values: Partial<T>) => void;
};

// ============================================================================
// SchemaForm Props 类型
// ============================================================================

export type SchemaFormProps<T extends FieldValues = FieldValues> = {
  /** Schema 定义 */
  schema: SchemaInput<T>;
  /** 默认值 */
  defaultValues?: Partial<T>;
  /** 提交回调 */
  onSubmit?: (values: T) => void | Promise<void | boolean>;
  /** 值变化回调 */
  onValuesChange?: (values: T) => void;
  /** 是否使用 Grid 布局 */
  grid?: boolean;
  /** 全局只读 */
  readOnly?: boolean;
  /** 全局禁用 */
  disabled?: boolean;
  /** 自定义控件 */
  widgets?: Record<string, WidgetComponent<T>>;
  /** 子元素 */
  children?: React.ReactNode;
  /** 间距 */
  spacing?: number;
};
