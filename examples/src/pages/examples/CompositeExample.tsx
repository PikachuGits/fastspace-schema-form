/**
 * 组合表单示例 - 展示复合输入组件
 *
 * 本示例展示：
 * 1. 电话号码（区号 + 手机号）
 * 2. 价格输入（货币 + 金额）
 * 3. 日期范围（开始 + 结束）
 * 4. 尺寸输入（长 × 宽 × 高 + 单位）
 * 5. 使用 Group 组合多个字段
 * 6. 使用 Grid 布局并排字段
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  InputAdornment,
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
// 自定义组合组件
// ============================================================================

// 电话号码组合组件 (区号 + 手机号)
const PhoneInputComponent: React.FC<{
  value: { areaCode: string; number: string };
  onChange: (val: { areaCode: string; number: string }) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  label?: string;
  helperText?: string;
}> = ({
  value = { areaCode: "+86", number: "" },
  onChange,
  onBlur,
  disabled,
  error,
  required,
  label,
  helperText,
}) => {
  const areaCodeOptions = [
    { label: "中国 +86", value: "+86" },
    { label: "美国 +1", value: "+1" },
    { label: "英国 +44", value: "+44" },
    { label: "日本 +81", value: "+81" },
    { label: "韩国 +82", value: "+82" },
    { label: "香港 +852", value: "+852" },
    { label: "台湾 +886", value: "+886" },
    { label: "新加坡 +65", value: "+65" },
    { label: "澳大利亚 +61", value: "+61" },
  ];

  return (
    <FormControl fullWidth error={!!error} size="small">
      {label && (
        <Typography
          variant="body2"
          sx={{ mb: 0.5, fontWeight: 500 }}
          color={error ? "error" : "text.primary"}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main">
              {" "}
              *
            </Typography>
          )}
        </Typography>
      )}
      <Stack direction="row" spacing={1}>
        <Select
          value={value?.areaCode || "+86"}
          onChange={(e) =>
            onChange({ ...value, areaCode: e.target.value as string })
          }
          onBlur={onBlur}
          disabled={disabled}
          sx={{ width: 150, flexShrink: 0 }}
          size="small"
        >
          {areaCodeOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        <TextField
          fullWidth
          value={value?.number || ""}
          onChange={(e) => onChange({ ...value, number: e.target.value })}
          onBlur={onBlur}
          disabled={disabled}
          error={!!error}
          placeholder="请输入手机号"
          size="small"
        />
      </Stack>
      {(error || helperText) && (
        <FormHelperText error={!!error}>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

// 价格组合组件 (货币 + 金额)
const PriceInputComponent: React.FC<{
  value: { currency: string; amount: number | string };
  onChange: (val: { currency: string; amount: number | string }) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  label?: string;
  helperText?: string;
}> = ({
  value = { currency: "CNY", amount: "" },
  onChange,
  onBlur,
  disabled,
  error,
  required,
  label,
  helperText,
}) => {
  const currencyOptions = [
    { label: "¥ 人民币", value: "CNY", symbol: "¥" },
    { label: "$ 美元", value: "USD", symbol: "$" },
    { label: "€ 欧元", value: "EUR", symbol: "€" },
    { label: "£ 英镑", value: "GBP", symbol: "£" },
    { label: "¥ 日元", value: "JPY", symbol: "¥" },
    { label: "₩ 韩元", value: "KRW", symbol: "₩" },
    { label: "₹ 印度卢比", value: "INR", symbol: "₹" },
  ];

  const currentCurrency = currencyOptions.find(
    (c) => c.value === value?.currency
  );

  return (
    <FormControl fullWidth error={!!error} size="small">
      {label && (
        <Typography
          variant="body2"
          sx={{ mb: 0.5, fontWeight: 500 }}
          color={error ? "error" : "text.primary"}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main">
              {" "}
              *
            </Typography>
          )}
        </Typography>
      )}
      <Stack direction="row" spacing={1}>
        <Select
          value={value?.currency || "CNY"}
          onChange={(e) =>
            onChange({ ...value, currency: e.target.value as string })
          }
          onBlur={onBlur}
          disabled={disabled}
          sx={{ width: 140, flexShrink: 0 }}
          size="small"
        >
          {currencyOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        <TextField
          fullWidth
          type="number"
          value={value?.amount ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              amount: e.target.value ? Number(e.target.value) : "",
            })
          }
          onBlur={onBlur}
          disabled={disabled}
          error={!!error}
          placeholder="请输入金额"
          size="small"
          slotProps={{
            input: {
              startAdornment: currentCurrency && (
                <InputAdornment position="start">
                  {currentCurrency.symbol}
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>
      {(error || helperText) && (
        <FormHelperText error={!!error}>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

// 日期范围组合组件
const DateRangeComponent: React.FC<{
  value: { start: string; end: string };
  onChange: (val: { start: string; end: string }) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  label?: string;
  helperText?: string;
}> = ({
  value = { start: "", end: "" },
  onChange,
  onBlur,
  disabled,
  error,
  required,
  label,
  helperText,
}) => {
  return (
    <FormControl fullWidth error={!!error} size="small">
      {label && (
        <Typography
          variant="body2"
          sx={{ mb: 0.5, fontWeight: 500 }}
          color={error ? "error" : "text.primary"}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main">
              {" "}
              *
            </Typography>
          )}
        </Typography>
      )}
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          type="date"
          value={value?.start || ""}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          onBlur={onBlur}
          disabled={disabled}
          error={!!error}
          size="small"
          sx={{ flex: 1 }}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />
        <Typography color="text.secondary" sx={{ px: 1 }}>
          至
        </Typography>
        <TextField
          type="date"
          value={value?.end || ""}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          onBlur={onBlur}
          disabled={disabled}
          error={!!error}
          size="small"
          sx={{ flex: 1 }}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />
      </Stack>
      {(error || helperText) && (
        <FormHelperText error={!!error}>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

// 尺寸组合组件 (长 x 宽 x 高)
const DimensionsComponent: React.FC<{
  value: {
    length: number | string;
    width: number | string;
    height: number | string;
    unit: string;
  };
  onChange: (val: {
    length: number | string;
    width: number | string;
    height: number | string;
    unit: string;
  }) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  label?: string;
  helperText?: string;
}> = ({
  value = { length: "", width: "", height: "", unit: "cm" },
  onChange,
  onBlur,
  disabled,
  error,
  required,
  label,
  helperText,
}) => {
  return (
    <FormControl fullWidth error={!!error} size="small">
      {label && (
        <Typography
          variant="body2"
          sx={{ mb: 0.5, fontWeight: 500 }}
          color={error ? "error" : "text.primary"}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main">
              {" "}
              *
            </Typography>
          )}
        </Typography>
      )}
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          type="number"
          value={value?.length ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              length: e.target.value ? Number(e.target.value) : "",
            })
          }
          onBlur={onBlur}
          disabled={disabled}
          error={!!error}
          placeholder="长"
          size="small"
          sx={{ flex: 1 }}
        />
        <Typography color="text.secondary">×</Typography>
        <TextField
          type="number"
          value={value?.width ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              width: e.target.value ? Number(e.target.value) : "",
            })
          }
          onBlur={onBlur}
          disabled={disabled}
          error={!!error}
          placeholder="宽"
          size="small"
          sx={{ flex: 1 }}
        />
        <Typography color="text.secondary">×</Typography>
        <TextField
          type="number"
          value={value?.height ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              height: e.target.value ? Number(e.target.value) : "",
            })
          }
          onBlur={onBlur}
          disabled={disabled}
          error={!!error}
          placeholder="高"
          size="small"
          sx={{ flex: 1 }}
        />
        <Select
          value={value?.unit || "cm"}
          onChange={(e) =>
            onChange({ ...value, unit: e.target.value as string })
          }
          onBlur={onBlur}
          disabled={disabled}
          sx={{ width: 80, flexShrink: 0 }}
          size="small"
        >
          <MenuItem value="mm">mm</MenuItem>
          <MenuItem value="cm">cm</MenuItem>
          <MenuItem value="m">m</MenuItem>
          <MenuItem value="in">in</MenuItem>
          <MenuItem value="ft">ft</MenuItem>
        </Select>
      </Stack>
      {(error || helperText) && (
        <FormHelperText error={!!error}>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

// 带单位的数量组件
const QuantityWithUnitComponent: React.FC<{
  value: { amount: number | string; unit: string };
  onChange: (val: { amount: number | string; unit: string }) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  label?: string;
  helperText?: string;
  units?: { label: string; value: string }[];
}> = ({
  value = { amount: "", unit: "piece" },
  onChange,
  onBlur,
  disabled,
  error,
  required,
  label,
  helperText,
  units = [
    { label: "个", value: "piece" },
    { label: "件", value: "item" },
    { label: "箱", value: "box" },
    { label: "套", value: "set" },
    { label: "公斤", value: "kg" },
    { label: "米", value: "m" },
  ],
}) => {
  return (
    <FormControl fullWidth error={!!error} size="small">
      {label && (
        <Typography
          variant="body2"
          sx={{ mb: 0.5, fontWeight: 500 }}
          color={error ? "error" : "text.primary"}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main">
              {" "}
              *
            </Typography>
          )}
        </Typography>
      )}
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          type="number"
          value={value?.amount ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              amount: e.target.value ? Number(e.target.value) : "",
            })
          }
          onBlur={onBlur}
          disabled={disabled}
          error={!!error}
          placeholder="请输入数量"
          size="small"
          slotProps={{
            input: {
              inputProps: { min: 0 },
            },
          }}
        />
        <Select
          value={value?.unit || "piece"}
          onChange={(e) =>
            onChange({ ...value, unit: e.target.value as string })
          }
          onBlur={onBlur}
          disabled={disabled}
          sx={{ width: 100, flexShrink: 0 }}
          size="small"
        >
          {units.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>
      {(error || helperText) && (
        <FormHelperText error={!!error}>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

// 带前缀/后缀的输入组件（使用 MUI InputAdornment）
const AdornmentInputComponent: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  label?: string;
  helperText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  type?: string;
}> = ({
  value = "",
  onChange,
  onBlur,
  disabled,
  error,
  required,
  label,
  helperText,
  prefix,
  suffix,
  type = "text",
}) => {
  return (
    <FormControl fullWidth error={!!error} size="small">
      {label && (
        <Typography
          variant="body2"
          sx={{ mb: 0.5, fontWeight: 500 }}
          color={error ? "error" : "text.primary"}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main">
              {" "}
              *
            </Typography>
          )}
        </Typography>
      )}
      <TextField
        fullWidth
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        error={!!error}
        size="small"
        slotProps={{
          input: {
            startAdornment: prefix ? (
              <InputAdornment position="start">{prefix}</InputAdornment>
            ) : undefined,
            endAdornment: suffix ? (
              <InputAdornment position="end">{suffix}</InputAdornment>
            ) : undefined,
          },
        }}
      />
      {(error || helperText) && (
        <FormHelperText error={!!error}>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

// 网址输入组件（带 https:// 前缀）
const UrlInputComponent: React.FC<{
  value: { protocol: string; domain: string };
  onChange: (val: { protocol: string; domain: string }) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  label?: string;
  helperText?: string;
}> = ({
  value = { protocol: "https://", domain: "" },
  onChange,
  onBlur,
  disabled,
  error,
  required,
  label,
  helperText,
}) => {
  return (
    <FormControl fullWidth error={!!error} size="small">
      {label && (
        <Typography
          variant="body2"
          sx={{ mb: 0.5, fontWeight: 500 }}
          color={error ? "error" : "text.primary"}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main">
              {" "}
              *
            </Typography>
          )}
        </Typography>
      )}
      <Stack direction="row" spacing={0}>
        <Select
          value={value?.protocol || "https://"}
          onChange={(e) =>
            onChange({ ...value, protocol: e.target.value as string })
          }
          onBlur={onBlur}
          disabled={disabled}
          size="small"
          sx={{
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            "& .MuiOutlinedInput-notchedOutline": {
              borderRight: 0,
            },
          }}
        >
          <MenuItem value="https://">https://</MenuItem>
          <MenuItem value="http://">http://</MenuItem>
        </Select>
        <TextField
          fullWidth
          value={value?.domain || ""}
          onChange={(e) => onChange({ ...value, domain: e.target.value })}
          onBlur={onBlur}
          disabled={disabled}
          error={!!error}
          placeholder="www.example.com"
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            },
          }}
        />
      </Stack>
      {(error || helperText) && (
        <FormHelperText error={!!error}>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

// 邮箱输入组件（带 @ 后缀选择）
const EmailInputComponent: React.FC<{
  value: { username: string; domain: string };
  onChange: (val: { username: string; domain: string }) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  label?: string;
  helperText?: string;
}> = ({
  value = { username: "", domain: "gmail.com" },
  onChange,
  onBlur,
  disabled,
  error,
  required,
  label,
  helperText,
}) => {
  const domainOptions = [
    "gmail.com",
    "qq.com",
    "163.com",
    "126.com",
    "outlook.com",
    "hotmail.com",
  ];

  return (
    <FormControl fullWidth error={!!error} size="small">
      {label && (
        <Typography
          variant="body2"
          sx={{ mb: 0.5, fontWeight: 500 }}
          color={error ? "error" : "text.primary"}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main">
              {" "}
              *
            </Typography>
          )}
        </Typography>
      )}
      <Stack direction="row" spacing={0} alignItems="center">
        <TextField
          value={value?.username || ""}
          onChange={(e) => onChange({ ...value, username: e.target.value })}
          onBlur={onBlur}
          disabled={disabled}
          error={!!error}
          placeholder="用户名"
          size="small"
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            },
          }}
        />
        <Box
          sx={{
            px: 1,
            py: 1,
            bgcolor: "grey.100",
            border: "1px solid",
            borderColor: error ? "error.main" : "grey.400",
            borderLeft: 0,
            borderRight: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          @
        </Box>
        <Select
          value={value?.domain || "gmail.com"}
          onChange={(e) =>
            onChange({ ...value, domain: e.target.value as string })
          }
          onBlur={onBlur}
          disabled={disabled}
          size="small"
          sx={{
            minWidth: 140,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            "& .MuiOutlinedInput-notchedOutline": {
              borderLeft: 0,
            },
          }}
        >
          {domainOptions.map((domain) => (
            <MenuItem key={domain} value={domain}>
              {domain}
            </MenuItem>
          ))}
        </Select>
      </Stack>
      {(error || helperText) && (
        <FormHelperText error={!!error}>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

// ============================================================================
// Schema 定义
// ============================================================================

const compositeSchema: SchemaInput = {
  meta: { version: "1.0.0" },
  fields: [
    // ==================== 自定义组合组件 ====================
    {
      name: "_section1",
      component: "Group",
      ui: {
        title: "自定义组合组件",
        style: "card",
        description: "使用 Custom 组件实现复合输入",
      },
      children: [],
    },

    // 电话号码组合
    {
      name: "phone",
      component: "Custom",
      defaultValue: { areaCode: "+86", number: "" },
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "联系电话",
        helperText: "选择区号并输入手机号",
        component: PhoneInputComponent,
      },
    },

    // 价格组合
    {
      name: "price",
      component: "Custom",
      defaultValue: { currency: "CNY", amount: "" },
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "商品价格",
        helperText: "选择货币类型并输入金额",
        component: PriceInputComponent,
      },
    },

    // 日期范围组合
    {
      name: "dateRange",
      component: "Custom",
      defaultValue: { start: "", end: "" },
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "有效期",
        helperText: "选择开始和结束日期",
        component: DateRangeComponent,
      },
    },

    // 尺寸组合
    {
      name: "dimensions",
      component: "Custom",
      defaultValue: { length: "", width: "", height: "", unit: "cm" },
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "包装尺寸",
        helperText: "输入长宽高，选择单位",
        component: DimensionsComponent,
      },
    },

    // 数量 + 单位
    {
      name: "quantity",
      component: "Custom",
      defaultValue: { amount: 1, unit: "piece" },
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "商品数量",
        helperText: "输入数量并选择单位",
        component: QuantityWithUnitComponent,
      },
    },

    // ==================== 前缀/后缀组合 ====================
    {
      name: "_sectionAdornment",
      component: "Group",
      ui: {
        title: "前缀/后缀组合（InputAdornment）",
        style: "card",
        description: "使用 MUI InputAdornment 实现前缀/后缀输入",
      },
      children: [],
    },

    // 带货币前缀的金额输入
    {
      name: "amount",
      component: "Custom",
      defaultValue: "",
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "金额",
        helperText: "带货币符号前缀",
        component: AdornmentInputComponent,
        prefix: "¥",
        type: "number",
      },
    },

    // 带百分号后缀的输入
    {
      name: "discount",
      component: "Custom",
      defaultValue: "",
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "折扣",
        helperText: "带百分号后缀",
        component: AdornmentInputComponent,
        suffix: "%",
        type: "number",
      },
    },

    // 带重量后缀的输入
    {
      name: "weight",
      component: "Custom",
      defaultValue: "",
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "重量",
        helperText: "带单位后缀",
        component: AdornmentInputComponent,
        suffix: "kg",
        type: "number",
      },
    },

    // 网址输入
    {
      name: "website",
      component: "Custom",
      defaultValue: { protocol: "https://", domain: "" },
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "网站地址",
        helperText: "选择协议并输入域名",
        component: UrlInputComponent,
      },
    },

    // 邮箱输入
    {
      name: "email",
      component: "Custom",
      defaultValue: { username: "", domain: "gmail.com" },
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "电子邮箱",
        helperText: "输入用户名并选择邮箱域名",
        component: EmailInputComponent,
      },
    },

    // 重量 + 单位
    {
      name: "weightWithUnit",
      component: "Custom",
      defaultValue: { amount: "", unit: "kg" },
      colSpan: { xs: 12, md: 6 },
      ui: {
        label: "商品重量",
        helperText: "输入重量并选择单位",
        component: QuantityWithUnitComponent,
        componentProps: {
          units: [
            { label: "克 (g)", value: "g" },
            { label: "千克 (kg)", value: "kg" },
            { label: "吨 (t)", value: "t" },
            { label: "磅 (lb)", value: "lb" },
          ],
        },
      },
    },

    // ==================== Group 组合方式 ====================
    {
      name: "_section2",
      component: "Group",
      ui: {
        title: "Group 组合方式",
        style: "card",
        description: "使用 Group 组件将多个相关字段组合在一起",
      },
      children: [],
    },

    // 收货地址组合
    {
      name: "addressGroup",
      component: "Group",
      colSpan: { xs: 12 },
      ui: {
        label: "收货地址",
        helperText: "请填写完整的收货地址",
        variant: "card",
      },
      children: [
        {
          name: "country",
          component: "Select",
          defaultValue: "CN",
          colSpan: { xs: 12, md: 3 },
          options: [
            { label: "🇨🇳 中国", value: "CN" },
            { label: "🇺🇸 美国", value: "US" },
            { label: "🇬🇧 英国", value: "UK" },
            { label: "🇯🇵 日本", value: "JP" },
            { label: "🇰🇷 韩国", value: "KR" },
            { label: "🇸🇬 新加坡", value: "SG" },
          ],
          ui: {
            label: "国家/地区",
          },
        },
        {
          name: "province",
          component: "Text",
          colSpan: { xs: 12, md: 3 },
          ui: {
            label: "省份",
            placeholder: "请输入省份",
          },
        },
        {
          name: "city",
          component: "Text",
          colSpan: { xs: 12, md: 3 },
          ui: {
            label: "城市",
            placeholder: "请输入城市",
          },
        },
        {
          name: "zipCode",
          component: "Text",
          colSpan: { xs: 12, md: 3 },
          ui: {
            label: "邮编",
            placeholder: "请输入邮编",
          },
        },
        {
          name: "addressDetail",
          component: "Text",
          colSpan: { xs: 12 },
          ui: {
            label: "详细地址",
            placeholder: "请输入详细地址（街道、门牌号等）",
            multiline: true,
            rows: 2,
          },
        },
      ],
    },

    // ==================== Grid 布局并排 ====================
    {
      name: "_section3",
      component: "Group",
      ui: {
        title: "Grid 布局并排",
        style: "card",
        description: "使用 colSpan 将相关字段放在同一行",
      },
      children: [],
    },

    // 银行卡信息
    {
      name: "bankName",
      component: "Select",
      defaultValue: "",
      colSpan: { xs: 12, md: 4 },
      options: [
        { label: "中国工商银行", value: "ICBC" },
        { label: "中国建设银行", value: "CCB" },
        { label: "中国农业银行", value: "ABC" },
        { label: "中国银行", value: "BOC" },
        { label: "招商银行", value: "CMB" },
        { label: "交通银行", value: "BOCOM" },
      ],
      ui: {
        label: "开户银行",
        placeholder: "请选择银行",
      },
    },
    {
      name: "bankAccount",
      component: "Text",
      colSpan: { xs: 12, md: 5 },
      ui: {
        label: "银行账号",
        placeholder: "请输入银行账号",
      },
    },
    {
      name: "accountName",
      component: "Text",
      colSpan: { xs: 12, md: 3 },
      ui: {
        label: "户名",
        placeholder: "请输入户名",
      },
    },

    // 证件信息
    {
      name: "idType",
      component: "Select",
      defaultValue: "idCard",
      colSpan: { xs: 12, md: 4 },
      options: [
        { label: "身份证", value: "idCard" },
        { label: "护照", value: "passport" },
        { label: "港澳通行证", value: "hkMacao" },
        { label: "台湾通行证", value: "taiwan" },
        { label: "军官证", value: "military" },
      ],
      ui: {
        label: "证件类型",
      },
    },
    {
      name: "idNumber",
      component: "Text",
      colSpan: { xs: 12, md: 8 },
      ui: {
        label: "证件号码",
        placeholder: "请输入证件号码",
      },
    },
  ],
};

// ============================================================================
// 组件
// ============================================================================

export default function CompositeExample() {
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
          组合表单示例
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          展示复合输入组件的多种实现方式：Custom 组件、Group 分组、Grid 布局
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>实现方式对比：</strong>
          </Typography>
          <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
            <li>
              <strong>Custom 组件</strong>：适用于复杂的组合输入，value
              是一个对象，内部管理多个子值
            </li>
            <li>
              <strong>Group 分组</strong>
              ：适用于逻辑相关的多个独立字段，每个字段有独立的 name
            </li>
            <li>
              <strong>Grid 布局</strong>：使用 colSpan
              将多个字段放在同一行，视觉上形成组合效果
            </li>
          </ul>
        </Alert>

        <Divider sx={{ mb: 3 }} />

        <SchemaForm
          ref={formRef}
          schema={compositeSchema}
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
            <Button
              variant="text"
              onClick={() => {
                const values = formRef.current?.getValues();
                console.log("当前值:", values);
                alert(JSON.stringify(values, null, 2));
              }}
            >
              获取当前值
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
          📖 组合表单使用指南
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          1. 使用 Custom 组件实现复合输入
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
  name: "phone",
  component: "Custom",
  defaultValue: { areaCode: "+86", number: "" },
  ui: {
    label: "联系电话",
    component: PhoneInputComponent,  // 自定义组件
  },
}`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          2. 自定义组件接收的 Props
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
          {`interface CustomComponentProps {
  value: T;               // 字段值（复合对象）
  onChange: (val: T) => void;  // 值变更回调
  onBlur?: () => void;    // 失焦回调
  disabled?: boolean;     // 禁用状态
  error?: string;         // 错误信息
  required?: boolean;     // 是否必填
  label?: string;         // 标签
  helperText?: string;    // 帮助文本
}`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          3. 使用 InputAdornment 添加前缀/后缀
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
          {`// 方式一：直接使用 MUI TextField 的 InputProps
<TextField
  slotProps={{
    input: {
      startAdornment: <InputAdornment position="start">¥</InputAdornment>,
      endAdornment: <InputAdornment position="end">元</InputAdornment>,
    },
  }}
/>

// 方式二：封装为 Custom 组件
{
  name: "amount",
  component: "Custom",
  ui: {
    label: "金额",
    component: AdornmentInputComponent,
    prefix: "¥",
    suffix: "元",
  },
}`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          4. 组合输入的数据结构示例
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
  phone: { areaCode: "+86", number: "13800138000" },
  price: { currency: "CNY", amount: 99.99 },
  dateRange: { start: "2024-01-01", end: "2024-12-31" },
  dimensions: { length: 30, width: 20, height: 10, unit: "cm" },
  website: { protocol: "https://", domain: "example.com" },
  email: { username: "user", domain: "gmail.com" },
}`}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          5. 使用 Group 组合相关字段
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
  name: "addressGroup",
  component: "Group",
  ui: {
    title: "收货地址",
    style: "card",
  },
  children: [
    { name: "province", component: "Select", colSpan: { xs: 12, md: 4 }, ... },
    { name: "city", component: "Text", colSpan: { xs: 12, md: 4 }, ... },
    { name: "district", component: "Text", colSpan: { xs: 12, md: 4 }, ... },
    { name: "address", component: "Textarea", colSpan: { xs: 12 }, ... },
  ],
}`}
        </Box>
      </Paper>
    </Box>
  );
}
