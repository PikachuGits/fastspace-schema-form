import type {
  CompiledSchema,
  FieldConfig,
  SchemaInput,
  SchemaRule,
  SchemaField,
  EvalScope,
  LayoutNode,
  SchemaMeta,
} from "../../types";
import { safeEvaluator } from "./evaluator";
import { DependencyAnalyzer } from "./dependencyAnalyzer";
import { resolveValidate } from "../validation/presets";

// ============================================================================
// SemVer 工具函数
// ============================================================================

/** 解析后的版本号 */
type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
};

/**
 * 解析 SemVer 版本字符串
 * @param version 版本字符串 (e.g., "1.2.3", "1.0.0-beta.1")
 */
function parseVersion(version: string): ParsedVersion | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
  };
}

/**
 * 检查版本是否满足 SemVer Range
 * 支持的格式: ^1.0.0, ~1.0.0, >=1.0.0, 1.0.0, 1.x, *
 */
function satisfiesRange(version: string, range: string): boolean {
  const parsed = parseVersion(version);
  if (!parsed) return false;

  // 通配符
  if (range === "*" || range === "x") return true;

  // 主版本通配符 (1.x, 1.x.x)
  if (range.match(/^(\d+)\.x(\.x)?$/)) {
    const major = parseInt(range.split(".")[0], 10);
    return parsed.major === major;
  }

  // ^ 符号: 兼容同一主版本
  if (range.startsWith("^")) {
    const rangeParsed = parseVersion(range.slice(1));
    if (!rangeParsed) return false;

    // ^0.x.y 只兼容同一 minor
    if (rangeParsed.major === 0) {
      return (
        parsed.major === 0 &&
        parsed.minor === rangeParsed.minor &&
        parsed.patch >= rangeParsed.patch
      );
    }

    return (
      parsed.major === rangeParsed.major &&
      (parsed.minor > rangeParsed.minor ||
        (parsed.minor === rangeParsed.minor &&
          parsed.patch >= rangeParsed.patch))
    );
  }

  // ~ 符号: 兼容同一次版本
  if (range.startsWith("~")) {
    const rangeParsed = parseVersion(range.slice(1));
    if (!rangeParsed) return false;

    return (
      parsed.major === rangeParsed.major &&
      parsed.minor === rangeParsed.minor &&
      parsed.patch >= rangeParsed.patch
    );
  }

  // >= 符号
  if (range.startsWith(">=")) {
    const rangeParsed = parseVersion(range.slice(2));
    if (!rangeParsed) return false;

    if (parsed.major !== rangeParsed.major)
      return parsed.major > rangeParsed.major;
    if (parsed.minor !== rangeParsed.minor)
      return parsed.minor > rangeParsed.minor;
    return parsed.patch >= rangeParsed.patch;
  }

  // 精确匹配
  return version === range;
}

// ============================================================================
// 编译器配置
// ============================================================================

export type CompilerOptions = {
  /** 当前运行时版本 (用于兼容性检查) */
  runtimeVersion?: string;
  /** 是否启用严格模式 (循环依赖时抛出异常) */
  strictMode?: boolean;
  /** 是否跳过安全验证 (不推荐) */
  skipSecurityValidation?: boolean;
};

/** 默认运行时版本 */
const RUNTIME_VERSION = "1.0.0";

/**
 * Schema 编译器 (V4)
 */
export class SchemaCompiler {
  private options: Required<CompilerOptions>;
  private dependencyAnalyzer: DependencyAnalyzer;

  constructor(options: CompilerOptions = {}) {
    this.options = {
      runtimeVersion: options.runtimeVersion ?? RUNTIME_VERSION,
      strictMode: options.strictMode ?? true,
      skipSecurityValidation: options.skipSecurityValidation ?? false,
    };

    this.dependencyAnalyzer = new DependencyAnalyzer({
      strictMode: this.options.strictMode,
    });
  }

