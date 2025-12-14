import * as v from 'valibot';
import type { FieldSchema, ParsedSchema } from '../../types';
import { evaluateCondition } from '../engine/condition';

/**
 * Valibot Schema 适配器
 *
 * 核心功能：
 * 1. 从 FieldSchema.rules 自动生成 Valibot 验证 schema
 * 2. 支持动态 requiredWhen 条件
 * 3. 根据当前表单值动态构建验证规则
 * 4. 支持 FormList 嵌套字段校验
 */

/** 判断字段是否为必填（考虑 rules 和 requiredWhen） */
function isFieldRequired(field: FieldSchema, values: Record<string, unknown>): boolean {
  // 检查 rules 中是否有 required
  const hasRequiredRule = field.rules?.some((r) => r.type === 'required');
  if (hasRequiredRule) return true;

  // 检查 requiredWhen 条件
  if (field.requiredWhen) {
    return evaluateCondition(field.requiredWhen, values);
  }

  return false;
}

/** 获取 required 规则的自定义消息 */
function getRequiredMessage(field: FieldSchema): string {
  const requiredRule = field.rules?.find((r) => r.type === 'required');
  const label = field.ui?.label ?? String(field.name);
  return requiredRule?.message ?? `${label}不能为空`;
}

/** 构建单个字段的 Valibot schema */
function buildFieldSchema(
  field: FieldSchema,
  values: Record<string, unknown>,
): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> {
  const label = field.ui?.label ?? String(field.name);
  const component = field.component;
  const rules = field.rules ?? [];
  const isRequired = isFieldRequired(field, values);
  const requiredMessage = getRequiredMessage(field);

  // 检查是否为多选 Autocomplete/Select
  const isMultiple = field.ui?.props?.multiple === true;
  const isAutocompleteMultiple = (component === 'Autocomplete' || component === 'Select') && isMultiple;

  // 多选 Autocomplete/Select - 值为数组
  if (isAutocompleteMultiple) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipes: v.PipeItem<any, any, v.BaseIssue<unknown>>[] = [];

    // 必填校验 - 数组至少有一项
    if (isRequired) {
      pipes.push(
        v.check((val) => Array.isArray(val) && val.length > 0 && val !== undefined && val !== null, requiredMessage),
      );
    }

    const baseSchema = v.union([v.string(), v.number(), v.boolean(), v.undefined_(), v.null_(), v.array(v.unknown())]);
    return pipes.length > 0 ? v.pipe(baseSchema, ...pipes) : baseSchema;
  }

  // Radio / 单选 Select / 单选 Autocomplete - 值可能是 string、number 或 boolean
  const selectLikeTypes = ['Radio', 'Select', 'Autocomplete'];
  if (selectLikeTypes.includes(component)) {
    // 使用 union 处理多种类型
    const baseSchema = v.union([v.string(), v.number(), v.boolean(), v.undefined_(), v.null_()]);

    if (isRequired) {
      return v.pipe(
        baseSchema,
        v.check((val) => val !== undefined && val !== null && val !== '', requiredMessage),
      );
    }
    return baseSchema;
  }

  // 文本类型字段
  const textTypes = ['Text', 'Password', 'Textarea', 'Date', 'Time', 'DateTime'];

  if (textTypes.includes(component)) {
    // 使用 union 处理 undefined/null/string
    const baseSchema = v.union([v.string(), v.undefined_(), v.null_()]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipes: v.PipeItem<any, any, v.BaseIssue<unknown>>[] = [];

    // 必填校验 - 检查非空
    if (isRequired) {
      pipes.push(v.check((val) => val !== undefined && val !== null && val !== '', requiredMessage));
    }

    // 处理其他规则（仅在有值时校验）
    for (const rule of rules) {
      switch (rule.type) {
        case 'minLength':
          pipes.push(
            v.check(
              (val) => val === undefined || val === null || val === '' || String(val).length >= rule.value,
              rule.message ?? `${label}至少${rule.value}个字符`,
            ),
          );
          break;
        case 'maxLength':
          pipes.push(
            v.check(
              (val) => val === undefined || val === null || val === '' || String(val).length <= rule.value,
              rule.message ?? `${label}最多${rule.value}个字符`,
            ),
          );
          break;
        case 'pattern': {
          const regex = typeof rule.value === 'string' ? new RegExp(rule.value) : rule.value;
          pipes.push(
            v.check(
              (val) => val === undefined || val === null || val === '' || regex.test(String(val)),
              rule.message ?? `${label}格式不正确`,
            ),
          );
          break;
        }
        case 'email':
          pipes.push(
            v.check(
              (val) =>
                val === undefined || val === null || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val)),
              rule.message ?? `${label}必须是有效的邮箱`,
            ),
          );
          break;
        case 'url':
          pipes.push(
            v.check((val) => {
              if (val === undefined || val === null || val === '') return true;
              try {
                new URL(String(val));
                return true;
              } catch {
                return false;
              }
            }, rule.message ?? `${label}必须是有效的URL`),
          );
          break;
        case 'custom':
          pipes.push(
            v.check(
              (val) => {
                const result = rule.validate(val, values);
                return result === true;
              },
              (issue) => {
                const result = rule.validate(issue.input, values);
                return typeof result === 'string' ? result : '校验失败';
              },
            ),
          );
          break;
        default:
          break;
      }
    }

    return pipes.length > 0 ? v.pipe(baseSchema, ...pipes) : baseSchema;
  }

  // 数字类型字段
  const numberTypes = ['Number', 'Slider', 'Rating'];
  if (numberTypes.includes(component)) {
    // 使用 union 处理 undefined/null/number
    const baseSchema = v.union([v.number(), v.undefined_(), v.null_(), v.pipe(v.string(), v.transform(Number), v.number()),]);

    const pipes: v.PipeItem<any, any, v.BaseIssue<unknown>>[] = [];
    // 必填校验
    if (isRequired) {
      pipes.push(v.check((val) => val !== undefined && val !== null && !Number.isNaN(val), requiredMessage));
    }

    // 处理其他规则
    for (const rule of rules) {
      switch (rule.type) {
        case 'min':
          pipes.push(
            v.check(
              (val) => val === undefined || val === null || Number(val) >= rule.value,
              rule.message ?? `${label}不能小于${rule.value}`,
            ),
          );
          break;
        case 'max':
          pipes.push(
            v.check(
              (val) => val === undefined || val === null || Number(val) <= rule.value,
              rule.message ?? `${label}不能大于${rule.value}`,
            ),
          );
          break;
        case 'custom':
          pipes.push(
            v.check(
              (val) => {
                const result = rule.validate(val, values);
                return result === true;
              },
              (issue) => {
                const result = rule.validate(issue.input, values);
                return typeof result === 'string' ? result : '校验失败';
              },
            ),
          );
          break;
        default:
          break;
      }
    }

    return pipes.length > 0 ? v.pipe(baseSchema, ...pipes) : baseSchema;
  }

  // 布尔类型字段
  const boolTypes = ['Checkbox', 'Switch'];
  if (boolTypes.includes(component)) {
    const baseSchema = v.union([v.boolean(), v.undefined_(), v.null_()]);

    if (isRequired) {
      return v.pipe(
        baseSchema,
        v.check((val) => val === true, requiredMessage),
      );
    }
    return baseSchema;
  }

  // FormList 类型字段
  if (component === 'FormList') {
    const columns = field.columns ?? [];
    const minItems = field.minItems ?? 0;
    const maxItems = field.maxItems ?? Infinity;

    // 构建行 schema
    const rowShape: Record<string, v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>> = {};

    for (const col of columns) {
      if (col.component === 'Group' && col.columns) {
        // Group 内的字段平铺
        for (const groupCol of col.columns) {
          rowShape[groupCol.name as string] = buildFieldSchema(groupCol, values);
        }
      } else if (col.component !== 'Group') {
        rowShape[col.name as string] = buildFieldSchema(col, values);
      }
    }

    const rowSchema = v.object(rowShape);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipes: v.PipeItem<any, any, v.BaseIssue<unknown>>[] = [];

    if (minItems > 0) {
      pipes.push(v.check((arr) => Array.isArray(arr) && arr.length >= minItems, `至少需要${minItems}条数据`));
    }

    if (maxItems < Infinity) {
      pipes.push(v.check((arr) => Array.isArray(arr) && arr.length <= maxItems, `最多允许${maxItems}条数据`));
    }

    const arraySchema = v.array(rowSchema);
    return pipes.length > 0 ? v.pipe(arraySchema, ...pipes) : arraySchema;
  }

  // 上传类型字段
  if (component === 'Upload') {
    const arrayRule = rules.find((r) => r.type === 'array');
    const minItems = arrayRule?.type === 'array' ? arrayRule.minItems ?? (isRequired ? 1 : 0) : isRequired ? 1 : 0;

    if (minItems > 0) {
      return v.pipe(
        v.union([v.array(v.unknown()), v.undefined_(), v.null_()]),
        v.check((arr) => Array.isArray(arr) && arr.length >= minItems, arrayRule?.message ?? requiredMessage),
      );
    }
    return v.union([v.array(v.unknown()), v.undefined_(), v.null_()]);
  }

  // 自定义校验规则
  const customRules = rules.filter((r) => r.type === 'custom');
  if (customRules.length > 0) {
    return v.pipe(
      v.unknown(),
      ...customRules.map((r) => {
        return r.type === 'custom'
          ? v.check(
            (val) => {
              const result = r.validate(val, values);
              return result === true;
            },
            (issue) => {
              const result = r.validate(issue.input, values);
              return typeof result === 'string' ? result : '校验失败';
            },
          )
          : v.check(() => true, '');
      }),
    );
  }

  // 默认处理
  if (isRequired) {
    return v.pipe(
      v.unknown(),
      v.check((val) => val !== undefined && val !== null && val !== '', requiredMessage),
    );
  }

  return v.optional(v.unknown());
}

