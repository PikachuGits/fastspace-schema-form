import type { FieldSchema, ParsedSchema, SchemaInput } from "../../types";
import { extractDependencies } from "../engine/condition";

/**
 * Schema 解析器
 *
 * 预处理 SchemaInput，生成：
 * 1. 字段索引（快速查找）
 * 2. 依赖图（用于联动更新）
 * 3. 默认值合并
 */

/**
 * 从计算表达式中提取变量名
 * 简单实现：匹配所有标识符
 */
function extractExpressionVars(expr: string): string[] {
  // 匹配标识符（字母开头，后跟字母数字下划线）
  // 排除常见关键字和数字
  const identifierRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  const matches = expr.match(identifierRegex) ?? [];

  // 过滤掉常见的 JS 关键字和内置对象
  const keywords = new Set([
    "true",
    "false",
    "null",
    "undefined",
    "Math",
    "Number",
    "String",
    "Boolean",
    "Array",
    "Object",
    "if",
    "else",
    "return",
    "const",
    "let",
    "var",
  ]);

  return matches.filter((m) => !keywords.has(m));
}

/**
 * 解析 Schema，生成预处理后的结构
 */
export function parseSchema<T extends Record<string, unknown>>(
  input: SchemaInput<T>
): ParsedSchema<T> & { allFields: FieldSchema<T>[] } {
  const fieldMap = new Map<string, FieldSchema<T>>();
  const dependencyGraph = new Map<string, Set<string>>();
  const defaultValues: Partial<T> = {};
  const allFields: FieldSchema<T>[] = [];

  // 递归收集字段
  const collectFields = (fields: FieldSchema<T>[]) => {
    for (const field of fields) {
      const name = field.name as string;
      fieldMap.set(name, field);
      allFields.push(field);

      // 收集默认值
      if (field.defaultValue !== undefined) {
        (defaultValues as Record<string, unknown>)[name] = field.defaultValue;
      }

      // 递归处理嵌套字段 (Group)
      if (field.columns) {
        collectFields(field.columns);
      }
    }
  };

  collectFields(input.fields);

  // 构建依赖图 (基于所有字段)
  for (const field of allFields) {
    const name = field.name as string;
    const deps = new Set<string>();

    // 显式依赖
    if (field.dependencies) {
      for (const dep of field.dependencies) {
        deps.add(dep);
      }
    }

    // 从条件表达式提取依赖
    if (field.visibleWhen) {
      for (const dep of extractDependencies(field.visibleWhen)) {
        deps.add(dep);
      }
    }
    if (field.disabledWhen) {
      for (const dep of extractDependencies(field.disabledWhen)) {
        deps.add(dep);
      }
    }
    if (field.requiredWhen) {
      for (const dep of extractDependencies(field.requiredWhen)) {
        deps.add(dep);
      }
    }

    // 从计算表达式提取依赖
    if (field.compute) {
      if (field.compute.dependencies) {
        for (const dep of field.compute.dependencies) {
          deps.add(dep);
        }
      } else {
        // 自动提取
        for (const dep of extractExpressionVars(field.compute.expr)) {
          deps.add(dep);
        }
      }
    }

    // 记录依赖关系（反向：依赖字段 -> 被依赖者列表）
    for (const dep of deps) {
      if (!dependencyGraph.has(dep)) {
        dependencyGraph.set(dep, new Set());
      }
      dependencyGraph.get(dep)?.add(name);
    }
  }

  return {
    input,
    fieldMap,
    dependencyGraph,
    defaultValues,
    allFields, // 新增：扁平化的所有字段列表
  };
}

/**
 * 获取字段的所有下游依赖（递归）
 * 用于判断哪些字段需要重新计算
 */
export function getDownstreamFields(
  fieldName: string,
  dependencyGraph: Map<string, Set<string>>
): Set<string> {
  const downstream = new Set<string>();
  const queue = [fieldName];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const dependents = dependencyGraph.get(current);
    if (dependents) {
      for (const dep of dependents) {
        if (!downstream.has(dep)) {
          downstream.add(dep);
          queue.push(dep);
        }
      }
    }
  }

  return downstream;
}

/**
 * 合并默认值与外部传入值
 */
export function mergeDefaultValues<T extends Record<string, unknown>>(
  parsed: ParsedSchema<T>,
  externalValues?: Partial<T>
): Partial<T> {
  return {
    ...parsed.defaultValues,
    ...externalValues,
  };
}
