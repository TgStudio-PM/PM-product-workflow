# 当前状态

本文件只记录 PM-product-workflow 仓库状态；产品使用者从[产品工作流指南](../docs/product/README.md)开始，无需读取维护状态。使用者项目的模块状态仍使用 [模块 CURRENT 模板](../templates/module/CURRENT.md)。

最后更新：2026-10-29

## 稳定基线

- v0.1 开发中；里程碑 A、B 已交付，C 的目标使用者验收尚未完成。
- 稳定基线是 `main` 上已合并并验证的产品能力。长期共识见[项目宪章](PROJECT_CHARTER.md)、[开源边界](OPEN_SOURCE_BOUNDARY.md)、[ADR 0002 合并授权](decisions/0002-delegated-merge-authority.md)、[ADR 0003 导航范围](decisions/0003-prototype-navigation-scope.md)和[ADR 0004 原型迭代定位](decisions/0004-prototype-iteration-focus.md)。短期 PR 状态以 GitHub 为准。

## 当前定位与验收

- 主线围绕需求变化、影响澄清、桌面 Web 原型迭代、业务路径验收、事实与版本差异同步、按接收方交接及开发反馈回流；响应式检查作为补充。
- 现有 Skill、模板、Profile、工程和虚构案例支撑工作流；小型案例或演示不代表使用者实际原型质量，五分钟加页演示仅为辅助工程观察。
- v0.1 四项标准：明确需求变化并分析影响后完成可审阅迭代；按来源记录确认需求、原型行为、实现说明和差异；新会话正确接续并避免重复否定方案；按接收方提供适用成果并保留浏览器离线预览和独立验包。
- 新定位不降低验收标准。独立非开发产品经理完成完整主流程人测仍待进行；AI、浏览器自动化、工程演练及非目标用户反馈不能替代。历史计时记录保持原样，不改算新标准通过。

## 已交付能力与剩余验收

| 范围 | 已确认结果与证据 | 尚待验收 |
| --- | --- | --- |
| 核心工作流 | `pm-prototype-memory`、`pm-prototype-handover`、`pm-prototype-packager`，中文事实模板、可选 `gov-enterprise-cn` Profile 与完全虚构的四轮材料申报案例已交付；使用入口见[产品工作流指南](../docs/product/README.md)；[需求迭代主指南](../docs/product/PROTOTYPE_ITERATION.md)已提供；可选[个人原型项目入口模板](../templates/project/AGENTS_TEMPLATE.md)；另有[R-TRIAL-01 Agent 隔离演练摘要](acceptance/2026-10-29-prototype-iteration-rehearsal.md)和[Issue #156 文件验收与交付复核](acceptance/2026-10-29-workflow-delivery-validation.md)。已补充受影响规则索引与引用的同步要求。 | 独立非开发产品经理完整主任务试用未完成；Profile 仅完成静态评审，不代表权威平台合规结论。 |
| 原生案例 | 最新版本 Node VM 7 项状态恢复检查、静态包结构与独立验包通过；Chrome、Edge 本地 HTTP 69 项检查通过，见 [ERR-20261028-004](errors/ERR-20261028-004.md)。本次公开源基线的 Chrome/Edge `file://` 自动化结果见[验收摘要](acceptance/2026-10-29-workflow-delivery-validation.md)。 | 自动化结果不证明手工双击关联、独立产品经理人测或 Windows 真机 2K/125% 缩放；HTTP 不能替代 `file://` 验收。 |
| 可选 Vue starter | 蓝色布局、导航及独立源码包构建预览有 Chrome/Edge 本地 HTTP 证据，见[蓝色布局验收](acceptance/2026-10-28-vue-blue-layout.md)、[ERR-20261028-001](errors/ERR-20261028-001.md)和 [ERR-20261028-003](errors/ERR-20261028-003.md)。本次公开源基线与隔离交付候选的 `file://` 和包核验边界见[验收摘要](acceptance/2026-10-29-workflow-delivery-validation.md)。 | 工程自动化不是目标使用者验收；Windows 真机 2K/125% 缩放仍待实际反馈。Issue #75[旧版绿色包 `file://` 记录](acceptance/2026-10-28-issue75-browser-review.md)不代表新版。 |
| 后端需求材料 | 可定位案例事实、字段、流程和待确认接口。 | 仅为讨论材料；真实前后端契约未经共同确认，不代表生产 API。 |

## 下一步

1. R-TRIAL-01 Agent 隔离接续演练已完成（见上方摘要），不替代目标 PM 人测；下一步安排独立非开发 PM 完成一次桌面原型需求迭代与接续，并记录影响、业务路径验收、事实差异及适用交接。
2. 本次公开源基线和隔离交付候选的目标浏览器 `file://` 自动化验收已记录；收集 Windows 真机 2K/125% 的实际使用反馈，并保留手工打开与目标 PM 人测边界，自动化不能替代这些验收。
3. 收集外部朋友反馈，并由独立非开发产品经理完成完整 v0.1 主流程人测；小页面计时仅作辅助工程观察，不替代该人测。根据独立人测判断 v0.1 是否达标；正式 Release 仍须另行明确授权。

## 阻塞与错误

- 尚无独立非开发产品经理完成完整 v0.1 主流程人测；可选新增页面计时也尚无目标使用者记录，但不单独作为主流程阻塞。
- 当前无未关闭错误，详见[错误记录目录](errors/)。Issue #140 截图复发已闭环；四张被覆盖的初始截图永久撤销验收用途，不能作为原始初始证据或新验收结果，见 [ERR-20261028-002](errors/ERR-20261028-002.md)。错误闭环不代表产品人测完成。

## 更新规则

- 仅在版本、里程碑、稳定基线、下一步、阻塞或错误状态改变时更新；PR 列表、详细哈希和逐项脚本记录留在 Git 历史、GitHub PR 及原验收/错误记录，不在此复制，也不另建历史归档。
