import type { EvalScope } from '../../types';

// ============================================================================
// Types
// ============================================================================

type CacheEntry = {
    data: any;
    timestamp: number;
    hash: string;
};

type RequestState = {
    controller: AbortController;
    hash: string;
    startTime: number;
};

/**
 * AsyncScheduler 配置
 */
export type AsyncSchedulerConfig = {
    /** 缓存过期时间 (ms)，默认 5 分钟 */
    staleTime?: number;
    /** 最大缓存条目数 */
    maxCacheSize?: number;
    /** 请求超时时间 (ms)，默认 30 秒 */
    timeout?: number;
    /** 是否启用请求去重 (同 hash 的请求只发一次) */
    deduplication?: boolean;
};

/**
 * 异步任务调度器 (V4 Enhanced)
 * 负责处理 Options 请求、异步计算等
 *
 * 特性:
 * - Race Control: AbortController + VersionHash
 * - Stable Hash: 基于内容的稳定哈希
 * - 缓存管理: LRU 策略
 * - 请求去重: 相同 hash 的请求复用
 */
export class AsyncScheduler {
    private cache = new Map<string, CacheEntry>();
    private activeRequests = new Map<string, RequestState>();
    private pendingPromises = new Map<string, Promise<any>>(); // 用于请求去重
    private config: Required<AsyncSchedulerConfig>;

    constructor(config: AsyncSchedulerConfig = {}) {
        this.config = {
            staleTime: config.staleTime ?? 5 * 60 * 1000, // 5 minutes
            maxCacheSize: config.maxCacheSize ?? 100,
            timeout: config.timeout ?? 30 * 1000, // 30 seconds
            deduplication: config.deduplication ?? true,
        };
    }

    /**
     * 执行异步任务
     * @param target 目标字段 (用于取消互斥请求)
     * @param hash 版本哈希 (deps hash)
     * @param fetcher 异步函数
     * @param scope 执行作用域
     * @returns Promise<any>
     */
    async schedule(
        target: string,
        hash: string,
        fetcher: (scope: EvalScope, signal: AbortSignal) => Promise<any>,
        scope: EvalScope
    ): Promise<any> {
        const cacheKey = `${target}:${hash}`;

        // 1. 检查缓存
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.config.staleTime)) {
            return cached.data;
        }

        // 2. 请求去重：如果相同的请求正在进行中，复用 Promise
        if (this.config.deduplication && this.pendingPromises.has(cacheKey)) {
            return this.pendingPromises.get(cacheKey);
        }

        // 3. 取消该 target 的上一次请求 (如果 hash 不同)
        const activeRequest = this.activeRequests.get(target);
        if (activeRequest && activeRequest.hash !== hash) {
            activeRequest.controller.abort();
            this.activeRequests.delete(target);
        }

        // 4. 发起新请求
        const controller = new AbortController();
        const requestState: RequestState = {
            controller,
            hash,
            startTime: Date.now(),
        };
        this.activeRequests.set(target, requestState);

        // 设置超时
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, this.config.timeout);

        // 创建请求 Promise
        const requestPromise = (async () => {
            try {
                const result = await fetcher(scope, controller.signal);

                // 版本检查 (Double Check)
                const currentRequest = this.activeRequests.get(target);
                if (currentRequest?.controller !== controller) {
                    throw new Error('Request aborted');
                }

                // 写入缓存
                this.setCache(cacheKey, result, hash);

                return result;
            } catch (error) {
                if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Request aborted')) {
                    throw new Error('Request aborted');
                }
                throw error;
            } finally {
                clearTimeout(timeoutId);

                // 清理状态
                if (this.activeRequests.get(target)?.controller === controller) {
                    this.activeRequests.delete(target);
                }
                this.pendingPromises.delete(cacheKey);
            }
        })();

        // 保存 pending promise 用于去重
        if (this.config.deduplication) {
            this.pendingPromises.set(cacheKey, requestPromise);
        }

        return requestPromise;
    }

    /**
     * 设置缓存 (带 LRU 策略)
     */
    private setCache(key: string, data: any, hash: string): void {
        // LRU 策略：如果缓存满了，删除最旧的条目
        if (this.cache.size >= this.config.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            hash,
        });
    }

    /**
     * 生成稳定的依赖哈希
     * 使用排序后的 JSON 确保相同内容生成相同 hash
     */
    generateHash(deps: Record<string, any>): string {
        try {
            return this.stableStringify(deps);
        } catch {
            // Fallback: 使用时间戳 (每次都不同)
            return `__unstable_${Date.now()}`;
        }
    }

    /**
     * 稳定的 JSON 序列化 (对象键排序)
     */
    private stableStringify(obj: any): string {
        if (obj === null || typeof obj !== 'object') {
            return JSON.stringify(obj);
        }

        if (Array.isArray(obj)) {
            return '[' + obj.map(item => this.stableStringify(item)).join(',') + ']';
        }

        // 对象：按键排序
        const sortedKeys = Object.keys(obj).sort();
        const pairs = sortedKeys.map(key => {
            const value = this.stableStringify(obj[key]);
            return `${JSON.stringify(key)}:${value}`;
        });

        return '{' + pairs.join(',') + '}';
    }

    /**
     * 取消指定目标的请求
     */
    cancel(target: string): void {
        const request = this.activeRequests.get(target);
        if (request) {
            request.controller.abort();
            this.activeRequests.delete(target);
        }
    }

    /**
     * 取消所有请求
     */
    cancelAll(): void {
        for (const [, request] of this.activeRequests) {
            request.controller.abort();
        }
        this.activeRequests.clear();
        this.pendingPromises.clear();
    }

    /**
     * 清除缓存
     */
    clearCache(target?: string): void {
        if (target) {
            // 清除指定目标的缓存
            for (const key of this.cache.keys()) {
                if (key.startsWith(`${target}:`)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    /**
     * 获取缓存统计
     */
    getCacheStats(): { size: number; maxSize: number; keys: string[] } {
        return {
            size: this.cache.size,
            maxSize: this.config.maxCacheSize,
            keys: Array.from(this.cache.keys()),
        };
    }

    /**
     * 使缓存条目失效
     */
    invalidate(target: string, hash?: string): void {
        if (hash) {
            this.cache.delete(`${target}:${hash}`);
        } else {
            this.clearCache(target);
        }
    }
}
