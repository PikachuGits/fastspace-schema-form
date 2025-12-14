import { Button, Typography, Paper, Divider, Box, Card, CardContent } from "@mui/material";
import { useRef, useState, useMemo, useCallback, useEffect, useLayoutEffect } from "react";
import { SchemaForm, type SchemaInput, type SchemaFormInstance, type FieldSchema } from "./index";

// ============================================================================
// 1. 基础表单示例
// ============================================================================
const basicSchema: SchemaInput = {
  fields: [
    {
      name: 'username',
      component: 'Text',
      ui: { label: '用户名', placeholder: '请输入用户名' },
      rules: [
        { type: 'required', message: '用户名必填' },
        { type: 'minLength', value: 3, message: '至少3个字符' },
      ],
      colSpan: { xs: 12, md: 6 },
    },
    {
      name: 'email',
      component: 'Text',
      ui: { label: '邮箱' },
      rules: [
        { type: 'required', message: '邮箱必填' },
        { type: 'email', message: '请输入有效的邮箱' },
      ],
      colSpan: { xs: 12, md: 6 },
    },
    {
      name: 'password',
      component: 'Password',
      ui: { label: '密码' },
      rules: [
        { type: 'required', message: '密码必填' },
        { type: 'minLength', value: 6, message: '密码至少6个字符' },
      ],
      colSpan: { xs: 12, md: 6 },
    },
    {
      name: 'confirmPassword',
      component: 'Password',
      ui: { label: '确认密码' },
      rules: [
        { type: 'required', message: '请确认密码' },
        {
          type: 'custom',
          validate: (value: any, values: any) => {
            if (value !== values.password) {
              return '两次密码输入不一致';
            }
            return true;
          }
        }
      ],
      colSpan: { xs: 12, md: 6 },
    },
    {
      name: 'age',
      component: 'Number',
      ui: { label: '年龄' },
      rules: [
        { type: 'required', message: '年龄必填' },
        { type: 'min', value: 0, message: '年龄不能为负数' },
        { type: 'max', value: 150, message: '年龄不能超过150' }
      ],
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'phone',
      component: 'Text',
      ui: { label: '手机号' },
      rules: [
        { type: 'required', message: '手机号必填' },
        { type: 'pattern', value: '^1[3-9]\\d{9}$', message: '请输入有效的手机号' }
      ],
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'website',
      component: 'Text',
      ui: { label: '个人主页' },
      rules: [
        { type: 'url', message: '请输入有效的网址' }
      ],
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'role',
      component: 'Select',
      ui: {
        label: '角色',
        options: [
          { label: '开发者', value: 'dev' },
          { label: '设计师', value: 'designer' },
          { label: '产品经理', value: 'pm' },
        ]
      },
      colSpan: { xs: 12, md: 6 },
    },
    {
      name: 'skills',
      component: 'Autocomplete',
      ui: {
        label: '技能（多选）',
        options: [
          { label: 'React', value: 'react' },
          { label: 'Vue', value: 'vue' },
          { label: 'Angular', value: 'angular' },
          { label: 'Node.js', value: 'node' },

        ],
        props: { multiple: true }
      },
      colSpan: { xs: 12, md: 6 },
    },
    {
      name: 'agreeTerms',
      component: 'Checkbox',
      ui: { label: '我已阅读并同意服务条款' },
      rules: [
        { type: 'required', message: '请同意服务条款' }
      ],
      colSpan: 12,
    }
  ],
};

