/**
 * 验证规则示例 - 展示所有验证功能
 *
 * 本示例展示：
 * 1. 预设规则数组 - 声明式验证（推荐）
 * 2. 所有内置预设规则的用法
 * 3. 带参数的验证规则
 * 4. 自定义验证规则
 * 5. 使用 Valibot 直接验证
 */

import React, { useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  Alert,
  Chip,
} from "@mui/material";
import {
  SchemaForm,
  type SchemaFormInstance,
  registerPresetRule,
  overridePresetRule,
  useValidationPresets,
} from "@fastspace/schema-form";

// 使用本地类型定义避免 dist 中旧类型的限制
type SchemaInput = {
  meta?: { version: string };
  fields: any[];
};
import * as v from "valibot";

// ============================================================================
// 自定义预设规则 - 在组件外部注册（全局生效）
// ============================================================================

// 注册：银行卡号验证
registerPresetRule("bankCard", (config) =>
  v.check(
    (val) => {
      if (!val) return true; // 允许空值
      const str = String(val).replace(/\s/g, ""); // 去除空格
      return /^\d{16,19}$/.test(str);
    },
    config?.message ?? `${config?.label ?? "该字段"}必须是有效的银行卡号`
  )
);

// 注册：用户名格式（字母开头，允许字母数字下划线）
registerPresetRule("username", (config) =>
  v.check(
    (val) => {
      if (!val) return true;
      return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(String(val));
    },
    config?.message ?? "用户名必须字母开头，只能包含字母、数字、下划线"
  )
);

// ============================================================================
// Schema 定义 - 验证规则示例
// ============================================================================

