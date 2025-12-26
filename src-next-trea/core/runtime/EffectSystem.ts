import type { CompiledSchema, EvalScope, SchemaRule } from "../../types";
import type { FormApi } from "@tanstack/react-form";
import type { AsyncScheduler } from "./AsyncScheduler";

// 简化 FormApi 类型定义，避免泛型地狱
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFormApi = FormApi<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

// ============================================================================
// Types
// ============================================================================

/**
 * 效果追踪日志
 */
export type EffectTrace = {
  ruleId: string;
  target: string;
  type: SchemaRule["type"];
  duration: number;
  result: any;
  error?: Error;
  timestamp: number;
};

/**
 * 字段 Meta 状态
 */
export type FieldMeta = {
  isVisible: boolean;
  isDisabled: boolean;
  isRequired: boolean;
  options?: any[];
  error?: string;
};

/**
 * EffectSystem 配置
 */
export type EffectSystemConfig = {
  /** 是否启用 DevTools 追踪 */
  enableTracing?: boolean;
  /** 追踪日志最大条数 */
  maxTraceCount?: number;
  /** 错误回调 */
  onError?: (
    error: Error,
    context: { rule: SchemaRule; target: string }
  ) => void;
  /** 外部上下文 (注入到 EvalScope.context) */
  externalContext?: Record<string, any>;
};

/**
 * 副作用系统 (Runtime Core - V4 Enhanced)
 * 负责调度所有派生规则、条件判断和联动逻辑
 *
 * 核心特性:
 * - Snapshot Batching: 基于状态快照计算，最后合并提交
 * - Conflict Resolution: 高优先级覆盖低优先级
 * - Error Boundary: 规则失败不阻断表单
 * - Runtime Freezing: scope 对象浅冻结防止修改
 */
export class EffectSystem {
  private schema: CompiledSchema;
  private form: AnyFormApi;
  private scheduler: AsyncScheduler;
  private config: Required<EffectSystemConfig>;

  private pendingRules: Set<SchemaRule> = new Set();
  private isBatching = false;
  private traces: EffectTrace[] = [];

  /** 字段 Meta 缓存 (避免频繁读取 Form State) */
  private metaCache: Map<string, FieldMeta> = new Map();

  constructor(
    schema: CompiledSchema,
    form: AnyFormApi,
    scheduler: AsyncScheduler,
    config: EffectSystemConfig = {}
  ) {
    this.schema = schema;
    this.form = form;
    this.scheduler = scheduler;
    this.config = {
      enableTracing:
        config.enableTracing ?? process.env.NODE_ENV === "development",
      maxTraceCount: config.maxTraceCount ?? 1000,
      onError: config.onError ?? (() => {}),
      externalContext: config.externalContext ?? {},
    };

    // 初始化 Meta 缓存
    this.initializeMetaCache();
  }

  /**
   * 初始化所有字段的 Meta 缓存
   */
  private initializeMetaCache(): void {
    for (const fieldName of Object.keys(this.schema.fields)) {
      this.metaCache.set(fieldName, {
        isVisible: true,
        isDisabled: false,
        isRequired: false,
      });
    }
  }

  /**
   * 获取字段的 Meta 状态
   */
  getFieldMeta(fieldName: string): FieldMeta | undefined {
    return this.metaCache.get(fieldName);
  }

  /**
   * 获取所有 Meta 快照
   */
  getAllMeta(): Record<string, FieldMeta> {
    const result: Record<string, FieldMeta> = {};
    for (const [key, value] of this.metaCache) {
      result[key] = { ...value };
    }
    return result;
  }

  /**
   * 获取追踪日志
   */
  getTraces(): readonly EffectTrace[] {
    return this.traces;
  }

  /**
   * 清除追踪日志
   */
  clearTraces(): void {
    this.traces = [];
  }

  /**
   * 触发依赖更新
   * 当 TanStack Form 字段值变化时调用此方法
   * @param changedField 变化的字段名
   */
  notifyFieldChange(changedField: string) {
    const affectedRules = this.schema.dependencyMap.get(changedField);
    if (!affectedRules || affectedRules.length === 0) return;

    // 将受影响的规则加入队列
    for (const rule of affectedRules) {
      this.pendingRules.add(rule);
    }

    // 调度批量更新
    this.scheduleBatchUpdate();
  }

  /**
   * 调度批量更新 (Microtask)
   */
  private scheduleBatchUpdate() {
    if (this.isBatching) return;
    this.isBatching = true;

    queueMicrotask(() => {
      this.flushUpdates();
      this.isBatching = false;
    });
  }

  /**
   * 递归冻结对象 (Deep Freeze)
   * 确保 EvalScope 在运行时绝对不可变
   */
  private deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") return obj;