// ============================================================================
// 2. 条件逻辑与联动示例
// ============================================================================
const logicSchema: SchemaInput = {
  fields: [
    {
      name: 'accountType',
      component: 'Radio',
      ui: {
        label: '账户类型',
        options: [
          { label: '个人', value: 'personal' },
          { label: '企业', value: 'business' },
        ],
        props: { inline: true }
      },
      rules: [{ type: 'required', message: '账户类型必填' }],
      defaultValue: 'personal',
      colSpan: 12,
    },
    {
      name: 'companyName',
      component: 'Text',
      ui: { label: '公司名称' },
      visibleWhen: { field: 'accountType', eq: 'business' },
      rules: [{ type: 'required', message: '公司名称必填' }],
      colSpan: { xs: 12, md: 6 },
    },
    {
      name: 'taxId',
      component: 'Text',
      ui: { label: '税号' },
      visibleWhen: { field: 'accountType', eq: 'business' },
      requiredWhen: { field: 'accountType', eq: 'business' },
      colSpan: { xs: 12, md: 6 },
    },
    {
      name: 'isVip',
      component: 'Switch',
      ui: { label: '是否 VIP 用户' },
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'discount',
      component: 'Number',
      ui: { label: '折扣 (%)' },
      disabledWhen: { field: 'isVip', eq: false },
      defaultValue: 100,
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'vipLevel',
      component: 'Select',
      ui: {
        label: 'VIP 等级',
        options: [
          { label: '白银', value: 'silver' },
          { label: '黄金', value: 'gold' },
          { label: '钻石', value: 'diamond' },
        ]
      },
      visibleWhen: { field: 'isVip', eq: true },
      colSpan: { xs: 12, md: 4 },
    }
  ]
};

// ============================================================================
// 3. 复杂布局与分组示例 (三级联动)
// ============================================================================
const ADDRESS_DATA = {
  provinces: [
    { label: '北京', value: '110000' },
    { label: '广东', value: '440000' },
  ],
  cities: {
    '110000': [
      { label: '北京市', value: '110100' },
    ],
    '440000': [
      { label: '广州市', value: '440100' },
      { label: '深圳市', value: '440300' },
    ],
  } as Record<string, { label: string, value: string }[]>,
  districts: {
    '110100': [
      { label: '东城区', value: '110101' },
      { label: '西城区', value: '110102' },
      { label: '朝阳区', value: '110105' },
    ],
    '440100': [
      { label: '荔湾区', value: '440103' },
      { label: '越秀区', value: '440104' },
      { label: '海珠区', value: '440105' },
    ],
    '440300': [
      { label: '罗湖区', value: '440303' },
      { label: '福田区', value: '440304' },
      { label: '南山区', value: '440305' },
    ],
  } as Record<string, { label: string, value: string }[]>
};

const layoutSchema: SchemaInput = {
  fields: [
    {
      name: 'addressGroup',
      component: 'Group',
      colSpan: { xs: 12 },
      ui: { label: '收货地址' },
      columns: [
        {
          name: 'province',
          component: 'Select',
          ui: {
            label: '省份',
            options: ADDRESS_DATA.provinces,
          },
          colSpan: { xs: 12, sm: 4 }
        },
        {
          name: 'city',
          component: 'Select',
          dependencies: ['province'],
          ui: {
            label: '城市',
            optionRequest: async (values) => {
              const province = values.province as string;
              return province ? ADDRESS_DATA.cities[province] || [] : [];
            }
          },
          colSpan: { xs: 12, sm: 4 }
        },
        {
          name: 'district',
          component: 'Select',
          dependencies: ['province', 'city'],
          ui: {
            label: '区县',
            optionRequest: async (values) => {
              const city = values.city as string;
              return city ? ADDRESS_DATA.districts[city] || [] : [];
            }
          },
          colSpan: { xs: 12, sm: 4 }
        }
      ]
    },
    {
      name: 'detailAddress',
      component: 'Textarea',
      ui: { label: '详细地址' },
      colSpan: 6,
    },
    {
      name: 'is_super_admin',
      component: 'Radio',
      newLine: true,
      ui: {
        label: '超管状态 (强制换行)',
        props: { inline: true },
        options: [
          { label: '普通用户', value: 0 },
          { label: '超级管理员', value: 1 },
        ],
      },
      colSpan: { xs: 12, md: 6 },
    }
  ]
};

// ============================================================================
// 4. FormList 动态列表示例
// ============================================================================
const listSchema: SchemaInput = {
  fields: [
    {
      name: 'contacts',
      component: 'FormList',
      ui: { label: '联系人列表' },
      defaultValue: [{ name: '张三', phone: '13800000001' },
      { name: '李四', phone: '13800000002' }],
      minItems: 0,
      maxItems: 5,
      addText: '添加联系人',
      copyable: true,
      columns: [
        {
          name: 'name',
          component: 'Text',
          ui: { label: '姓名' },
          rules: [{ type: 'required', message: '姓名必填' }],
          colSpan: { xs: 12, sm: 5 }
        },
        {
          name: 'phone',
          component: 'Text',
          ui: { label: '电话' },
          rules: [
            { type: 'required', message: '电话必填' },
            { type: 'pattern', value: '^1[3-9]\\d{9}$', message: '请输入有效的手机号' }
          ],
          colSpan: { xs: 12, sm: 5 }
        }
      ]
    }
  ]
};

