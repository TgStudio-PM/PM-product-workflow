# 材料申报模块当前状态

## 范围

这是 Tg Studio Vue 原型 starter 中的完全虚构教学模块，仅演示浏览器内的材料申报表单交互。它不对应真实政务事项或真实机构，也不代表生产办理能力。

## 当前实现

- 页面：`pages/apply/Page.vue`；页面 mock：`pages/apply/mock.ts`。
- 页面登记：`src/app/page-registry.ts`。
- 草稿模型与浏览器存储适配：`data/use-application-draft.ts`、`data/browser-storage.ts`。
- 说明长度上限为 500；`data/limits.ts` 的 `DESCRIPTION_MAX_LENGTH` 用于输入控件、计数、提交和恢复有效性检查。读取保留旧记录全文；超限正文仍可编辑和暂存，但不能提交，超限的旧“已提交”记录恢复为草稿并提示更正保存结果。上限与 BR-002 未变。
- 规则正文：本模块 `BUSINESS_RULES.md`、`DECISIONS.md`、`PAGE_FLOW.md`。
- 数据只保存在当前浏览器的专用存储键；无文件上传、外部请求或真实办理。
- 当前实现区分本地数据异常：JSON 格式损坏时页面可重新填写并自动保存新草稿；读取浏览器存储不可用时如实提示内容不会持久保存。
- Issue #168 的 Chrome/Edge `file://` 定向验证中，本模块 8 个流程 case 通过，覆盖超限草稿、旧终态、受控保存失败和合法 500 字终态；Node 生命周期/TypeScript 源码回归 10 项通过。浏览器自动化和 VM 均不是独立 PM 人测。

## 来源与边界

规则依据仓库 `examples/material-submission/` 的公开虚构案例重新表述，用于教学和验证 starter 架构。若页面实现与本目录事实冲突，应记录差异并先确定是否需要调整规则，不以现有代码自动推导新规则。

## 下一步

结合独立产品验收检查页面复制流程、热更新、离线预览和前后端交接说明；清洁源码完整回归与最终 CI 尚待完成。任何未验证的真实接口、鉴权和生产行为继续保持待确认。
