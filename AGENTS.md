# 仓库维护入口

本文件只用于维护 PM-product-workflow 仓库。产品经理使用工作流时从 `README.md` 和 `docs/product/README.md` 开始，不需要加载本仓库的维护规则。

所有 Coding Agent（包括首版参考实现 Codex）维护本仓库时必须从这里加载上下文。仓库文件是事实源，对话和长期记忆只提供入口提示。

## 开工前加载顺序

1. `maintainers/PROJECT_CHARTER.md`：使命、定位和明确不做。
2. `maintainers/OPEN_SOURCE_BOUNDARY.md`：公开边界和敏感信息红线。
3. `maintainers/CURRENT.md`：当前稳定基线和下一步。
4. 如果存在 `.codex-local/MAINTENANCE_STATE.md`，读取本机未完成任务；该文件不得提交。
5. 关联 Issue、PR、ADR，以及任务涉及的 Skill、Profile、模板或源码。

涉及冲突、文档同步、错误或决策时读取 `maintainers/GOVERNANCE.md`；准备 PR 和合并时读取 `maintainers/MAINTENANCE_POLICY.md` 与 `maintainers/WORKFLOW.md`。

## 基线核对

1. 先检查工作树，保留并隔离已有未提交修改。
2. 获取远端最新状态，分别核对本地提交、远端 `main` 提交和关联 PR 状态。
3. GitHub 当前 `main` 和 PR、实际工作树、本地接力文件、当前对话依次降级；低层信息与高层冲突时不得覆盖高层事实。
4. 长期记忆、旧克隆和接力块只作线索；与 GitHub 当前状态冲突时，以远端仓库为准。
5. 从最新 `main` 创建 `feature/*`、`fix/*`、`docs/*`、`chore/*` 或 `refactor/*` 分支，不复用已合并分支。

## 不可违反的规则

1. 真实项目材料、数据、源码、截图、内部规则和历史对话不得进入公开仓库，也不得通过替换名称包装公开。
2. 区分已确认事实、待确认问题和当前实现；不虚构 API、生产行为、政策、组织或人员数据。
3. 用户明确确认的新决策可以修改旧规则，但必须同步权威文件并记录 ADR。
4. 源码和页面是实现证据，不自动代表产品需求正确；冲突时并列记录并核对。
5. 两次等价失败后停止盲试，按 `maintainers/GOVERNANCE.md` 建立根因记录。
6. 产品验收与机器验证分别记录，不用笼统的“通过”代替。
7. 所有非微小变更通过分支和 PR；不得直接推送 `main`。

## 风险与合并权限

- 低风险、中风险：完成差异自审、相关验证和边界检查后可以合并。
- 高风险：完成可审阅 PR 后，等待产品负责人明确确认。
- 无法确定风险时提高一级。

宪章、边界、License、真实资料提炼、重大不兼容、CI 与合并规则、正式发布一律按高风险处理。

## 任务执行与接力

按 `maintainers/WORKFLOW.md` 执行。未完成任务优先更新本机 `.codex-local/MAINTENANCE_STATE.md`；已经创建 PR 且需要公开协作时，使用 `maintainers/templates/maintenance-handoff.md` 留下必要摘要。

任务结束时说明结果、改动文件、治理文档同步、产品验收、机器验证、未决项、风险和下一步。仅当里程碑、稳定基线、下一步、阻塞或错误状态变化时更新 `maintainers/CURRENT.md`。

## 文档地图

| 路径 | 作用 |
| --- | --- |
| `docs/product/README.md` | 产品工作流使用入口 |
| `maintainers/PROJECT_CHARTER.md` | 项目最高共识 |
| `maintainers/OPEN_SOURCE_BOUNDARY.md` | 开源边界 |
| `maintainers/GOVERNANCE.md` | 仓库上下文、冲突、同步、ADR 和错误规则 |
| `maintainers/MAINTENANCE_POLICY.md` | 风险分级与合并授权 |
| `maintainers/WORKFLOW.md` | 开发、验证和接力流程 |
| `maintainers/CURRENT.md` | 本仓库当前状态 |
| `maintainers/decisions/` | 长期决策 |
| `maintainers/errors/` | 重要错误闭环 |
