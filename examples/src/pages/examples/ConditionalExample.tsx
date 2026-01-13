/**
 * 条件逻辑示例 - 展示字段联动功能
 *
 * 本示例展示：
 * 1. visibleWhen - 条件显示/隐藏
 * 2. disabledWhen - 条件禁用
 * 3. requiredWhen - 条件必填
 * 4. compute - 派生计算
 * 5. 复杂联动场景
 */

import React, { useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import {
  SchemaForm,
  type SchemaFormInstance,
} from "@fastspace/schema-form";

// 使用本地类型定义避免 dist 中旧类型的限制
type SchemaInput = {
  meta?: { version: string };
  fields: any[];
};

// ============================================================================
// Schema 定义 - 条件逻辑示例
// ============================================================================

const conditionalSchema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    // ==================== 条件显示 (visibleWhen) ====================
    {
      name: "_section1",
      component: "Group",
      ui: {
        title: "条件显示 (visibleWhen)",
        style: "card",
        description: "根据条件动态显示/隐藏字段",
      },
      children: [],
    },
    {
      name: "userType",
      component: "Radio",
      defaultValue: "personal",
      colSpan: { xs: 12 },
      options: [
        { label: "个人用户", value: "personal" },
        { label: "企业用户", value: "enterprise" },
      ],
      ui: {
        label: "用户类型",
        helperText: "选择不同类型显示不同字段",
        row: true,
        inline: true,
      },
    },
    {
      name: "personalId",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      // 仅个人用户显示
      visibleWhen: "userType === 'personal'",
      validate: [{ type: "idCard", message: "请输入有效的身份证号" }],
      ui: {
        label: "身份证号",
        placeholder: "仅个人用户需填写",
        helperText: "visibleWhen: \"userType === 'personal'\"",
      },
    },
    {
      name: "companyName",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      // 仅企业用户显示
      visibleWhen: "userType === 'enterprise'",
      validate: [{ type: "required", message: "公司名称必填" }],
      ui: {
        label: "公司名称",
        placeholder: "仅企业用户需填写",
        helperText: "visibleWhen: \"userType === 'enterprise'\"",
      },
    },
    {
      name: "businessLicense",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      visibleWhen: "userType === 'enterprise'",
      ui: {
        label: "营业执照号",
        placeholder: "企业用户选填",
      },
    },
    {
      name: "taxNumber",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      visibleWhen: "userType === 'enterprise'",
      ui: {
        label: "税号",
        placeholder: "企业用户选填",
      },
    },

    // ==================== 条件禁用 (disabledWhen) ====================
    {
      name: "_section2",
      component: "Group",
      ui: {
        title: "条件禁用 (disabledWhen)",
        style: "card",
        description: "根据条件启用/禁用字段",
      },
      children: [],
    },
    {
      name: "enableDiscount",
      component: "Switch",
      defaultValue: false,
      colSpan: { xs: 12 },
      ui: {
        label: "启用折扣",
        helperText: "开启后可以输入折扣率",
        inline: true,
      },
    },
    {
      name: "discountRate",
      component: "Slider",
      defaultValue: 10,
      colSpan: { xs: 12, md: 6 },
      // 未开启折扣时禁用
      disabledWhen: "!enableDiscount",
      ui: {
        label: "折扣率 (%)",
        helperText: "disabledWhen: \"!enableDiscount\"",
        min: 0,
        max: 50,
        step: 5,
        marks: true,
      },
    },
    {
      name: "vipLevel",
      component: "Select",
      defaultValue: "normal",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "普通会员", value: "normal" },
        { label: "银卡会员", value: "silver" },
        { label: "金卡会员", value: "gold" },
        { label: "钻石会员", value: "diamond" },
      ],
      ui: {
        label: "会员等级",
        helperText: "金卡及以上可使用大额折扣",
      },
    },
    {
      name: "maxDiscount",
      component: "Number",
      defaultValue: 1000,
      colSpan: { xs: 12, md: 6 },
      // 非金卡/钻石会员禁用
      disabledWhen: "vipLevel !== 'gold' && vipLevel !== 'diamond'",
      ui: {
        label: "最大折扣金额",
        helperText: "金卡及以上可设置",
        min: 0,
        max: 10000,
      },
    },

    // ==================== 条件必填 (requiredWhen) ====================
    {
      name: "_section3",
      component: "Group",
      ui: {
        title: "条件必填 (requiredWhen)",
        style: "card",
        description: "根据条件动态设置必填状态",
      },
      children: [],
    },
    {
      name: "needInvoice",
      component: "Checkbox",
      defaultValue: false,
      colSpan: { xs: 12 },
      ui: {
        label: "需要开具发票",
        helperText: "勾选后需填写发票信息",
        inline: true,
      },
    },
    {
      name: "invoiceTitle",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      // 需要发票时必填
      requiredWhen: "needInvoice",
      ui: {
        label: "发票抬头",
        placeholder: "需要发票时必填",
        helperText: "requiredWhen: \"needInvoice\"",
      },
    },
    {
      name: "invoiceTaxNumber",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      requiredWhen: "needInvoice",
      ui: {
        label: "纳税人识别号",
        placeholder: "需要发票时必填",
      },
    },
    {
      name: "notifyMethod",
      component: "Radio",
      defaultValue: "email",
      colSpan: { xs: 12 },
      options: [
        { label: "邮件通知", value: "email" },
        { label: "短信通知", value: "sms" },
        { label: "不通知", value: "none" },
      ],
      ui: {
        label: "通知方式",
        row: true,
        inline: true,
      },
    },
    {
      name: "notifyEmail",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      // 选择邮件通知时显示并必填
      visibleWhen: "notifyMethod === 'email'",
      requiredWhen: "notifyMethod === 'email'",
      validate: [{ type: "email", message: "请输入有效邮箱" }],
      ui: {
        label: "通知邮箱",
        placeholder: "example@domain.com",
        helperText: "邮件通知时必填",
      },
    },
    {
      name: "notifyPhone",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      // 选择短信通知时显示并必填
      visibleWhen: "notifyMethod === 'sms'",
      requiredWhen: "notifyMethod === 'sms'",
      validate: [{ type: "phone", message: "请输入有效手机号" }],
      ui: {
        label: "通知手机",
        placeholder: "13800138000",
        helperText: "短信通知时必填",
      },
    },

    // ==================== 派生计算 (compute) ====================
    {
      name: "_section4",
      component: "Group",
      ui: {
        title: "派生计算 (compute)",
        style: "card",
        description: "自动计算字段值，支持数学运算和字符串拼接",
      },
      children: [],
    },
    {
      name: "unitPrice",
      component: "Number",
      defaultValue: 100,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "单价 (元)",
        min: 0,
        step: 10,
      },
    },
    {
      name: "quantity",
      component: "Number",
      defaultValue: 1,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "数量",
        min: 1,
        max: 100,
      },
    },
    {
      name: "subtotal",
      component: "Number",
      colSpan: { xs: 12, md: 4 },
      // 自动计算：单价 × 数量
      compute: "unitPrice * quantity",
      disabledWhen: "true", // 禁止手动修改
      ui: {
        label: "小计 (自动计算)",
        helperText: "compute: \"unitPrice * quantity\"",
      },
    },
    {
      name: "discountAmount",
      component: "Number",
      colSpan: { xs: 12, md: 6 },
      // 计算折扣金额
      compute: "enableDiscount ? subtotal * discountRate / 100 : 0",
      disabledWhen: "true",
      ui: {
        label: "折扣金额 (自动计算)",
        helperText: "根据是否启用折扣和折扣率计算",
      },
    },
    {
      name: "totalPrice",
      component: "Number",
      colSpan: { xs: 12, md: 6 },
      // 计算最终价格
      compute: "subtotal - discountAmount",
      disabledWhen: "true",
      ui: {
        label: "最终价格 (自动计算)",
        helperText: "小计 - 折扣金额",
      },
    },

    // 字符串拼接
    {
      name: "firstName",
      component: "Text",
      defaultValue: "张",
      colSpan: { xs: 12, md: 4 },
      ui: { label: "姓" },
    },
    {
      name: "lastName",
      component: "Text",
      defaultValue: "三",
      colSpan: { xs: 12, md: 4 },
      ui: { label: "名" },
    },
    {
      name: "fullName",
      component: "Text",
      colSpan: { xs: 12, md: 4 },
      // 字符串拼接
      compute: "firstName + lastName",
      disabledWhen: "true",
      ui: {
        label: "全名 (自动拼接)",
        helperText: "compute: \"firstName + lastName\"",
      },
    },

    // 布尔计算
    {
      name: "age",
      component: "Number",
      defaultValue: 20,
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "年龄",
        min: 0,
        max: 150,
      },
    },
    {
      name: "isAdult",
      component: "Switch",
      colSpan: { xs: 12, md: 6 },
      // 布尔计算
      compute: "age >= 18",
      disabledWhen: "true",
      ui: {
        label: "是否成年 (自动判断)",
        helperText: "compute: \"age >= 18\"",
        inline: true,
      },
    },

    // ==================== 复杂联动 ====================
    {
      name: "_section5",
      component: "Group",
      ui: {
        title: "复杂联动场景",
        style: "card",
        description: "多个条件组合使用",
      },
      children: [],
    },
    {
      name: "productType",
      component: "Select",
      defaultValue: "",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "请选择产品类型", value: "" },
        { label: "实物商品", value: "physical" },
        { label: "虚拟商品", value: "virtual" },
        { label: "服务类", value: "service" },
      ],
      ui: {
        label: "产品类型",
        helperText: "不同类型显示不同字段",
      },
    },
    {
      name: "deliveryMethod",
      component: "Radio",
      colSpan: { xs: 12, md: 6 },
      // 仅实物商品显示
      visibleWhen: "productType === 'physical'",
      options: [
        { label: "快递配送", value: "express" },
        { label: "到店自取", value: "pickup" },
      ],
      ui: {
        label: "配送方式",
        row: true,
      },
    },
    {
      name: "deliveryAddress",
      component: "Textarea",
      colSpan: { xs: 12 },
      // 实物商品 + 快递配送时显示
      visibleWhen: "productType === 'physical' && deliveryMethod === 'express'",
      requiredWhen: "productType === 'physical' && deliveryMethod === 'express'",
      ui: {
        label: "收货地址",
        placeholder: "请输入详细收货地址",
        helperText: "快递配送时必填",
        rows: 2,
      },
    },
    {
      name: "pickupStore",
      component: "Select",
      colSpan: { xs: 12 },
      // 实物商品 + 到店自取时显示
      visibleWhen: "productType === 'physical' && deliveryMethod === 'pickup'",
      options: [
        { label: "北京旗舰店", value: "beijing" },
        { label: "上海旗舰店", value: "shanghai" },
        { label: "广州旗舰店", value: "guangzhou" },
      ],
      ui: {
        label: "自取门店",
        helperText: "到店自取时选择",
      },
    },
    {
      name: "virtualAccount",
      component: "Text",
      colSpan: { xs: 12 },
      // 虚拟商品显示
      visibleWhen: "productType === 'virtual'",
      requiredWhen: "productType === 'virtual'",
      validate: [{ type: "email", message: "请输入有效邮箱" }],
      ui: {
        label: "接收账号 (邮箱)",
        placeholder: "虚拟商品将发送到此邮箱",
        helperText: "虚拟商品必填",
      },
    },
    {
      name: "serviceTime",
      component: "DateTime",
      colSpan: { xs: 12, md: 6 },
      // 服务类显示
      visibleWhen: "productType === 'service'",
      requiredWhen: "productType === 'service'",
      ui: {
        label: "预约时间",
        helperText: "服务类产品必填",
      },
    },
    {
      name: "serviceNote",
      component: "Textarea",
      colSpan: { xs: 12, md: 6 },
      visibleWhen: "productType === 'service'",
      ui: {
        label: "备注说明",
        placeholder: "特殊要求请在此说明",
        rows: 2,
      },
    },
  ],
};

