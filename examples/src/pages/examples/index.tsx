/**
 * 示例页面索引
 *
 * 提供所有示例的导航入口
 */

import React, { useState, Suspense, lazy, type JSX } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";
import {
  TextFields as TextFieldsIcon,
  CheckCircle as CheckCircleIcon,
  AccountTree as AccountTreeIcon,
  CloudDownload as CloudDownloadIcon,
  FormatListNumbered as ListIcon,
  Description as DescriptionIcon,
  ViewModule as ViewModuleIcon,
} from "@mui/icons-material";

// 懒加载示例组件
const BasicExample = lazy(() => import("./BasicExample"));
const ValidationExample = lazy(() => import("./ValidationExample"));
const ConditionalExample = lazy(() => import("./ConditionalExample"));
const AsyncOptionsExample = lazy(() => import("./AsyncOptionsExample"));
const FormListExample = lazy(() => import("./FormListExample"));
const CompositeExample = lazy(() => import("./CompositeExample"));
const FullUsageExample = lazy(() => import("./FullUsageExample"));

// ============================================================================
// 示例列表配置
// ============================================================================

interface ExampleItem {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  component: React.LazyExoticComponent<() => JSX.Element>;
}

const examples: ExampleItem[] = [
  {
    key: "basic",
    title: "基础组件示例",
    description: "展示所有 18 种内置 Widget 组件的基本用法",
    icon: <TextFieldsIcon />,
    tags: ["Text", "Number", "Select", "Radio", "Checkbox", "Date"],
    component: BasicExample,
  },
  {
    key: "validation",
    title: "验证规则示例",
    description: "预设验证规则、自定义规则、Valibot 直接验证",
    icon: <CheckCircleIcon />,
    tags: ["required", "email", "phone", "pattern", "自定义规则"],
    component: ValidationExample,
  },
  {
    key: "conditional",
    title: "条件逻辑示例",
    description: "字段联动：条件显示、禁用、必填、派生计算",
    icon: <AccountTreeIcon />,
    tags: ["visibleWhen", "disabledWhen", "requiredWhen", "compute"],
    component: ConditionalExample,
  },
  {
    key: "async",
    title: "异步选项示例",
    description: "远程数据加载、级联选择、分页搜索",
    icon: <CloudDownloadIcon />,
    tags: ["async options", "cascade", "remote search", "pagination"],
    component: AsyncOptionsExample,
  },
  {
    key: "formlist",
    title: "FormList 动态列表",
    description: "动态添加/删除/复制行，支持行内计算",
    icon: <ListIcon />,
    tags: ["FormList", "动态表单", "嵌套", "行计算"],
    component: FormListExample,
  },
  {
    key: "composite",
    title: "组合表单",
    description: "复合输入组件：电话号码、价格、日期范围、尺寸等",
    icon: <ViewModuleIcon />,
    tags: ["Custom", "组合输入", "区号+手机号", "货币+金额"],
    component: CompositeExample,
  },
  {
    key: "full",
    title: "全量测试页面",
    description: "汇总所有核心能力，适合真实页面手动验证",
    icon: <DescriptionIcon />,
    tags: ["全量", "联动", "校验", "异步", "FormList"],
    component: FullUsageExample,
  },
];

// ============================================================================
// 加载状态组件
// ============================================================================

function LoadingFallback() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 400,
      }}
    >
      <CircularProgress />
    </Box>
  );
}

// ============================================================================
// 主组件
// ============================================================================

export default function ExamplesIndex() {
  const [selectedKey, setSelectedKey] = useState<string>("basic");

  const selectedExample = examples.find((e) => e.key === selectedKey);
  const SelectedComponent = selectedExample?.component;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.100" }}>
      {/* 左侧导航 */}
      <Paper
        elevation={2}
        sx={{
          width: 320,
          flexShrink: 0,
          borderRadius: 0,
          overflow: "auto",
        }}
      >
        <Box sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
          <Typography variant="h6" fontWeight="bold">
            @fastspace/schema-form
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            声明式表单引擎示例集
          </Typography>
        </Box>

        <List sx={{ py: 0 }}>
          {examples.map((example, index) => (
            <React.Fragment key={example.key}>
              {index > 0 && <Divider />}
              <ListItemButton
                selected={selectedKey === example.key}
                onClick={() => setSelectedKey(example.key)}
                sx={{
                  py: 2,
                  "&.Mui-selected": {
                    bgcolor: "primary.light",
                    "&:hover": { bgcolor: "primary.light" },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      selectedKey === example.key
                        ? "primary.main"
                        : "text.secondary",
                  }}
                >
                  {example.icon}
                </ListItemIcon>
                <ListItemText
                  primary={example.title}
                  secondary={
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                        sx={{ mb: 0.5 }}
                      >
                        {example.description}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {example.tags.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.65rem", height: 18 }}
                          />
                        ))}
                        {example.tags.length > 3 && (
                          <Chip
                            label={`+${example.tags.length - 3}`}
                            size="small"
                            sx={{ fontSize: "0.65rem", height: 18 }}
                          />
                        )}
                      </Stack>
                    </Box>
                  }
                  primaryTypographyProps={{
                    fontWeight: selectedKey === example.key ? "bold" : "medium",
                  }}
                  secondaryTypographyProps={{
                    component: "div",
                  }}
                />
              </ListItemButton>
            </React.Fragment>
          ))}
        </List>

        <Divider />

        {/* 底部说明 */}
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            基于 TanStack Form + Valibot + MUI
          </Typography>
        </Box>
      </Paper>

      {/* 右侧内容区 */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        <Suspense fallback={<LoadingFallback />}>
          {SelectedComponent && <SelectedComponent />}
        </Suspense>
      </Box>
    </Box>
  );
}
