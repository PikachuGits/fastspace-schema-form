import React, { memo, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useRuntime } from '../react/SchemaFormProvider';
import { valibotValidator } from '../core/validation/valibotAdapter';
import { isPresetRulesArray, presetToSchema, type PresetRule } from '../core/validation/presets';
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
    /**
     * 校验规则
     * - Valibot schema: 直接使用 valibot 校验
     * - PresetRule[]: 预设规则数组，格式为 [{type: 'required', message: '必填'}, {type: 'email'}]
     */
    validate?: any | PresetRule[];
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
            return runtime.subscribe(fieldName, callback);
        },
        [runtime, fieldName]
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
 * - Validation 集成: 支持 Valibot schema 和预设规则数组
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

    // 转换 validator - 支持预设规则数组和 valibot schema
    const validators = useMemo(() => {
        if (!validate) return undefined;

        // 检测是否是预设规则数组 [{type: 'required'}, {type: 'email'}]
        let schema = validate;
        if (isPresetRulesArray(validate)) {
            // 从 fieldProps 获取 label 用于错误消息
            const label = fieldProps?.label || name;
            schema = presetToSchema(validate, { label });
        }

        const validatorFn = valibotValidator(schema);
        return {
            onChange: validatorFn,
            onBlur: validatorFn,
        };
    }, [validate, fieldProps?.label, name]);

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

                // 获取错误信息 - 根据字段状态智能选择错误源
                // TanStack Form 的 errorMap 按验证事件类型分隔错误
                const errorMap = state.meta?.errorMap;
                const isDirty = state.meta?.isDirty;
                
                // errorMap 的值可能是字符串或数组
                const getFirstError = (err: unknown): string | undefined => {
                    if (!err) return undefined;
                    if (typeof err === 'string') return err;
                    if (Array.isArray(err)) return err[0];
                    return undefined;
                };
                
                // 根据字段是否被修改来决定显示哪个错误
                // - 如果字段已修改（isDirty），使用 onChange 验证结果
                //   （如果 onChange 验证通过，errorMap.onChange 为 undefined，应该清除错误）
                // - 如果字段未修改但被触摸过，使用 onBlur 验证结果
                let error: string | undefined;
                if (isDirty) {
                    // 字段已修改，只看 onChange 结果
                    error = getFirstError(errorMap?.onChange);
                } else {
                    // 字段未修改，看 onBlur 或 errors
                    error = getFirstError(errorMap?.onBlur) ?? state.meta?.errors?.[0];
                }
                // 最后 fallback 到 runtime meta error
                error = error ?? meta?.error;

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
