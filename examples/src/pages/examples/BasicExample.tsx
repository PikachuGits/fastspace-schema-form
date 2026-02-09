/**
 * 基础示例 - 展示所有 Widget 组件类型
 *
 * 本示例展示：
 * 1. 所有内置 Widget 组件的基本用法
 * 2. 基础属性配置（label, placeholder, helperText）
 * 3. 栅格布局配置（colSpan）
 * 4. 默认值设置
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
  type SchemaInput,
} from "@fastspace/schema-form";

// ============================================================================
// Schema 定义 - 所有组件类型
// ============================================================================

const basicSchema: SchemaInput = {
  // meta: {
  //   version: "1.0.0",
  //   compatibleWith: ["^1.0.0"],
  // },
  fields: [
    // ==================== 文本类组件 ====================
    {
      name: "text",
      component: "Text",
      defaultValue: "",
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "文本输入 (Text)",
        placeholder: "请输入文本",
        helperText: "基础单行文本输入框",
      },
    },
    {
      name: "password",
      component: "Password",
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "密码输入 (Password)",
        placeholder: "请输入密码",
        helperText: "带显示/隐藏切换的密码框",
        showToggle: true, // 显示切换按钮
      },
    },
    {
      name: "textarea",
      component: "Textarea",
      colSpan: { xs: 12 },
      ui: {
        label: "多行文本 (Textarea)",
        placeholder: "请输入详细描述...",
        helperText: "多行文本输入框",
        rows: 1, // 默认行数
        maxRows: 6, // 最大行数
        maxLength: 500, // 最大字符数
      },
    },

    // ==================== 数值类组件 ====================
    {
      name: "number",
      component: "Number",
      defaultValue: 50,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "数字输入 (Number)",
        helperText: "范围 0-100，步长 1",
        min: 0,
        max: 100,
        step: 1,
      },
    },
    {
      name: "integerNumber",
      component: "Number",
      defaultValue: 0,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "仅整数 (integer)",
        helperText: "失焦自动截断小数，如 3.7→3",
        integer: true,
        min: 0,
        max: 999,
      },
    },
    {
      name: "precisionNumber",
      component: "Number",
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "保留2位小数 (precision)",
        helperText: "失焦四舍五入，如 3.14159→3.14",
        precision: 2,
        allowNegative: false,
      },
    },
    {
      name: "slider",
      component: "Slider",
      defaultValue: 50,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "滑块 (Slider)",
        helperText: "拖动选择数值",
        min: 0,
        max: 100,
        step: 1,
        marks: true, // 显示刻度
        inline: false, // label 在上方
      },
    },
    {
      name: "rating",
      component: "Rating",
      defaultValue: 3,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "评分 (Rating)",
        helperText: "1-5 星评分",
        max: 5,
        precision: 0.5, // 支持半星
        inline: true, // label 和组件在同一行
      },
    },

    // ==================== 选择类组件 ====================
    {
      name: "select",
      component: "Select",
      defaultValue: "option1",
      colSpan: { xs: 12, md: 12 },
      options: [
        { label: "选项一", value: "option1" },
        { label: "选项二", value: "option2" },
        { label: "选项三", value: "option3" },
      ],
      ui: {
        label: "下拉选择 (Select - Unified Autocomplete)",
        placeholder: "请选择(可搜索)",
        helperText: "基于 Autocomplete 实现，支持搜索",
        clearable: true, // 可清空
      },
    },
    {
      name: "customSelect",
      component: "Select",
      colSpan: { xs: 12, md: 6 },
      options: [
        { name: "自定义选项 1", id: 1 },
        { name: "自定义选项 2", id: 2 },
      ],
      ui: {
        label: "自定义字段 Select",
        placeholder: "测试 optionLabelProp",
        helperText: "optionLabelProp='name', optionValueProp='id'",
        optionLabelProp: "name",
        optionValueProp: "id",
      },
    },
    {
      name: "selectMultiple",
      component: "Select",
      defaultValue: ["option1", "option2"],
      colSpan: { xs: 12, md: 4 },
      options: [
        { label: "选项A", value: "option1" },
        { label: "选项B", value: "option2" },
        { label: "选项C", value: "option3" },
        { label: "选项D", value: "option4" },
      ],
      ui: {
        label: "多选下拉 (Select Multiple)",
        placeholder: "请选择多个",
        helperText: "支持选择多个选项",
        multiple: true, // 开启多选
      },
    },
    {
      name: "radio",
      component: "Radio",
      defaultValue: "male",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "男", value: "male" },
        { label: "女", value: "female" },
        { label: "其他", value: "other" },
      ],
      ui: {
        label: "单选按钮组 (Radio)",
        helperText: "水平排列",
        row: true, // 选项水平排列
        inline: true, // label 和选项同行
      },
    },
    {
      name: "autocomplete",
      component: "Autocomplete",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "北京", value: "beijing" },
        { label: "上海", value: "shanghai" },
        { label: "广州", value: "guangzhou" },
        { label: "深圳", value: "shenzhen" },
        { label: "杭州", value: "hangzhou" },
        { label: "南京", value: "nanjing" },
      ],
      ui: {
        label: "自动完成 (Autocomplete)",
        placeholder: "输入搜索城市...",
        helperText: "支持本地搜索过滤",
      },
    },
    {
      name: "autocompleteFreeSolo",
      component: "Autocomplete",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "React", value: "react" },
        { label: "Vue", value: "vue" },
        { label: "Angular", value: "angular" },
      ],
      ui: {
        label: "自由输入 (freeSolo)",
        placeholder: "选择或输入技术栈...",
        helperText: "可输入选项外的值",
        freeSolo: true, // 允许自由输入
        multiple: true, // 多选
      },
    },

    // ==================== 布尔类组件 ====================
    {
      name: "checkbox",
      component: "Checkbox",
      defaultValue: false,
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "复选框 (Checkbox)",
        helperText: "勾选表示同意",
        inline: true, // label 和复选框同行
      },
    },
    {
      name: "switch",
      component: "Switch",
      defaultValue: true,
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "开关 (Switch)",
        helperText: "开启/关闭状态",
        inline: true,
      },
    },

    // ==================== 日期时间类组件 ====================
    {
      name: "date",
      component: "Date",
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "日期选择 (Date)",
        helperText: "选择日期",
        format: "YYYY-MM-DD", // 日期格式
      },
    },
    {
      name: "time",
      component: "Time",
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "时间选择 (Time)",
        helperText: "选择时间",
        format: "HH:mm", // 时间格式
        ampm: false, // 24小时制
        minutesStep: 5, // 分钟步长
      },
    },
    {
      name: "datetime",
      component: "DateTime",
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "日期时间 (DateTime)",
        helperText: "选择日期和时间",
        format: "YYYY-MM-DD HH:mm",
      },
    },

    // ==================== 特殊组件 ====================
    {
      name: "hidden",
      component: "Hidden",
      defaultValue: "hidden-value-123",
      // Hidden 组件不渲染 UI，但值会包含在表单数据中
    },
  ],
};

// ============================================================================
// 组件
// ============================================================================

export default function BasicExample() {
  // 表单引用
  const formRef = useRef<SchemaFormInstance>(null);
  // 提交的数据
  const [submittedData, setSubmittedData] = React.useState<any>(null);

  // 提交处理
  const handleSubmit = (values: any) => {
    console.log("表单提交:", values);
    setSubmittedData(values);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* 标题 */}
        <Typography variant="h4" gutterBottom>
          基础示例 - 所有 Widget 组件
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          展示 @fastspace/schema-form 支持的所有内置组件类型及其基础配置
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* 表单 */}
        <SchemaForm
          ref={formRef}
          schema={basicSchema}
          onSubmit={handleSubmit}
          spacing={2}
        >
          {/* 操作按钮 */}
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => formRef.current?.submit()}
            >
              提交表单
            </Button>
            <Button variant="outlined" onClick={() => formRef.current?.reset()}>
              重置
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const values = formRef.current?.getValues();
                console.log("当前值:", values);
                alert("请查看控制台");
              }}
            >
              打印当前值
            </Button>
          </Stack>
        </SchemaForm>

        {/* 提交结果展示 */}
        {submittedData && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="subtitle2">提交成功！数据如下：</Typography>
            <Box
              component="pre"
              sx={{
                mt: 1,
                p: 2,
                bgcolor: "grey.100",
                borderRadius: 1,
                overflow: "auto",
                fontSize: "0.875rem",
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
          📖 基础组件使用指南
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          1. Schema 基本结构
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
          {`const schema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    {
      name: "fieldName",        // 字段名（表单数据的 key）
      component: "Text",        // 组件类型
      defaultValue: "",         // 默认值
      colSpan: { xs: 12, md: 6 }, // 响应式栅格布局
      ui: {
        label: "标签",
        placeholder: "占位符",
        helperText: "帮助文本",
      },
    },
  ],
};`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          2. 支持的组件类型
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {[
            "Text",
            "Number",
            "Select",
            "Radio",
            "Checkbox",
            "Switch",
            "Slider",
            "Rating",
            "Date",
            "Time",
            "DateTime",
            "Autocomplete",
            "Textarea",
            "Hidden",
            "Group",
            "FormList",
            "Custom",
          ].map((type) => (
            <Box
              key={type}
              sx={{
                px: 1.5,
                py: 0.5,
                bgcolor: "primary.light",
                color: "white",
                borderRadius: 1,
                fontSize: "0.75rem",
              }}
            >
              {type}
            </Box>
          ))}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          3. 栅格布局 (colSpan)
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
          {`// 响应式布局（基于 MUI Grid，总宽度 12 栏）
colSpan: { xs: 12, md: 6, lg: 4 }

// xs: 手机端占满整行
// md: 平板端占半行
// lg: 桌面端占 1/3 行`}
        </Box>
      </Paper>
    </Box>
  );
}
