import { safeParseAsync, safeParse } from 'valibot';

/**
 * 将 Valibot Schema 转换为 TanStack Form Validator
 * 支持同步和异步校验
 */
export const valibotValidator = (schema: any) => {
    return ({ value }: { value: any }) => {
        if (!schema) return undefined;

        // 尝试解析
        // TanStack Form 期望返回错误消息字符串或 undefined
        // 使用同步解析以避免 Promise 被误认为是错误对象
        const result = safeParse(schema, value);

        if (result.success) {
            return undefined;
        }

        // 返回第一个错误消息
        return result.issues[0].message;
    };
};

/**
 * 表单级校验适配器
 */
export const valibotFormValidator = (schema: any) => {
    return ({ value }: { value: any }) => {
        if (!schema) return undefined;

        const result = safeParse(schema, value);

        if (result.success) {
            return undefined;
        }

        // 转换 Issues 为 Record<string, string>
        // TanStack Form onValidate signature returns ValidationError (string | undefined) or map?
        // form.options.validators.onChange returns ValidationError or Map.
        // Wait, TanStack Form form validators usually return an object of errors keyed by field, or a general error.
        // But for field-level validation, we return string.

        // For form-level validation, it might be different.
        // Returning a string is treated as a form-level error.

        return result.issues.map(i => i.message).join(', ');
    };
};
