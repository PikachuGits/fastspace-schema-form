import type { SchemaInput, SchemaField } from "../../types";
import { safeEvaluator } from "./evaluator";

// ============================================================================
// Types
// ============================================================================

export type LintSeverity = "error" | "warning" | "info";

export type LintMessage = {
  severity: LintSeverity;
  field?: string;
  rule?: string;
  message: string;
  suggestion?: string;
};

export type LintResult = {
  valid: boolean;
  messages: LintMessage[];
  errors: LintMessage[];
  warnings: LintMessage[];
};

export type LinterOptions = {
  /** 是否检查未使用的字段 */
  checkUnusedFields?: boolean;
  /** 是否检查表达式语法 */
  checkExpressions?: boolean;
  /** 是否检查组件类型 */
  checkComponentTypes?: boolean;
  /** 已知的组件类型列表 */
  knownComponents?: string[];
};

// ============================================================================
// 默认已知组件
// ============================================================================

const DEFAULT_KNOWN_COMPONENTS = [
  "Text",
  "Number",
  "Password",
  "Textarea",
  "Select",
  "Autocomplete",
  "Checkbox",
  "Switch",
  "Radio",
  "Slider",
  "Rating",
  "Date",
  "Time",
  "DateTime",
  "Upload",
  "Hidden",
  "Custom",
  "Group",
  "FormList",
];

// ============================================================================
// SchemaLinter
// ============================================================================

/**
 * Schema 校验器
 *
 * 在编译时检测 Schema 中的问题
 */
export class SchemaLinter {
  private options: Required<LinterOptions>;

  constructor(options: LinterOptions = {}) {
    this.options = {
      checkUnusedFields: options.checkUnusedFields ?? true,
      checkExpressions: options.checkExpressions ?? true,
      checkComponentTypes: options.checkComponentTypes ?? true,
      knownComponents: options.knownComponents ?? DEFAULT_KNOWN_COMPONENTS,
    };
  }

  /**
   * 校验 Schema
   */
  lint(schema: SchemaInput): LintResult {
    const messages: LintMessage[] = [];

    // 收集所有字段名
    const allFieldNames = new Set<string>();
    const referencedFields = new Set<string>();

    // 遍历字段
    this.lintFields(schema.fields, messages, allFieldNames, referencedFields, "");

    // 检查未使用的字段 (仅警告)
    if (this.options.checkUnusedFields) {
      for (const fieldName of allFieldNames) {
        if (!referencedFields.has(fieldName)) {
          // 这个检查意义不大，因为大部分字段都是独立的，跳过
        }
      }
    }

    // 检查版本信息
    if (schema.meta) {
      if (schema.meta.version && !/^\d+\.\d+\.\d+/.test(schema.meta.version)) {
        messages.push({
          severity: "warning",
          message: `Invalid version format: "${schema.meta.version}". Expected SemVer format (e.g., "1.0.0")`,
          suggestion: 'Use SemVer format like "1.0.0"',
        });
      }
    }

    // 分类消息
    const errors = messages.filter((m) => m.severity === "error");
    const warnings = messages.filter((m) => m.severity === "warning");

    return {
      valid: errors.length === 0,
      messages,
      errors,
      warnings,
    };
  }

