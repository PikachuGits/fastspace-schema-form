import React, { useRef, useMemo, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Divider,
  Stack,
  Alert,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import { SchemaForm, type SchemaFormInstance } from "./ui/SchemaForm";
import type { SchemaInput } from "./types";
import { rulesToValibot } from "./core/validation/rulesAdapter";
import * as v from "valibot";

// ============================================================================
// 示例 1: 基础表单 - 所有 Widget 类型
// ============================================================================

const basicWidgetsSchema: SchemaInput = {
  meta: {
    version: "1.0.0",
    compatibleWith: ["^1.0.0"],
  },
  fields: [
    // ==================== 文本类 ====================
    {
      name: "text",
      component: "Text",
      defaultValue: "",
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(v.string(), v.minLength(3, "至少3个字符")),
      ui: {
        label: "文本输入 (Text)",
        placeholder: "请输入文本",
        helperText: "基础文本输入框",
        required: true
      },
    },
    {
      name: "password",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "密码输入 (Password)",
        placeholder: "请输入密码",
        type: "password",
        helperText: "密码会被隐藏显示",
      },
    },
    {
      name: "email",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(v.string(), v.check(
        (val) =>
          val === undefined || val === null || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val)),
        `email必须是有效的邮箱`,
      )),
      ui: {
        label: "邮箱 (Email)",
        placeholder: "example@domain.com",
        type: "email",
        helperText: "支持邮箱格式验证",
      },
    },
    {
      name: "url",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "网址 (URL)",
        placeholder: "https://example.com",
        type: "url",
      },
    },
    {
      name: "textarea",
      component: "Text",
      colSpan: { xs: 12 },
      ui: {
        label: "多行文本 (Textarea)",
        placeholder: "请输入多行文本内容...",
        multiline: true,
        rows: 4,
        helperText: "支持多行输入",
      },
    },

    // ==================== 数值类 ====================
    {
      name: "number",
      component: "Number",
      defaultValue: 0,
      colSpan: { xs: 12, md: 4 },
      validate: v.pipe(v.number("请输入数字"), v.minValue(0), v.maxValue(100)),
      ui: {
        label: "数字输入 (Number)",
        min: 0,
        max: 100,
        helperText: "范围: 0-100",
      },
    },
    {
      name: "slider",
      component: "Slider",
      defaultValue: 50,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "滑块 (Slider)",
        min: 0,
        max: 100,
        step: 5,
        marks: true,
        helperText: "拖动调整数值",
      },
    },
    {
      name: "rating",
      component: "Rating",
      defaultValue: 3,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "评分 (Rating)",
        max: 5,
        precision: 0.5,
        helperText: "支持半星",
      },
    },

    // ==================== 选择类 ====================
    {
      name: "select",
      component: "Select",
      defaultValue: "",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "选项一", value: "option1" },
        { label: "选项二", value: "option2" },
        { label: "选项三", value: "option3" },
        { label: "禁用选项", value: "disabled", disabled: true },
      ],
      ui: {
        label: "下拉选择 (Select)",
        placeholder: "请选择",
        helperText: "单选下拉框",
      },
    },
    {
      name: "radio",
      component: "Radio",
      defaultValue: "A",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "选项 A", value: "A" },
        { label: "选项 B", value: "B" },
        { label: "选项 C", value: "C" },
      ],
      ui: {
        label: "单选按钮组 (Radio)",
        row: true,
        helperText: "横向排列",
      },
    },
    {
      name: "autocomplete",
      component: "Autocomplete",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "React", value: "react" },
        { label: "Vue", value: "vue" },
        { label: "Angular", value: "angular" },
        { label: "Svelte", value: "svelte" },
        { label: "Next.js", value: "nextjs" },
        { label: "Nuxt.js", value: "nuxtjs" },
      ],
      ui: {
        label: "自动完成 (Autocomplete)",
        placeholder: "搜索框架...",
        helperText: "支持搜索过滤",
      },
    },
    {
      name: "autocompleteMultiple",
      component: "Autocomplete",
      defaultValue: [],
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "JavaScript", value: "js" },
        { label: "TypeScript", value: "ts" },
        { label: "Python", value: "py" },
        { label: "Java", value: "java" },
        { label: "Go", value: "go" },
        { label: "Rust", value: "rust" },
      ],
      ui: {
        label: "多选自动完成",
        placeholder: "选择编程语言...",
        multiple: true,
        helperText: "支持多选",
      },
    },

    // ==================== 布尔类 ====================
    {
      name: "checkbox",
      component: "Checkbox",
      defaultValue: false,
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "复选框 (Checkbox)",
        helperText: "用于同意协议等场景",
      },
    },
    {
      name: "switch",
      component: "Switch",
      defaultValue: true,
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "开关 (Switch)",
        helperText: "用于开启/关闭功能",
      },
    },

    // ==================== 日期时间类 ====================
    {
      name: "date",
      component: "Date",
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "日期选择 (Date)",
        helperText: "选择日期",
      },
    },
    {
      name: "time",
      component: "Time",
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "时间选择 (Time)",
        helperText: "选择时间",
      },
    },
    {
      name: "datetime",
      component: "DateTime",
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "日期时间 (DateTime)",
        helperText: "同时选择日期和时间",
      },
    },

    // ==================== 隐藏字段 ====================
    {
      name: "hiddenField",
      component: "Hidden",
      defaultValue: "hidden-value-123",
    },
  ],
};

