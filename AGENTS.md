# 仓库维护入口

本文件是所有 Coding Agent（包括首版参考实现 Codex）维护本仓库时的强制入口。仓库文件是事实源，对话只承载当前工作上下文。

## 开工前加载顺序

任何任务开始前依次读取：

1. `docs/project-charter.md`：使命、定位和明确不做。
2. `docs/open-source-boundary.md`：公开边界和敏感信息红线。
3. `docs/current.md`：当前稳定基线、进行中工作和下一步。
4. 关联 Issue、PR、ADR 及任务涉及的 Skill、Profile、模板或源码。

涉及冲突、文档同步、错误或决策时读取 `docs/governance-rules.md`；准备 PR 和合并时读取 `docs/maintenance-policy.md` 与 `docs/maintainer-workflow.md`。

## 不可违反的规则

1. 真实项目材料、数据、源码、截图、内部规则和历史对话不得进入公开仓库，也不得通过替换名称包装公开。
2. 区分已确认事实、待确认问题和当前实现；不虚构 API、生产行为、政策、组织或人员数据。
3. 用户明确确认的新决策可以修改旧规则，但必须同步权威文件并记录 ADR。
4. 源码和页面是实现证据，不自动代表产品需求正确；冲突时并列记录并核对。
5. 两次等价失败后停止盲试，按 `docs/governance-rules.md` 建立根因记录。
6. 产品验收与机器验证分别记录，不用笼统的“通过”代替。
7. 所有非微小变更通过分支和 PR；不得直接推送 `main`。

## 风险与合并权限

- 低风险、中风险：完成差异自审、相关验证和边界检查后可以合并。
- 高风险：完成可审阅 PR 后，等待产品负责人明确确认。
- 无法确定风险时提高一级。

宪章、边界、License、真实资料提炼、重大不兼容、CI 与合并规则、正式发布一律按高风险处理。

## 任务执行与接力

按 `docs/maintainer-workflow.md` 执行。中断或换会话时，使用 `templates/maintenance-handoff.md` 在 Issue 或 PR 留下接力块。

任务结束时说明：结果、改动文件、治理文档同步、产品验收、机器验证、未决项、风险和下一步。仅当里程碑、稳定基线、进行中任务、下一步、阻塞或错误状态变化时更新 `docs/current.md`。

## 文档地图

| 文档 | 作用 |
| --- | --- |
| `docs/project-charter.md` | 项目最高共识 |
| `docs/open-source-boundary.md` | 开源边界 |
| `docs/governance-rules.md` | 上下文、冲突、同步、ADR 和错误规则 |
| `docs/maintenance-policy.md` | 风险分级与合并授权 |
| `docs/maintainer-workflow.md` | 开发、验证和接力流程 |
| `docs/current.md` | 本仓库当前状态 |
| `docs/decisions/` | 长期决策 |
| `docs/errors/` | 重要错误闭环 |
