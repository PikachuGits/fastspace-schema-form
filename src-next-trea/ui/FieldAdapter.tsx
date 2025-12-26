import React, { memo, useCallback, useSyncExternalStore } from 'react';
import { useRuntime } from '../react/SchemaFormProvider';
import { valibotValidator } from '../core/validation/valibotAdapter';
import type { FieldMeta } from '../core/runtime/EffectSystem';
import type { LayoutNode } from '../types';

// ============================================================================
// Types
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFormApi = any;

export interface WidgetProps {
    /** 字段值 */
    value: any;
    /** 值变更回调 */
    onChange: (val: any) => void;
    /** 失焦回调 */
    onBlur: () => void;
    /** 错误信息 */
    error?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否可见 */
    visible?: boolean;
    /** 是否必填 */
    required?: boolean;
    /** 选项列表 (Select/Radio 等) */
    options?: any[];
    /** 字段名 */
    name?: string;
    /** 是否为脏数据 */
    isDirty?: boolean;
    /** 是否被触摸过 */
    isTouched?: boolean;
    /** 子布局节点 (用于容器型 Widget) */
    layoutChildren?: LayoutNode[];
}

export type FieldAdapterProps = {
    form: AnyFormApi;
    name: string;
    validate?: any; // Valibot schema
    render: (props: WidgetProps) => React.ReactNode;
    /** 额外的 props 透传 */
    fieldProps?: Record<string, any>;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * 订阅 Runtime Meta 状态的 Hook
 * 使用 useSyncExternalStore 实现高效订阅
 */
function useFieldMeta(fieldName: string): FieldMeta | undefined {
    const runtime = useRuntime();

    // 订阅函数
    const subscribe = useCallback(
        (callback: () => void) => {
            // 简单实现：使用轮询检查
            // 更好的实现需要在 EffectSystem 中增加事件发射
            const interval = setInterval(callback, 100);
            return () => clearInterval(interval);
        },
        []
    );

    // 获取快照
    const getSnapshot = useCallback(() => {
        return runtime.getFieldMeta(fieldName);
    }, [runtime, fieldName]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ============================================================================
// Component
// ============================================================================

/**
 * 字段适配器 (V4 Enhanced)
 *
 * 特性:
 * - Selector Subscription: 细粒度订阅减少重渲染
 * - Runtime Meta 集成: 自动读取 visible/disabled/required
 * - Validation 集成: 支持 Valibot schema
 */
export const FieldAdapter = memo(function FieldAdapter({
    form,
    name,
    validate,
    render,
    fieldProps,
}: FieldAdapterProps) {
    const runtime = useRuntime();

    // 从 Runtime 获取 Meta 状态
    const meta = useFieldMeta(name);

    // 转换 validator
    const validators = React.useMemo(() => {
        if (!validate) return undefined;
        return {
            onChange: valibotValidator(validate),
        };
    }, [validate]);

    // 如果不可见，直接返回 null
    if (meta?.isVisible === false) {
        return null;
    }

    return (
        <form.Field
            name={name}
            validators={validators}
            children={(fieldApi: any) => {
                const { state, handleChange, handleBlur } = fieldApi;

                // 拦截 onChange 以通知 Runtime
                const onChange = (val: any) => {
                    handleChange(val);
                    // 关键：通知 EffectSystem
                    runtime.notifyChange(name);
                };

                // 合并 meta (优先使用 Runtime Meta)
                const isDisabled = meta?.isDisabled ?? state.meta?.isDisabled ?? false;
                const isRequired = meta?.isRequired ?? state.meta?.isRequired ?? false;
                const options = meta?.options ?? state.meta?.options ?? [];

                // 获取错误信息
                const error = state.meta?.errors?.[0] ?? meta?.error;

                return render({
                    name,
                    value: state.value,
                    onChange,
                    onBlur: handleBlur,
                    error,
                    disabled: isDisabled,
                    visible: true,
                    required: isRequired,
                    options,
                    isDirty: state.meta?.isDirty,
                    isTouched: state.meta?.isTouched,
                    ...fieldProps,
                });
            }}
        />
    );
});

/**
 * 创建绑定了 form 的 FieldAdapter
 * 减少重复传递 form 参数
 */
export function createFieldAdapter(form: AnyFormApi) {
    return function BoundFieldAdapter(
        props: Omit<FieldAdapterProps, 'form'>
    ) {
        return <FieldAdapter form={form} {...props} />;
    };
}