// ============================================================================
// 示例 2: 条件逻辑 - visibleWhen / disabledWhen / requiredWhen
// ============================================================================

const conditionalSchema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
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
        row: true,
        helperText: "选择不同类型会显示不同的表单项",
      },
    },

    // 个人用户字段
    {
      name: "personalName",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      visibleWhen: "userType === 'personal'",
      ui: {
        label: "姓名",
        placeholder: "请输入您的姓名",
        helperText: "仅个人用户显示",
      },
    },
    {
      name: "idCard",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      visibleWhen: "userType === 'personal'",
      ui: {
        label: "身份证号",
        placeholder: "请输入身份证号码",
      },
    },

    // 企业用户字段
    {
      name: "companyName",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      visibleWhen: "userType === 'enterprise'",
      ui: {
        label: "公司名称",
        placeholder: "请输入公司全称",
        helperText: "仅企业用户显示",
      },
    },
    {
      name: "businessLicense",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      visibleWhen: "userType === 'enterprise'",
      ui: {
        label: "营业执照号",
        placeholder: "请输入营业执照号码",
      },
    },
    {
      name: "taxNumber",
      component: "Text",
      colSpan: { xs: 12 },
      visibleWhen: "userType === 'enterprise'",
      ui: {
        label: "税号",
        placeholder: "请输入税号",
      },
    },

    // 条件禁用示例
    {
      name: "enableAdvanced",
      component: "Switch",
      defaultValue: false,
      colSpan: { xs: 12 },
      ui: {
        label: "启用高级设置",
        helperText: "开启后可配置高级选项",
      },
    },
    {
      name: "advancedOption1",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      disabledWhen: "!enableAdvanced",
      ui: {
        label: "高级选项 1",
        placeholder: "请先启用高级设置",
        helperText: "由开关控制禁用状态",
      },
    },
    {
      name: "advancedOption2",
      component: "Number",
      defaultValue: 100,
      colSpan: { xs: 12, md: 6 },
      disabledWhen: "!enableAdvanced",
      ui: {
        label: "高级选项 2",
        helperText: "由开关控制禁用状态",
      },
    },

    // 条件必填示例
    {
      name: "needInvoice",
      component: "Checkbox",
      defaultValue: false,
      colSpan: { xs: 12 },
      ui: {
        label: "需要开具发票",
      },
    },
    {
      name: "invoiceTitle",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      visibleWhen: "needInvoice",
      requiredWhen: "needInvoice",
      ui: {
        label: "发票抬头",
        placeholder: "请输入发票抬头",
        helperText: "勾选开发票后必填",
      },
    },
    {
      name: "invoiceTaxNo",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      visibleWhen: "needInvoice",
      requiredWhen: "needInvoice",
      ui: {
        label: "纳税人识别号",
        placeholder: "请输入纳税人识别号",
      },
    },
  ],
};

// ============================================================================
// 示例 3: 计算字段 - compute
// ============================================================================

