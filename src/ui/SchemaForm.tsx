performance.mark("schemaform-start");
import type React from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { type FieldValues, FormProvider, useForm, useWatch } from 'react-hook-form';
import { extractDependencies, evaluateCompute, isValidComputeValue } from '../core/engine/compute';
import { parseSchema } from '../core/parser/schemaParser';
import { createDynamicResolver } from '../core/validation/valibotAdapter';
import type { FieldSchema, OptionItem, SchemaFormInstance, SchemaFormProps } from '../types';
import { FieldRenderer } from './components';
import { GridLayout, StackLayout } from './layout';
import { defaultWidgets } from './widgets';

/**
 * SchemaForm 组件
 *
 * 特性：
 * 1. Schema 驱动：通过 JSON 定义表单结构、验证、联动
 * 2. 验证集成：规则直接写在 schema 的 rules 字段
 * 3. 动态联动：支持 visibleWhen、disabledWhen、requiredWhen
 * 4. 自动计算：支持 compute 表达式（健壮处理 undefined/null 值）
 */

type ValuesMap = Record<string, unknown>;


// ============================================================================
// Hooks
// ============================================================================

/** 加载单个字段的异步选项 */
async function loadFieldOptions(field: FieldSchema, values: ValuesMap): Promise<OptionItem[] | null> {
  const optionRequest = field.ui?.optionRequest;
  if (!optionRequest) {
    return null;
  }
  try {
    return await optionRequest(values as FieldValues);
  } catch {
    return field.ui?.options ?? [];
  }
}

/** 异步选项加载 Hook */
function useAsyncOptions(fields: FieldSchema[], values: ValuesMap): Record<string, OptionItem[]> {
  const [optionsMap, setOptionsMap] = useState<Record<string, OptionItem[]>>({});
  // 记录上一次的值，用于比对依赖是否变化
  const prevValuesRef = useRef<ValuesMap>({});
  // 记录是否已完成初始化加载
  const initialLoadDoneRef = useRef(false);

  // 初始化静态选项 & 重置状态
  useEffect(() => {
    // 当 fields 变化（Schema 变化）时，重置状态
    initialLoadDoneRef.current = false;
    prevValuesRef.current = {};

    const initial: Record<string, OptionItem[]> = {};
    for (const field of fields) {
      initial[field.name as string] = field.ui?.options ?? [];
    }
    setOptionsMap(initial);
  }, [fields]);

  // 加载异步选项
  useEffect(() => {
    let active = true;

    const checkAndLoad = async () => {
      const prevValues = prevValuesRef.current;
      const currentValuesSnapshot = { ...values }; // 捕获当前值

      for (const field of fields) {
        // 只有配置了 optionRequest 的字段才需要处理
        if (!field.ui?.optionRequest) continue;

        let shouldLoad = false;
        const deps = field.dependencies;

        // 策略：
        // 1. 如果没有显式定义 dependencies，则只在初始化时加载一次（防止每次表单变动都请求）
        // 2. 如果定义了 dependencies，则检查依赖值是否变化
        if (!deps || deps.length === 0) {
          if (!initialLoadDoneRef.current) {
            shouldLoad = true;
          }
        } else {
          // 检查依赖值变更
          const isChanged = deps.some((dep) => values[dep] !== prevValues[dep]);
          // 如果依赖变了，或者还没初始化过，则加载
          if (isChanged || !initialLoadDoneRef.current) {
            shouldLoad = true;
          }
        }

        if (shouldLoad) {
          try {
            const result = await loadFieldOptions(field, values);
            if (!active) return;
            if (result !== null) {
              setOptionsMap((prev) => ({
                ...prev,
                [field.name as string]: result,
              }));
            }
          } catch (error) {
            console.error(`Failed to load options for field ${String(field.name)}`, error);
          }
        }
      }

      // 更新引用
      prevValuesRef.current = currentValuesSnapshot;
      initialLoadDoneRef.current = true;
    };

    checkAndLoad();

    return () => {
      active = false;
    };
  }, [fields, values]);

  return optionsMap;
}

// ============================================================================
// Utils
// ============================================================================

// ============================================================================
// SchemaForm Component
// ============================================================================

import { getWatchFields } from '../core/engine/fieldState';