  compile(input: SchemaInput): CompiledSchema {
    // 1. 版本检查
    this.checkVersion(input.meta);

    // 2. 扁平化字段与提取规则
    const fields: Record<string, FieldConfig> = {};
    const rawRules: SchemaRule[] = [];

    const layout = this.processFields(input.fields, fields, rawRules);

    // 收集所有字段名
    const allFieldNames = Object.keys(fields);

    // 3. 依赖分析与排序
    const analysisResult = this.dependencyAnalyzer.analyze(
      rawRules,
      allFieldNames
    );
    const { dependencyMap, topologicalOrder, report } = analysisResult;

    // 4. 为规则分配优先级 (基于拓扑排序)
    const nodePriority = new Map<string, number>();
    topologicalOrder.forEach((node, index) => nodePriority.set(node, index));

    const rules = rawRules.map((rule) => {
      const target = "target" in rule ? rule.target : "";
      const priority = nodePriority.get(target) ?? 0;
      return { ...rule, priority };
    });

    // 对 dependencyMap 中的规则排序
    for (const [, depRules] of dependencyMap.entries()) {
      depRules.sort((a, b) => a.priority - b.priority);
    }

    // 5. 输出警告信息 (仅在开发模式下输出 info 级别日志，避免控制台噪音)
    if (process.env.NODE_ENV === "development" && report.warnings.length > 0) {
      report.warnings.forEach((warning) => {
        // 循环依赖是严重问题，使用 warn；其他信息性警告使用 info
        if (warning.includes("Cyclic dependencies")) {
          console.warn(`[SchemaCompiler] ${warning}`);
        } else {
          console.info(`[SchemaCompiler] ${warning}`);
        }
      });
    }

    return {
      meta: input.meta || { version: "0.0.0" },
      fields,
      layout,
      rules,
      dependencyMap,
      topologicalOrder,
      staticAnalysisReport: {
        cycles: report.cycles,
        isolatedFields: report.isolatedFields,
      },
    };
  }

  /**
   * 版本兼容性检查
   */
  private checkVersion(meta?: SchemaMeta): void {
    if (!meta?.version) return;

    const schemaVersion = parseVersion(meta.version);
    if (!schemaVersion) {
      console.warn(
        `[SchemaCompiler] Invalid schema version format: "${meta.version}"`
      );
      return;
    }

    // 检查 compatibleWith
    if (meta.compatibleWith && meta.compatibleWith.length > 0) {
      const runtimeVersion = this.options.runtimeVersion;
      const isCompatible = meta.compatibleWith.some((range) =>
        satisfiesRange(runtimeVersion, range)
      );

      if (!isCompatible) {
        const message =
          `Schema version ${meta.version} is not compatible with runtime version ${runtimeVersion}. ` +
          `Compatible versions: ${meta.compatibleWith.join(", ")}`;

        if (this.options.strictMode) {
          throw new Error(`[SchemaCompiler] ${message}`);
        } else {
          console.warn(`[SchemaCompiler] ${message}`);
        }
      }
    }
  }

  private processFields(
    schemaFields: SchemaField[],
    fieldsMap: Record<string, FieldConfig>,
    rules: SchemaRule[],
    parentPath: string = ""
  ): LayoutNode[] {
    const layoutNodes: LayoutNode[] = [];

    for (const field of schemaFields) {
      const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name;

      // 如果有 children，则视为 Container (或 FormList，暂且视为 Layout 容器)
      // 如果 component 是 Layout 类型 (Grid, Stack)，则它本身是 container
      // 简单判断：如果 defined children，就是 container node，但也可能是 field (FormList)
      // 这里我们假设：如果 component 是已知布局组件，或者是 group，则是 container
      // 否则是 field (叶子节点)

      // 为了简化，我们把所有节点都作为 LayoutNode 处理
      const isLayoutComponent = ["Grid", "Stack", "Card", "Group"].includes(
        field.component
      );
      const hasChildren = field.children && field.children.length > 0;

      if (isLayoutComponent || (hasChildren && !field.name)) {
        // 纯布局容器 (无 name 或显式布局组件)
        const childrenNodes = field.children
          ? this.processFields(field.children, fieldsMap, rules, parentPath)
          : [];
        layoutNodes.push({
          type: "container",
          component: field.component,
          props: field.ui,
          children: childrenNodes,
        });
      } else {
        // 字段 (Field)
        // 1. 注册字段
        // 自动转换预设规则数组为 valibot schema
        const resolvedValidate = resolveValidate(field.validate, {
          label: field.ui?.label as string | undefined,
        });

        fieldsMap[fieldPath] = {
          name: fieldPath,
          component: field.component,
          defaultValue: field.defaultValue,
          props: {
            ...field.ui,
            // 布局属性（仅在字段根级别配置）
            colSpan: field.colSpan,
            independent: field.independent,
            // 静态 options 直接放入 props (作为 fallback，Runtime 设置的 meta.options 优先)
            ...(Array.isArray(field.options) ? { options: field.options } : {}),
          },
          validate: resolvedValidate,
        };

        // 2. 提取规则
        this.extractRule(
          fieldPath,
          field.visibleWhen,
          "gate",
          "visible",
          rules
        );
        this.extractRule(
          fieldPath,
          field.disabledWhen,
          "gate",
          "disabled",
          rules
        );
        this.extractRule(
          fieldPath,
          field.requiredWhen,
          "gate",
          "required",
          rules
        );
        this.extractRule(fieldPath, field.compute, "derive", undefined, rules);
        this.extractOptionsRule(fieldPath, field.options, rules);

        // 3. 处理子字段 (针对 FormList 或 ObjectField)
        let childrenNodes: LayoutNode[] = [];
        if (field.children) {
          childrenNodes = this.processFields(
            field.children,
            fieldsMap,
            rules,
            fieldPath
          );
        }

        layoutNodes.push({
          type: "field",
          field: fieldPath,
          children: childrenNodes.length > 0 ? childrenNodes : undefined,
        });
      }
    }
    return layoutNodes;
  }