const computeSchema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    // 价格计算
    {
      name: "unitPrice",
      component: "Number",
      defaultValue: 100,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "单价 (元)",
        min: 0,
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
        max: 999,
      },
    },
    {
      name: "subtotal",
      component: "Number",
      colSpan: { xs: 12, md: 4 },
      compute: "unitPrice * quantity",
      disabledWhen: "true",
      ui: {
        label: "小计 (自动计算)",
        helperText: "= 单价 × 数量",
      },
    },

    // 折扣计算
    {
      name: "discount",
      component: "Slider",
      defaultValue: 0,
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "折扣 (%)",
        min: 0,
        max: 50,
        step: 5,
        marks: [
          { value: 0, label: "0%" },
          { value: 25, label: "25%" },
          { value: 50, label: "50%" },
        ],
      },
    },
    {
      name: "discountAmount",
      component: "Number",
      colSpan: { xs: 12, md: 6 },
      compute: "subtotal * discount / 100",
      disabledWhen: "true",
      ui: {
        label: "折扣金额 (自动计算)",
        helperText: "= 小计 × 折扣率",
      },
    },

    // 最终价格
    {
      name: "finalPrice",
      component: "Number",
      colSpan: { xs: 12 },
      compute: "subtotal - discountAmount",
      disabledWhen: "true",
      ui: {
        label: "最终价格 (自动计算)",
        helperText: "= 小计 - 折扣金额",
      },
    },

    // 字符串拼接
    {
      name: "firstName",
      component: "Text",
      defaultValue: "张",
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "姓",
      },
    },
    {
      name: "lastName",
      component: "Text",
      defaultValue: "三",
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "名",
      },
    },
    {
      name: "fullName",
      component: "Text",
      colSpan: { xs: 12, md: 4 },
      compute: "firstName + lastName",
      disabledWhen: "true",
      ui: {
        label: "全名 (自动拼接)",
        helperText: "= 姓 + 名",
      },
    },

    // 布尔计算
    {
      name: "age",
      component: "Number",
      defaultValue: 18,
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
      compute: "age >= 18",
      disabledWhen: "true",
      ui: {
        label: "是否成年 (自动判断)",
        helperText: "年龄 ≥ 18 时为成年",
      },
    },
  ],
};

// ============================================================================
// 示例 4: FormList 动态列表
// ============================================================================

const formListSchema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    // 基础 FormList
    {
      name: "contacts",
      component: "FormList",
      defaultValue: [{ name: "", phone: "", email: "" }],
      colSpan: { xs: 12 },
      ui: {
        label: "联系人列表",
        helperText: "可动态添加/删除联系人",
        minItems: 1,
        maxItems: 5,
        addText: "添加联系人",
        copyable: true,
        showIndex: true,
      },
      children: [
        {
          name: "name",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          ui: {
            label: "姓名",
            placeholder: "请输入姓名",
          },
        },
        {
          name: "phone",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          ui: {
            label: "电话",
            placeholder: "请输入电话",
          },
        },
        {
          name: "email",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          ui: {
            label: "邮箱",
            placeholder: "请输入邮箱",
          },
        },
      ],
    },

    // 复杂 FormList - 工作经历
    {
      name: "workHistory",
      component: "FormList",
      defaultValue: [],
      colSpan: { xs: 12 },
      ui: {
        label: "工作经历",
        helperText: "添加您的工作经历",
        minItems: 0,
        maxItems: 10,
        addText: "添加工作经历",
        copyable: true,
        emptyText: "暂无工作经历，点击下方按钮添加",
      },
      children: [
        {
          name: "company",
          component: "Text",
          colSpan: { xs: 12, md: 6 },
          ui: {
            label: "公司名称",
            placeholder: "请输入公司名称",
          },
        },
        {
          name: "position",
          component: "Text",
          colSpan: { xs: 12, md: 6 },
          ui: {
            label: "职位",
            placeholder: "请输入职位名称",
          },
        },
        {
          name: "startDate",
          component: "Date",
          colSpan: { xs: 12, md: 6 },
          ui: {
            label: "入职日期",
          },
        },
        {
          name: "endDate",
          component: "Date",
          colSpan: { xs: 12, md: 6 },
          ui: {
            label: "离职日期",
            helperText: "在职则留空",
          },
        },
        {
          name: "description",
          component: "Text",
          colSpan: { xs: 12 },
          ui: {
            label: "工作描述",
            placeholder: "请描述您的工作内容和成就...",
            multiline: true,
            rows: 3,
          },
        },
      ],
    },

    // 产品列表 - 带计算
    {
      name: "products",
      component: "FormList",
      defaultValue: [{ name: "", price: 0, quantity: 1 }],
      colSpan: { xs: 12 },
      ui: {
        label: "产品列表",
        helperText: "添加产品并计算总价",
        minItems: 1,
        addText: "添加产品",
      },
      children: [
        {
          name: "name",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          ui: {
            label: "产品名称",
            placeholder: "请输入产品名称",
          },
        },
        {
          name: "price",
          component: "Number",
          defaultValue: 0,
          colSpan: { xs: 12, md: 4 },
          ui: {
            label: "单价",
            min: 0,
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
          },
        },
      ],
    },
  ],
};