// ============================================================================
// 5. 计算字段示例
// ============================================================================
const computeSchema: SchemaInput = {
  fields: [
    {
      name: 'price',
      component: 'Number',
      ui: { label: '单价' },
      defaultValue: 100,
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'quantity',
      component: 'Number',
      ui: { label: '数量' },
      defaultValue: 1,
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'total',
      component: 'Number',
      ui: { label: '总价 (自动计算)', helperText: '单价 × 数量' },
      readonly: true,
      compute: {
        expr: 'price * quantity',
        dependencies: ['price', 'quantity']
      },
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'is_include_tax',
      component: 'Radio',
      ui: {
        label: '计税方式',
        options: [{ label: '含税', value: 1 }, { label: '不含税', value: 2 }],
        props: { inline: true }
      },
      defaultValue: 1,
      colSpan: 12,
    },
    {
      name: 'contract_amount',
      component: 'Number',
      ui: { label: '合同额（含税）' },
      disabledWhen: { field: 'is_include_tax', eq: 2 },
      compute: {
        expr: 'is_include_tax === 2 ? exclud_tax_amount * (1 + tax_rate / 100) : contract_amount',
        dependencies: ['exclud_tax_amount', 'tax_rate', 'is_include_tax'],
        precision: 2,
        roundMode: 'round',
      },
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'exclud_tax_amount',
      component: 'Number',
      ui: { label: '合同额（不含税）' },
      disabledWhen: { field: 'is_include_tax', eq: 1 },
      compute: {
        expr: 'is_include_tax === 1 ? contract_amount / (1 + tax_rate / 100) : exclud_tax_amount',
        dependencies: ['contract_amount', 'tax_rate', 'is_include_tax'],
        precision: 2,
        roundMode: 'round',
      },
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'tax_rate',
      component: 'Number',
      ui: { label: '税率(%)' },
      defaultValue: 13,
      colSpan: { xs: 12, md: 4 },
    },
    {
      name: 'tax_amount',
      component: 'Number',
      ui: { label: '增值税额 (自动计算)' },
      disabled: true,
      compute: {
        expr: 'contract_amount - exclud_tax_amount',
        dependencies: ['contract_amount', 'exclud_tax_amount'],
        precision: 2,
      },
      colSpan: { xs: 12, md: 4 },
    }
  ]
};

// ============================================================================
// 6. 自定义组件示例
// ============================================================================
const customSchema: SchemaInput = {
  fields: [
    {
      name: 'customInput',
      component: 'Custom',
      colSpan: { xs: 12 },
      ui: {
        label: '完全自定义输入',
        props: {
          children: ({ field, label, error, helperText, fieldProps }: any) => {
            return (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>{label}</label>
                <input
                  type="text"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  disabled={fieldProps?.disabled}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: error ? '1px solid red' : '1px solid #ccc',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                />
                {helperText && (
                  <div style={{ color: error ? 'red' : '#666', fontSize: 12, marginTop: 4 }}>
                    {helperText}
                  </div>
                )}
              </div>
            );
          },
        },
      },
      rules: [{ type: 'required', message: '此字段必填' }],
    },
    {
      name: 'notice',
      component: 'Custom',
      colSpan: { xs: 12 },
      noSubmit: true,
      ui: {
        props: {
          children: (
            <div style={{ padding: 16, background: '#e3f2fd', borderRadius: 8, color: '#0d47a1' }}>
              <strong>💡 提示：</strong>
              <span>这是一个纯展示的自定义组件，不参与表单提交。</span>
            </div>
          ),
        },
      },
    }
  ]
};