/**
 * 根据 ParsedSchema 和当前值动态构建完整的 Valibot schema
 */
export function buildValibotSchema<T extends Record<string, unknown>>(
  parsed: ParsedSchema<T>,
  values: Record<string, unknown>,
): v.ObjectSchema<Record<string, v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>, undefined> {
  const shape: Record<string, v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>> = {};

  for (const field of parsed.input.fields) {
    // 跳过隐藏字段
    if (field.hidden || field.component === 'Hidden') {
      shape[field.name as string] = v.optional(v.unknown());
      continue;
    }

    // Group 组件不参与校验（其子字段独立校验）
    if (field.component === 'Group') {
      continue;
    }

    // 检查 visibleWhen - 隐藏的字段不参与校验
    if (field.visibleWhen && !evaluateCondition(field.visibleWhen, values)) {
      shape[field.name as string] = v.optional(v.unknown());
      continue;
    }

    shape[field.name as string] = buildFieldSchema(field as FieldSchema, values);
  }

  return v.object(shape);
}

/**
 * 创建动态 resolver（用于 react-hook-form）
 */
export function createDynamicResolver<T extends Record<string, unknown>>(parsed: ParsedSchema<T>) {
  return async (values: Record<string, unknown>, _context: unknown, _options: unknown) => {
    const schema = buildValibotSchema(parsed, values);
    const result = v.safeParse(schema, values);

    if (result.success) {
      return { values: result.output, errors: {} };
    }

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.issues) {
      const path = Array.isArray(issue.path)
        ? issue.path
          .map((seg) => (seg as { key?: string | number }).key ?? '')
          .filter((k) => k !== '')
          .join('.')
        : '';
      if (path && !errors[path]) {
        errors[path] = { type: 'validation', message: issue.message };
      }
    }

    return { values: {}, errors };
  };
}