// ============================================================================
// 示例 5: 验证规则
// ============================================================================

const validationSchema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    // 使用 Valibot 直接验证
    {
      name: "requiredField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(v.string("此字段为必填项"), v.nonEmpty("此字段为必填项")),
      ui: {
        label: "必填字段",
        placeholder: "必须填写",
        helperText: "使用 Valibot 的 nonEmpty 验证",
      },
    },
    {
      name: "minLengthField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(v.string("请输入内容"), v.minLength(5, "至少需要5个字符")),
      ui: {
        label: "最小长度验证",
        placeholder: "至少5个字符",
        helperText: "使用 Valibot 的 minLength 验证",
      },
    },
    {
      name: "maxLengthField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(v.string("请输入内容"), v.maxLength(10, "最多10个字符")),
      ui: {
        label: "最大长度验证",
        placeholder: "最多10个字符",
        helperText: "使用 Valibot 的 maxLength 验证",
      },
    },
    {
      name: "emailField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(v.string("请输入邮箱"), v.email("请输入有效的邮箱地址")),
      ui: {
        label: "邮箱验证",
        placeholder: "example@domain.com",
        helperText: "使用 Valibot 的 email 验证",
      },
    },
    {
      name: "urlField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(v.string("请输入URL"), v.url("请输入有效的URL")),
      ui: {
        label: "URL验证",
        placeholder: "https://example.com",
        helperText: "使用 Valibot 的 url 验证",
      },
    },
    {
      name: "patternField",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(
        v.string("请输入手机号"),
        v.regex(/^1[3-9]\d{9}$/, "请输入有效的手机号码")
      ),
      ui: {
        label: "手机号验证 (正则)",
        placeholder: "13800138000",
        helperText: "使用 Valibot 的 regex 验证",
      },
    },
    {
      name: "numberRange",
      component: "Number",
      defaultValue: 50,
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(
        v.number("请输入数字"),
        v.minValue(18, "最小值为18"),
        v.maxValue(100, "最大值为100")
      ),
      ui: {
        label: "数值范围验证",
        min: 0,
        max: 150,
        helperText: "必须在 18-100 之间",
      },
    },
    {
      name: "agreeTerms",
      component: "Checkbox",
      defaultValue: false,
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(v.boolean("请勾选"), v.value(true, "请同意用户协议")),
      ui: {
        label: "同意用户协议",
        helperText: "必须勾选才能提交",
      },
    },

    // 使用 rulesAdapter 声明式规则
    {
      name: "declarativeField",
      component: "Text",
      colSpan: { xs: 12 },
      validate: rulesToValibot(
        [
          { type: "required", message: "此字段必填" },
          { type: "minLength", value: 3, message: "至少3个字符" },
          { type: "maxLength", value: 20, message: "最多20个字符" },
        ],
        { label: "声明式字段", fieldType: "text" }
      ),
      ui: {
        label: "声明式验证规则",
        placeholder: "3-20个字符",
        helperText: "使用 rulesToValibot 转换声明式规则",
      },
    },
  ],
};

// ============================================================================
// 示例 6: 异步选项加载
// ============================================================================

