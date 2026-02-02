/**
 * 异步选项示例 - 展示远程数据加载功能
 *
 * 本示例展示：
 * 1. 静态选项 vs 异步选项
 * 2. 级联选择（依赖其他字段）
 * 3. Autocomplete 远程搜索
 * 4. 分页加载
 * 5. 数据缓存与刷新
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
  type EvalScope,
  type SchemaInput,
} from "@fastspace/schema-form";

// ============================================================================
// 模拟 API
// ============================================================================

// 模拟省份数据
const provinces = [
  { label: "浙江省", value: "zhejiang" },
  { label: "江苏省", value: "jiangsu" },
  { label: "广东省", value: "guangdong" },
  { label: "北京市", value: "beijing" },
  { label: "上海市", value: "shanghai" },
];

// 模拟城市数据
const citiesByProvince: Record<string, { label: string; value: string }[]> = {
  zhejiang: [
    { label: "杭州市", value: "hangzhou" },
    { label: "宁波市", value: "ningbo" },
    { label: "温州市", value: "wenzhou" },
    { label: "嘉兴市", value: "jiaxing" },
  ],
  jiangsu: [
    { label: "南京市", value: "nanjing" },
    { label: "苏州市", value: "suzhou" },
    { label: "无锡市", value: "wuxi" },
    { label: "常州市", value: "changzhou" },
  ],
  guangdong: [
    { label: "广州市", value: "guangzhou" },
    { label: "深圳市", value: "shenzhen" },
    { label: "珠海市", value: "zhuhai" },
    { label: "东莞市", value: "dongguan" },
  ],
  beijing: [{ label: "北京市", value: "beijing" }],
  shanghai: [{ label: "上海市", value: "shanghai" }],
};

// 模拟区县数据
const districtsByCity: Record<string, { label: string; value: string }[]> = {
  hangzhou: [
    { label: "西湖区", value: "xihu" },
    { label: "余杭区", value: "yuhang" },
    { label: "滨江区", value: "binjiang" },
  ],
  nanjing: [
    { label: "玄武区", value: "xuanwu" },
    { label: "鼓楼区", value: "gulou" },
    { label: "建邺区", value: "jianye" },
  ],
  guangzhou: [
    { label: "天河区", value: "tianhe" },
    { label: "越秀区", value: "yuexiu" },
    { label: "海珠区", value: "haizhu" },
  ],
  shenzhen: [
    { label: "南山区", value: "nanshan" },
    { label: "福田区", value: "futian" },
    { label: "宝安区", value: "baoan" },
  ],
};

// 模拟用户搜索 API
const allUsers = Array.from({ length: 100 }, (_, i) => ({
  label: `用户${String(i + 1).padStart(3, "0")}`,
  value: `user_${i + 1}`,
  email: `user${i + 1}@example.com`,
}));

async function searchUsers(
  keyword: string,
  pageNum: number,
  pageSize: number
): Promise<{ options: typeof allUsers; hasMore: boolean }> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  const filtered = keyword
    ? allUsers.filter(
      (u) =>
        u.label.toLowerCase().includes(keyword.toLowerCase()) ||
        u.email.toLowerCase().includes(keyword.toLowerCase())
    )
    : allUsers;

  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const options = filtered.slice(start, end);
  const hasMore = end < filtered.length;

  return { options, hasMore };
}

async function getUserById(
  id: string
): Promise<{ label: string; value: string; email: string } | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return allUsers.find((u) => u.value === id) || null;
}

// 模拟产品搜索
const allProducts = Array.from({ length: 50 }, (_, i) => ({
  label: `产品 ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ""}`,
  value: `product_${i + 1}`,
  price: Math.floor(Math.random() * 1000) + 100,
  stock: Math.floor(Math.random() * 100),
}));

// ============================================================================
// Schema 定义
// ============================================================================

const asyncOptionsSchema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    // ==================== 静态选项 ====================
    {
      name: "_section1",
      component: "Group",
      ui: {
        title: "静态选项",
        style: "card",
        description: "直接在 options 中定义选项数组",
      },
      children: [],
    },
    {
      name: "staticSelect",
      component: "Select",
      colSpan: { xs: 12, md: 6 },
      // 静态选项：直接提供数组
      options: [
        { label: "选项 A", value: "a" },
        { label: "选项 B", value: "b" },
        { label: "选项 C", value: "c" },
      ],
      ui: {
        label: "静态下拉选择",
        placeholder: "请选择",
        helperText: "options: [{ label, value }, ...]",
      },
    },
    {
      name: "staticRadio",
      component: "Radio",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "男", value: "male" },
        { label: "女", value: "female" },
      ],
      ui: {
        label: "静态单选",
        row: true,
        inline: true,
      },
    },

    // ==================== 级联选择 ====================
    {
      name: "_section2",
      component: "Group",
      ui: {
        title: "级联选择 (三级联动)",
        style: "card",
        description: "城市选择依赖省份，区县选择依赖城市。使用 compute 实现联动清空",
      },
      children: [],
    },
    {
      name: "province",
      component: "Select",
      colSpan: { xs: 12, md: 4 },
      // 静态省份数据
      options: provinces,
      ui: {
        label: "省份",
        placeholder: "请选择省份",
        helperText: "第一级：静态数据",
        clearable: true,
      },
    },
    {
      name: "city",
      component: "Select",
      colSpan: { xs: 12, md: 4 },
      // 使用 compute 实现：省份变化时清空城市
      compute: (scope: EvalScope) => {
        const province = scope.values.province;
        const city = scope.values.city;
        // 如果省份为空，清空城市
        if (!province) return null;
        // 如果当前城市不属于当前省份，清空
        const validCities = citiesByProvince[province] || [];
        if (city && !validCities.some((c) => c.value === city)) {
          return null;
        }
        return city;
      },
      // 异步选项 + 依赖：省份变化时重新加载城市列表
      options: {
        deps: ["province"], // 关键：指定依赖字段
        fetcher: async (scope: EvalScope, signal?: AbortSignal) => {
          const province = scope.values.province;
          if (!province) return [];
          // 模拟网络延迟
          await new Promise((resolve) => setTimeout(resolve, 300));

          // 检查是否已取消
          if (signal?.aborted) return [];
          console.log("province:", citiesByProvince[province]);

          return citiesByProvince[province] || [];
        },
      },
      disabledWhen: "!province",
      ui: {
        label: "城市",
        placeholder: "请先选择省份",
        helperText: "第二级：依赖省份异步加载（options.deps）",
        clearable: true,
      },
    },
    {
      name: "district",
      component: "Select",
      colSpan: { xs: 12, md: 4 },
      // 使用 compute 实现：城市变化时清空区县
      compute: (scope: EvalScope) => {
        const city = scope.values.city;
        const district = scope.values.district;
        // 如果城市为空，清空区县
        if (!city) return null;
        // 如果当前区县不属于当前城市，清空
        const validDistricts = districtsByCity[city] || [];
        if (district && !validDistricts.some((d) => d.value === district)) {
          return null;
        }
        return district;
      },
      // 异步选项 + 依赖：城市变化时重新加载区县列表
      options: {
        deps: ["city"], // 关键：指定依赖字段
        fetcher: async (scope: EvalScope, signal?: AbortSignal) => {
          const city = scope.values.city;
          if (!city) return [];

          await new Promise((resolve) => setTimeout(resolve, 300));
          if (signal?.aborted) return [];

          return districtsByCity[city] || [];
        },
      },
      disabledWhen: "!city",
      ui: {
        label: "区县",
        placeholder: "请先选择城市",
        helperText: "第三级：依赖城市异步加载（options.deps）",
        clearable: true,
      },
    },
    {
      name: "fullAddress",
      component: "Textarea",
      colSpan: { xs: 12 },
      ui: {
        label: "详细地址",
        placeholder: "请输入详细地址...",
        rows: 2,
      },
    },

    // ==================== Autocomplete 远程搜索 ====================
    {
      name: "_section3",
      component: "Group",
      ui: {
        title: "Autocomplete 远程搜索",
        style: "card",
        description: "支持远程搜索、分页加载、数据回显",
      },
      children: [],
    },
    {
      name: "user",
      component: "Autocomplete",
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "选择用户 (远程搜索)",
        placeholder: "输入用户名或邮箱搜索...",
        helperText: "支持分页加载，共100条模拟数据",
        // 远程配置
        remoteConfig: {
          // 搜索选项
          fetchOptions: async (keyword: string, pageNum: number, pageSize: number) => {
            const result = await searchUsers(keyword, pageNum, pageSize);
            return {
              data: result.options,
              total: allUsers.length,
              hasMore: result.hasMore,
            };
          },
          // 根据 ID 获取详情（用于回显）
          fetchById: async (id: string | number) => {
            const user = await getUserById(String(id));
            return user;
          },
          pageSize: 10,
          debounceTimeout: 300,
          minSearchLength: 0, // 0 表示不输入也加载
        },
        // 每次打开时刷新
        refreshOnOpen: true,
        // 缓存搜索关键词
        cacheSearchKeyword: true,
      },
    },
    {
      name: "userMultiple",
      component: "Autocomplete",
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "选择多个用户",
        placeholder: "可选择多个...",
        helperText: "multiple: true",
        multiple: true, // 多选
        remoteConfig: {
          fetchOptions: async (keyword: string, pageNum: number, pageSize: number) => {
            const result = await searchUsers(keyword, pageNum, pageSize);
            return {
              data: result.options,
              total: allUsers.length,
              hasMore: result.hasMore,
            };
          },
          pageSize: 10,
          debounceTimeout: 300,
        },
      },
    },

    // ==================== 本地 Autocomplete ====================
    {
      name: "_section4",
      component: "Group",
      ui: {
        title: "本地 Autocomplete",
        style: "card",
        description: "使用静态数据，前端过滤搜索",
      },
      children: [],
    },
    {
      name: "localAutocomplete",
      component: "Autocomplete",
      colSpan: { xs: 12, md: 6 },
      // 静态选项，本地过滤
      options: [
        { label: "苹果 Apple", value: "apple" },
        { label: "香蕉 Banana", value: "banana" },
        { label: "橙子 Orange", value: "orange" },
        { label: "葡萄 Grape", value: "grape" },
        { label: "西瓜 Watermelon", value: "watermelon" },
        { label: "草莓 Strawberry", value: "strawberry" },
        { label: "蓝莓 Blueberry", value: "blueberry" },
        { label: "芒果 Mango", value: "mango" },
      ],
      ui: {
        label: "选择水果 (本地搜索)",
        placeholder: "输入搜索...",
        helperText: "静态 options，前端过滤",
      },
    },
    {
      name: "freeSoloAutocomplete",
      component: "Autocomplete",
      colSpan: { xs: 12, md: 6 },
      options: [
        { label: "React", value: "react" },
        { label: "Vue", value: "vue" },
        { label: "Angular", value: "angular" },
        { label: "Svelte", value: "svelte" },
      ],
      ui: {
        label: "技术栈 (可自由输入)",
        placeholder: "选择或输入...",
        helperText: "freeSolo: true，可输入不在列表中的值",
        freeSolo: true, // 允许自由输入
        multiple: true, // 多选
      },
    },

    // ==================== 带 suffixButton 的 Autocomplete ====================
    {
      name: "_section5",
      component: "Group",
      ui: {
        title: "带新增按钮",
        style: "card",
        description: "搜索不到时显示新增按钮",
      },
      children: [],
    },
    {
      name: "productWithAdd",
      component: "Autocomplete",
      colSpan: { xs: 12 },
      options: allProducts.slice(0, 20),
      ui: {
        label: "选择产品",
        placeholder: "搜索产品...",
        helperText: "右侧按钮可用于新增产品",
        // suffix 按钮配置
        suffixButton: (searchValue: string, hasOptions: boolean) => {
          // 始终显示，或可根据条件控制
          return {
            tooltip: "新增产品",
            onClick: () => {
              alert(`点击新增，当前搜索: "${searchValue}"`);
            },
          };
        },
      },
    },

    // ==================== 带列表标题的 Autocomplete ====================
    {
      name: "userWithLabel",
      component: "Autocomplete",
      colSpan: { xs: 12 },
      ui: {
        label: "选择用户 (带列表标题)",
        placeholder: "搜索用户...",
        helperText: "listLabel 显示下拉列表标题",
        listLabel: "用户列表",
        remoteConfig: {
          fetchOptions: async (keyword: string, pageNum: number, pageSize: number) => {
            const result = await searchUsers(keyword, pageNum, pageSize);
            return {
              data: result.options,
              total: allUsers.length,
              hasMore: result.hasMore,
            };
          },
          pageSize: 5,
          debounceTimeout: 300,
        },
      },
    },
  ],
};

// ============================================================================
// 组件
// ============================================================================

export default function AsyncOptionsExample() {
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
          异步选项示例
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          展示静态选项、级联选择、远程搜索、分页加载等功能
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <SchemaForm ref={formRef} schema={asyncOptionsSchema} onSubmit={handleSubmit}>
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
          📖 异步选项使用指南
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          1. 静态选项
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
  name: "status",
  component: "Select",
  options: [
    { label: "选项一", value: "1" },
    { label: "选项二", value: "2" },
  ],
}`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          2. 级联选择（带依赖的异步选项）
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
  name: "city",
  component: "Select",
  // 联动清空：省份变化时清空城市
  compute: (scope) => {
    if (!scope.values.province) return null;
    // 验证城市是否属于当前省份...
    return scope.values.city;
  },
  // 带依赖的异步选项（推荐）
  options: {
    deps: ["province"],  // 关键：指定依赖字段
    fetcher: async (scope, signal) => {
      if (!scope.values.province) return [];
      return await fetchCities(scope.values.province);
    },
  },
  disabledWhen: "!province",
}`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          3. Autocomplete 远程搜索
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
  name: "user",
  component: "Autocomplete",
  ui: {
    label: "选择用户",
    remoteConfig: {
      fetchOptions: async (keyword, page, pageSize) => {
        const result = await searchUsers(keyword, page, pageSize);
        return {
          data: result.options,
          total: result.total,
          hasMore: result.hasMore,
        };
      },
      fetchById: async (id) => await getUserById(id),  // 回显
      pageSize: 10,
      debounceTimeout: 300,
      minSearchLength: 0,
    },
    refreshOnOpen: true,      // 每次打开刷新
    cacheSearchKeyword: true, // 缓存搜索关键词
  },
}`}
        </Box>
      </Paper>
    </Box>
  );
}