function FormSection({ title, schema, defaultValues = {} }: { title: string, schema: SchemaInput, defaultValues?: any }) {
  const formRef = useRef<SchemaFormInstance>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = (values: any) => {
    console.log(`[${title}] 提交数据:`, values);
    setResult(values);
  };

  const renderResult = useMemo(() =>
    <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        提交结果:
      </Typography>
      <pre style={{ margin: 0, overflow: 'auto', maxHeight: 200 }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </Box>
    , [result]);
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 3 }}>
        {title}
      </Typography>

      <SchemaForm
        ref={formRef}
        schema={schema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        spacing={2}
        onValuesChange={(v) => console.log(`[${title}] 值变化:`, v)}
      >
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => formRef.current?.submit()}>
            提交表单
          </Button>
          <Button variant="outlined" onClick={() => formRef.current?.reset()}>
            重置
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => {
            const values = formRef.current?.getValues();
            console.log(`[${title}] 当前值:`, values);
            alert(JSON.stringify(values, null, 2));
          }}>
            查看当前值
          </Button>
        </Box>
      </SchemaForm>

      {result && renderResult}
    </Paper>
  );
}

// ============================================================================
// 7. 异步选项示例 (正确使用 useMemo)
// ============================================================================
function AsyncOptionsDemo() {
  const [loading, setLoading] = useState(false);
  const renderCount = useRef(0);
  renderCount.current++;

  // 模拟 fetch 请求
  const mockFetch = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
    return [
      { label: '阿里巴巴', value: 'alibaba' },
      { label: '腾讯', value: 'tencent' },
      { label: '字节跳动', value: 'bytedance' },
    ];
  };

  // ✅ 正确写法：使用 useMemo 缓存 Schema
  // 防止每次组件重渲染导致 Schema 对象引用变化，进而触发无限重复请求
  const schema = useMemo(() => ({
    fields: [
      {
        name: 'company_search',
        component: 'Autocomplete',
        ui: {
          label: '异步搜索公司',
          placeholder: '尝试输入...',
          helperText: `组件渲染次数: ${renderCount.current} (使用 useMemo 保持稳定)`,
          optionRequest: async () => {
            console.log("✅ optionRequest executed");
            return await mockFetch();
          }
        },
        colSpan: 12,
      }
    ]
  }), []); // 依赖项为空数组，表示 Schema 只在挂载时创建一次

  return <FormSection title="7. 异步选项与性能优化" schema={schema} />;
}

