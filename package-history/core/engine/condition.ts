import type {
  CompoundCondition,
  ConditionExpression,
  SimpleCondition,
} from "../../types";

/**
 * 条件表达式求值引擎
 *
 * 支持的条件类型：
 * - 简单条件：字段比较（eq, ne, gt, gte, lt, lte, in, notIn, empty, notEmpty）
 * - 复合条件：逻辑运算（and, or, not）
 */

/** 判断值是否为空 */
function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/** 获取嵌套字段值 */
function getFieldValue(
  values: Record<string, unknown>,
  fieldPath: string
): unknown {
  const parts = fieldPath.split(".");
  let current: unknown = values;
  for (const part of parts) {
    if (current === undefined || current === null) return;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** 判断是否为简单条件 */
function isSimpleCondition(
  condition: ConditionExpression
): condition is SimpleCondition {
  return "field" in condition;
}

/** 判断是否为复合条件 */
function isCompoundCondition(
  condition: ConditionExpression
): condition is CompoundCondition {
  return "and" in condition || "or" in condition || "not" in condition;
}

/** 求值简单条件 */
function evaluateSimpleCondition(
  condition: SimpleCondition,
  values: Record<string, unknown>
): boolean {
  const fieldValue = getFieldValue(values, condition.field);

  // eq: 等于
  if ("eq" in condition) {
    return fieldValue === condition.eq;
  }

  // ne: 不等于
  if ("ne" in condition) {
    return fieldValue !== condition.ne;
  }

  // gt: 大于
  if ("gt" in condition && typeof fieldValue === "number") {
    return fieldValue > (condition.gt as number);
  }

  // gte: 大于等于
  if ("gte" in condition && typeof fieldValue === "number") {
    return fieldValue >= (condition.gte as number);
  }

  // lt: 小于
  if ("lt" in condition && typeof fieldValue === "number") {
    return fieldValue < (condition.lt as number);
  }

  // lte: 小于等于
  if ("lte" in condition && typeof fieldValue === "number") {
    return fieldValue <= (condition.lte as number);
  }

  // in: 在数组中
  if ("in" in condition && Array.isArray(condition.in)) {
    return condition.in.includes(fieldValue);
  }

  // notIn: 不在数组中
  if ("notIn" in condition && Array.isArray(condition.notIn)) {
    return !condition.notIn.includes(fieldValue);
  }

  // empty: 是否为空
  if ("empty" in condition) {
    return condition.empty ? isEmpty(fieldValue) : !isEmpty(fieldValue);
  }

  // notEmpty: 是否非空
  if ("notEmpty" in condition) {
    return condition.notEmpty ? !isEmpty(fieldValue) : isEmpty(fieldValue);
  }

  // 默认返回 false
  return false;
}

/** 求值复合条件 */
function evaluateCompoundCondition(
  condition: CompoundCondition,
  values: Record<string, unknown>
): boolean {
  // and: 所有条件都为真
  if ("and" in condition) {
    return condition.and.every((c) => evaluateCondition(c, values));
  }

  // or: 任一条件为真
  if ("or" in condition) {
    return condition.or.some((c) => evaluateCondition(c, values));
  }

  // not: 取反
  if ("not" in condition) {
    return !evaluateCondition(condition.not, values);
  }

  return false;
}

/**
 * 求值条件表达式
 * @param condition 条件表达式
 * @param values 当前表单值
 * @returns 条件是否满足
 */
export function evaluateCondition(
  condition: ConditionExpression,
  values: Record<string, unknown>
): boolean {
  if (!condition) return true;

  // 函数条件
  if (typeof condition === "function") {
    return condition(values);
  }

  // 简单条件
  if (isSimpleCondition(condition)) {
    return evaluateSimpleCondition(condition, values);
  }

  // 复合条件
  if (isCompoundCondition(condition)) {
    return evaluateCompoundCondition(condition, values);
  }

  return true;
}

/**
 * 从条件表达式中提取依赖字段
 * @param condition 条件表达式
 * @returns 依赖字段名数组
 */
export function extractDependencies(condition: ConditionExpression): string[] {
  const deps: string[] = [];

  if (isSimpleCondition(condition)) {
    deps.push(condition.field);
  } else if ("and" in condition) {
    for (const c of condition.and) {
      deps.push(...extractDependencies(c));
    }
  } else if ("or" in condition) {
    for (const c of condition.or) {
      deps.push(...extractDependencies(c));
    }
  } else if ("not" in condition) {
    deps.push(...extractDependencies(condition.not));
  }

  return [...new Set(deps)]; // 去重
}
