/**
 * 验证预设 React Hook
 *
 * 提供在 React 组件中使用和扩展验证预设的能力
 */

import { useRef, useCallback, useMemo, createContext, useContext, type ReactNode } from "react";
import * as v from "valibot";
import {
  createValidationRegistry,
  globalValidationRegistry,
  defaultRuleFactories,
  type RuleFactory,
  type PresetRule,
  type ValidationPresetRegistry,
} from "../core/validation/presets";

// ============================================================================
// Types
// ============================================================================

export type UseValidationPresetsOptions = {
  /**
   * 是否使用独立的注册表实例
   * - true: 创建新的注册表，不影响全局
   * - false: 使用全局注册表 (默认)
   */
  isolated?: boolean;
  /**
   * 初始规则扩展
   * 可用于覆盖默认规则或添加新规则
   */
  extend?: Record<string, RuleFactory>;
};

export type UseValidationPresetsReturn = {
  /**
   * 注册新的预设规则
   * @param name 规则名称
   * @param factory 规则工厂函数
   */
  register: (name: string, factory: RuleFactory) => void;

  /**
   * 覆盖已有的预设规则
   * @param name 规则名称
   * @param factory 规则工厂函数
   */
  override: (name: string, factory: RuleFactory) => void;

  /**
   * 批量注册/覆盖规则
   * @param rules 规则映射
   */
  extend: (rules: Record<string, RuleFactory>) => void;

  /**
   * 检查规则是否存在
   */
  has: (name: string) => boolean;

  /**
   * 获取所有已注册的规则名称
   */
  getNames: () => string[];

  /**
   * 将预设规则数组转换为 valibot schema
   *
   * @example
   * ```tsx
   * const schema = toSchema([
   *   { type: 'required', message: '必填' },
   *   { type: 'email', message: '请输入有效邮箱' },
   * ]);
   *
   * // 带参数
   * const schema = toSchema([
   *   { type: 'required' },
   *   { type: 'minLength', value: 3, message: '至少3个字符' },
   * ], { label: '用户名' });
   * ```
   */
  toSchema: (
    rules: PresetRule[],
    options?: { label?: string; baseType?: "string" | "number" | "any" }
  ) => v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;

  /**
   * 获取原始注册表实例
   */
  registry: ValidationPresetRegistry;
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * 验证预设 Hook
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const { toSchema, override, register } = useValidationPresets({
 *     extend: {
 *       // 覆盖默认 email 规则 - 只允许特定后缀
 *       email: (config) => v.check(
 *         (val) => !val || /@(163|qq|gmail)\.com$/.test(String(val)),
 *         config?.message ?? '只支持 163、QQ、Gmail 邮箱'
 *       ),
 *     },
 *   });
 *
 *   // 动态添加新规则
 *   useEffect(() => {
 *     register('companyEmail', (config) => v.check(
 *       (val) => !val || /@mycompany\.com$/.test(String(val)),
 *       config?.message ?? '请使用公司邮箱'
 *     ));
 *   }, []);
 *
 *   // 使用预设规则
 *   const emailSchema = toSchema([
 *     { type: 'required', message: '邮箱必填' },
 *     { type: 'email' },
 *   ]);
 *
 *   return <SchemaForm ... />;
 * }
 * ```
 */
export function useValidationPresets(
  options: UseValidationPresetsOptions = {}
): UseValidationPresetsReturn {
  const { isolated = false, extend: initialExtend } = options;

  // 创建或使用注册表
  const registryRef = useRef<ValidationPresetRegistry | null>(null);

  if (!registryRef.current) {
    if (isolated) {
      // 创建独立注册表
      registryRef.current = createValidationRegistry(initialExtend);
    } else {
      // 使用全局注册表，但先应用扩展
      if (initialExtend) {
        Object.entries(initialExtend).forEach(([name, factory]) => {
          globalValidationRegistry.override(name, factory);
        });
      }
      registryRef.current = globalValidationRegistry;
    }
  }

  const registry = registryRef.current;

  // 注册新规则
  const register = useCallback(
    (name: string, factory: RuleFactory) => {
      registry.register(name, factory);
    },
    [registry]
  );

  // 覆盖规则
  const override = useCallback(
    (name: string, factory: RuleFactory) => {
      registry.override(name, factory);
    },
    [registry]
  );

  // 批量扩展
  const extend = useCallback(
    (rules: Record<string, RuleFactory>) => {
      registry.registerAll(rules);
    },
    [registry]
  );

  // 检查规则是否存在
  const has = useCallback((name: string) => registry.has(name), [registry]);

  // 获取所有规则名称
  const getNames = useCallback(() => registry.getNames(), [registry]);

  // 转换为 schema
  const toSchema = useCallback(
    (
      rules: PresetRule[],
      schemaOptions?: { label?: string; baseType?: "string" | "number" | "any" }
    ) => registry.toSchema(rules, schemaOptions),
    [registry]
  );

  return useMemo(
    () => ({
      register,
      override,
      extend,
      has,
      getNames,
      toSchema,
      registry,
    }),
    [register, override, extend, has, getNames, toSchema, registry]
  );
}

// ============================================================================
// Context Provider
// ============================================================================

const ValidationPresetsContext = createContext<UseValidationPresetsReturn | null>(
  null
);

export type ValidationPresetsProviderProps = {
  children: ReactNode;
  /**
   * 扩展规则
   */
  extend?: Record<string, RuleFactory>;
  /**
   * 是否使用独立注册表
   */
  isolated?: boolean;
};

/**
 * 验证预设 Provider
 *
 * 用于在应用级别配置验证预设，所有子组件共享
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ValidationPresetsProvider
 *       extend={{
 *         email: (config) => v.check(
 *           (val) => !val || /@company\.com$/.test(String(val)),
 *           '请使用公司邮箱'
 *         ),
 *         employeeId: (config) => v.check(
 *           (val) => !val || /^EMP\d{6}$/.test(String(val)),
 *           '员工编号格式不正确'
 *         ),
 *       }}
 *     >
 *       <MyForms />
 *     </ValidationPresetsProvider>
 *   );
 * }
 * ```
 */
export function ValidationPresetsProvider({
  children,
  extend,
  isolated = false,
}: ValidationPresetsProviderProps) {
  const presets = useValidationPresets({ extend, isolated });

  return (
    <ValidationPresetsContext.Provider value={presets}>
      {children}
    </ValidationPresetsContext.Provider>
  );
}

/**
 * 使用 Provider 中的验证预设
 *
 * 如果没有 Provider，则使用默认全局预设
 */
export function useValidationPresetsContext(): UseValidationPresetsReturn {
  const context = useContext(ValidationPresetsContext);
  if (!context) {
    // 没有 Provider 时使用默认 hook
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useValidationPresets();
  }
  return context;
}

// ============================================================================
// 导出默认规则工厂 (方便用户参考和扩展)
// ============================================================================

export { defaultRuleFactories };
