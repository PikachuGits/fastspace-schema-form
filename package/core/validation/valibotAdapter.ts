import { safeParse } from "valibot";
import { isPresetRulesArray, presetToSchema } from "./presets";

/**
 * 将 Valibot Schema 或预设规则数组转换为 TanStack Form Validator
 * 支持同步和异步校验
 *
 * @example 支持两种校验格式
 * ```tsx
 * // 格式 1: Valibot Schema (高度自定义)
 * validate: v.pipe(v.string(), v.email('请输入有效邮箱'))
 *
 * // 格式 2: 预设规则数组 (简洁声明式)
 * validate: [
 *   { type: 'required', message: '必填项' },
 *   { type: 'email', message: '请输入有效邮箱' },
 * ]
 * ```
 */
export const valibotValidator = (schemaOrRules: any) => {
  return ({ value }: { value: any }) => {
    if (!schemaOrRules) return undefined;

    // 检测是否为预设规则数组，如果是则自动转换
    const schema = isPresetRulesArray(schemaOrRules)
      ? presetToSchema(schemaOrRules)
      : schemaOrRules;

    // 使用同步解析
    const result = safeParse(schema, value);

    if (result.success) {
      return undefined;
    }

    // 返回第一个错误消息
    return result.issues[0]?.message;
  };
};

/**
 * 表单级校验适配器
 */
export const valibotFormValidator = (schemaOrRules: any) => {
  return ({ value }: { value: any }) => {
    if (!schemaOrRules) return undefined;

    // 检测是否为预设规则数组，如果是则自动转换
    const schema = isPresetRulesArray(schemaOrRules)
      ? presetToSchema(schemaOrRules)
      : schemaOrRules;

    const result = safeParse(schema, value);

    if (result.success) {
      return undefined;
    }

    return result.issues.map((i) => i.message).join(", ");
  };
};
