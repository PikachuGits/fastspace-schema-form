/**
 * SchemaForm Compute 功能示例
 * 
 * 展示如何使用 compute 属性进行自动计算
 */

import { Box, Button, Paper, Typography } from '@mui/material';
import React, { useRef } from 'react';
import { SchemaForm } from './index';
import type { SchemaFormInstance, SchemaInput } from './types';

export default function ComputeExample() {
  const formRef = useRef<SchemaFormInstance<any>>(null);

  const schema: SchemaInput = {
    fields: [
      // ========================================
      // 基础信息
      // ========================================
      {
        name: 'product_name',
        component: 'Text',
        ui: { label: '商品名称', placeholder: '请输入商品名称' },
        colSpan: { xs: 12 },
        rules: [{ type: 'required', message: '请输入商品名称' }],
      },

      // ========================================
      // 价格计算示例
      // ========================================
      {
        name: 'price',
        component: 'Number',
        ui: {
          label: '单价（元）',
          placeholder: '请输入单价',
          props: { inputProps: { step: '0.01', min: 0 } },
        },
        colSpan: { xs: 12, md: 4 },
        rules: [
          { type: 'required', message: '请输入单价' },
          { type: 'min', value: 0.01, message: '单价必须大于0' },
        ],
      },
      {
        name: 'quantity',
        component: 'Number',
        ui: {
          label: '数量',
          placeholder: '请输入数量',
          props: { inputProps: { step: '1', min: 1 } },
        },
        colSpan: { xs: 12, md: 4 },
        rules: [
          { type: 'required', message: '请输入数量' },
          { type: 'min', value: 1, message: '数量必须大于0' },
        ],
      },
      {
        name: 'subtotal',
        component: 'Number',
        disabled: true,
        ui: {
          label: '小计（元）',
          helperText: '✨ 自动计算: 单价 × 数量',
          props: { inputProps: { step: '0.01' } },
        },
        colSpan: { xs: 12, md: 4 },
        compute: {
          expr: 'price * quantity',
          dependencies: ['price', 'quantity'],
        },
      },

      // ========================================
      // 税费计算示例
      // ========================================
      {
        name: 'tax_rate',
        component: 'Number',
        defaultValue: 0.13,
        ui: {
          label: '税率',
          helperText: '默认 13%',
          props: { inputProps: { step: '0.01', min: 0, max: 1 } },
        },
        colSpan: { xs: 12, md: 6 },
      },
      {
        name: 'tax_amount',
        component: 'Number',
        disabled: true,
        ui: {
          label: '税额（元）',
          helperText: '✨ 自动计算: 小计 × 税率',
          props: { inputProps: { step: '0.01' } },
        },
        colSpan: { xs: 12, md: 6 },
        compute: {
          expr: 'subtotal * tax_rate',
          dependencies: ['subtotal', 'tax_rate'],
        },
      },

      // ========================================
      // 折扣计算示例
      // ========================================
      {
        name: 'is_vip',
        component: 'Switch',
        defaultValue: false,
        ui: { label: 'VIP 客户（享受 8 折优惠）' },
        colSpan: { xs: 12, md: 6 },
      },
      {
        name: 'discount_amount',
        component: 'Number',
        disabled: true,
        ui: {
          label: '折扣金额（元）',
          helperText: '✨ 自动计算: VIP 享受 20% 折扣',
          props: { inputProps: { step: '0.01' } },
        },
        colSpan: { xs: 12, md: 6 },
        compute: {
          expr: 'is_vip ? (subtotal + tax_amount) * 0.2 : 0',
          dependencies: ['is_vip', 'subtotal', 'tax_amount'],
        },
      },

      // ========================================
      // 最终金额计算
      // ========================================
      {
        name: 'total',
        component: 'Number',
        disabled: true,
        ui: {
          label: '应付总额（元）',
          helperText: '✨ 自动计算: 小计 + 税额 - 折扣',
          props: { inputProps: { step: '0.01' } },
        },
        colSpan: { xs: 12 },
        compute: {
          expr: 'subtotal + tax_amount - discount_amount',
          dependencies: ['subtotal', 'tax_amount', 'discount_amount'],
        },
      },

      // ========================================
      // 备注
      // ========================================
      {
        name: 'remark',
        component: 'Textarea',
        ui: {
          label: '备注',
          placeholder: '请输入备注信息',
          props: { rows: 3 },
        },
        colSpan: { xs: 12 },
      },
    ],
  };

  const handleSubmit = async () => {
    const isValid = await formRef.current?.trigger();
    if (!isValid) {
      return;
    }

    const values = formRef.current?.getFormValues();
    console.log('✅ 提交数据:', values);
    alert(`提交成功!\n\n${JSON.stringify(values, null, 2)}`);
  };

  const handleReset = () => {
    formRef.current?.reset();
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1000, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        SchemaForm Compute 功能示例
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        演示自动计算功能：小计、税额、折扣、总额等字段会根据输入自动计算
      </Typography>

      <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          💡 使用说明：
        </Typography>
        <Typography variant="body2" component="div">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>输入<strong>单价</strong>和<strong>数量</strong>，小计会自动计算</li>
            <li>修改<strong>税率</strong>，税额会自动更新</li>
            <li>勾选 <strong>VIP 客户</strong>，自动享受 8 折优惠</li>
            <li>所有带 ✨ 标记的字段都是自动计算的</li>
            <li>尝试清空字段，观察计算行为（只在所有依赖字段有值时才计算）</li>
          </ul>
        </Typography>
      </Box>

      <SchemaForm ref={formRef} schema={schema} spacing={2} />

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          提交
        </Button>
        <Button variant="outlined" onClick={handleReset}>
          重置
        </Button>
      </Box>
    </Paper>
  );
}

