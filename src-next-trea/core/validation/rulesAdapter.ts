/**
 * 验证规则适配器
 *
 * 将声明式验证规则转换为 Valibot schema
 * 提供从老版本规则配置平滑迁移的能力
 */

import * as v from "valibot";

// ============================================================================
// Types
// ============================================================================

/** 基础验证规则 */
export type ValidationRule =
  | { type: "required"; message?: string }
  | { type: "minLength"; value: number; message?: string }
  | { type: "maxLength"; value: number; message?: string }
  | { type: "min"; value: number; message?: string }
  | { type: "max"; value: number; message?: string }
  | { type: "pattern"; value: string | RegExp; message?: string }
  | { type: "email"; message?: string }
  | { type: "url"; message?: string }
  | {
      type: "custom";
      validate: (value: unknown, values: unknown) => boolean | string;
    }
  | { type: "array"; minItems?: number; maxItems?: number; message?: string };

/** 字段类型 */
export type FieldType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "array"
  | "date"
  | "unknown";

/** 规则适配器选项 */
export type RulesAdapterOptions = {
  /** 字段标签（用于默认错误消息） */
  label?: string;
  /** 字段类型 */
  fieldType?: FieldType;
  /** 当前表单值（用于 custom 规则） */
  values?: Record<string, unknown>;
};

// ============================================================================
// Helpers
// ============================================================================

/** 判断值是否为空 */
function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * 将声明式验证规则转换为 Valibot schema
 *
 * @example
 * ```tsx
 * const schema = rulesToValibot([
 *   { type: 'required', message: '必填' },
 *   { type: 'minLength', value: 3, message: '至少3个字符' },
 *   { type: 'email' },
 * ], { label: '邮箱', fieldType: 'text' });
 * ```
 */
export function rulesToValibot(
  rules: ValidationRule[],
  options: RulesAdapterOptions = {}
): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> {
  const { label = "该字段", fieldType = "unknown", values = {} } = options;
  const pipes: v.PipeItem<any, any, v.BaseIssue<unknown>>[] = [];

  // 检查是否有 required 规则
  const requiredRule = rules.find((r) => r.type === "required");
  const isRequired = !!requiredRule;
  const requiredMessage = requiredRule?.message ?? `${label}不能为空`;

  // 根据字段类型确定基础 schema
  let baseSchema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;

  switch (fieldType) {
    case "text":
    case "date":
      baseSchema = v.union([v.string(), v.undefined_(), v.null_()]);
      break;
    case "number":
      baseSchema = v.union([
        v.number(),
        v.undefined_(),
        v.null_(),
        v.pipe(v.string(), v.transform(Number), v.number()),
      ]);
      break;
    case "boolean":
      baseSchema = v.union([v.boolean(), v.undefined_(), v.null_()]);
      break;
    case "select":
      baseSchema = v.union([
        v.string(),
        v.number(),
        v.boolean(),
        v.undefined_(),
        v.null_(),
        v.array(v.unknown()),
      ]);
      break;
    case "array":
      baseSchema = v.union([v.array(v.unknown()), v.undefined_(), v.null_()]);
      break;
    default:
      baseSchema = v.unknown();
  }

  // 必填校验
  if (isRequired) {
    if (fieldType === "boolean") {
      pipes.push(v.check((val) => val === true, requiredMessage));
    } else if (fieldType === "array") {
      pipes.push(
        v.check(
          (val) => Array.isArray(val) && val.length > 0,
          requiredMessage
        )
      );
    } else {
      pipes.push(v.check((val) => !isEmpty(val), requiredMessage));
    }
  }

  // 处理其他规则
  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        // 已在上面处理
        break;

      case "minLength":
        pipes.push(
          v.check(
            (val) =>
              isEmpty(val) || String(val).length >= rule.value,
            rule.message ?? `${label}至少${rule.value}个字符`
          )
        );
        break;

      case "maxLength":
        pipes.push(
          v.check(
            (val) =>
              isEmpty(val) || String(val).length <= rule.value,
            rule.message ?? `${label}最多${rule.value}个字符`
          )
        );
        break;

      case "min":
        pipes.push(
          v.check(
            (val) =>
              isEmpty(val) || Number(val) >= rule.value,
            rule.message ?? `${label}不能小于${rule.value}`
          )
        );
        break;

      case "max":
        pipes.push(
          v.check(
            (val) =>
              isEmpty(val) || Number(val) <= rule.value,
            rule.message ?? `${label}不能大于${rule.value}`
          )
        );
        break;

      case "pattern": {
        const regex =
          typeof rule.value === "string" ? new RegExp(rule.value) : rule.value;
        pipes.push(
          v.check(
            (val) => isEmpty(val) || regex.test(String(val)),
            rule.message ?? `${label}格式不正确`
          )
        );
        break;
      }

      case "email":
        pipes.push(
          v.check(
            (val) =>
              isEmpty(val) ||
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val)),
            rule.message ?? `${label}必须是有效的邮箱`
          )
        );
        break;

      case "url":
        pipes.push(
          v.check((val) => {
            if (isEmpty(val)) return true;
            try {
              new URL(String(val));
              return true;
            } catch {
              return false;
            }
          }, rule.message ?? `${label}必须是有效的URL`)
        );
        break;

      case "custom":
        pipes.push(
          v.check(
            (val) => {
              const result = rule.validate(val, values);
              return result === true;
            },
            (issue) => {
              const result = rule.validate(issue.input, values);
              return typeof result === "string" ? result : "校验失败";
            }
          )
        );
        break;

      case "array": {
        const minItems = rule.minItems ?? 0;
        const maxItems = rule.maxItems ?? Infinity;

        if (minItems > 0) {
          pipes.push(
            v.check(
              (arr) => Array.isArray(arr) && arr.length >= minItems,
              rule.message ?? `至少需要${minItems}条数据`
            )
          );
        }
        if (maxItems < Infinity) {
          pipes.push(
            v.check(
              (arr) => Array.isArray(arr) && arr.length <= maxItems,
              rule.message ?? `最多允许${maxItems}条数据`
            )
          );
        }
        break;
      }
    }
  }

  return pipes.length > 0 ? v.pipe(baseSchema, ...pipes) : baseSchema;
}

/**
 * 从字段配置推断字段类型
 */
export function inferFieldType(component: string): FieldType {
  const textTypes = ["Text", "Password", "Textarea"];
  const numberTypes = ["Number", "Slider", "Rating"];
  const boolTypes = ["Checkbox", "Switch"];
  const selectTypes = ["Select", "Radio", "Autocomplete"];
  const dateTypes = ["Date", "Time", "DateTime"];
  const arrayTypes = ["FormList"];

  if (textTypes.includes(component)) return "text";
  if (numberTypes.includes(component)) return "number";
  if (boolTypes.includes(component)) return "boolean";
  if (selectTypes.includes(component)) return "select";
  if (dateTypes.includes(component)) return "date";
  if (arrayTypes.includes(component)) return "array";

  return "unknown";
}

/**
 * 快捷函数：为字段创建验证 schema
 *
 * @example
 * ```tsx
 * const schema = createFieldValidator(
 *   'email',
 *   'Text',
 *   [{ type: 'required' }, { type: 'email' }],
 *   { label: '邮箱' }
 * );
 * ```
 */
export function createFieldValidator(
  fieldName: string,
  component: string,
  rules: ValidationRule[],
  options: Omit<RulesAdapterOptions, "fieldType"> = {}
): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> {
  return rulesToValibot(rules, {
    ...options,
    fieldType: inferFieldType(component),
    label: options.label ?? fieldName,
  });
}

