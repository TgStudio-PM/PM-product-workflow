# 材料申报模块当前状态

## 范围

这是 Tg Studio Vue 原型 starter 中的完全虚构教学模块，仅演示浏览器内的材料申报表单交互。它不对应真实政务事项或真实机构，也不代表生产办理能力。

## 当前实现

- 页面：`pages/apply/Page.vue`；页面 mock：`pages/apply/mock.ts`。
- 页面登记：`src/app/page-registry.ts`。
- 草稿模型与浏览器存储适配：`data/use-application-draft.ts`、`data/browser-storage.ts`。
- 规则正文：本模块 `BUSINESS_RULES.md`、`DECISIONS.md`、`PAGE_FLOW.md`。
- 数据只保存在当前浏览器的专用存储键；无文件上传、外部请求或真实办理。

## 来源与边界

规则依据仓库 `examples/material-submission/` 的公开虚构案例重新表述，用于教学和验证 starter 架构。若页面实现与本目录事实冲突，应记录差异并先确定是否需要调整规则，不以现有代码自动推导新规则。

## 下一步

结合产品验收检查页面复制流程、热更新、离线预览和前后端交接说明；任何未验证的真实接口、鉴权和生产行为继续保持待确认。
