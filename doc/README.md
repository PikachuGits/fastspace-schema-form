# Fastspace Schema Form - 开发与使用文档

本目录文档基于源码 `/src` 整理，目标是同时覆盖：

- 使用方：如何用 `SchemaForm` 快速搭建表单、Schema 怎么写、如何扩展 Widget
- 开发方：内部架构与运行时链路（解析、联动、异步选项、计算、校验、提交）

## 文档导航

- `doc/01-Quickstart.md`：安装、最小用例、运行命令、项目依赖
- `doc/02-Api.md`：对外导出 API 与类型清单（从 `src/index.tsx` 视角）
- `doc/03-Schema.md`：`SchemaInput` / `FieldSchema` 写法与字段能力参考
- `doc/04-Runtime.md`：核心运行时链路（Schema → RHF → 渲染 → 联动/计算/提交）
- `doc/05-Widgets.md`：内置 Widgets 说明、远程 Autocomplete、FormList/Group、Custom 扩展
- `doc/06-Validation.md`：基于 Valibot 的动态校验规则生成与边界行为
- `doc/07-BestPractices.md`：性能与踩坑（Schema/defaultValues 稳定性、dependencies 语义、compute 安全）

## 源码入口速查

- 外部入口与导出：`src/index.tsx`
- 类型定义：`src/types.ts`
- 主组件：`src/ui/SchemaForm.tsx`
- 字段渲染：`src/ui/components/FieldRenderer.tsx`
- 引擎：`src/core/*`
- Widgets：`src/ui/widgets/*`

