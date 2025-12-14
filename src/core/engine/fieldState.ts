import type { ConditionExpression, FieldSchema, ParsedSchema } from "../../types";
import { evaluateCondition } from "./condition";

/**
 * 字段状态计算引擎
 *
 * 计算每个字段的运行时状态：
 * - visible: 是否显示
 * - disabled: 是否禁用
 * - required: 是否必填
 * - readonly: 是否只读
 */

/** 单个字段的运行时状态 */
export type FieldState = {
  /** 是否可见 */
  visible: boolean;
  /** 是否禁用 */
  disabled: boolean;
  /** 是否必填 */
  required: boolean;
  /** 是否只读 */
  readonly: boolean;
};

/** 所有字段的状态映射 */
export type FieldStatesMap = Map<string, FieldState>;

/**
 * 计算单个字段的状态
 */
export function computeFieldState(
  field: FieldSchema,
  values: Record<string, unknown>,
  globalDisabled = false,
  globalReadOnly = false
): FieldState {
  // 可见性
  let visible = !field.hidden;
  if (visible && field.visibleWhen) {
    visible = evaluateCondition(field.visibleWhen, values);
  }

  // 禁用状态
  let disabled = field.disabled ?? false;
  if (!disabled && field.disabledWhen) {
    disabled = evaluateCondition(field.disabledWhen, values);
  }
  // 全局禁用优先
  if (globalDisabled) {
    disabled = true;
  }

  // 必填状态
  let required = field.rules?.some((r) => r.type === "required") ?? false;
  if (!required && field.requiredWhen) {
    required = evaluateCondition(field.requiredWhen, values);
  }

  // 只读状态
  const readonly = field.readonly ?? globalReadOnly;

  return { visible, disabled, required, readonly };
}

/**
 * 计算所有字段的状态
 */
export function computeAllFieldStates<T extends Record<string, unknown>>(
  parsed: ParsedSchema<T>,
  values: Record<string, unknown>,
  globalDisabled = false,
  globalReadOnly = false
): FieldStatesMap {
  const states: FieldStatesMap = new Map();

  for (const field of parsed.input.fields) {
    const state = computeFieldState(
      field as FieldSchema,
      values,
      globalDisabled,
      globalReadOnly
    );
    states.set(field.name as string, state);
  }

  return states;
}

/**
 * 递归提取条件表达式中的依赖字段
 */
function extractConditionDependencies(cond: ConditionExpression | undefined, deps: Set<string>) {
  if (!cond) return;

  // 函数类型无法静态分析，暂时忽略或需要在外部处理
  if (typeof cond === "function") {
    return;
  }

  // 简单条件
  if ("field" in cond) {
    deps.add(cond.field);
    return;
  }

  // 复合条件
  if ("and" in cond && Array.isArray(cond.and)) {
    cond.and.forEach((c) => extractConditionDependencies(c, deps));
  }
  if ("or" in cond && Array.isArray(cond.or)) {
    cond.or.forEach((c) => extractConditionDependencies(c, deps));
  }
  if ("not" in cond) {
    extractConditionDependencies(cond.not, deps);
  }
}

/**
 * 获取需要监听的依赖字段
 * 用于构建 useWatch 的 name 数组
 */
export function getWatchFields<T extends Record<string, unknown>>(
  parsed: ParsedSchema<T>
): string[] {
  const watchFields = new Set<string>();

  for (const field of parsed.allFields) {
    // 1. 显式依赖
    if (field.dependencies) {
      for (const dep of field.dependencies) {
        watchFields.add(dep);
      }
    }

    // 2. 状态条件依赖 (visibleWhen, disabledWhen, requiredWhen)
    extractConditionDependencies(field.visibleWhen, watchFields);
    extractConditionDependencies(field.disabledWhen, watchFields);
    extractConditionDependencies(field.requiredWhen, watchFields);

    // 3. 计算字段依赖
    if (field.compute?.dependencies) {
      for (const dep of field.compute.dependencies) {
        watchFields.add(dep);
      }
    }
  }

  return Array.from(watchFields);
}
