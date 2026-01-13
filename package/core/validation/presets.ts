/**
 * 验证预设系统
 *
 * 提供统一的预设验证规则，支持扩展、覆盖、添加新规则
 * 所有规则统一使用 Valibot 格式
 *
 * @example 在 schema 中直接使用预设规则数组
 * ```tsx
 * {
 *   name: 'email',
 *   component: 'Text',
 *   validate: [
 *     { type: 'required', message: '邮箱必填' },
 *     { type: 'email', message: '请输入有效邮箱' },
 *   ],
 * }
 * ```
 */

import * as v from "valibot";

// ============================================================================
// Types
// ============================================================================

/** 规则配置参数 */
export type RuleConfig = {
  /** 规则参数值 (如 minLength 的长度) */
  value?: any;
  /** 自定义错误消息 */
  message?: string;
  /** 字段标签 (用于默认消息) */
  label?: string;
};

/** 规则工厂函数 - 接收配置，返回 valibot check */
export type RuleFactory = (
  config?: RuleConfig
) => v.PipeItem<any, any, v.BaseIssue<unknown>>;

/** 预设规则名称 */
export type PresetRuleName =
  | "required"
  | "email"
  | "phone"
  | "url"
  | "minLength"
  | "maxLength"
  | "min"
  | "max"
  | "pattern"
  | "idCard"
  | "integer"
  | "positive"
  | "negative"
  | "alphanumeric"
  | "chinese"
  | string;

/**
 * 预设规则配置
 * @example
 * ```tsx
 * // 简写
 * { type: 'required' }
 * { type: 'email', message: '请输入有效邮箱' }
 *
 * // 带参数
 * { type: 'minLength', value: 3, message: '至少3个字符' }
 * { type: 'pattern', value: /^\d+$/, message: '只能输入数字' }
 * ```
 */
export type PresetRule = {
  type: PresetRuleName;
  value?: any;
  message?: string;
};