  /**
   * 递归校验字段
   */
  private lintFields(
    fields: SchemaField[],
    messages: LintMessage[],
    allFieldNames: Set<string>,
    referencedFields: Set<string>,
    parentPath: string
  ): void {
    const seenNames = new Set<string>();

    for (const field of fields) {
      const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name;

      // 检查字段名
      if (!field.name && field.component !== "Grid" && field.component !== "Stack") {
        messages.push({
          severity: "error",
          field: fieldPath || "(unnamed)",
          message: "Field name is required",
          suggestion: "Add a unique name to the field",
        });
      } else if (field.name) {
        // 检查重复名称
        if (seenNames.has(field.name)) {
          messages.push({
            severity: "error",
            field: fieldPath,
            message: `Duplicate field name: "${field.name}"`,
            suggestion: "Use unique field names",
          });
        }
        seenNames.add(field.name);
        allFieldNames.add(fieldPath);
      }

      // 检查组件类型
      if (this.options.checkComponentTypes) {
        if (!this.options.knownComponents.includes(field.component)) {
          messages.push({
            severity: "warning",
            field: fieldPath,
            message: `Unknown component type: "${field.component}"`,
            suggestion: `Known types: ${this.options.knownComponents.join(", ")}`,
          });
        }
      }

      // 检查表达式
      if (this.options.checkExpressions) {
        this.lintExpression(field.visibleWhen, "visibleWhen", fieldPath, messages, referencedFields);
        this.lintExpression(field.disabledWhen, "disabledWhen", fieldPath, messages, referencedFields);
        this.lintExpression(field.requiredWhen, "requiredWhen", fieldPath, messages, referencedFields);
        this.lintExpression(field.compute, "compute", fieldPath, messages, referencedFields);
      }

      // 检查 Select/Radio 等需要 options 的组件
      if (["Select", "Radio", "Autocomplete"].includes(field.component)) {
        if (!field.options && !field.ui?.options && !field.ui?.optionRequest) {
          messages.push({
            severity: "warning",
            field: fieldPath,
            message: `${field.component} component should have options defined`,
            suggestion: "Add options array or optionRequest function",
          });
        }
      }

      // 检查 FormList 必须有 columns
      if (field.component === "FormList") {
        if (!field.children || field.children.length === 0) {
          messages.push({
            severity: "error",
            field: fieldPath,
            message: "FormList must have children (columns) defined",
            suggestion: "Add children array with field definitions",
          });
        }
      }

      // 检查 Group 必须有 columns
      if (field.component === "Group") {
        if (!field.children || field.children.length === 0) {
          messages.push({
            severity: "warning",
            field: fieldPath,
            message: "Group should have children defined",
            suggestion: "Add children array with field definitions",
          });
        }
      }

      // 递归检查子字段
      if (field.children && field.children.length > 0) {
        this.lintFields(field.children, messages, allFieldNames, referencedFields, fieldPath);
      }
    }
  }

  /**
   * 校验表达式
   */
  private lintExpression(
    expr: string | ((...args: any[]) => any) | undefined,
    ruleName: string,
    fieldPath: string,
    messages: LintMessage[],
    referencedFields: Set<string>
  ): void {
    if (!expr) return;

    if (typeof expr === "function") {
      messages.push({
        severity: "info",
        field: fieldPath,
        rule: ruleName,
        message: `${ruleName} uses function - dependencies cannot be statically analyzed`,
        suggestion: "Consider using string expression for better static analysis",
      });
      return;
    }

    if (typeof expr === "string") {
      // 验证表达式语法
      const validation = safeEvaluator.validate(expr);
      if (!validation.valid) {
        messages.push({
          severity: "error",
          field: fieldPath,
          rule: ruleName,
          message: `Invalid expression: ${validation.error}`,
          suggestion: "Fix the expression syntax",
        });
        return;
      }

      // 提取依赖
      const deps = safeEvaluator.extractDependencies(expr);
      for (const dep of deps) {
        referencedFields.add(dep);
      }

      // 检查自引用
      const fieldName = fieldPath.split(".").pop();
      if (ruleName === "compute" && deps.includes(fieldName || "")) {
        messages.push({
          severity: "warning",
          field: fieldPath,
          rule: ruleName,
          message: `Potential self-reference in compute expression`,
          suggestion: "Avoid referencing the same field in its own compute expression",
        });
      }
    }
  }
}

/**
 * 默认 Linter 实例
 */
export const schemaLinter = new SchemaLinter();

/**
 * 快捷校验函数
 */
export function lintSchema(
  schema: SchemaInput,
  options?: LinterOptions
): LintResult {
  const linter = options ? new SchemaLinter(options) : schemaLinter;
  return linter.lint(schema);
}

