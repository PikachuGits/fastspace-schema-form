# 快速开始

## 1. 项目定位

`@fastspace/schema-form` 是一个基于 JSON Schema 驱动的动态表单库，核心技术栈：

- UI：MUI v7（`@mui/material`、`@mui/icons-material`、`@mui/x-date-pickers`）
- 表单状态：React Hook Form v7
- 校验：Valibot（通过动态 resolver 接入 RHF）

## 2. 安装与依赖

该仓库以组件库形式发布，依赖分为两类：

- `dependencies`：库自身必须依赖（如 `valibot`、`@hookform/resolvers`）
- `peerDependencies`：由业务项目提供（如 React、MUI、RHF、dayjs）

以业务侧为例（仅示意，按你项目包管理器调整）：

```bash
npm i @fastspace/schema-form
```

确保业务侧已安装并满足 peer 依赖版本：`package.json:35`。

## 3. 最小可用示例

```tsx
import { useRef } from "react";
import type { FieldValues } from "react-hook-form";
import { Button } from "@mui/material";
import { SchemaForm, type SchemaFormInstance, type SchemaInput } from "@fastspace/schema-form";

const schema: SchemaInput = {
  fields: [
    {
      name: "username",
      component: "Text",
      ui: { label: "用户名", placeholder: "请输入用户名" },
      rules: [{ type: "required", message: "用户名必填" }],
      colSpan: { xs: 12, md: 6 },
    },
    {
      name: "email",
      component: "Text",
      ui: { label: "邮箱" },
      rules: [{ type: "email", message: "邮箱格式不正确" }],
      colSpan: { xs: 12, md: 6 },
    },
  ],
};

export default function Demo() {
  const formRef = useRef<SchemaFormInstance<FieldValues>>(null);

  return (
    <SchemaForm
      ref={formRef}
      schema={schema}
      onSubmit={(values) => console.log("submit:", values)}
      spacing={2}
    >
      <Button variant="contained" onClick={() => formRef.current?.submit()}>
        提交
      </Button>
    </SchemaForm>
  );
}
```

关键点：

- `SchemaForm` 内部使用 TanStack Form 管理状态，并通过 `ref.submit()` 触发提交（见 `package/ui/SchemaForm.tsx`）。
- `rules` 写在 schema 上，由动态 resolver 生成校验逻辑（见 `package/core/validation/valibotAdapter.ts`）。

## 4. 本仓库开发命令

脚本来自 `package.json:28`：

- 单测：`npm run test`
- 构建（含 TS 构建）：`npm run build`