const asyncOptionsSchema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    // 模拟异步加载的省份
    {
      name: "province",
      component: "Select",
      colSpan: { xs: 12, md: 4 },
      options: async (_scope, _signal) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return [
          { label: "北京市", value: "beijing" },
          { label: "上海市", value: "shanghai" },
          { label: "广东省", value: "guangdong" },
          { label: "浙江省", value: "zhejiang" },
          { label: "江苏省", value: "jiangsu" },
        ];
      },
      ui: {
        label: "省份 (异步加载)",
        placeholder: "请选择省份",
        helperText: "选项从服务器加载",
      },
    },

    // 依赖省份的城市选择
    {
      name: "city",
      component: "Select",
      colSpan: { xs: 12, md: 4 },
      options: async (scope, _signal) => {
        const province = scope.values.province;
        if (!province) return [];

        await new Promise((resolve) => setTimeout(resolve, 500));

        const cityMap: Record<string, { label: string; value: string }[]> = {
          beijing: [
            { label: "东城区", value: "dongcheng" },
            { label: "西城区", value: "xicheng" },
            { label: "朝阳区", value: "chaoyang" },
            { label: "海淀区", value: "haidian" },
          ],
          shanghai: [
            { label: "黄浦区", value: "huangpu" },
            { label: "徐汇区", value: "xuhui" },
            { label: "浦东新区", value: "pudong" },
          ],
          guangdong: [
            { label: "广州市", value: "guangzhou" },
            { label: "深圳市", value: "shenzhen" },
            { label: "东莞市", value: "dongguan" },
          ],
          zhejiang: [
            { label: "杭州市", value: "hangzhou" },
            { label: "宁波市", value: "ningbo" },
            { label: "温州市", value: "wenzhou" },
          ],
          jiangsu: [
            { label: "南京市", value: "nanjing" },
            { label: "苏州市", value: "suzhou" },
            { label: "无锡市", value: "wuxi" },
          ],
        };

        return cityMap[province] || [];
      },
      disabledWhen: "!province",
      ui: {
        label: "城市 (级联加载)",
        placeholder: "请先选择省份",
        helperText: "根据省份动态加载城市",
      },
    },

    // 区县
    {
      name: "district",
      component: "Text",
      colSpan: { xs: 12, md: 4 },
      disabledWhen: "!city",
      ui: {
        label: "区/县",
        placeholder: "请输入区县",
        helperText: "选择城市后可填写",
      },
    },

    // 远程搜索 Autocomplete
    {
      name: "remoteUser",
      component: "Autocomplete",
      colSpan: { xs: 12 },
      ui: {
        label: "用户搜索 (远程)",
        placeholder: "输入关键字搜索用户...",
        helperText: "模拟远程搜索，支持分页加载",
        remoteConfig: {
          pageSize: 10,
          debounceTimeout: 300,
          fetchOptions: async (keyword: string, page: number, pageSize: number) => {
            // 模拟 API 请求
            await new Promise((resolve) => setTimeout(resolve, 500));

            const allUsers = Array.from({ length: 100 }, (_, i) => ({
              label: `用户${i + 1} (${["张", "李", "王", "赵", "刘"][i % 5]}${["明", "华", "强", "伟", "芳"][i % 5]
                })`,
              value: `user-${i + 1}`,
              listLabel: `用户${i + 1} - ${["开发", "设计", "产品", "运营", "测试"][i % 5]
                }`,
            }));

            // 过滤
            const filtered = keyword
              ? allUsers.filter((u) =>
                u.label.toLowerCase().includes(keyword.toLowerCase())
              )
              : allUsers;

            // 分页
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const data = filtered.slice(start, end);

            return {
              data,
              total: filtered.length,
              hasMore: end < filtered.length,
            };
          },
          fetchById: async (value: any) => {
            await new Promise((resolve) => setTimeout(resolve, 200));
            const id = Number(String(value).replace("user-", ""));
            if (id >= 1 && id <= 100) {
              return {
                label: `用户${id}`,
                value: `user-${id}`,
              };
            }
            return null;
          },
        },
      },
    },
  ],
};

// ============================================================================
// 示例 7: Group 分组
// ============================================================================

const groupSchema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    // Card 样式分组
    {
      name: "basicInfoGroup",
      component: "Group",
      colSpan: { xs: 12 },
      ui: {
        label: "基本信息",
        helperText: "请填写您的基本个人信息",
        variant: "card",
      },
      children: [
        {
          name: "name",
          component: "Text",
          colSpan: { xs: 12, md: 6 },
          ui: {
            label: "姓名",
            placeholder: "请输入姓名",
          },
        },
        {
          name: "gender",
          component: "Radio",
          defaultValue: "male",
          colSpan: { xs: 12, md: 6 },
          options: [
            { label: "男", value: "male" },
            { label: "女", value: "female" },
          ],
          ui: {
            label: "性别",
            row: true,
          },
        },
        {
          name: "birthday",
          component: "Date",
          colSpan: { xs: 12, md: 6 },
          ui: {
            label: "生日",
          },
        },
        {
          name: "phone",
          component: "Text",
          colSpan: { xs: 12, md: 6 },
          ui: {
            label: "手机号",
            placeholder: "请输入手机号",
          },
        },
      ],
    },

    // Divider 样式分组
    {
      name: "addressGroup",
      component: "Group",
      colSpan: { xs: 12 },
      ui: {
        label: "地址信息",
        variant: "divider",
      },
      children: [
        {
          name: "province",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          ui: {
            label: "省份",
            placeholder: "请输入省份",
          },
        },
        {
          name: "city",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          ui: {
            label: "城市",
            placeholder: "请输入城市",
          },
        },
        {
          name: "district",
          component: "Text",
          colSpan: { xs: 12, md: 4 },
          ui: {
            label: "区县",
            placeholder: "请输入区县",
          },
        },
        {
          name: "address",
          component: "Text",
          colSpan: { xs: 12 },
          ui: {
            label: "详细地址",
            placeholder: "请输入详细地址",
            multiline: true,
            rows: 2,
          },
        },
      ],
    },

    // None 样式分组 (无边框)
    {
      name: "otherGroup",
      component: "Group",
      colSpan: { xs: 12 },
      ui: {
        label: "其他信息",
        variant: "none",
      },
      children: [
        {
          name: "hobby",
          component: "Text",
          colSpan: { xs: 12, md: 6 },
          ui: {
            label: "爱好",
            placeholder: "请输入爱好",
          },
        },
        {
          name: "bio",
          component: "Text",
          colSpan: { xs: 12, md: 6 },
          ui: {
            label: "个人简介",
            placeholder: "请输入个人简介",
            multiline: true,
            rows: 2,
          },
        },
      ],
    },
  ],
};

