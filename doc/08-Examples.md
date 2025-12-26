# 示例与测试入口

本仓库在 `/src` 内自带多份示例文件，适合用来验证某个能力是否符合预期，也适合做二次开发时的回归参考。

## 1. 示例文件

### 1.1 综合示例

- `src/SchemaForm.example.tsx`
  - 覆盖：基础字段、条件联动、异步 options、FormList、Group、性能建议（Schema useMemo）

- `src/SchemaForm.example2.tsx`
  - 覆盖：更完整的字段组合、嵌套 Group/FormList、复杂校验与条件组合

### 1.2 compute 专项示例

- `src/SchemaForm.compute.example.tsx`
  - 覆盖：compute 的 `expr/dependencies/precision/roundMode`
  - 推荐对照：compute 依赖务必显式声明（示例见 `src/SchemaForm.compute.example.tsx:69`）

## 2. 单测入口

测试框架：Vitest（脚本见 `package.json:31`）。

- `src/__tests__/AutocompleteWidget.test.tsx`
  - 覆盖：Autocomplete 远程搜索的默认值回显（`fetchById`）、搜索触发、防闪烁等

- `src/__tests__/setup.ts`
  - 测试环境初始化

## 3. 常用命令

来自 `package.json:28`：

- 运行单测：`npm run test`
- watch 模式：`npm run test:watch`
- 构建：`npm run build`

