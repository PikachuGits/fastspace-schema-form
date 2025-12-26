# 校验体系（Valibot × React Hook Form）

本库的校验从 Schema 的 `rules` 出发，在运行时动态生成 Valibot schema，并接入 React Hook Form 的 resolver。

核心实现：`src/core/validation/valibotAdapter.ts`。

## 1. 总体思路

1. 业务在 `FieldSchema.rules` 上声明规则（类型见 `src/types.ts:9`）
2. 提交/触发校验时，RHF 调用 resolver
3. resolver 内部：
   - 根据“当前 values”构建 Valibot schema（支持动态 requiredWhen / visibleWhen）
   - `safeParse` 执行校验
   - 将 issues 映射为 RHF errors

入口函数：

- `createDynamicResolver(parsed)`：`src/core/validation/valibotAdapter.ts:357`

## 2. 动态 requiredWhen 与可见性

### 2.1 requiredWhen

必填判定统一通过：

- `isFieldRequired(field, values)`：`src/core/validation/valibotAdapter.ts:16`

规则：

- `rules` 中包含 `required` → 必填
- 否则若存在 `requiredWhen` → 运行时求值（`evaluateCondition`，见 `src/core/validation/valibotAdapter.ts:22`）

### 2.2 visibleWhen / Hidden 字段跳过校验

构建顶层 object shape 时会处理：

- `Hidden` / `hidden: true`：直接 `optional(unknown())`（`src/core/validation/valibotAdapter.ts:330`）
- `Group`：自身不参与校验（其子字段独立校验）（`src/core/validation/valibotAdapter.ts:337`）
- `visibleWhen` 不满足：该字段跳过校验（`src/core/validation/valibotAdapter.ts:342`）

这使得“隐藏字段不报错”成为默认行为。

## 3. 规则到 Valibot 的映射

`buildFieldSchema(field, values)` 是核心转换函数（`src/core/validation/valibotAdapter.ts:37`）。它按组件类型选择 base schema，并按 `rules` 叠加 check。

### 3.1 Select / Radio / Autocomplete

组件集合：`['Radio', 'Select', 'Autocomplete']`（`src/core/validation/valibotAdapter.ts:68`）。

- 基础类型是 `union(string | number | boolean | undefined | null)`
- required 时检查 `val !== undefined && val !== null && val !== ''`

多选 Autocomplete/Select（`ui.props.multiple === true`）特殊处理：

- 值允许 array
- required 时校验 `Array.isArray(val) && val.length > 0`（`src/core/validation/valibotAdapter.ts:51`）

### 3.2 文本类：Text / Password / Textarea / Date / Time / DateTime

组件集合：`textTypes`（`src/core/validation/valibotAdapter.ts:83`）。

默认策略：

- base schema：`union(string | undefined | null)`
- required：检查非空字符串
- 其他规则（minLength/maxLength/pattern/email/url）：仅在“有值”时校验，允许空值通过

### 3.3 数字类：Number / Slider / Rating

组件集合：`numberTypes`（`src/core/validation/valibotAdapter.ts:171`）。

- base schema：允许 number / undefined / null / string→number（`transform(Number)`）
- required：检查非空且非 NaN
- min/max/custom：按需叠加 check

### 3.4 布尔类：Checkbox / Switch

组件集合：`boolTypes`（`src/core/validation/valibotAdapter.ts:224`）。

- base schema：允许 boolean / undefined / null
- required：必须为 `true`（用于“同意条款”场景）

### 3.5 FormList

当字段 `component === 'FormList'`：

- 生成 `rowSchema = object(rowShape)`（`src/core/validation/valibotAdapter.ts:257`）
- `rowShape` 构建时会把 `Group.columns` 展开到同一层（`src/core/validation/valibotAdapter.ts:246`）
- 再生成 `array(rowSchema)`，并附加 minItems/maxItems 校验（`src/core/validation/valibotAdapter.ts:262`）

### 3.6 Upload（数组）

当字段 `component === 'Upload'`：

- 以数组长度校验为主
- `rules` 中的 `{ type: 'array' }` 用于覆盖 minItems/maxItems/message（`src/core/validation/valibotAdapter.ts:275`）

## 4. 自定义校验：`custom`

`ValidationRule` 的 `custom` 形态：`src/types.ts:18`。

实现要点：

- `validate(value, values)` 返回 `true` 通过
- 返回 string 时作为错误消息（`src/core/validation/valibotAdapter.ts:155`）

## 5. errors 映射到 RHF

`safeParse` 失败后，会遍历 issues 并把 `issue.path` 拼成 `a.b.c` 形式作为字段名（`src/core/validation/valibotAdapter.ts:366`）。

对 FormList 的场景，path 会包含数组索引并能映射到 RHF 的字段路径（例如 `list.0.title`）。