    // 如果已经是冻结的，直接返回（避免重复处理）
    if (Object.isFrozen(obj)) return obj;

    Object.freeze(obj);

    Object.getOwnPropertyNames(obj).forEach((prop) => {
      const val = (obj as any)[prop];
      if (
        val !== null &&
        (typeof val === "object" || typeof val === "function") &&
        !Object.isFrozen(val)
      ) {
        this.deepFreeze(val);
      }
    });

    return obj;
  }

  /**
   * 执行批量更新
   */
  private flushUpdates(): void {
    if (this.pendingRules.size === 0) return;

    // 1. 获取不可变快照 (Snapshot)
    // 采用 Deep Freeze 确保规则执行期间无法修改状态
    const snapshotValues = this.deepFreeze(
      this.cloneDeep(this.form.state.values)
    );
    const snapshotMeta = this.deepFreeze(this.getAllMeta());

    const scope: EvalScope = Object.freeze({
      values: snapshotValues,
      meta: snapshotMeta,
      context: Object.freeze({ ...this.config.externalContext }),
    });

    // 2. 排序规则 (按 Priority)
    const sortedRules = Array.from(this.pendingRules).sort(
      (a, b) => a.priority - b.priority
    );
    this.pendingRules.clear();

    // 3. 执行规则并收集变更
    const updates = new Map<string, any>(); // target -> newValue
    const metaUpdates = new Map<string, Partial<FieldMeta>>(); // target -> newMeta
    const rulePriorities = new Map<string, number>(); // target -> maxPriority

    for (const rule of sortedRules) {
      const startTime = performance.now();
      const target = "target" in rule ? rule.target : "effect";

      try {
        if (rule.type === "derive") {
          this.executeDeriveRule(
            rule,
            scope,
            updates,
            rulePriorities,
            startTime
          );
        } else if (rule.type === "gate") {
          this.executeGateRule(rule, scope, metaUpdates, startTime);
        } else if (rule.type === "options") {
          this.executeOptionsRule(rule, scope, startTime);
        } else if (rule.type === "effect") {
          this.executeEffectRule(rule, scope, startTime);
        }
      } catch (error) {
        // Error Boundary: 规则失败不阻断表单
        const err = error as Error;
        this.logTrace(rule, startTime, undefined, err);

        if (this.config.enableTracing) {
          console.error(
            `[EffectSystem] Rule execution failed for "${target}":`,
            err
          );
        }

        // 调用错误回调
        this.config.onError(err, { rule, target });

        // Continue to next rule (Error Isolation)
      }
    }

    // 4. 提交变更到 Form (Batch Commit)
    this.commitUpdates(updates, metaUpdates);
  }

  /**
   * 执行 derive 规则
   */
  private executeDeriveRule(
    rule: Extract<SchemaRule, { type: "derive" }>,
    scope: EvalScope,
    updates: Map<string, any>,
    rulePriorities: Map<string, number>,
    startTime: number
  ): void {
    // 冲突检测策略
    if (updates.has(rule.target)) {
      const prevPriority = rulePriorities.get(rule.target) ?? 0;
      if (rule.priority === prevPriority && this.config.enableTracing) {
        console.warn(
          `[EffectSystem] Rule conflict for "${rule.target}": ` +
            `Multiple rules with same priority (${rule.priority}). Last one wins.`
        );
      }
      // 高优先级 (或同级后执行) 覆盖
    }

    const result = rule.evaluator(scope);
    updates.set(rule.target, result);
    rulePriorities.set(rule.target, rule.priority);

    this.logTrace(rule, startTime, result);
  }

  /**
   * 执行 gate 规则
   */
  private executeGateRule(
    rule: Extract<SchemaRule, { type: "gate" }>,
    scope: EvalScope,
    metaUpdates: Map<string, Partial<FieldMeta>>,
    startTime: number
  ): void {
    const result = rule.evaluator(scope); // true/false

    if (!metaUpdates.has(rule.target)) {
      metaUpdates.set(rule.target, {});
    }
    const meta = metaUpdates.get(rule.target)!;

    // 根据 effect 类型更新 meta
    switch (rule.effect) {
      case "visible":
        meta.isVisible = result;
        break;
      case "disabled":
        meta.isDisabled = result;
        break;
      case "required":
        meta.isRequired = result;
        break;
    }

    this.logTrace(rule, startTime, result);
  }

  /**
   * 执行 options 规则 (异步)
   */
  private executeOptionsRule(
    rule: Extract<SchemaRule, { type: "options" }>,
    scope: EvalScope,
    startTime: number
  ): void {
    // 计算依赖值的 Hash
    const depsValues: Record<string, any> = {};
    for (const dep of rule.deps) {
      depsValues[dep] = this.getValueByPath(scope.values, dep);
    }

    const hash = this.scheduler.generateHash(depsValues);

    // 调度异步任务 (不等待)
    this.scheduler
      .schedule(rule.target, hash, rule.fetcher, scope)
      .then((options) => {
        // 异步更新 Meta Cache
        const meta = this.metaCache.get(rule.target);
        if (meta) {
          meta.options = options;
        }

        // 更新 Form Meta
        this.form.setFieldMeta(rule.target, (prev: any) => ({
          ...prev,
          options,
        }));

        this.logTrace(rule, startTime, options);
      })
      .catch((err) => {
        if (err?.message !== "Request aborted") {
          this.logTrace(rule, startTime, undefined, err);
          this.config.onError(err, { rule, target: rule.target });
        }
      });
  }

  /**
   * 执行 effect 规则
   */
  private executeEffectRule(
    rule: Extract<SchemaRule, { type: "effect" }>,
    scope: EvalScope,
    startTime: number
  ): void {
    // Effect 规则可以执行任意副作用
    // 提供 API 对象供规则使用
    const api = {
      setFieldValue: (name: string, value: any) => {
        this.form.setFieldValue(name, value);
      },
      setFieldMeta: (name: string, meta: Partial<FieldMeta>) => {
        const existing = this.metaCache.get(name);
        if (existing) {
          Object.assign(existing, meta);
        }
        this.form.setFieldMeta(name, (prev: any) => ({ ...prev, ...meta }));
      },
      getFieldValue: (name: string) => this.form.getFieldValue(name),
      getFieldMeta: (name: string) => this.metaCache.get(name),
    };

    rule.handler(scope, api);
    this.logTrace(rule, startTime, "effect executed");
  }

  /**
   * 提交变更到 Form
   */
  private commitUpdates(
    updates: Map<string, any>,
    metaUpdates: Map<string, Partial<FieldMeta>>
  ): void {
    // 应用 Values 变更
    for (const [target, value] of updates) {
      // 只有值真正变化时才更新，避免死循环
      const currentValue = this.form.getFieldValue(target);
      if (!this.isEqual(currentValue, value)) {
        this.form.setFieldValue(target, value);
      }
    }

    // 应用 Meta 变更 (同时更新缓存和 Form)
    for (const [target, meta] of metaUpdates) {
      // 更新缓存
      const cached = this.metaCache.get(target);
      if (cached) {
        Object.assign(cached, meta);
      } else {
        this.metaCache.set(target, {
          isVisible: true,
          isDisabled: false,
          isRequired: false,
          ...meta,
        });
      }

      // 更新 Form Meta
      this.form.setFieldMeta(target, (prev: any) => ({ ...prev, ...meta }));
    }
  }

  /**
   * 通过路径获取值 (支持嵌套路径如 "a.b.c")
   */
  private getValueByPath(obj: Record<string, any>, path: string): any {
    const keys = path.split(".");
    let current: any = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * 简单的深拷贝
   */
  private cloneDeep<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) {
      return obj.map((item) => this.cloneDeep(item)) as unknown as T;
    }
    const cloned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.cloneDeep((obj as any)[key]);
      }
    }
    return cloned;
  }

  /**
   * 简单的相等性比较
   */
  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === null || b === null) return a === b;
    if (typeof a !== "object" || typeof b !== "object") return a === b;

    // 简单的 JSON 比较 (适用于简单对象)
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }

  /**
   * 记录追踪日志
   */
  private logTrace(
    rule: SchemaRule,
    startTime: number,
    result: any,
    error?: Error
  ): void {
    if (!this.config.enableTracing) return;

    const trace: EffectTrace = {
      ruleId: "target" in rule ? `${rule.type}:${rule.target}` : `${rule.type}`,
      target: "target" in rule ? rule.target : "effect",
      type: rule.type,
      duration: performance.now() - startTime,
      result,
      error,
      timestamp: Date.now(),
    };

    this.traces.push(trace);

    // 限制追踪日志大小
    while (this.traces.length > this.config.maxTraceCount) {
      this.traces.shift();
    }
  }

  /**
   * 初始化执行所有规则 (首次渲染)
   */
  initialize(): void {
    // 将所有规则加入待执行队列
    for (const rule of this.schema.rules) {
      this.pendingRules.add(rule);
    }
    this.scheduleBatchUpdate();
  }

  /**
   * 更新外部上下文
   */
  updateContext(context: Record<string, any>): void {
    this.config.externalContext = {
      ...this.config.externalContext,
      ...context,
    };
  }
}
