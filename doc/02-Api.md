# 对外 API（从 `src/index.tsx` 视角）

本库对外导出集中在 `src/index.tsx:5`，可分为：核心工具、类型、组件、内置 Widgets。

## 1. 组件入口

- `SchemaForm`：主表单组件（`src/index.tsx:46`，实现见 `src/ui/SchemaForm.tsx`）
- `GridLayout` / `StackLayout`：布局容器（`src/index.tsx:48`）
- `FieldRenderer`：单字段渲染器（`src/index.tsx:52`）

## 2. 类型出口（常用）

类型位于 `src/types.ts`，从 `src/index.tsx:21` 导出：

- `SchemaInput`：顶层 schema
- `FieldSchema`：字段 schema
- `ValidationRule`：验证规则类型
- `ConditionExpression` / `SimpleCondition` / `CompoundCondition`：条件表达式
- `ComputeConfig`：计算字段配置
- `OptionItem` / `RemoteConfig`：选项与远程配置（注意 `RemoteConfig` 未在 `index.tsx` 导出，需从源码或未来补充导出）
- `SchemaFormInstance`：`ref` 实例类型（`submit` / `getFormValues` / `setValues`）
- `WidgetProps` / `WidgetComponent`：自定义 Widget 接口

## 3. 核心工具（可独立使用）

从 `src/index.tsx:7` 导出，实现在 `src/core/*`：

- `parseSchema`：预处理 `SchemaInput`，生成 `ParsedSchema`（`src/core/parser/schemaParser.ts:49`）
- `mergeDefaultValues`：合并 Schema 默认值与外部默认值（`src/core/parser/schemaParser.ts:171`）
- `evaluateCondition` / `extractDependencies`：条件求值与依赖提取（`src/core/engine/condition.ts:141`、`src/core/engine/condition.ts:170`）
- `computeFieldState` / `computeAllFieldStates`：运行时字段状态（`src/core/engine/fieldState.ts:32`、`src/core/engine/fieldState.ts:69`）
- `getWatchFields`：提取需要 `useWatch` 订阅的字段集合（`src/core/engine/fieldState.ts:123`）
- `getDownstreamFields`：基于依赖图查询下游字段（`src/core/parser/schemaParser.ts:143`）
- `buildValibotSchema` / `createDynamicResolver`：把 `rules` 转成 Valibot，并接入 RHF resolver（`src/core/validation/valibotAdapter.ts:324`、`src/core/validation/valibotAdapter.ts:357`）

## 4. 内置 Widgets

从 `src/index.tsx:56` 导出，默认映射在 `src/ui/widgets/index.tsx:64`。

重点说明：

- `SelectWidget`：已合并到 `AutocompleteWidget`，导出为兼容（`src/ui/widgets/index.tsx:32`）
- `compactFieldStyles` / `DATE_FORMAT` / `DATETIME_FORMAT`：公共样式与日期格式（`src/ui/widgets/styles.ts:6`）