/** 验证预设注册表类型 */
export type ValidationPresetRegistry = {
  /** 获取规则工厂 */
  get: (name: string) => RuleFactory | undefined;
  /** 注册新规则 */
  register: (name: string, factory: RuleFactory) => void;
  /** 覆盖已有规则 */
  override: (name: string, factory: RuleFactory) => void;
  /** 批量注册规则 */
  registerAll: (rules: Record<string, RuleFactory>) => void;
  /** 检查规则是否存在 */
  has: (name: string) => boolean;
  /** 获取所有规则名称 */
  getNames: () => string[];
  /** 将预设规则数组转换为 valibot schema */
  toSchema: (
    rules: PresetRule[],
    options?: { label?: string; baseType?: "string" | "number" | "any" }
  ) => v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;
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

/**
 * 检测是否为预设规则数组
 * @param value 待检测的值
 * @returns 是否为预设规则数组
 */
export function isPresetRulesArray(value: unknown): value is PresetRule[] {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return false;
  // 检查第一个元素是否有 type 属性
  return (
    typeof value[0] === "object" &&
    value[0] !== null &&
    "type" in value[0] &&
    typeof value[0].type === "string"
  );
}

// ============================================================================
// 默认预设规则
// ============================================================================

export const defaultRuleFactories: Record<string, RuleFactory> = {
  /** 必填 */
  required: (config) =>
    v.check(
      (val) => !isEmpty(val),
      config?.message ?? `${config?.label ?? "该字段"}不能为空`
    ),

  /** 邮箱 */
  email: (config) =>
    v.check(
      (val) => isEmpty(val) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val)),
      config?.message ?? `${config?.label ?? "该字段"}必须是有效的邮箱`
    ),

  /** 手机号 (中国大陆) */
  phone: (config) =>
    v.check(
      (val) => isEmpty(val) || /^1[3-9]\d{9}$/.test(String(val)),
      config?.message ?? `${config?.label ?? "该字段"}必须是有效的手机号`
    ),

  /** URL */
  url: (config) =>
    v.check((val) => {
      if (isEmpty(val)) return true;
      try {
        new URL(String(val));
        return true;
      } catch {
        return false;
      }
    }, config?.message ?? `${config?.label ?? "该字段"}必须是有效的URL`),

  /** 最小长度 */
  minLength: (config) =>
    v.check(
      (val) => isEmpty(val) || String(val).length >= (config?.value ?? 0),
      config?.message ??
        `${config?.label ?? "该字段"}至少${config?.value ?? 0}个字符`
    ),

  /** 最大长度 */
  maxLength: (config) =>
    v.check(
      (val) =>
        isEmpty(val) || String(val).length <= (config?.value ?? Infinity),
      config?.message ??
        `${config?.label ?? "该字段"}最多${config?.value ?? 0}个字符`
    ),

  /** 最小值 */
  min: (config) =>
    v.check(
      (val) => isEmpty(val) || Number(val) >= (config?.value ?? -Infinity),
      config?.message ??
        `${config?.label ?? "该字段"}不能小于${config?.value ?? 0}`
    ),

  /** 最大值 */
  max: (config) =>
    v.check(
      (val) => isEmpty(val) || Number(val) <= (config?.value ?? Infinity),
      config?.message ??
        `${config?.label ?? "该字段"}不能大于${config?.value ?? 0}`
    ),

  /** 正则表达式 */
  pattern: (config) => {
    const regex =
      config?.value instanceof RegExp
        ? config.value
        : new RegExp(config?.value ?? ".*");
    return v.check(
      (val) => isEmpty(val) || regex.test(String(val)),
      config?.message ?? `${config?.label ?? "该字段"}格式不正确`
    );
  },

  /** 身份证号 (中国大陆 18 位) */
  idCard: (config) =>
    v.check(
      (val) =>
        isEmpty(val) ||
        /^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(
          String(val)
        ),
      config?.message ?? `${config?.label ?? "该字段"}必须是有效的身份证号`
    ),

  /** 整数 */
  integer: (config) =>
    v.check(
      (val) => isEmpty(val) || Number.isInteger(Number(val)),
      config?.message ?? `${config?.label ?? "该字段"}必须是整数`
    ),

  /** 正数 */
  positive: (config) =>
    v.check(
      (val) => isEmpty(val) || Number(val) > 0,
      config?.message ?? `${config?.label ?? "该字段"}必须是正数`
    ),

  /** 负数 */
  negative: (config) =>
    v.check(
      (val) => isEmpty(val) || Number(val) < 0,
      config?.message ?? `${config?.label ?? "该字段"}必须是负数`
    ),

  /** 字母数字 */
  alphanumeric: (config) =>
    v.check(
      (val) => isEmpty(val) || /^[a-zA-Z0-9]+$/.test(String(val)),
      config?.message ?? `${config?.label ?? "该字段"}只能包含字母和数字`
    ),

  /** 中文 */
  chinese: (config) =>
    v.check(
      (val) => isEmpty(val) || /^[\u4e00-\u9fa5]+$/.test(String(val)),
      config?.message ?? `${config?.label ?? "该字段"}只能包含中文字符`
    ),
};

// ============================================================================
// 创建验证预设注册表
// ============================================================================

/**
 * 创建验证预设注册表
 *
 * @param initialRules 初始规则集 (会与默认规则合并)
 * @returns 注册表实例
 *
 * @example
 * ```tsx
 * const registry = createValidationRegistry({
 *   // 覆盖默认的 email 规则
 *   email: (config) => v.check(
 *     (val) => isEmpty(val) || /@(163|qq|gmail)\.com$/.test(String(val)),
 *     config?.message ?? '只支持 163、QQ、Gmail 邮箱'
 *   ),
 *   // 添加新规则
 *   idNumber: (config) => v.check(
 *     (val) => isEmpty(val) || /^\d{18}$/.test(String(val)),
 *     config?.message ?? '请输入18位身份证号'
 *   ),
 * });
 * ```
 */