const validationSchema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    // ==================== 基础预设规则 ====================
    {
      name: "_section1",
      component: "Group",
      ui: {
        title: "基础预设规则",
        style: "divider",
      },
      children: [],
    },
    {
      name: "requiredField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      // 最简单的预设规则用法
      validate: [{ type: "required", message: "此字段必填" }],
      ui: {
        label: "必填验证 (required)",
        placeholder: "必须填写",
        helperText: 'validate: [{ type: "required" }]',
      },
    },
    {
      name: "emailField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: [
        { type: "required", message: "邮箱必填" },
        { type: "email", message: "请输入有效的邮箱地址" },
      ],
      ui: {
        label: "邮箱验证 (email)",
        placeholder: "example@domain.com",
        helperText: "组合 required + email 规则",
      },
    },
    {
      name: "phoneField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: [{ type: "phone", message: "请输入有效的手机号" }],
      ui: {
        label: "手机号验证 (phone)",
        placeholder: "13800138000",
        helperText: "中国大陆手机号格式",
      },
    },
    {
      name: "urlField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: [{ type: "url", message: "请输入有效的 URL" }],
      ui: {
        label: "URL 验证 (url)",
        placeholder: "https://example.com",
        helperText: "必须是完整的 URL",
      },
    },
    {
      name: "idCardField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: [{ type: "idCard", message: "请输入有效的身份证号" }],
      ui: {
        label: "身份证验证 (idCard)",
        placeholder: "18位身份证号",
        helperText: "中国大陆18位身份证",
      },
    },

    // ==================== 带参数的规则 ====================
    {
      name: "_section2",
      component: "Group",
      ui: {
        title: "带参数的规则",
        style: "divider",
      },
      children: [],
    },
    {
      name: "minLengthField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: [
        { type: "required" },
        { type: "minLength", value: 5, message: "至少输入5个字符" },
      ],
      ui: {
        label: "最小长度 (minLength)",
        placeholder: "至少5个字符",
        helperText: 'value: 5 设置最小长度',
      },
    },
    {
      name: "maxLengthField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: [{ type: "maxLength", value: 10, message: "最多10个字符" }],
      ui: {
        label: "最大长度 (maxLength)",
        placeholder: "最多10个字符",
        helperText: "value: 10 设置最大长度",
      },
    },
    {
      name: "minValueField",
      component: "Number",
      colSpan: { xs: 12, md: 6 },
      validate: [
        { type: "required" },
        { type: "min", value: 18, message: "最小值为18" },
      ],
      ui: {
        label: "最小值 (min)",
        helperText: "value: 18 设置最小值",
        min: 0,
        max: 100,
      },
    },
    {
      name: "maxValueField",
      component: "Number",
      colSpan: { xs: 12, md: 6 },
      validate: [{ type: "max", value: 100, message: "最大值为100" }],
      ui: {
        label: "最大值 (max)",
        helperText: "value: 100 设置最大值",
        min: 0,
        max: 200,
      },
    },
    {
      name: "patternField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: [
        {
          type: "pattern",
          value: "^[A-Z]{2}\\d{4}$", // 正则字符串
          message: "格式：2个大写字母 + 4位数字",
        },
      ],
      ui: {
        label: "正则验证 (pattern)",
        placeholder: "如：AB1234",
        helperText: "格式：XX0000",
      },
    },

    // ==================== 数值相关规则 ====================
    {
      name: "_section3",
      component: "Group",
      ui: {
        title: "数值相关规则",
        style: "divider",
      },
      children: [],
    },
    {
      name: "integerField",
      component: "Number",
      colSpan: { xs: 12, md: 4 },
      validate: [
        { type: "required" },
        { type: "integer", message: "必须是整数" },
      ],
      ui: {
        label: "整数 (integer)",
        helperText: "只允许整数",
      },
    },
    {
      name: "positiveField",
      component: "Number",
      colSpan: { xs: 12, md: 4 },
      validate: [{ type: "positive", message: "必须是正数" }],
      ui: {
        label: "正数 (positive)",
        helperText: "必须大于0",
      },
    },
    {
      name: "negativeField",
      component: "Number",
      colSpan: { xs: 12, md: 4 },
      validate: [{ type: "negative", message: "必须是负数" }],
      ui: {
        label: "负数 (negative)",
        helperText: "必须小于0",
      },
    },

    // ==================== 文本格式规则 ====================
    {
      name: "_section4",
      component: "Group",
      ui: {
        title: "文本格式规则",
        style: "divider",
      },
      children: [],
    },
    {
      name: "alphanumericField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: [{ type: "alphanumeric", message: "只能包含字母和数字" }],
      ui: {
        label: "字母数字 (alphanumeric)",
        placeholder: "abc123",
        helperText: "只允许字母和数字",
      },
    },
    {
      name: "chineseField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: [{ type: "chinese", message: "只能包含中文字符" }],
      ui: {
        label: "中文字符 (chinese)",
        placeholder: "请输入中文",
        helperText: "只允许中文字符",
      },
    },

    // ==================== 自定义预设规则 ====================
    {
      name: "_section5",
      component: "Group",
      ui: {
        title: "自定义预设规则",
        style: "divider",
      },
      children: [],
    },
    {
      name: "bankCardField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      // 使用自定义注册的规则
      validate: [{ type: "bankCard", message: "请输入正确的银行卡号" }],
      ui: {
        label: "银行卡号 (自定义 bankCard)",
        placeholder: "16-19位数字",
        helperText: "通过 registerPresetRule 注册",
      },
    },
    {
      name: "usernameField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: [
        { type: "required" },
        { type: "minLength", value: 3 },
        { type: "maxLength", value: 20 },
        { type: "username" }, // 自定义规则
      ],
      ui: {
        label: "用户名 (自定义 username)",
        placeholder: "字母开头，3-20位",
        helperText: "组合多个规则",
      },
    },

    // ==================== 直接使用 Valibot ====================
    {
      name: "_section6",
      component: "Group",
      ui: {
        title: "直接使用 Valibot",
        style: "divider",
      },
      children: [],
    },
    {
      name: "passwordField",
      component: "Password",
      colSpan: { xs: 12, md: 6 },
      // 直接使用 Valibot schema
      validate: v.pipe(
        v.string("请输入密码"),
        v.nonEmpty("密码不能为空"),
        v.minLength(8, "密码至少8位"),
        v.regex(/[A-Z]/, "需包含大写字母"),
        v.regex(/[a-z]/, "需包含小写字母"),
        v.regex(/[0-9]/, "需包含数字"),
        v.regex(/[!@#$%^&*]/, "需包含特殊字符 (!@#$%^&*)")
      ),
      ui: {
        label: "强密码 (Valibot)",
        placeholder: "至少8位，含大小写、数字、特殊字符",
        helperText: "使用 Valibot pipe 组合多个规则",
        showToggle: true,
      },
    },
    {
      name: "confirmPassword",
      component: "Password",
      colSpan: { xs: 12, md: 6 },
      // Valibot 不支持跨字段验证，这里仅作示例
      validate: v.pipe(
        v.string("请确认密码"),
        v.nonEmpty("确认密码不能为空")
      ),
      ui: {
        label: "确认密码",
        placeholder: "再次输入密码",
        helperText: "注：跨字段验证需在提交时处理",
        showToggle: true,
      },
    },

    // ==================== 组合验证 ====================
    {
      name: "_section7",
      component: "Group",
      ui: {
        title: "复杂组合验证",
        style: "divider",
      },
      children: [],
    },
    {
      name: "complexField",
      component: "Text",
      colSpan: { xs: 12 },
      validate: [
        { type: "required", message: "此字段必填" },
        { type: "minLength", value: 6, message: "至少6个字符" },
        { type: "maxLength", value: 30, message: "最多30个字符" },
        { type: "pattern", value: "^[a-zA-Z]", message: "必须以字母开头" },
        { type: "alphanumeric", message: "只能包含字母和数字" },
      ],
      ui: {
        label: "复杂验证组合",
        placeholder: "字母开头，6-30位字母数字",
        helperText: "组合5个验证规则：required + minLength + maxLength + pattern + alphanumeric",
      },
    },
  ],
};

