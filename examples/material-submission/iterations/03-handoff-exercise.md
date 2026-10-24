# 第三轮：模拟中断与接续练习

这是用完全虚构的案例维护本仓库时形成的**模拟中断与实际仓库维护验收记录**，不是作者历史对话或真实项目的导出。下面的历史接续记录保留了当时维护本仓库的核对过程；普通使用者复做原型项目接续时不需要照搬该维护流程。业务事实仍以 `facts/` 中的文件为准，接手者应核对自己项目的当前内容，不能把快照当作比代码、事实文件和 Git 状态更新的证据。

## 普通使用者如何复做（教学步骤，尚未实测）

以下步骤供使用者在自己的原型项目中练习接续，不是非开发产品经理人测结果：

1. 以本虚构案例为练习，读取项目事实 `facts/project/PROJECT_CONTEXT.md`、模块事实 `facts/module/CURRENT.md`，并设定练习任务：核对当前事实与离线页面是否一致，为下一次接手写一份短接续。按需查看相关页面 `index.html`、`app.js`。下方含 Issue #18 的历史接力块仅供了解记录格式，不作为普通使用者的任务输入。
2. 对照任务、事实文件和页面当前实现，写明当前状态、已完成事项、待确认项及下一步；不要把页面实现自行升级为业务规则。
3. 输出短接续，注明第二轮 Chrome `file://` 验收是既有记录；若未自行重跑浏览器，不声称完成了新的浏览器验收。没有证据时，不新增业务规则或 API。

这是一份教学指引，以上普通使用者步骤尚未由独立使用者实测。

## 接力块（模拟中断时）

【任务】Issue #18：用已公开的虚构材料申报案例演示新会话接续；核对第二轮结束后是否仍有过期的“待验收”状态，并补齐第三轮迭代记录。

【当前基线】从 `main` 提交 `7250a470ea62bed92744b6cf51536b6824baf3b8` 开始。进入任务后先核对实际分支、工作树和 GitHub，不沿用本行作为永远有效的当前基线。

【已完成】第二轮规则变更已记录在 `facts/module/ITERATIONS.md`；BR-001 至 BR-007 及页面实现已存在。产品交接 Skill 由本任务另行新增，接续时应检查它是否已落地。

【已验证】第二轮记录称 Chrome `file://` 交互和仓库检查通过；这些是既有记录，本接力块没有重新执行验证。重新声明本轮通过前应运行与本轮改动相称的检查。

【未完成】逐项核对 `facts/module/CURRENT.md`、`facts/project/PROJECT_CONTEXT.md`、`facts/project/MODULE_REGISTRY.md` 与第二轮事实、页面和已留存验收记录；修正有证据证明的过期表述。将第三轮接续经过和验证结果写入 `facts/module/ITERATIONS.md`，并在本文件追加接续结果。

【下一步】先读取上述事实文件与 `app.js`、`index.html`，列出具体矛盾及证据，然后只修正已证实的状态。完成后分别报告产品验收和机器验证。

【禁止事项】不读取作者旧聊天或任何真实项目材料；不新增业务规则、接口、上传或服务端能力；不把这次模拟练习写成真实历史事故；不因文档过期而无证据地改动已运行页面。

【影响范围】`facts/module/CURRENT.md`、`facts/module/ITERATIONS.md`、必要时的项目事实文件、本练习文件。页面代码只有发现与已确认规则不一致并取得明确依据时才纳入修改。

## 接续结果

### 本轮空白上下文接续记录（2026-10-21）

- 实际核对：根 `AGENTS.md`；`maintainers/PROJECT_CHARTER.md`、`OPEN_SOURCE_BOUNDARY.md`、`CURRENT.md`、`GOVERNANCE.md`、`WORKFLOW.md`；Git 分支/提交/工作树；GitHub Issue #18；本案例 `facts/project/PROJECT_CONTEXT.md`、`MODULE_REGISTRY.md`、模块 `CURRENT.md`、`BUSINESS_RULES.md`、`PAGE_FLOW.md`、`DECISIONS.md`、`ITERATIONS.md`；`index.html`、`app.js`；本练习快照；以及工作树中未跟踪的 `.agents/skills/pm-prototype-handover/SKILL.md`（仅用于核对文件存在与职责，不代表 Git 跟踪或合并状态）。未读取旧聊天或真实项目材料。
- 实际基线：`feature/fictional-handover-iteration`，HEAD `7250a470ea62bed92744b6cf51536b6824baf3b8`；本地 `main` 与 `origin/main` 同提交；Issue #18 仍为 Open。
- 发现：`facts/module/CURRENT.md` 同时称第二轮 `file://` 产品验收已通过并把同一验收列为待办；其下一步仍称“进入第三轮设计”，与当前 Issue #18 和本快照不符。`PROJECT_CONTEXT.md` 仍称当前阶段第二轮；`MODULE_REGISTRY.md` 仍标“验收中”，与第二轮事实记录中已完成的浏览器验收不一致。
- 改动：修正上述过期状态；将第三轮定义为接续事实练习，不改业务规则和页面；在 `facts/module/ITERATIONS.md` 追加依据、修正、边界与验证记录。BR-001 至 BR-007 与页面实现没有发现需改动的矛盾。
- 产品验收：本轮没有运行浏览器。第二轮已有的 Chrome 152 `file://` 交互与 390px 检查保留为历史验收记录，不能表述成本轮重测。
- 机器验证：`python maintainers/scripts/check_markdown_links.py .` 通过；`python maintainers/scripts/check_public_content.py --root .` 的内容扫描通过，但其风险分类为 `NOT-EVALUATED`（未提供 PR base-ref）；`git diff --check` 与 `node --check examples/material-submission/app.js` 通过。机器检查不覆盖浏览器交互或全部业务回归。
- 待确认/未完成：Issue #18 的 Skill 文件在工作树存在但未跟踪；其内容审查、独立验收和 Issue 整体完成状态仍待主线处理。未确认任何真实业务待办。
- 下一步：由主线审查未跟踪的 `pm-prototype-handover` Skill 并完成 Issue #18 剩余验收；如重新声明页面产品验收，应另行执行浏览器检查。
- 不要重复：不要把第二轮既有产品验收写成第三轮刚刚重跑；不要把 Skill 的本地文件存在等同于已跟踪、已合并或已验收；没有发现需要重复的失败尝试。
