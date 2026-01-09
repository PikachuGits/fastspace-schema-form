/** 从表达式中提取依赖的字段名 */
export function extractDependencies(expr: string): string[] {
  const identifiers = expr.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
  // 过滤掉 JavaScript 关键字和内置对象
  const keywords = new Set([
    'true',
    'false',
    'null',
    'undefined',
    'NaN',
    'Infinity',
    'Math',
    'Number',
    'String',
    'Boolean',
    'Array',
    'Object',
    'if',
    'else',
    'return',
    'function',
  ]);
  return Array.from(new Set(identifiers.filter((id) => !keywords.has(id))));
}

/**
 * 检查值是否为有效的可计算值
 * - 数字（包括 0）
 * - 非空字符串
 */
export function isValidComputeValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

/**
 * 计算表达式求值
 * 更健壮的实现，处理 undefined/null/NaN 等边界情况
 */
export function evaluateCompute(
  expr: string,
  values: Record<string, unknown>,
  dependencies: string[],
  precision?: number,
  roundMode: 'round' | 'ceil' | 'floor' = 'round'
): unknown {
  try {
    // 检查所有依赖是否都有有效值
    for (const dep of dependencies) {
      if (!isValidComputeValue(values[dep])) {
        return undefined; // 如果任何依赖无效，返回 undefined
      }
    }

    // 只使用依赖的字段值，避免引入无关变量
    const safeValues: Record<string, unknown> = {};
    for (const dep of dependencies) {
      const value = values[dep];
      // 转换为数字（如果是数字字符串）
      if (typeof value === 'string' && !Number.isNaN(Number(value))) {
        safeValues[dep] = Number(value);
      } else {
        safeValues[dep] = value ?? 0;
      }
    }

    const fn = new Function(...Object.keys(safeValues), `"use strict"; return (${expr});`);
    let result = fn(...Object.values(safeValues));

    // 如果结果是 NaN、Infinity 或 -Infinity，返回 undefined
    if (typeof result === 'number') {
      if (!Number.isFinite(result)) {
        return undefined;
      }
      // 处理精度
      if (precision !== undefined && precision >= 0) {
        const factor = Math.pow(10, precision);

        switch (roundMode) {
          case 'ceil':
            // 向上取整
            result = Math.ceil(result * factor) / factor;
            break;
          case 'floor':
            // 向下取整
            result = Math.floor(result * factor) / factor;
            break;
          case 'round':
          default:
            // 四舍五入 (使用 toFixed 解决浮点数精度问题)
            result = Number(result.toFixed(precision));
            break;
        }
      }
    }

    return result;
  } catch (error) {
    // 静默处理错误，避免控制台刷屏
    return undefined;
  }
}