// ============================================================================
// 组件
// ============================================================================

export default function ValidationExample() {
  const formRef = useRef<SchemaFormInstance>(null);
  const [submittedData, setSubmittedData] = React.useState<any>(null);

  // 使用 Hook 动态注册规则（组件级别）
  const { register, getNames } = useValidationPresets();

  useEffect(() => {
    // 可以在组件内动态注册规则
    register("companyEmail", (config) =>
      v.check(
        (val) => !val || /@(company\.com|example\.org)$/.test(String(val)),
        config?.message ?? "只支持公司邮箱"
      )
    );
  }, [register]);

  const handleSubmit = (values: any) => {
    console.log("验证通过，提交数据:", values);
    setSubmittedData(values);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* 标题 */}
        <Typography variant="h4" gutterBottom>
          验证规则示例
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          展示所有内置验证规则、自定义规则以及 Valibot 直接使用
        </Typography>

        {/* 已注册的规则 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            已注册的预设规则：
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {getNames().map((name) => (
              <Chip
                key={name}
                label={name}
                size="small"
                variant="outlined"
                color={
                  ["bankCard", "username", "companyEmail"].includes(name)
                    ? "secondary"
                    : "default"
                }
              />
            ))}
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* 表单 */}
        <SchemaForm ref={formRef} schema={validationSchema} onSubmit={handleSubmit}>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => formRef.current?.submit()}
            >
              提交验证
            </Button>
            <Button variant="outlined" onClick={() => formRef.current?.reset()}>
              重置
            </Button>
            <Button
              variant="text"
              color="error"
              onClick={() => formRef.current?.clearErrors()}
            >
              清除错误
            </Button>
          </Stack>
        </SchemaForm>

        {/* 提交结果 */}
        {submittedData && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="subtitle2">所有验证通过！</Typography>
            <Box
              component="pre"
              sx={{
                mt: 1,
                p: 2,
                bgcolor: "grey.100",
                borderRadius: 1,
                overflow: "auto",
                fontSize: "0.875rem",
                maxHeight: 300,
              }}
            >
              {JSON.stringify(submittedData, null, 2)}
            </Box>
          </Alert>
        )}
      </Paper>

      {/* 使用说明 */}
      <Paper elevation={1} sx={{ mt: 3, p: 3, bgcolor: "grey.50" }}>
        <Typography variant="h6" gutterBottom>
          📖 验证规则使用指南
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          1. 预设规则数组（推荐）
        </Typography>
        <Box
          component="pre"
          sx={{
            p: 2,
            bgcolor: "grey.200",
            borderRadius: 1,
            fontSize: "0.8rem",
            overflow: "auto",
          }}
        >
          {`validate: [
  { type: "required", message: "此字段必填" },
  { type: "email", message: "邮箱格式不正确" },
  { type: "minLength", value: 6, message: "至少6个字符" },
]`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          2. 内置预设规则
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {[
            "required", "email", "phone", "url", "idCard",
            "minLength", "maxLength", "min", "max",
            "pattern", "alphanumeric", "integer", "positive"
          ].map(rule => (
            <Box
              key={rule}
              sx={{
                px: 1.5,
                py: 0.5,
                bgcolor: "success.light",
                color: "white",
                borderRadius: 1,
                fontSize: "0.75rem",
              }}
            >
              {rule}
            </Box>
          ))}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          3. 自定义验证规则
        </Typography>
        <Box
          component="pre"
          sx={{
            p: 2,
            bgcolor: "grey.200",
            borderRadius: 1,
            fontSize: "0.8rem",
            overflow: "auto",
          }}
        >
          {`// 注册全局自定义规则
registerPresetRule("strongPassword", (value, params, ctx) => {
  if (!value) return true;  // 空值交给 required 处理
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  return hasUpper && hasLower && hasNumber;
});

// 使用
validate: [{ type: "strongPassword", message: "需包含大小写和数字" }]`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          4. 使用 Valibot 直接验证
        </Typography>
        <Box
          component="pre"
          sx={{
            p: 2,
            bgcolor: "grey.200",
            borderRadius: 1,
            fontSize: "0.8rem",
            overflow: "auto",
          }}
        >
          {`import * as v from "valibot";

validate: v.pipe(
  v.string("请输入内容"),
  v.minLength(3, "至少3个字符"),
  v.maxLength(20, "最多20个字符"),
)`}
        </Box>
      </Paper>
    </Box>
  );
}