// ============================================================================
// 示例 8: 综合示例 - 完整注册表单
// ============================================================================

const comprehensiveSchema: SchemaInput = {
  meta: {
    version: "1.0.0",
    compatibleWith: ["^1.0.0"],
  },
  fields: [
    // 账户信息
    {
      name: "username",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(
        v.string("用户名不能为空"),
        v.nonEmpty("用户名不能为空"),
        v.minLength(3, "用户名至少3个字符"),
        v.maxLength(20, "用户名最多20个字符"),
        v.regex(/^[a-zA-Z0-9_]+$/, "只能包含字母、数字和下划线")
      ),
      ui: {
        label: "用户名",
        placeholder: "3-20个字符，字母数字下划线",
      },
    },
    {
      name: "email",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(
        v.string("邮箱不能为空"),
        v.nonEmpty("邮箱不能为空"),
        v.email("请输入有效的邮箱")
      ),
      ui: {
        label: "邮箱",
        placeholder: "用于接收通知",
        type: "email",
      },
    },
    {
      name: "password",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      validate: v.pipe(
        v.string("密码不能为空"),
        v.nonEmpty("密码不能为空"),
        v.minLength(8, "密码至少8个字符")
      ),
      ui: {
        label: "密码",
        placeholder: "至少8个字符",
        type: "password",
      },
    },
    {
      name: "confirmPassword",
      component: "Text",
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "确认密码",
        placeholder: "请再次输入密码",
        type: "password",
      },
    },

    // 个人信息
    {
      name: "nickname",
      component: "Text",
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "昵称",
        placeholder: "显示名称",
      },
    },
    {
      name: "age",
      component: "Number",
      defaultValue: 18,
      colSpan: { xs: 12, md: 4 },
      validate: v.pipe(
        v.number("请输入年龄"),
        v.minValue(1, "年龄必须大于0"),
        v.maxValue(150, "年龄不能超过150")
      ),
      ui: {
        label: "年龄",
        min: 1,
        max: 150,
      },
    },
    {
      name: "gender",
      component: "Radio",
      defaultValue: "other",
      colSpan: { xs: 12, md: 4 },
      options: [
        { label: "男", value: "male" },
        { label: "女", value: "female" },
        { label: "保密", value: "other" },
      ],
      ui: {
        label: "性别",
        row: true,
      },
    },

    // 职业信息
    {
      name: "occupation",
      component: "Select",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "学生", value: "student" },
        { label: "工程师", value: "engineer" },
        { label: "设计师", value: "designer" },
        { label: "产品经理", value: "pm" },
        { label: "教师", value: "teacher" },
        { label: "医生", value: "doctor" },
        { label: "其他", value: "other" },
      ],
      ui: {
        label: "职业",
        placeholder: "请选择职业",
      },
    },
    {
      name: "experience",
      component: "Slider",
      defaultValue: 3,
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "工作年限",
        min: 0,
        max: 30,
        step: 1,
        marks: [
          { value: 0, label: "0年" },
          { value: 10, label: "10年" },
          { value: 20, label: "20年" },
          { value: 30, label: "30年" },
        ],
      },
    },

    // 技能
    {
      name: "skills",
      component: "Autocomplete",
      defaultValue: [],
      colSpan: { xs: 12 },
      options: [
        { label: "JavaScript", value: "js" },
        { label: "TypeScript", value: "ts" },
        { label: "React", value: "react" },
        { label: "Vue", value: "vue" },
        { label: "Node.js", value: "node" },
        { label: "Python", value: "python" },
        { label: "Java", value: "java" },
        { label: "Go", value: "go" },
        { label: "SQL", value: "sql" },
        { label: "Docker", value: "docker" },
      ],
      ui: {
        label: "技能标签",
        placeholder: "选择您掌握的技能",
        multiple: true,
        helperText: "可多选",
      },
    },

    // 个人介绍
    {
      name: "bio",
      component: "Text",
      colSpan: { xs: 12 },
      ui: {
        label: "个人介绍",
        placeholder: "请简单介绍一下自己...",
        multiline: true,
        rows: 4,
        helperText: "最多500字",
      },
    },

    // 偏好设置
    {
      name: "theme",
      component: "Radio",
      defaultValue: "system",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "跟随系统", value: "system" },
        { label: "浅色", value: "light" },
        { label: "深色", value: "dark" },
      ],
      ui: {
        label: "主题偏好",
        row: true,
      },
    },
    {
      name: "language",
      component: "Select",
      defaultValue: "zh-CN",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "简体中文", value: "zh-CN" },
        { label: "繁體中文", value: "zh-TW" },
        { label: "English", value: "en" },
        { label: "日本語", value: "ja" },
      ],
      ui: {
        label: "语言",
      },
    },

    // 通知设置
    {
      name: "emailNotification",
      component: "Switch",
      defaultValue: true,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "邮件通知",
      },
    },
    {
      name: "pushNotification",
      component: "Switch",
      defaultValue: true,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "推送通知",
      },
    },
    {
      name: "smsNotification",
      component: "Switch",
      defaultValue: false,
      colSpan: { xs: 12, md: 4 },
      ui: {
        label: "短信通知",
      },
    },

    // 协议
    {
      name: "agreeTerms",
      component: "Checkbox",
      defaultValue: false,
      colSpan: { xs: 12 },
      validate: v.pipe(
        v.boolean("请勾选"),
        v.value(true, "请阅读并同意用户协议和隐私政策")
      ),
      ui: {
        label: "我已阅读并同意《用户协议》和《隐私政策》",
      },
    },
    {
      name: "subscribeNewsletter",
      component: "Checkbox",
      defaultValue: false,
      colSpan: { xs: 12 },
      ui: {
        label: "订阅产品更新和优惠信息 (可选)",
      },
    },
  ],
};

