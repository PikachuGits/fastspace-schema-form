/**
 * Next-Gen Schema Form (V4)
 *
 * 基于 TanStack Form 的声明式表单引擎
 *
 * @packageDocumentation
 */

// ============================================================================
// Core - Compiler
// ============================================================================
export {
  SchemaCompiler,
  schemaCompiler,
  createCompiler,
  type CompilerOptions,
} from "./core/compiler";

export { SafeEvaluator, safeEvaluator } from "./core/compiler/evaluator";

export {
  DependencyAnalyzer,
  dependencyAnalyzer,
  type StaticAnalysisReport,
  type AnalysisResult,
} from "./core/compiler/dependencyAnalyzer";

export {
  SchemaLinter,
  schemaLinter,
  lintSchema,
  type LintSeverity,
  type LintMessage,
  type LintResult,
  type LinterOptions,
} from "./core/compiler/schemaLinter";

// ============================================================================
// Core - Runtime
// ============================================================================
export { FormRuntime, type RuntimeConfig } from "./core/runtime/Runtime";

export {
  EffectSystem,
  type EffectSystemConfig,
  type EffectTrace,
  type FieldMeta,
} from "./core/runtime/EffectSystem";

export {
  AsyncScheduler,
  type AsyncSchedulerConfig,
} from "./core/runtime/AsyncScheduler";

// ============================================================================
// Core - Validation
// ============================================================================
export {
  valibotValidator,
  valibotFormValidator,
} from "./core/validation/valibotAdapter";

export {
  rulesToValibot,
  inferFieldType,
  createFieldValidator,
  type ValidationRule,
  type FieldType,
  type RulesAdapterOptions,
} from "./core/validation/rulesAdapter";

export {
  // 预设注册表
  createValidationRegistry,
  globalValidationRegistry,
  defaultRuleFactories,
  // 快捷函数
  presetToSchema,
  registerPresetRule,
  overridePresetRule,
  isPresetRulesArray,
  // 类型
  type RuleConfig,
  type RuleFactory,
  type PresetRuleName,
  type PresetRule,
  type ValidationPresetRegistry,
} from "./core/validation/presets";

// ============================================================================
// React Integration
// ============================================================================
export {
  useSchemaForm,
  type UseSchemaFormOptions,
  type UseSchemaFormReturn,
} from "./react/useSchemaForm";

export { SchemaFormProvider, useRuntime } from "./react/SchemaFormProvider";

export {
  useValidationPresets,
  useValidationPresetsContext,
  ValidationPresetsProvider,
  type UseValidationPresetsOptions,
  type UseValidationPresetsReturn,
  type ValidationPresetsProviderProps,
} from "./react/useValidationPresets";

// ============================================================================
// UI Components - SchemaForm & Renderer
// ============================================================================
export {
  SchemaForm,
  type SchemaFormProps,
  type SchemaFormInstance,
} from "./ui/SchemaForm";

export {
  SchemaRenderer,
  type SchemaRendererProps,
  type WidgetRegistry,
} from "./ui/SchemaRenderer";

export {
  FieldAdapter,
  createFieldAdapter,
  type FieldAdapterProps,
  type WidgetProps,
} from "./ui/FieldAdapter";

// ============================================================================
// UI Components - Layout
// ============================================================================
export { LayoutRenderer, type LayoutRendererProps } from "./ui/layout";
export {
  LayoutContext,
  useLayoutContext,
  type LayoutContextType,
} from "./ui/layout/LayoutContext";

// ============================================================================
// UI Components - Widgets
// ============================================================================
export {
  // Text
  TextWidget,
  TextWidgetRender,
  type TextWidgetProps,
  type TextWidgetRenderProps,
  // Number
  NumberWidget,
  NumberWidgetRender,
  type NumberWidgetProps,
  // Select
  SelectWidget,
  SelectWidgetRender,
  type SelectWidgetProps,
  type OptionItem,
  // Autocomplete
  AutocompleteWidget,
  AutocompleteWidgetRender,
  type AutocompleteWidgetProps,
  type AutocompleteWidgetRenderProps,
  type RemoteConfig,
  // Checkbox
  CheckboxWidget,
  CheckboxWidgetRender,
  type CheckboxWidgetProps,
  // Switch
  SwitchWidget,
  SwitchWidgetRender,
  type SwitchWidgetProps,
  // Radio
  RadioWidget,
  RadioWidgetRender,
  type RadioWidgetProps,
  // Date
  DateWidget,
  DateWidgetRender,
  type DateWidgetProps,
  // Time
  TimeWidget,
  TimeWidgetRender,
  type TimeWidgetProps,
  type TimeWidgetRenderProps,
  // DateTime
  DateTimeWidget,
  DateTimeWidgetRender,
  type DateTimeWidgetProps,
  type DateTimeWidgetRenderProps,
  // Slider
  SliderWidget,
  SliderWidgetRender,
  type SliderWidgetProps,
  type SliderWidgetRenderProps,
  // Rating
  RatingWidget,
  RatingWidgetRender,
  type RatingWidgetProps,
  type RatingWidgetRenderProps,
  // Hidden
  HiddenWidget,
  HiddenWidgetRender,
  type HiddenWidgetProps,
  type HiddenWidgetRenderProps,
  // Group
  GroupWidget,
  GroupWidgetRender,
  type GroupWidgetProps,
  type GroupWidgetRenderProps,
  // Custom
  CustomWidget,
  CustomWidgetRender,
  type CustomWidgetProps,
  type CustomWidgetRenderProps,
  // FormList
  FormListWidget,
  FormListWidgetRender,
  type FormListWidgetProps,
  type FormListWidgetRenderProps,
  // 公共模块
  compactFieldStyles,
  DATE_FORMAT,
  TIME_FORMAT,
  DATETIME_FORMAT,
  renderLabel,
  parseColSpan,
  // Widget 注册表
  defaultWidgets,
  getWidget,
  registerWidget,
  registerWidgets,
  getRegisteredWidgetTypes,
  type WidgetRenderFn,
} from "./ui/widgets";

// ============================================================================
// Types
// ============================================================================
export type {
  EvalScope,
  SchemaRule,
  SchemaMeta,
  FieldConfig,
  LayoutNode,
  CompiledSchema,
  SchemaInput,
  SchemaField,
  AsyncOptionsConfig,
} from "./types";
