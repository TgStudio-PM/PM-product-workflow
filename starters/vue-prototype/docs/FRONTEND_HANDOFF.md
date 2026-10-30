# 前端原型交接说明

## 文件位置

- `src/app/page-registry.ts`：页面路由、菜单、标题和组件映射。
- `src/modules/<模块>/pages/<页面>/Page.vue`：展示和交互。
- 同目录的 `mock.ts`：静态虚构数据；字段形状应与协商后的业务类型一致。
- `src/modules/<模块>/contracts/`：已确认的数据结构与待确认接口问题。
- `src/modules/<模块>/data/`：页面数据源适配；示例中的 `browser-storage.ts` 是本地浏览器存储，不是 API。
- `src/shared/components/`：可复用的查询、表格、表单、确认和详情 UI 组件。

## 离线预览的许可说明

`UPSTREAM_LICENSE.txt` 随 starter 保留本仓库复用内容原有的许可与归属说明。它不会因为使用模板而自动给用户新增或无关代码指定 MIT 许可，也不表示私有资料可以公开。`npm run preview:pack` 会将该文件原文复制到 `dist/preview/UPSTREAM_LICENSE.txt`，并将其登记到清单和完整性摘要；专用验包会与当前 starter 源文件逐字节核对。

同一预览包还包含独立的 `THIRD_PARTY_NOTICES.txt`：构建从当前安装的 `vue`、`@vue/shared`、`@vue/reactivity`、`@vue/runtime-core` 和 `@vue/runtime-dom` 读取包名、版本、许可字段与完整 `LICENSE` 正文。交付静态预览时应保留这两个许可文件；升级前生成的七文件或八文件 Vue 预览需重新构建。固定清单只覆盖上述 Vue 运行组件，不会自动审计新增的其他运行依赖；这些说明不构成完整依赖许可审计或法律结论。

## 接入后端前

1. 与后端确认接口 URL、方法、请求/响应、认证、错误结构和持久化行为，并更新合同文件。
2. 将 mock 数据和真实响应映射到同一个前端业务类型；差异在适配层转换，不让页面直接依赖原始响应格式。
3. 明确哪些交互只做本地展示，哪些会调用服务；清楚处理加载、空态、失败、重复提交和权限拒绝。
4. 为上传、审批和服务端状态设置真实验收证据，不以 mock 成功代替联调。

当前工程没有网络 API 客户端、鉴权或服务端持久化。新增这些能力前应以双方已确认的合同为准。