// ============================================================================
// Tab Panel 组件
// ============================================================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// ============================================================================
// 单个示例渲染组件
// ============================================================================

interface ExampleFormProps {
  schema: SchemaInput;
  title: string;
  description: string;
  defaultValues?: Record<string, any>;
}

const ExampleForm: React.FC<ExampleFormProps> = ({
  schema,
  title,
  description,
  defaultValues = {},
}) => {
  const formRef = useRef<SchemaFormInstance>(null);
  const cachedSchema = useMemo(() => schema, [schema]);
  const [submittedValues, setSubmittedValues] = useState<any>(null);


  const handleSubmit = (values: any) => {
    console.log(`[${title}] Submitted:`, values);
    setSubmittedValues(values);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>

      <SchemaForm
        ref={formRef}
        schema={cachedSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        spacing={2}
      >
        <Divider sx={{ my: 3 }} />
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button type="submit" variant="contained" color="primary">
            提交
          </Button>
          <Button
            type="button"
            variant="outlined"
            onClick={() => {
              formRef.current?.reset();
              setSubmittedValues(null);
            }}
          >
            重置
          </Button>
          <Button
            type="button"
            variant="text"
            onClick={() => {
              const values = formRef.current?.getValues();
              console.log(`[${title}] Current values:`, values);
              alert(JSON.stringify(values, null, 2));
            }}
          >
            获取值
          </Button>
        </Stack>
      </SchemaForm>

      {submittedValues && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            提交成功！提交的数据：
          </Typography>
          <Box
            component="pre"
            sx={{
              fontSize: 12,
              maxHeight: 200,
              overflow: "auto",
              bgcolor: "grey.100",
              p: 1,
              borderRadius: 1,
              m: 0,
            }}
          >
            {JSON.stringify(submittedValues, null, 2)}
          </Box>
        </Alert>
      )}
    </Box>
  );
};

// ============================================================================
// 主示例组件
// ============================================================================