// ============================================================================
// 组件
// ============================================================================

export default function ConditionalExample() {
  const formRef = useRef<SchemaFormInstance>(null);
  const [submittedData, setSubmittedData] = React.useState<any>(null);

  const handleSubmit = (values: any) => {
    console.log("提交数据:", values);
    setSubmittedData(values);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          条件逻辑示例
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          展示 visibleWhen、disabledWhen、requiredWhen、compute 的用法
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <SchemaForm ref={formRef} schema={conditionalSchema} onSubmit={handleSubmit}>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => formRef.current?.submit()}
            >
              提交表单
            </Button>
            <Button variant="outlined" onClick={() => formRef.current?.reset()}>
              重置
            </Button>
          </Stack>
        </SchemaForm>

        {submittedData && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="subtitle2">提交成功！</Typography>
            <Box
              component="pre"
              sx={{
                mt: 1,
                p: 2,
                bgcolor: "grey.100",
                borderRadius: 1,
                overflow: "auto",
                fontSize: "0.875rem",
                maxHeight: 400,
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
          📖 条件逻辑使用指南
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          1. 条件显示 (visibleWhen)
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
          {`// 字符串表达式
visibleWhen: "userType === 'enterprise'"

// 函数形式
visibleWhen: (scope) => scope.values.userType === 'enterprise'`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          2. 条件禁用 (disabledWhen)
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
          {`// 当高级设置未启用时禁用
disabledWhen: "!enableAdvanced"

// 当某字段为空时禁用
disabledWhen: "!province"`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          3. 条件必填 (requiredWhen)
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
          {`// 当需要发票时，发票抬头必填
requiredWhen: "needInvoice"`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          4. 派生计算 (compute)
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
          {`// 数值计算
compute: "price * quantity"

// 字符串拼接
compute: "firstName + ' ' + lastName"

// 布尔判断
compute: "age >= 18"

// 函数形式
compute: (scope) => scope.values.price * scope.values.quantity`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          5. 表达式语法支持
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {[
            "===", "!==", ">", "<", ">=", "<=",
            "&&", "||", "!",
            "+", "-", "*", "/", "%",
            "? :", "()", "字段名"
          ].map(op => (
            <Box
              key={op}
              sx={{
                px: 1.5,
                py: 0.5,
                bgcolor: "grey.300",
                borderRadius: 1,
                fontSize: "0.75rem",
                fontFamily: "monospace",
              }}
            >
              {op}
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
