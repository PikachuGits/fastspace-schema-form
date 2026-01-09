AutocompleteWidget 修改
1. 下拉加载增强
接口失败处理：添加 fetchError 状态，失败时显示"加载失败"提示和重试按钮
加载更多防重复：fetchingMore 状态确保不会重复触发加载
最后一页提示：显示"已加载全部"，关闭当前关键词下的自动加载
搜索关键词重置：关键词变化时自动重置分页为 1，重新请求数据
2. Suffix 按钮
新增 suffixButton?: SuffixButtonRender 配置，入参为 (searchValue: string, hasOptions: boolean)
返回 ButtonConfig | false | null（false/null 不显示）
新增 autoSelectNewOption 配置（默认 false），开启后自动选中新增选项
3. 动态搜索配置
新增 searchClearConfig 配置：
keepSearchOnClose：布尔值，默认 false，开启后关闭面板不清空搜索值
keepSearchOnSelect：布尔值，默认 false，开启后选中选项不清空搜索值
cacheSearchKeyword：布尔值，默认 false，开启后缓存最后一次搜索值，鼠标悬停显示"恢复上次搜索"按钮
clearValueOnly：布尔值，默认 false，仅清空值不重置列表
4. 列表加载配置
新增 refreshOnOpen：布尔值，默认 false，true 则每次展开触发接口，false 则仅首次加载

SelectWidget 修改
1. 组件重构
使用原生 MUI Select：移除 Autocomplete，无搜索功能，极致轻量
2. 空数据处理
本地数据为空时显示 emptyText（默认"暂无选项"）
3. Suffix 按钮
新增 showAddSuffix?: boolean | SuffixButtonRender 配置
函数入参为 (hasOptions: boolean)
返回 ButtonConfig | false | null
4. 扩展配置
配置项	类型	默认值	说明
multiple	boolean	false	多选
disabled	boolean	false	禁用
clearable	boolean	false	显示清空按钮
placeholder	string	"请选择"	占位提示
optionLabelProp	string	"label"	选项显示文本字段
optionValueProp	string	"value"	选项绑定值字段
emptyText	string	"暂无选项"	空数据提示
autoSelectNewOption	boolean	false	自动选中新增选项

类型导出更新
index.ts 新增导出：
SelectWidgetRenderProps, SelectButtonConfig, SelectSuffixButtonRender
AutocompleteButtonConfig, AutocompleteSuffixButtonRender, SearchClearConfig, OnAddOptionSuccess


Radio 布局配置
inline	row	效果
false	false	label 在上，选项纵向
false	true	label 在上，选项横向
true	false	label 和组件同行，选项纵向
true	true	label 和组件同行，选项横向
// 1. label 在上，选项纵向（默认）
{ component: "Radio", ui: { label: "选择" } }

// 2. label 在上，选项横向
{ component: "Radio", ui: { label: "选择", row: true } }

// 3. label 和组件同行，选项纵向
{ component: "Radio", ui: { label: "选择", inline: true } }

// 4. label 和组件同行，选项横向
// 1. label 在上，选项纵向（默认）{ component: "Radio", ui: { label: "选择" } }// 2. label 在上，选项横向{ component: "Radio", ui: { label: "选择", row: true } }// 3. label 和组件同行，选项纵向{ component: "Radio", ui: { label: "选择", inline: true } }// 4. label 和组件同行，选项横向{ component: "Radio", ui: { label: "选择", inline: true, row: true } }

Slider 布局选项
配置	效果
默认 (inline=false)	label 在上，slider 在下
inline=true	label 和 slider 在同一行
// label 在上{ component: "Slider", ui: { label: "音量", inline: false } }// label 和 slider 在同一行{ component: "Slider", ui: { label: "音量", inline: true } }

Rating 布局选项
配置	效果
默认 (inline=true)	label 和 rating 在同一行
inline=false	label 在上，rating 在下
// label 和 rating 在同一行（默认）
{ component: "Rating", ui: { label: "评分" } }
// label 在上
{ component: "Rating", ui: { label: "评分", inline: false }
// label 和 rating 在同一行（默认）{ component: "Rating", ui: { label: "评分" } }// label 在上{ component: "Rating", ui: { label: "评分", inline: false } }