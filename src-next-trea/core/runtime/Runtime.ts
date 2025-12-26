import type { CompiledSchema } from '../../types';
import type { FormApi } from '@tanstack/react-form';
import { EffectSystem, type EffectSystemConfig, type FieldMeta } from './EffectSystem';
import { AsyncScheduler, type AsyncSchedulerConfig } from './AsyncScheduler';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFormApi = FormApi<any, any, any, any, any, any, any, any, any, any, any, any>;

/**
 * 运行时配置
 */
export type RuntimeConfig = {
    /** EffectSystem 配置 */
    effect?: EffectSystemConfig;
    /** AsyncScheduler 配置 */
    async?: AsyncSchedulerConfig;
    /** 是否自动初始化 (执行所有规则) */
    autoInitialize?: boolean;
};

/**
 * 表单运行时 (Facade - V4)
 *
 * 统一管理 EffectSystem 和 AsyncScheduler，提供简洁的 API。
 */
export class FormRuntime {
    public readonly effectSystem: EffectSystem;
    public readonly asyncScheduler: AsyncScheduler;
    public readonly schema: CompiledSchema;

    private form: AnyFormApi;
    private initialized = false;

    constructor(schema: CompiledSchema, form: AnyFormApi, config: RuntimeConfig = {}) {
        this.schema = schema;
        this.form = form;

        // 初始化 AsyncScheduler
        this.asyncScheduler = new AsyncScheduler(config.async);

        // 初始化 EffectSystem
        this.effectSystem = new EffectSystem(schema, form, this.asyncScheduler, config.effect);

        // 自动初始化
        if (config.autoInitialize !== false) {
            this.initialize();
        }
    }

    /**
     * 初始化运行时 (执行所有规则)
     */
    initialize(): void {
        if (this.initialized) return;
        this.initialized = true;
        this.effectSystem.initialize();
    }

    /**
     * 通知字段变更
     */
    notifyChange(field: string): void {
        this.effectSystem.notifyFieldChange(field);
    }

    /**
     * 批量通知字段变更
     */
    notifyChanges(fields: string[]): void {
        for (const field of fields) {
            this.effectSystem.notifyFieldChange(field);
        }
    }

    /**
     * 获取字段 Meta
     */
    getFieldMeta(fieldName: string): FieldMeta | undefined {
        return this.effectSystem.getFieldMeta(fieldName);
    }

    /**
     * 获取所有字段 Meta
     */
    getAllMeta(): Record<string, FieldMeta> {
        return this.effectSystem.getAllMeta();
    }

    /**
     * 更新外部上下文
     */
    updateContext(context: Record<string, any>): void {
        this.effectSystem.updateContext(context);
    }

    /**
     * 获取调度器
     */
    get scheduler(): AsyncScheduler {
        return this.asyncScheduler;
    }

    /**
     * 获取追踪日志
     */
    getTraces() {
        return this.effectSystem.getTraces();
    }

    /**
     * 清除追踪日志
     */
    clearTraces(): void {
        this.effectSystem.clearTraces();
    }

    /**
     * 使缓存失效并重新计算
     */
    invalidateAndRefresh(field?: string): void {
        if (field) {
            this.asyncScheduler.invalidate(field);
            this.notifyChange(field);
        } else {
            this.asyncScheduler.clearCache();
            // 重新执行所有规则
            this.effectSystem.initialize();
        }
    }

    /**
     * 销毁运行时
     */
    destroy(): void {
        this.asyncScheduler.cancelAll();
        this.asyncScheduler.clearCache();
        this.effectSystem.clearTraces();
    }
}
