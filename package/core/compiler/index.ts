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

    // 5. 输出警告信息
    if (report.warnings.length > 0) {
      report.warnings.forEach((warning) =>
        console.warn(`[SchemaCompiler] ${warning}`)
      );
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
          validate: field.validate,
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
      | undefined,
    rules: SchemaRule[]
  ) {
    if (!options) return;

    if (Array.isArray(options)) {
      // 静态选项，直接作为默认值或初始状态？
      // 我们生成一个同步的 derive 规则，或者直接在 Runtime 初始化时注入 meta
      // 为了统一，我们生成一个总是返回该数组的 derive rule?
      // 不，Options 应该存储在 meta.options 中。
      // 我们可以生成一个 effect 类型的规则，或者 options 类型的规则。
      rules.push({
        type: "options",
        target,
        deps: [], // 静态无依赖
        fetcher: async () => options,
        priority: 0,
      });
    } else if (typeof options === "function") {
      // 异步函数
      // 无法自动推断 deps，暂时假设无依赖或由用户负责
      // 这是一个 limitation，同 compute function。
      // 理想情况下应该支持 { fetcher: ..., deps: [...] }
      console.warn(
        `Async options for ${target} cannot be statically analyzed for dependencies.`
      );
      rules.push({
        type: "options",
        target,
        deps: [], // TODO: Manual deps
        fetcher: options as any,
        priority: 0,
      });
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
      // 函数类型无法静态分析依赖，除非用户显式提供 deps (当前 SchemaInput 尚未支持显式 deps，假设全量或后续改进)
      // 暂时假设为 [] 或 运行时动态追踪 (Proxy)
      // 为了安全和性能，V3 计划推荐 字符串表达式 或 带 deps 的对象配置
      // 这里为了兼容简单写法，暂时无法提取 deps。
      // TODO: SchemaInput should support { expr, deps } object
      console.warn(
        `Function definition for ${target} cannot be statically analyzed for dependencies.`
      );
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