// ============================================================================
// 8. 远程搜索与分页 (Autocomplete 增强)
// ============================================================================
function RemoteSearchDemo() {
  // 外部控制 loading 状态（示例：通过 onLoadingChange 获取内部状态，或直接控制 props.loading）
  const [isFetching, setIsFetching] = useState(false);

  // 模拟后端数据库
  const mockDB = Array.from({ length: 1000 }, (_, i) => ({
    label: `User ${i + 1}`,
    value: 10000 + i,
    email: `user${i + 1}@example.com`
  }));

  // 模拟后端 API
  // 注意：这里的 fetchUsers 必须定义在 useMemo 之外，或者使用 useCallback 缓存
  // 否则每次渲染都会生成新的函数，导致 remoteConfig 变化，进而触发 useEffect
  const fetchUsers = useCallback(async (keyword: string, page: number, pageSize: number) => {
    console.log(`📡 Fetching: keyword="${keyword}", page=${page}, pageSize=${pageSize}`);
    await new Promise(resolve => setTimeout(resolve, 800)); // 模拟网络延迟

    // 1. 搜索
    const filtered = keyword
      ? mockDB.filter(u => u.label.toLowerCase().includes(keyword.toLowerCase()))
      : mockDB;

    // 2. 分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = filtered.slice(start, end);

    return {
      data,
      total: filtered.length,
      hasMore: end < filtered.length
    };
  }, []);

  const fetchUserById = useCallback(async (id: string | number) => {
    console.log(`📡 Fetching by ID: ${id}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDB.find(u => u.value === id) || null;
  }, []);

  // 验证 fetchUsers 是否正常工作
  useEffect(() => {
    console.log("🚀 RemoteSearchDemo mounted, testing fetchUsers...");
    fetchUsers('User 1', 1, 10).then(res => {
      console.log("🚀 RemoteSearchDemo fetchUsers result:", res);
    });
  }, [fetchUsers]);

  /**
   * 测试用例说明 (Test Cases):
   * 
   * 1. 基础滚动加载 (Basic Scroll Loading):
   *    - 操作: 打开下拉框，清除输入框（显示所有），快速滚动到底部。
   *    - 预期: 底部出现 "加载中..." 提示，随后列表追加新数据，滚动条不回弹到顶部。
   * 
   * 2. 选中后继续滚动 (Scroll After Selection):
   *    - 操作: 选中一个用户（如 "User 1..."），下拉框关闭。再次打开。
   *    - 预期: 
   *      - 此时输入框可能有值，列表可能仅显示匹配项。
   *      - 若手动清除输入框内容，应重新加载第一页所有数据。
   *      - 再次滚动到底部，应能正常触发"加载中..."并追加数据。
   * 
   * 3. 无更多数据 (No More Data):
   *    - 操作: 输入特殊关键词使结果很少（或滚动到所有数据的末尾）。
   *    - 预期: 底部显示 "没有更多数据了"，此时继续滚动不会触发网络请求。
   * 
   * 4. 状态重置 (State Reset):
   *    - 操作: 无论当前在第几页，关闭下拉框再重新打开。
   *    - 预期: 列表重置为第一页（基于当前输入框内容），确保数据是最新的。
   */
  const schema = useMemo(() => ({
    fields: [
      {
        name: 'remote_user',
        component: 'Autocomplete',
        defaultValue: 10010,
        ui: {
          label: '搜索用户 (支持分页/搜索)',
          placeholder: '输入 "User 1" 试试...',
          helperText: '滚动到底部自动加载更多',
          // 新增 remoteConfig 配置
          remoteConfig: {
            fetchOptions: fetchUsers,
            fetchById: fetchUserById,
            pageSize: 20,
            debounceTimeout: 800,
            onLoadingChange: (loading: boolean) => {
              console.log("RemoteSearchDemo loading:", loading);
              setIsFetching(loading);
            }
          },
          // 演示：可以通过 props.loading 强制控制 loading 状态
          // props: { loading: isFetching }
        },
        colSpan: 12,
      },
      {
        name: 'selected_info',
        component: 'Custom',
        dependencies: ['remote_user'],
        ui: {
          label: '选中详情',
          props: {
            children: ({ values, field, form }: any) => {
              // 监听 remote_user 变化，更新 selected_info 的值
              const selectedId = values?.remote_user;

              // 使用 useEffect 监听变化并赋值
              useEffect(() => {
                if (selectedId && form) {
                  // 模拟根据 ID 获取完整详情
                  // 实际场景中，这里可能是同步查找（如果 options 在 context 中）或者异步请求
                  // 这里演示简单的赋值
                  fetchUserById(selectedId).then(user => {
                    if (user) {
                      // 更新 selected_info 字段的值
                      form.setValue('selected_info', user);
                    }
                  });
                } else if (!selectedId && form) {
                  form.setValue('selected_info', null);
                }
              }, [selectedId, form]);

              return (
                <div style={{ padding: 10, background: '#f5f5f5', borderRadius: 4 }}>
                  <div>选中值 ID: {selectedId || '未选择'}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    请求状态: {isFetching ? '加载中...' : '空闲'}
                  </div>
                  {field.value && (
                    <div style={{ marginTop: 8, borderTop: '1px solid #ddd', paddingTop: 8 }}>
                      <strong>已赋值给 selected_info:</strong>
                      <pre style={{ margin: 0, fontSize: 11 }}>
                        {JSON.stringify(field.value, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            }
          }
        },
        colSpan: 12
      }
    ]
  }), []);

  return <FormSection title="8. 远程搜索与分页" schema={schema} />;
}

export default function Demo() {
  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h3" gutterBottom align="center" sx={{ mb: 4 }}>
        SchemaForm 全功能演示
      </Typography>

      <FormSection title="1. 基础验证表单" schema={basicSchema} />
      <FormSection title="2. 条件逻辑与联动" schema={logicSchema} />
      <FormSection title="3. 复杂布局与分组" schema={layoutSchema} />
      <FormSection title="4. 动态列表 (FormList)" schema={listSchema} />
      <FormSection title="5. 智能计算字段" schema={computeSchema} />
      <FormSection title="6. 自定义组件" schema={customSchema} />

      <Divider sx={{ my: 4 }} />
      <Typography variant="h4" gutterBottom color="primary">
        最佳实践
      </Typography>
      <AsyncOptionsDemo />
      <RemoteSearchDemo />
    </Box>
  );
}
