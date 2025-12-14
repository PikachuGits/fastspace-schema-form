/**
 * SchemaForm 完整示例
 *
 * 展示所有功能：
 * 1. 基础字段 + 验证规则
 * 2. FormList 动态列表
 * 3. Group 字段分组
 * 4. 条件显示/禁用/必填
 * 5. 计算字段
 * 6. 响应式布局
 */

import { Box, Button, Divider, Typography } from "@mui/material";
import { useRef } from "react";
import type { FieldValues } from "react-hook-form";
import { SchemaForm } from "./index";
import type { SchemaFormInstance, SchemaInput } from "./types";

// 状态选项
const statusOptions = [
  { label: "全部", value: "all" },
  { label: "未处理", value: "pending" },
  { label: "已处理", value: "done" },
  { label: "已取消", value: "cancelled" },
];

// Schema 定义
const formSchema: SchemaInput = {
  fields: [
    // ========================================
    // 第一部分：FormList 动态列表
    // ========================================
    {
      name: "list",
      component: "FormList",
      ui: { label: "📋 联系人列表（FormList + Group 示例）" },
      colSpan: { xs: 12 },
      defaultValue: [{ state: "all", title: "" }],
      minItems: 1,
      maxItems: 5,
      addText: "添加联系人",
      copyable: true,
      columns: [
        // Group 嵌套 - 将多个字段放在一行
        {
          name: "group1",
          component: "Group",
          colSpan: { xs: 12 },
          columns: [
            {
              name: "state",
              component: "Select",
              ui: { label: "状态", options: statusOptions },
              colSpan: { xs: 12, sm: 6 },
              rules: [{ type: "required", message: "请选择状态" }],
            },
            {
              name: "title",
              component: "Text",
              ui: { label: "标题", placeholder: "请输入标题" },
              colSpan: { xs: 12, sm: 6 },
              rules: [
                { type: "required", message: "标题必填" },
                { type: "minLength", value: 2, message: "标题至少2个字符" },
              ],
            },
          ],
        },
        // 单独字段
        {
          name: "remark",
          component: "Textarea",
          ui: { label: "备注", placeholder: "请输入备注信息" },
          colSpan: { xs: 12 },
        },
      ],
    },

    // ========================================
    // 第二部分：基础验证规则示例
    // ========================================
    {
      name: "username",
      component: "Text",
      ui: { label: "用户名", placeholder: "请输入用户名" },
      colSpan: { xs: 12, md: 6 },
      rules: [
        { type: "required", message: "用户名必填" },
        { type: "minLength", value: 3, message: "用户名至少3个字符" },
        { type: "maxLength", value: 20, message: "用户名最多20个字符" },
      ],
    },

    {
      name: "email",
      component: "Text",
      ui: { label: "邮箱", placeholder: "请输入邮箱" },
      colSpan: { xs: 12, md: 6 },
      rules: [
        { type: "required", message: "邮箱必填" },
        { type: "email", message: "请输入有效的邮箱地址" },
      ],
    },

    {
      name: "phone",
      component: "Text",
      ui: { label: "手机号", placeholder: "请输入手机号" },
      colSpan: { xs: 12, md: 6 },
      rules: [
        { type: "required", message: "手机号必填" },
        {
          type: "pattern",
          value: "^1[3-9]\\d{9}$",
          message: "请输入有效的11位手机号",
        },
      ],
    },

    {
      name: "website",
      component: "Text",
      ui: { label: "网站", placeholder: "https://example.com" },
      colSpan: { xs: 12, md: 6 },
      rules: [{ type: "url", message: "请输入有效的网址" }],
    },

    // ========================================
    // 第三部分：密码 + 自定义验证
    // ========================================
    {
      name: "password",
      component: "Password",
      ui: { label: "密码", placeholder: "请输入密码" },
      colSpan: { xs: 12, md: 6 },
      rules: [
        { type: "required", message: "密码必填" },
        { type: "minLength", value: 6, message: "密码至少6个字符" },
        {
          type: "pattern",
          value: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)",
          message: "密码必须包含大小写字母和数字",
        },
      ],
    },

    {
      name: "confirmPassword",
      component: "Password",
      ui: { label: "确认密码", placeholder: "请再次输入密码" },
      colSpan: { xs: 12, md: 6 },
      rules: [
        { type: "required", message: "请确认密码" },
        {
          type: "custom",
          validate: (value, values) => {
            const formValues = values as { password?: string };
            if (value !== formValues.password) {
              return "两次密码输入不一致";
            }
            return true;
          },
        },
      ],
    },

    // ========================================
    // 第四部分：条件显示/必填
    // ========================================
    {
      name: "accountType",
      component: "Select",
      defaultValue: "personal",
      ui: {
        label: "账户类型",
        options: [
          { label: "个人账户", value: "personal" },
          { label: "企业账户", value: "business" },
        ],
      },
      colSpan: { xs: 12, md: 6 },
      rules: [{ type: "required", message: "请选择账户类型" }],
    },

    {
      name: "companyName",
      component: "Text",
      ui: {
        label: "公司名称",
        placeholder: "请输入公司名称",
        helperText: "选择企业账户时显示",
      },
      colSpan: { xs: 12, md: 6 },
      visibleWhen: { field: "accountType", eq: "business" },
      requiredWhen: { field: "accountType", eq: "business" },
    },

    {
      name: "taxId",
      component: "Text",
      ui: {
        label: "税号",
        placeholder: "请输入15-20位税号",
        helperText: "选择企业账户时显示",
      },
      colSpan: { xs: 12, md: 6 },
      visibleWhen: { field: "accountType", eq: "business" },
      requiredWhen: { field: "accountType", eq: "business" },
      rules: [
        {
          type: "pattern",
          value: "^[0-9A-Z]{15,20}$",
          message: "请输入有效的税号（15-20位数字或大写字母）",
        },
      ],
    },

    // ========================================
    // 第五部分：数字 + 计算字段
    // ========================================
    // ========================================
    // Custom 自定义组件示例
    // ========================================

    // 方式1：使用 children 函数（推荐，可访问 field、form 等）
    {
      name: "customField1",
      component: "Custom",
      colSpan: { xs: 12 },
      ui: {
        label: "付款账户",
        props: {
          children: ({ field, form, label, error, helperText }: any) => {
            return (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 12, color: "#999" }}>
                    没有可选账户？<a href="#">去添加</a>
                  </span>
                </div>
                <input
                  type="text"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  placeholder="请输入账户信息"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: error ? "1px solid red" : "1px solid #ddd",
                    borderRadius: 4,
                  }}
                />
                {helperText && (
                  <div
                    style={{
                      fontSize: 12,
                      color: error ? "red" : "#999",
                      marginTop: 4,
                    }}
                  >
                    {helperText}
                  </div>
                )}
              </div>
            );
          },
        },
      },
      rules: [{ type: "required", message: "请输入账户信息" }],
    },

    // 方式2：纯展示内容（不需要表单交互）
    {
      name: "customDisplay",
      component: "Custom",
      colSpan: { xs: 12 },
      noSubmit: true, // 不参与表单提交
      ui: {
        props: {
          children: (
            <div
              style={{
                padding: 16,
                background: "#f5f5f5",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <strong>💡 温馨提示：</strong>
              <span style={{ color: "#666" }}>
                以下为订单金额信息，总价会自动计算
              </span>
            </div>
          ),
        },
      },
    },

    {
      name: "price",
      component: "Number",
      defaultValue: 100,
      ui: { label: "单价", props: { min: 0 } },
      colSpan: { xs: 12, md: 4 },
      rules: [
        { type: "required", message: "请输入单价" },
        { type: "min", value: 0, message: "单价不能为负数" },
      ],
    },

    {
      name: "quantity",
      component: "Number",
      defaultValue: 1,
      ui: { label: "数量", props: { min: 1 } },
      colSpan: { xs: 12, md: 4 },
      rules: [
        { type: "required", message: "请输入数量" },
        { type: "min", value: 1, message: "数量至少为1" },
        { type: "max", value: 999, message: "数量不能超过999" },
      ],
    },

    {
      name: "total",
      component: "Number",
      readonly: true,
      ui: {
        label: "总价",
        helperText: "自动计算: 单价 × 数量",
      },
      colSpan: { xs: 12, md: 4 },
      compute: { expr: "price * quantity" },
    },

    // ========================================
    // 第六部分：其他组件
    // ========================================
    {
      name: "birthday",
      component: "Date",
      ui: { label: "生日" },
      colSpan: { xs: 12, md: 6 },
      rules: [{ type: "required", message: "请选择生日" }],
    },

    {
      name: "rating",
      component: "Rating",
      defaultValue: 3,
      ui: { label: "评分" },
      colSpan: { xs: 12, md: 6 },
    },

    {
      name: "agreeTerms",
      component: "Checkbox",
      defaultValue: false,
      ui: { label: "我已阅读并同意服务条款" },
      colSpan: { xs: 12 },
      rules: [{ type: "required", message: "请同意服务条款" }],
    },
  ],
};

/**
 * 示例组件
 */
export default function SchemaFormExample2() {
  const formRef = useRef<SchemaFormInstance<FieldValues>>(null);

  const handleSubmit = async (values: FieldValues) => {
    console.log("✅ 提交数据:", values);
    alert(`提交成功!\n${JSON.stringify(values, null, 2)}`);
  };

  const handleValuesChange = (values: FieldValues) => {
    console.log("📝 值变化:", values);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        SchemaForm 完整示例
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        展示所有功能：FormList、Group、验证规则、条件控制、计算字段
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <SchemaForm
        onSubmit={handleSubmit}
        onValuesChange={handleValuesChange}
        ref={formRef}
        schema={formSchema}
        spacing={2}
      />

      <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => formRef.current?.submit()}
        >
          提交表单
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => formRef.current?.reset()}
        >
          重置表单
        </Button>
        <Button
          variant="text"
          onClick={() => console.log(formRef.current?.getValues())}
        >
          打印当前值
        </Button>
      </Box>
    </Box>
  );
}