/** SchemaForm 内部实现 */
function SchemaFormInner<T extends FieldValues>(props: SchemaFormProps<T>, ref: React.Ref<SchemaFormInstance<T>>) {
  const {
    schema,
    defaultValues: externalDefaults,
    onSubmit,
    onValuesChange,
    grid = true,
    readOnly = false,
    disabled = false,
    widgets: customWidgets = {},
    children,
    spacing: propSpacing,
  } = props;

  // useEffect(() => {
  //   performance.mark("schemaform-mounted");
  //   performance.measure(
  //     "schemaform-render",
  //     "schemaform-start",
  //     "schemaform-mounted"
  //   );

  //   const [entry] = performance.getEntriesByName("schemaform-render");
  //   console.log(
  //     "📦 SchemaForm 首次渲染耗时:",
  //     entry?.duration.toFixed(2),
  //     "ms"
  //   );
  // }, []);
  // 解析 Schema
  const parsed = useMemo(() => {
    performance.mark("schema-parse-start");
    const result = parseSchema(schema);
    performance.mark("schema-parse-end");

    performance.measure(
      "schema-parse",
      "schema-parse-start",
      "schema-parse-end"
    );
    // const [entry] = performance.getEntriesByName("schema-parse");
    // console.log("🧩 schema-parse 耗时:", entry?.duration.toFixed(2), "ms");

    return result;
  }, [schema]);

  // ✅ 关键修复：使用 useRef 确保 defaultValues 只在首次渲染时设置
  // React Hook Form v7 会在 defaultValues 引用变化时自动 reset 表单
  // 这会导致用户清空字段后被自动回填
  const initialDefaultValuesRef = useRef<ValuesMap | undefined>(undefined);

  // 只在首次渲染时记录 defaultValues
  if (initialDefaultValuesRef.current === undefined) {
    // 优先使用外部传入的 defaultValues，缺失的部分使用 Schema 中的 defaultValues
    initialDefaultValuesRef.current = {
      ...parsed.defaultValues,
      ...(externalDefaults || {}),
    };
  }

  // 合并 Widgets
  const allWidgets = useMemo(() => ({ ...defaultWidgets, ...customWidgets }), [customWidgets]);

  // 创建动态 resolver
  const resolver = useMemo(() => createDynamicResolver(parsed), [parsed]);

  // ✅ 使用 useRef 中的稳定值初始化表单
  // 这样 defaultValues 就不会因为外部引用变化而重新设置
  const methods = useForm({
    defaultValues: initialDefaultValuesRef.current,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: resolver as any,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  // 1. 获取所有需要监听的依赖字段
  const watchFields = useMemo(() => getWatchFields(parsed), [parsed]);

  // Debug log
  useEffect(() => {
    console.log('👀 watchFields:', watchFields);
  }, [watchFields]);

  // 2. 只订阅这些字段
  const watchedValues = useWatch({
    control: methods.control,
    name: watchFields,
  });

  // 3. 组装 values Map (仅包含引擎所需的依赖值)
  // 注意：useWatch 传入 name 数组时返回数组，需要映射回对象
  const values = useMemo(() => {
    const result: ValuesMap = {};
    if (Array.isArray(watchedValues)) {
      watchFields.forEach((field, index) => {
        result[field] = watchedValues[index];
      });
    }
    return result;
  }, [watchedValues, watchFields]);

  // 异步选项加载
  const optionsMap = useAsyncOptions(parsed.allFields as FieldSchema[], values);

  // 记录上一次的 values 用于比较依赖变化 (处理级联清空)
  const prevValuesRefForReset = useRef<ValuesMap>({});

  // 依赖变化自动清空值逻辑
  useEffect(() => {
    const prevValues = prevValuesRefForReset.current;
    // 如果是第一次渲染，只记录不处理
    if (Object.keys(prevValues).length === 0) {
      prevValuesRefForReset.current = { ...values };
      return;
    }

    const updates: Record<string, unknown> = {};
    let hasUpdates = false;

    for (const field of parsed.allFields) {
      // 只有显式配置了 dependencies 的字段才参与自动清空
      // 这样可以避免误伤 visibleWhen 等其他依赖场景
      if (field.dependencies?.length) {
        // 检查该字段的依赖是否在本次变化中被修改
        const isDepChanged = field.dependencies.some(
          (dep) => values[dep] !== prevValues[dep]
        );

        if (isDepChanged) {
          // 依赖变了，清空当前字段
          // 只有当当前字段有值时才清空，避免死循环或无用更新
          const currentVal = methods.getValues(field.name as any);
          // 如果当前有值（非空），则清空
          if (currentVal !== undefined && currentVal !== null && currentVal !== '') {
            console.log(`🧹 Auto-resetting field ${String(field.name)} due to dependency change`);
            updates[field.name as string] = null; // 或者 undefined，视具体需求而定
            hasUpdates = true;
          }
        }
      }
    }

    if (hasUpdates) {
      // 使用 setValue 批量更新
      Object.entries(updates).forEach(([key, val]) => {
        methods.setValue(key as any, val, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      });
    }

    // 更新快照
    prevValuesRefForReset.current = { ...values };
  }, [values, parsed.allFields, methods]);

  // 值变化回调
  useEffect(() => {
    if (onValuesChange) {
      // 注意：这里的 values 仅包含依赖字段，如果用户期望拿到全量数据，
      // 可能需要 methods.getValues()，但那样不会响应非依赖字段的变化。
      // 如果 onValuesChange 需要全量响应，这里的优化可能需要权衡。
      // 但通常 onValuesChange 是为了联动或保存，用 methods.getValues() 获取全量数据可能更安全。
      // 或者，如果用户确实需要监听每一个字段的变化，那么全量 watch 就是必须的。
      // 这里的假设是：为了性能，我们牺牲部分“无意义”的 onValuesChange 触发。
      // 如果需要全量数据，可以在这里调用 methods.getValues()
      onValuesChange(methods.getValues() as T);
    }
  }, [values, onValuesChange, methods]);

  // ✅ 预计算所有 compute 字段的依赖关系（避免每次渲染重新计算）
  const computeFieldsInfo = useMemo(() => {
    return parsed.allFields
      .filter((field) => field.compute)
      .map((field) => ({
        name: field.name as string,
        expr: field.compute!.expr,
        dependencies: field.compute!.dependencies || extractDependencies(field.compute!.expr),
        precision: field.compute!.precision,
        roundMode: field.compute!.roundMode,
      }));
  }, [parsed.allFields]);

  // ✅ 记录上一次计算的依赖值，避免无限循环
  const prevDepsRef = useRef<Record<string, string>>({});

  // ✅ 计算字段自动更新（优化：避免无限刷新）
  useEffect(() => {
    // 如果没有 compute 字段，直接返回
    if (computeFieldsInfo.length === 0) return;

    // 批量更新标志，避免多次触发渲染
    let hasUpdate = false;
    const updates: Record<string, unknown> = {};

    for (const { name, expr, dependencies, precision, roundMode } of computeFieldsInfo) {
      // 生成依赖值的快照字符串（用于检测变化）
      const depsSnapshot = dependencies.map((dep) => `${dep}:${values[dep]}`).join('|');
      const prevSnapshot = prevDepsRef.current[name];

      // Debug log for compute trigger
      if (depsSnapshot !== prevSnapshot) {
        console.log(`🧮 Compute triggered for ${name}:`, {
          dependencies,
          values: dependencies.map(d => values[d]),
          depsSnapshot,
          prevSnapshot
        });
      }

      // 如果依赖值没有变化，跳过计算
      if (depsSnapshot === prevSnapshot) {
        continue;
      }

      // 检查依赖字段是否都有有效值
      const hasAllDependencies = dependencies.every((dep) => isValidComputeValue(values[dep]));

      // 如果依赖不完整，记录当前快照并跳过
      if (!hasAllDependencies) {
        prevDepsRef.current[name] = depsSnapshot;
        continue;
      }

      // 计算新值
      const computedValue = evaluateCompute(expr, values, dependencies, precision, roundMode);
      const currentValue = methods.getValues(name);

      // 只有当计算结果有效且确实变化时才更新
      if (
        computedValue !== undefined &&
        computedValue !== currentValue &&
        !Number.isNaN(computedValue) &&
        // 避免浮点数精度问题导致的无限更新
        (typeof computedValue !== 'number' ||
          typeof currentValue !== 'number' ||
          Math.abs(computedValue - currentValue) > 0.0001)
      ) {
        updates[name] = computedValue;
        hasUpdate = true;
      }

      // 记录当前快照
      prevDepsRef.current[name] = depsSnapshot;
    }

    // 批量更新表单值
    if (hasUpdate) {
      // 使用 reset 进行批量更新，避免多次触发渲染
      // 注意：reset 会重置 dirty/touched 状态，需要保留
      console.log('🔄 Performing batch update via reset:', updates);
      methods.reset(
        {
          ...methods.getValues(),
          ...updates,
        },
        {
          keepDirty: true,
          keepTouched: true,
          keepErrors: true,
          keepDefaultValues: false, // Explicitly update default values to match new state? Or should we?
          // Usually computed values should be considered "current" values.
          // If we want them to appear as "user input" (dirty), we should use setValue.
          // But user suggested reset.
          // If we use reset, the new values become the "default" (base) values unless we dirty them?
          // No, reset(values) sets both defaultValues and values to 'values'.
          // keepDirty: true means "if a field was dirty, keep it dirty".
        }
      );
    }
  }, [values, computeFieldsInfo, methods]);

  // 提交处理
  const handleSubmit = useCallback(
    async (data: ValuesMap) => {
      // 获取全量表单值 (解决 RHF handleSubmit 可能过滤掉某些字段的问题，如嵌套在 Group 中的字段)
      const formValues = methods.getValues();
      const transformed: ValuesMap = {};

      for (const field of parsed.allFields) {
        // 跳过不提交的字段
        if (field.noSubmit) {
          continue;
        }

        const name = field.name as string;
        // 优先使用 RHF 验证后的 data，如果缺失则回退到 formValues
        // 注意：使用 in 运算符检查 key 是否存在，因为 value 可能是 null/undefined
        let value = name in data ? data[name] : formValues[name];

        if (field.transform) {
          transformed[name] = field.transform(value, formValues as T);
        } else {
          transformed[name] = value;
        }
      }

      if (onSubmit) {
        await onSubmit(transformed as T);
      }
    },
    [parsed.allFields, onSubmit, methods],
  );

  // 暴露实例方法
  useImperativeHandle(
    ref,
    () => {
      const instance = {
        ...methods,
        submit: async () => {
          await methods.handleSubmit(handleSubmit)();
        },
        getFormValues: () => {
          const formValues = methods.getValues();
          const result: ValuesMap = {};
          for (const field of parsed.allFields) {
            if (!field.noSubmit) {
              result[field.name as string] = formValues[field.name as string];
            }
          }
          return result as Partial<T>;
        },
        setValues: (vals: Partial<T>) => {
          for (const [key, value] of Object.entries(vals)) {
            if (value !== undefined) {
              methods.setValue(key, value);
            }
          }
        },
      };
      return instance as unknown as SchemaFormInstance<T>;
    },
    [methods, parsed, handleSubmit],
  );

  // 渲染字段列表
  const renderFields = () => {
    const result = parsed.input.fields.flatMap((field, idx) => {
      // 隐藏字段不渲染
      if (field.component === 'Hidden') {
        return [];
      }
      const elements: React.ReactNode[] = [];
      // newLine: true 时插入换行占位符（仅在 grid 模式下生效）
      if (field.newLine && grid) {
        elements.push(<div key={`${String(field.name)}-${idx}-newline`} style={{ gridColumn: '1 / -1', height: 0, }} />);
      }

      elements.push(
        <FieldRenderer
          key={`${String(field.name)}-${idx}`}
          field={field}
          index={idx}
          values={values}
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          form={methods as any}
          disabled={disabled}
          readOnly={readOnly}
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          widgets={allWidgets as any}
          optionsMap={optionsMap}
          useGrid={grid}
        />,
      );

      return elements;
    })
    return result;
  };

  // 获取布局间距（优先使用 props.spacing，其次 layout.spacing，默认 2）
  const spacing = propSpacing ?? schema.layout?.spacing ?? 2;

  return (
    <FormProvider {...methods}>
      <form noValidate style={{ marginTop: '16px' }}>
        {grid ? (
          <GridLayout spacing={spacing}>{renderFields()}</GridLayout>
        ) : (
          <StackLayout spacing={spacing}>{renderFields()}</StackLayout>
        )}
        {children}
      </form>
    </FormProvider>
  );
}

/** 导出 SchemaForm 组件 */
export const SchemaForm = forwardRef(SchemaFormInner) as <T extends FieldValues>(
  props: SchemaFormProps<T> & { ref?: React.Ref<SchemaFormInstance<T>> },
) => React.ReactElement;

export default SchemaForm;