  private extractOptionsRule(
    target: string,
    options:
      | any[]
      | ((scope: EvalScope, signal?: AbortSignal) => Promise<any[]>)
      | { fetcher: (scope: EvalScope, signal?: AbortSignal) => Promise<any[]>; deps: string[] }
      | undefined,
    rules: SchemaRule[]
  ) {
    if (!options) return;

    if (Array.isArray(options)) {
      // 静态选项
      rules.push({
        type: "options",
        target,
        deps: [], // 静态无依赖
        fetcher: async () => options,
        priority: 0,
      });
    } else if (typeof options === "function") {
      // 异步函数（无依赖追踪）
      // 仅在开发模式下输出 info 级别日志
      if (process.env.NODE_ENV === "development") {
        console.info(
          `[SchemaCompiler] Async options for "${target}" has no deps. Consider using { fetcher, deps } format for cascade select.`
        );
      }
      rules.push({
        type: "options",
        target,
        deps: [],
        fetcher: options as any,
        priority: 0,
      });
    } else if (typeof options === "object" && "fetcher" in options) {
      // 异步选项 + 手动依赖（推荐用于级联选择）
      const { fetcher, deps = [] } = options;
      rules.push({
        type: "options",
        target,
        deps,
        fetcher: fetcher as any,
        priority: 0,
      });
    }
  }

  /**
   * 从函数源码中提取依赖字段 (best-effort)
   *
   * 匹配以下模式:
   * - scope.values.fieldName     (点访问)
   * - scope.values["fieldName"]  (括号访问)
   * - scope.values['fieldName']  (括号访问)
   * - 解构后的 values.fieldName  (如 ({ values }) => values.xxx)
   *
   * @param fn 待分析的函数
   * @param excludeField 排除的字段名 (通常是字段自身，避免自依赖)
   */
  private extractDepsFromFunction(
    fn: (scope: EvalScope) => any,
    excludeField?: string
  ): string[] {
    try {
      const source = fn.toString();
      const deps = new Set<string>();

      // 匹配 *.values.fieldName 或独立 values.fieldName (解构场景)
      // \b 确保 "values" 是一个完整单词 (不会匹配 myvalues.xxx)
      const dotPattern = /\bvalues\.(\w+)/g;
      let match;
      while ((match = dotPattern.exec(source)) !== null) {
        deps.add(match[1]);
      }

      // 匹配 values["fieldName"] 或 values['fieldName'] (括号访问)
      const bracketPattern = /\bvalues\[["'](\w+)["']\]/g;
      while ((match = bracketPattern.exec(source)) !== null) {
        deps.add(match[1]);
      }

      // 排除字段自身，避免自依赖 (derive 规则读取自身值是常见模式，但不应触发自身)
      if (excludeField) {
        deps.delete(excludeField);
      }

      return Array.from(deps);
    } catch {
      // 解析失败时返回空依赖 (降级为仅初始化时执行)
      return [];
    }
  }

  private extractRule(
    target: string,
    definition: string | ((scope: EvalScope) => any) | undefined,
    type: "gate" | "derive",
    effectType: "visible" | "disabled" | "required" | undefined,
    rules: SchemaRule[]
  ) {
    if (!definition) return;

    let evaluator: (scope: EvalScope) => any;
    let deps: string[] = [];

    if (typeof definition === "function") {
      evaluator = definition;
      // 从函数源码中提取依赖 (best-effort 静态分析)
      deps = this.extractDepsFromFunction(definition, target);

      if (process.env.NODE_ENV === "development" && deps.length === 0) {
        console.info(
          `[SchemaCompiler] No dependencies extracted from function for "${target}". ` +
          `The rule will only run on initialization. ` +
          `Use scope.values.xxx pattern or string expressions for automatic dependency detection.`
        );
      }
    } else {
      // 字符串表达式
      evaluator = safeEvaluator.compile(definition);
      deps = safeEvaluator.extractDependencies(definition);
    }

    if (type === "gate") {
      rules.push({
        type: "gate",
        target,
        deps,
        evaluator: evaluator as (scope: EvalScope) => boolean,
        effect: effectType as any,
        priority: 0, // Placeholder, will be updated
      });
    } else if (type === "derive") {
      rules.push({
        type: "derive",
        target,
        deps,
        evaluator,
        priority: 0, // Placeholder
      });
    }
  }
}

/** 默认编译器实例 */
export const schemaCompiler = new SchemaCompiler();

/** 创建自定义配置的编译器 */
export function createCompiler(options: CompilerOptions): SchemaCompiler {
  return new SchemaCompiler(options);
}