export function createValidationRegistry(
  initialRules: Record<string, RuleFactory> = {}
): ValidationPresetRegistry {
  // 合并默认规则和初始规则
  const rules = new Map<string, RuleFactory>(
    Object.entries({ ...defaultRuleFactories, ...initialRules })
  );

  const registry: ValidationPresetRegistry = {
    get: (name) => rules.get(name),

    register: (name, factory) => {
      if (rules.has(name)) {
        console.warn(
          `[ValidationPresets] 规则 "${name}" 已存在，使用 override() 覆盖`
        );
        return;
      }
      rules.set(name, factory);
    },

    override: (name, factory) => {
      rules.set(name, factory);
    },

    registerAll: (newRules) => {
      Object.entries(newRules).forEach(([name, factory]) => {
        rules.set(name, factory);
      });
    },

    has: (name) => rules.has(name),

    getNames: () => Array.from(rules.keys()),

    toSchema: (presetRules, options = {}) => {
      const { label, baseType = "any" } = options;
      const pipes: v.PipeItem<any, any, v.BaseIssue<unknown>>[] = [];

      // 处理每个预设规则
      for (const rule of presetRules) {
        const ruleName = rule.type;
        const ruleConfig: RuleConfig = {
          value: rule.value,
          message: rule.message,
          label,
        };

        const factory = rules.get(ruleName);
        if (!factory) {
          console.warn(`[ValidationPresets] 未知规则: "${ruleName}"`);
          continue;
        }

        pipes.push(factory(ruleConfig));
      }

      // 根据 baseType 确定基础 schema
      let baseSchema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;
      switch (baseType) {
        case "string":
          baseSchema = v.union([v.string(), v.undefined_(), v.null_()]);
          break;
        case "number":
          baseSchema = v.union([v.number(), v.undefined_(), v.null_()]);
          break;
        default:
          baseSchema = v.unknown();
      }

      return pipes.length > 0 ? v.pipe(baseSchema, ...pipes) : baseSchema;
    },
  };

  return registry;
}

// ============================================================================
// 全局默认注册表
// ============================================================================

/** 全局默认验证预设注册表 */
export const globalValidationRegistry = createValidationRegistry();

/**
 * 将预设规则数组转换为 valibot schema
 *
 * @example
 * ```tsx
 * // 基础用法
 * const schema = presetToSchema([
 *   { type: 'required', message: '必填项' },
 *   { type: 'email', message: '请输入有效邮箱' },
 * ]);
 *
 * // 带参数的规则
 * const schema = presetToSchema([
 *   { type: 'required' },
 *   { type: 'minLength', value: 3, message: '至少3个字符' },
 *   { type: 'maxLength', value: 20 },
 * ], { label: '用户名' });
 * ```
 */
export function presetToSchema(
  rules: PresetRule[],
  options?: { label?: string; baseType?: "string" | "number" | "any" }
): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> {
  return globalValidationRegistry.toSchema(rules, options);
}

/**
 * 快捷函数：注册新的预设规则到全局注册表
 */
export function registerPresetRule(name: string, factory: RuleFactory): void {
  globalValidationRegistry.register(name, factory);
}

/**
 * 快捷函数：覆盖全局注册表中的预设规则
 */
export function overridePresetRule(name: string, factory: RuleFactory): void {
  globalValidationRegistry.override(name, factory);
}

/**
 * 解析 validate 配置
 *
 * 支持以下格式：
 * 1. PresetRule[] - 预设规则数组，自动转换为 valibot schema
 * 2. Valibot Schema - 直接返回
 * 3. undefined - 返回 undefined
 *
 * @param validate 验证配置
 * @param options 选项 (label 用于生成默认错误消息)
 * @returns 解析后的 valibot schema 或 undefined
 */
export function resolveValidate(
  validate:
    | PresetRule[]
    | v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
    | undefined,
  options?: { label?: string }
): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> | undefined {
  if (!validate) {
    return undefined;
  }

  // 检测是否为预设规则数组
  if (isPresetRulesArray(validate)) {
    return globalValidationRegistry.toSchema(validate, {
      label: options?.label,
    });
  }

  // 假设是 valibot schema，直接返回
  return validate as v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;
}
