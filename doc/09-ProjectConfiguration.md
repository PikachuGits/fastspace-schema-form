# 项目配置说明

本文档详细说明 `@fastspace/schema-form` 的项目配置逻辑、注意事项和实际用途。

---

## 1. 项目结构

```
├── package/                 # 正式源码目录（核心库）
│   ├── core/               # 核心模块
│   │   ├── compiler/       # Schema 编译器（依赖分析、表达式求值、Lint）
│   │   ├── runtime/        # 运行时系统（Effect、调度器）
│   │   └── validation/     # 验证适配器（Valibot）
│   ├── react/              # React 集成 Hook
│   ├── ui/                 # UI 组件（SchemaForm、Widget、Layout）
│   ├── types.ts            # 类型定义
│   └── index.ts            # 库入口
├── package-history/         # 旧版本源码归档（仅供参考）
├── examples/               # 示例项目（独立 Vite 应用）
├── doc/                    # 文档目录
├── dist/                   # 构建产物
└── 配置文件
```

---

## 2. 配置文件说明

### 2.1 package.json

**用途**：定义包元信息、脚本命令、依赖关系。

```json
{
  "name": "@fastspace/schema-form",
  "type": "module",
  "main": "./dist/schema-form-lib.umd.cjs",
  "module": "./dist/schema-form-lib.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/schema-form-lib.js",
      "require": "./dist/schema-form-lib.umd.cjs"
    }
  }
}
```

**关键字段**：

| 字段 | 说明 |
|------|------|
| `type: "module"` | 使用 ES Module 格式 |
| `main` | CommonJS 入口（兼容 Node.js require） |
| `module` | ES Module 入口（现代打包工具优先使用） |
| `types` | TypeScript 类型定义入口 |
| `exports` | 条件导出，支持不同环境自动选择正确入口 |
| `files` | 发布到 npm 时包含的文件（仅 `dist`） |

**依赖分类**：

| 类型 | 说明 | 示例 |
|------|------|------|
| `dependencies` | 库运行必须，会被打包进库 | `valibot`, `jsep` |
| `peerDependencies` | 由使用方提供，避免重复打包 | `react`, `@mui/material` |
| `devDependencies` | 仅开发时使用 | `vite`, `vitest`, `typescript` |

**注意事项**：
- `peerDependencies` 定义了兼容的 React 版本范围 `^18.0.0 || ^19.0.0`
- 业务项目必须安装所有 `peerDependencies`

---

### 2.2 tsconfig.json

**用途**：TypeScript 编译器配置。

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "declaration": true
  },
  "include": ["package"]
}
```

**关键配置**：

| 配置 | 值 | 说明 |
|------|-----|------|
| `target` | ES2020 | 编译目标，支持可选链、nullish 合并等特性 |
| `module` | ESNext | 使用最新的 ES Module 语法 |
| `moduleResolution` | bundler | 适配 Vite 等现代打包工具的模块解析 |
| `jsx` | react-jsx | 使用 React 17+ 的新 JSX 转换 |
| `strict` | true | 启用所有严格类型检查 |
| `noEmit` | true | 不输出文件，由 Vite 处理编译 |
| `declaration` | true | 生成类型声明文件 |
| `include` | ["package"] | 仅编译 package 目录 |

**注意事项**：
- `noEmit: true` 意味着 tsc 只做类型检查，实际编译由 Vite 完成
- `allowImportingTsExtensions: true` 允许导入 `.ts` 后缀文件
- `skipLibCheck: true` 跳过 node_modules 类型检查，加快编译速度

---

### 2.3 vite.config.ts

**用途**：Vite 构建配置，定义库模式打包。

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['package'],
      rollupTypes: true,
      tsconfigPath: './tsconfig.json'
    })
  ],
  esbuild: {
    drop: ['console', 'debugger'],  // 生产构建移除调试代码
  },
  build: {
    lib: {
      entry: resolve('package/index.ts'),
      name: 'SchemaFormLib',
      fileName: 'schema-form-lib',
    },
    rollupOptions: {
      external: [/* peer dependencies */],
      output: {
        exports: 'named',
        globals: {/* UMD 全局变量映射 */}
      }
    }
  }
});
```

**关键配置**：