export const SchemaFormExample: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const examples = [
    {
      title: "1. 基础 Widget 组件",
      description:
        "展示所有支持的 Widget 类型：Text、Number、Slider、Rating、Select、Radio、Autocomplete、Checkbox、Switch、Date、Time、DateTime、Hidden",
      schema: basicWidgetsSchema,
      defaultValues: {
        text: "",
        number: 50,
        slider: 50,
        rating: 3,
        select: "option1",
        switch: true,
      },
    },
    {
      title: "2. 条件逻辑",
      description:
        "演示 visibleWhen（条件显示）、disabledWhen（条件禁用）、requiredWhen（条件必填）的使用",
      schema: conditionalSchema,
      defaultValues: {
        userType: "personal",
        enableAdvanced: false,
        needInvoice: false,
      },
    },
    {
      title: "3. 计算字段",
      description:
        "演示 compute 属性实现字段自动计算：价格计算、字符串拼接、布尔判断等",
      schema: computeSchema,
      defaultValues: {
        unitPrice: 100,
        quantity: 2,
        discount: 10,
        firstName: "张",
        lastName: "三",
        age: 20,
      },
    },
    {
      title: "4. FormList 动态列表",
      description:
        "演示 FormList 组件：动态添加/删除行、复制行、最小/最大行数限制、行号显示",
      schema: formListSchema,
      defaultValues: {
        contacts: [
          { name: "张三", phone: "13800138000", email: "zhangsan@example.com" },
        ],
        workHistory: [],
        products: [{ name: "产品A", price: 100, quantity: 2 }],
      },
    },
    {
      title: "5. 验证规则",
      description:
        "演示多种验证方式：Valibot 直接验证、rulesToValibot 声明式规则转换",
      schema: validationSchema,
      defaultValues: {},
    },
    {
      title: "6. 异步选项加载",
      description:
        "演示异步选项加载、级联选择、远程搜索 Autocomplete（支持分页）",
      schema: asyncOptionsSchema,
      defaultValues: {},
    },
    {
      title: "7. Group 分组",
      description:
        "演示 Group 组件的三种样式：card（卡片）、divider（分割线）、none（无边框）",
      schema: groupSchema,
      defaultValues: {},
    },
    {
      title: "8. 综合示例",
      description: "完整的用户注册表单，综合运用以上所有功能",
      schema: comprehensiveSchema,
      defaultValues: {
        age: 25,
        gender: "other",
        experience: 3,
        skills: ["js", "ts", "react"],
        theme: "system",
        language: "zh-CN",
        emailNotification: true,
        pushNotification: true,
        smsNotification: false,
      },
    },
  ];

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Schema Form V4 完整示例集
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          基于 TanStack Form 的声明式表单引擎 —— 全面功能测试
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 3 }}
          flexWrap="wrap"
          useFlexGap
        >
          <Chip
            label="TanStack Form"
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label="MUI Widgets"
            size="small"
            color="secondary"
            variant="outlined"
          />
          <Chip
            label="Valibot 验证"
            size="small"
            color="success"
            variant="outlined"
          />
          <Chip
            label="响应式布局"
            size="small"
            color="info"
            variant="outlined"
          />
          <Chip
            label="TypeScript"
            size="small"
            color="warning"
            variant="outlined"
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabIndex}
            onChange={(_, newValue) => setTabIndex(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {examples.map((example, index) => (
              <Tab key={index} label={`示例 ${index + 1}`} />
            ))}
          </Tabs>
        </Box>

        {examples.map((example, index) => (
          <TabPanel key={index} value={tabIndex} index={index}>
            <ExampleForm
              title={example.title}
              description={example.description}
              schema={example.schema}
              defaultValues={example.defaultValues}
            />
          </TabPanel>
        ))}
      </Paper>

      {/* 使用说明 */}
      <Paper elevation={1} sx={{ mt: 3, p: 3, bgcolor: "grey.50" }}>
        <Typography variant="h6" gutterBottom>
          📖 使用说明
        </Typography>
        <Typography variant="body2" component="div">
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            <li>每个示例都可以独立提交和重置</li>
            <li>点击"获取值"可以查看当前表单的完整数据</li>
            <li>提交后会在表单下方显示提交的数据</li>
            <li>打开浏览器控制台可以查看详细日志</li>
            <li>所有示例都支持响应式布局，可调整浏览器窗口宽度查看效果</li>
          </ol>
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          🧩 支持的 Widget 类型
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {[
            "Text",
            "Number",
            "Slider",
            "Rating",
            "Select",
            "Radio",
            "Autocomplete",
            "Checkbox",
            "Switch",
            "Date",
            "Time",
            "DateTime",
            "Hidden",
            "Group",
            "FormList",
            "Custom",
          ].map((widget) => (
            <Chip key={widget} label={widget} size="small" variant="outlined" />
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

export default SchemaFormExample;
