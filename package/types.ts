
// ============================================================================
// Core Types for Next-Gen Schema Form (V4)
// ============================================================================

/**
 * 运行时评估作用域
 * 必须在运行时被 Object.freeze() 浅冻结
 */
export type EvalScope = Readonly<{
    values: Record<string, any>;
    meta: Record<string, any>; // 包含 visible, disabled, required 等状态
    context: Record<string, any>; // 外部注入的上下文
}>;

/**
 * 规则类型定义
 */
export type SchemaRule =
    | {
        type: 'derive';
        target: string;
        deps: string[];
        /** 预编译后的执行函数 */
        evaluator: (scope: EvalScope) => any;
        priority: number;
    }
    | {
        type: 'gate';
        target: string;
        deps: string[];
        evaluator: (scope: EvalScope) => boolean;
        effect: 'visible' | 'disabled' | 'required';
        priority: number;
    }
    | {
        type: 'options';
        target: string;
        deps: string[];
        fetcher: (scope: EvalScope, signal: AbortSignal) => Promise<any>;
        /** 生成缓存 Key 的策略，e.g., `${field}:${hash(deps)}` */
        cacheKey?: (scope: EvalScope) => string;
        priority: number;
    }
    | {
        type: 'effect';
        deps: string[];
        handler: (scope: EvalScope, api: any) => void;
        priority: number;
    };

/**
 * Schema 版本与兼容性信息
 */
export type SchemaMeta = {
    version: string; // SemVer, e.g. "1.0.0"
    compatibleWith?: string[]; // e.g. ["^1.0.0"]
};

/**
 * 字段配置 (Compiler 输出)
 */
export type FieldConfig = {
    name: string;
    component: string;
    defaultValue?: any;
    props?: Record<string, any>;
    // 校验规则 (Valibot schema builder or similar)
    validate?: any;
};

/**
 * 布局节点
 */
export type LayoutNode = {
    type: 'field' | 'container';
    /** 如果是 field，对应 fieldPath */
    field?: string;
    /** 如果是 container，对应组件名 (Grid, Stack, Card...) */
    component?: string;
    props?: Record<string, any>;
    children?: LayoutNode[];
};

/**
 * 编译后的 Schema (Runtime 输入)
 */
export type CompiledSchema = {
    meta: SchemaMeta;
    fields: Record<string, FieldConfig>;
    /** 布局树 */
    layout: LayoutNode[];
    /** 扁平化的规则列表，已排序 */
    rules: SchemaRule[];
    /** 反向依赖索引: DepField -> Rules[] */
    dependencyMap: Map<string, SchemaRule[]>;
    /** 拓扑排序序列 (字段名) */
    topologicalOrder: string[];
    /** 静态分析报告 */
    staticAnalysisReport?: {
        cycles: string[][];
        isolatedFields: string[];
    };
};

/**
 * 用户输入的 Schema (Source)
 */
export type SchemaInput = {
    meta?: SchemaMeta;
    fields: SchemaField[];
};

export type SchemaField = {
    name: string;
    component: string;
    defaultValue?: any;
    // 简写语法，Compiler 会将其转换为 Rule
    visibleWhen?: string | ((scope: EvalScope) => boolean);
    disabledWhen?: string | ((scope: EvalScope) => boolean);
    requiredWhen?: string | ((scope: EvalScope) => boolean);
    compute?: string | ((scope: EvalScope) => any);
    /** 校验规则 (Valibot Schema or Adapter) */
    validate?: any;
    /** 选项配置 (数组 或 异步函数) */
    options?: any[] | ((scope: EvalScope, signal?: AbortSignal) => Promise<any[]>);
    // 嵌套结构
    children?: SchemaField[];
    /** 栅格布局配置 (MUI Grid size) */
    colSpan?: number | Record<string, number>; // { xs: 12, md: 6 }
    /** 独占一行（组件占满整行，内部宽度由 colSpan 控制） */
    independent?: boolean;
    // 其他 UI 属性
    ui?: Record<string, any>;
};