| 配置 | 说明 |
|------|------|
| `plugins.react()` | React JSX 转换和 Fast Refresh |
| `plugins.dts()` | 生成 `.d.ts` 类型声明文件 |
| `dts.rollupTypes` | 将所有类型声明合并为单个文件 |
| `build.lib` | 库模式构建配置 |
| `rollupOptions.external` | 外部依赖，不打包进库 |
| `esbuild.drop` | 移除 console/debugger 语句 |

**external 配置原则**：
- 所有 `peerDependencies` 必须设为 external
- 包括子路径导入，如 `@mui/x-date-pickers/DatePicker`
- 避免依赖被重复打包，减小库体积

---

### 2.4 vitest.config.ts

**用途**：Vitest 测试框架配置。

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./package/__tests__/setup.ts"],
    include: ["package/**/*.{test,spec}.{ts,tsx}"],
  },
});
```

**关键配置**：

| 配置 | 说明 |
|------|------|
| `environment` | jsdom - 浏览器环境模拟，支持 DOM 操作 |
| `globals` | 全局注入 describe/it/expect 等测试函数 |
| `setupFiles` | 测试前执行的初始化文件 |
| `include` | 测试文件匹配模式 |

**注意事项**：
- 测试文件需放在 `package/__tests__/` 目录或以 `.test.ts(x)` / `.spec.ts(x)` 结尾
- setup 文件通常配置 jest-dom 扩展匹配器

---

## 3. NPM 脚本说明

| 脚本 | 命令 | 说明 |
|------|------|------|
| `build` | `tsc -b && vite build` | 类型检查 + 构建产物 |
| `prepublishOnly` | `npm run build` | 发布前自动构建 |
| `lint` | `oxlint` | 代码静态检查 |
| `lint:fix` | `oxlint --fix` | 自动修复 Lint 问题 |
| `test` | `vitest run` | 运行单元测试 |
| `test:watch` | `vitest` | 监听模式运行测试 |
| `test:ui` | `vitest --ui` | 可视化测试界面 |

---

## 4. 开发工作流

### 4.1 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 进入示例项目开发
cd examples
pnpm dev

# 3. 在示例项目中引用本地库
# examples/package.json 配置：
# "@fastspace/schema-form": "link:../"
```

### 4.2 测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 可视化界面
pnpm test:ui
```

### 4.3 构建发布

```bash
# 构建
pnpm build

# 检查产物
ls dist/
# → index.d.ts, schema-form-lib.js, schema-form-lib.umd.cjs

# 发布（自动触发 prepublishOnly）
npm publish --access public
```

---

## 5. 配置最佳实践

### 5.1 新增组件

1. 在 `package/ui/widgets/` 创建组件文件
2. 在 `package/ui/widgets/index.ts` 导出
3. 在 `package/index.ts` 重新导出
4. 添加对应测试文件

### 5.2 新增依赖

- **运行时必须**：添加到 `dependencies`
- **用户侧提供**：添加到 `peerDependencies`
- **仅开发用**：添加到 `devDependencies`

### 5.3 添加新的 external 依赖

如果新增 peerDependency，需同步更新 `vite.config.ts`:

```typescript
rollupOptions: {
  external: [
    // 新增依赖
    'new-peer-dep',
    'new-peer-dep/sub-path',
  ]
}
```

---

## 6. 常见问题

### Q1: 构建后类型文件缺失
**原因**：`vite-plugin-dts` 的 `include` 配置未覆盖源文件  
**解决**：确保 `dts({ include: ['package'] })` 包含所有源码目录

### Q2: 业务项目报 "无法找到模块"
**原因**：未安装 peerDependencies  
**解决**：检查并安装所有 peerDependencies

### Q3: UMD 构建全局变量未定义
**原因**：`rollupOptions.output.globals` 缺少映射  
**解决**：为每个 external 依赖添加全局变量名

### Q4: 测试运行报 "document is not defined"
**原因**：测试环境未配置 jsdom  
**解决**：确保 `vitest.config.ts` 中 `environment: "jsdom"`

---

## 7. 目录变更历史

| 时间 | 变更 | 说明 |
|------|------|------|
| v0.0.15 之前 | `src/` | 初始版本源码目录 |
| v0.0.16+ | `package/` | 重构后的正式源码目录 |
| - | `package-history/` | 旧版本源码归档，仅供参考 |

旧版本代码保留在 `package-history/` 目录中，方便对比和参考，但不再维护。

