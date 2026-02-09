/**
 * 全量测试页面
 *
 * 汇总所有核心能力，便于真实页面手动测试。
 */

import React from "react";
import { Box, Paper, Typography, Divider, Alert, Stack, Chip } from "@mui/material";
import { SchemaFormExample } from "../../../../package/SchemaForm.example";

export default function FullUsageExample() {
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          全量测试页面
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          用于真实页面手动验证：Schema、布局、联动、校验、异步选项、Custom 等功能。
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {[
            "全部 Widget",
            "条件逻辑",
            "计算字段",
            "FormList",
            "异步选项 2",
            "远程搜索",
            "自定义组件",
          ].map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Stack>

        <Alert severity="info" sx={{ mb: 2 }}>
          说明：以下示例均为真实可交互表单，请直接操作并观察结果。
        </Alert>

        <Divider sx={{ mb: 2 }} />

        <SchemaFormExample />
      </Paper>
    </Box>
  );
}
