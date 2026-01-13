/**
 * FormList 动态列表示例
 *
 * 本示例展示：
 * 1. 基础 FormList 用法
 * 2. 最小/最大行数限制
 * 3. 行内计算字段
 * 4. 嵌套 FormList
 * 5. 复制行功能
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
import { SchemaForm, type SchemaFormInstance } from "@fastspace/schema-form";

// 使用本地类型定义避免 dist 中旧类型的限制
type SchemaInput = {
  meta?: { version: string };
  fields: any[];
};

// ============================================================================
// Schema 定义
// ============================================================================

const formListSchema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    // ==================== 基础 FormList ====================
    {
      name: "_section1",
      component: "Group",
      ui: {
        title: "基础联系人列表",
        style: "card",
        description: "最简单的 FormList 用法，支持添加/删除行",
      },
      children: [],
    },
    {
      name: "contacts",
      component: "FormList",
      // 默认值：至少一行
      defaultValue: [{ name: "", phone: "", email: "" }],
      colSpan: { xs: 12 },
      ui: {
        label: "联系人列表",
        addText: "添加联系人", // 添加按钮文字
        removeText: "删除", // 删除按钮文字
        minItems: 1, // 最少1行
        maxItems: 5, // 最多5行
        showIndex: true, // 显示行号
        showCopy: true, // 显示复制按钮
        emptyText: "暂无联系人，请点击添加", // 空状态提示
      },
      // 子字段定义
      children: [
        {
          name: "name",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          validate: [{ type: "required", message: "姓名必填" }],
          ui: {
            label: "姓名",
            placeholder: "请输入姓名",
          },
        },
        {
          name: "phone",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          validate: [
            { type: "required", message: "电话必填" },
            { type: "phone", message: "电话格式不正确" },
          ],
          ui: {
            label: "电话",
            placeholder: "请输入手机号",
          },
        },
        {
          name: "email",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          validate: [{ type: "email", message: "邮箱格式不正确" }],
          ui: {
            label: "邮箱",
            placeholder: "选填",
          },
        },
      ],
    },

    // ==================== 带计算的 FormList ====================
    {
      name: "_section2",
      component: "Group",
      ui: {
        title: "订单商品列表 (带计算)",
        style: "card",
        description: "每行自动计算小计，支持行内联动",
      },
      children: [],
    },
    {
      name: "orderItems",
      component: "FormList",
      defaultValue: [{ productName: "", price: 0, quantity: 1 }],
      colSpan: { xs: 12 },
      ui: {
        label: "商品列表",
        addText: "添加商品",
        minItems: 1,
        maxItems: 10,
        showIndex: true,
        showCopy: true,
      },
      children: [
        {
          name: "productName",
          component: "Text",
          colSpan: { xs: 12, md: 3 },
          validate: [{ type: "required", message: "商品名称必填" }],
          ui: {
            label: "商品名称",
            placeholder: "请输入商品名",
          },
        },
        {
          name: "price",
          component: "Number",
          defaultValue: 0,
          colSpan: { xs: 12, md: 3 },
          validate: [
            { type: "required" },
            { type: "min", value: 0, message: "价格不能为负" },
          ],
          ui: {
            label: "单价 (元)",
            min: 0,
            step: 0.01,
          },
        },
        {
          name: "quantity",
          component: "Number",
          defaultValue: 1,
          colSpan: { xs: 12, md: 3 },
          validate: [
            { type: "required" },
            { type: "min", value: 1, message: "数量至少为1" },
            { type: "integer", message: "数量必须是整数" },
          ],
          ui: {
            label: "数量",
            min: 1,
            max: 999,
          },
        },
        {
          name: "subtotal",
          component: "Number",
          colSpan: { xs: 12, md: 3 },
          // 自动计算小计
          compute: "price * quantity",
          disabledWhen: "true",
          ui: {
            label: "小计 (自动计算)",
          },
        },
      ],
    },

    // ==================== 工作经历（带日期范围）====================
    {
      name: "_section3",
      component: "Group",
      ui: {
        title: "工作经历",
        style: "card",
        description: "复杂表单项，包含日期、选择器等",
      },
      children: [],
    },
    {
      name: "workHistory",
      component: "FormList",
      defaultValue: [],
      colSpan: { xs: 12 },
      ui: {
        label: "工作经历",
        addText: "添加工作经历",
        minItems: 0, // 可以为空
        maxItems: 10,
        showIndex: true,
        showCopy: true,
        emptyText: "暂无工作经历",
      },
      children: [
        {
          name: "company",
          component: "Text",
          colSpan: { xs: 12, md: 6 },
          validate: [{ type: "required", message: "公司名称必填" }],
          ui: {
            label: "公司名称",
            placeholder: "请输入公司名称",
          },
        },
        {
          name: "position",
          component: "Text",
          colSpan: { xs: 12, md: 6 },
          validate: [{ type: "required", message: "职位必填" }],
          ui: {
            label: "职位",
            placeholder: "请输入职位",
          },
        },
        {
          name: "startDate",
          component: "Date",
          colSpan: { xs: 12, md: 4 },
          validate: [{ type: "required", message: "入职日期必填" }],
          ui: {
            label: "入职日期",
          },
        },
        {
          name: "isCurrent",
          component: "Checkbox",
          defaultValue: false,
          colSpan: { xs: 12, md: 4 },
          ui: {
            label: "至今仍在职",
            inline: true,
          },
        },
        {
          name: "endDate",
          component: "Date",
          colSpan: { xs: 12, md: 4 },
          // 仍在职时隐藏
          visibleWhen: "!isCurrent",
          requiredWhen: "!isCurrent",
          ui: {
            label: "离职日期",
          },
        },
        {
          name: "description",
          component: "Textarea",
          colSpan: { xs: 12 },
          ui: {
            label: "工作描述",
            placeholder: "请描述您的工作内容和成就...",
            rows: 2,
            maxLength: 500,
          },
        },
      ],
    },

    // ==================== 简单列表（无标题）====================
    {
      name: "_section4",
      component: "Group",
      ui: {
        title: "技能标签",
        style: "card",
        description: "简单的单字段列表",
      },
      children: [],
    },
    {
      name: "skills",
      component: "FormList",
      defaultValue: [{ skill: "" }],
      colSpan: { xs: 12 },
      ui: {
        label: "技能列表",
        addText: "添加技能",
        minItems: 1,
        maxItems: 20,
        showIndex: false, // 不显示序号
        showCopy: false, // 不显示复制
      },
      children: [
        {
          name: "skill",
          component: "Text",
          colSpan: { xs: 12 },
          validate: [{ type: "required", message: "技能名称必填" }],
          ui: {
            label: "技能",
            placeholder: "如：JavaScript, React, TypeScript...",
          },
        },
      ],
    },

    // ==================== 产品规格（多字段）====================
    {
      name: "_section5",
      component: "Group",
      ui: {
        title: "产品规格",
        style: "card",
        description: "多字段组合",
      },
      children: [],
    },
    {
      name: "specifications",
      component: "FormList",
      defaultValue: [{ key: "", value: "", unit: "" }],
      colSpan: { xs: 12 },
      ui: {
        label: "规格参数",
        addText: "添加规格",
        minItems: 1,
        maxItems: 50,
        showIndex: true,
        showCopy: true,
      },
      children: [
        {
          name: "key",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          validate: [{ type: "required", message: "参数名必填" }],
          ui: {
            label: "参数名",
            placeholder: "如：重量、尺寸、颜色",
          },
        },
        {
          name: "value",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          validate: [{ type: "required", message: "参数值必填" }],
          ui: {
            label: "参数值",
            placeholder: "如：500、10x20x5、红色",
          },
        },
        {
          name: "unit",
          component: "Select",
          colSpan: { xs: 12, md: 4 },
          options: [
            { label: "无单位", value: "" },
            { label: "克 (g)", value: "g" },
            { label: "千克 (kg)", value: "kg" },
            { label: "毫米 (mm)", value: "mm" },
            { label: "厘米 (cm)", value: "cm" },
            { label: "米 (m)", value: "m" },
            { label: "毫升 (ml)", value: "ml" },
            { label: "升 (L)", value: "L" },
          ],
          ui: {
            label: "单位",
            placeholder: "选择单位",
            clearable: true,
          },
        },
      ],
    },
  ],
};

// ============================================================================
// 组件
// ============================================================================

export default function FormListExample() {
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
          FormList 动态列表示例
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          展示动态列表的各种配置：添加/删除/复制、最小最大行数、行内计算等
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <SchemaForm
          ref={formRef}
          schema={formListSchema}
          onSubmit={handleSubmit}
        >
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
                fontSize: "0.75rem",
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
          📖 FormList 使用指南
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          1. 基础用法
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
          {`{
  name: "contacts",
  component: "FormList",
  defaultValue: [{ name: "", phone: "" }],  // 默认一行
  ui: {
    label: "联系人列表",
    addText: "添加联系人",    // 添加按钮文字
    minItems: 1,              // 最少行数
    maxItems: 10,             // 最多行数
    showIndex: true,          // 显示行号
    showCopy: true,           // 显示复制按钮
    emptyText: "暂无数据",    // 空状态提示
  },
  children: [
    { name: "name", component: "Text", ... },
    { name: "phone", component: "Text", ... },
  ],
}`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          2. 行内计算
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
          {`// 在 children 中使用 compute 实现行内计算
{
  name: "subtotal",
  component: "Number",
  compute: "price * quantity",  // 自动计算小计
  disabledWhen: "true",         // 禁用编辑
}`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          3. 条件显隐
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
          {`// 在 children 中使用 visibleWhen 实现条件显隐
{
  name: "endDate",
  component: "Date",
  visibleWhen: "!isCurrent",    // 仍在职时隐藏
  requiredWhen: "!isCurrent",   // 仍在职时非必填
}`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          4. 数据结构
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
          {`// 提交时的数据结构
{
  contacts: [
    { name: "张三", phone: "13800138000", email: "..." },
    { name: "李四", phone: "13900139000", email: "..." },
  ],
  orderItems: [
    { productName: "商品A", price: 100, quantity: 2, subtotal: 200 },
  ],
}`}
        </Box>
      </Paper>
    </Box>
  );
}
