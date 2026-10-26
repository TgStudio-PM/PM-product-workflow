# 外部试用与评审证据分层记录

日期：2026-10-26。受评公开基线：`6ddeca1fc158b65da0c296e4ad6f40c72531cff5`。本记录依据多份仓库外测试与评审材料作取舍，并核对当前公开源码；原始附件、日志、截图和本机路径不进入公开仓库。它是问题接力记录，**不是 v0.1 产品验收或正式发布结论**。

## 先看证据能证明什么

| 来源类型 | 报告所述观察 | 本仓库采用的结论边界 |
| --- | --- | --- |
| 现有机器用例与三类交付包 | 不同环境分别报告原有用例通过、类型检查及打包/独立验包通过；一份 Windows 报告因链接创建权限不足跳过 4 项，另一份支持链接的环境报告这些用例通过。 | 仅证明各自环境与既有断言覆盖的路径；不把不同报告的用例数累加，也不推断未覆盖的异常输入已通过。 |
| 浏览器操作 | 有报告在 Chrome/Edge `file://` 完成虚构原生案例五步和 Vue 冒烟；另一份在 Edge 的本机 HTTP 环境完成 Vue 主要流程，原生案例清除弹窗未完成；还有一份因浏览器连接失败未能运行。 | 这些是外部各自声称执行的结果，环境与完成范围不同；原始可复核产物未纳入仓库，本记录不将其改写为本仓库独立重测。HTTP 结果不能代替 `file://`。 |
| 新增隔离反例与 DOM 模拟 | 一份报告称原有用例全绿，同时新增的路径、凭据格式、资源引用及异常恢复反例未通过。 | 新反例提供明确的复现线索；DOM 模拟不证明真实浏览器布局、点击或离线行为。逐项复现、修复、回归后再关闭问题。 |
| AI 与非 PM 参与 | 外部报告包含 AI 静态阅读、AI 执行命令与浏览器自动化，没有独立非开发产品经理完整试用。 | 不把 AI 或非 PM 的结果填作目标用户人测。参照[外部试用手册](../../docs/product/EXTERNAL_TRIAL.md)分别记录人工与 AI 证据。 |

## 已核对的取舍

1. **优先修复公开边界和工程外写入。** 带引号凭据键漏扫已在本仓库用完全虚构输入独立复现，经 [Issue #117](https://github.com/TgStudio-PM/PM-product-workflow/issues/117)、[PR #119](https://github.com/TgStudio-PM/PM-product-workflow/pull/119) 修复；定向测试与 GitHub CI 通过，详见[错误记录](../errors/ERR-20261026-003.md)。`page:new` 的父路径链接问题可由[当前源码](../../starters/vue-prototype/scripts/create-page.mjs)定位，外部反例提供了工程外写入线索；[Issue #118](https://github.com/TgStudio-PM/PM-product-workflow/issues/118) 要求先在隔离环境复现，再做有限修复。不得在真实项目或原型目录运行反例。
2. **交付边界按独立反例继续核对。** 外部报告指出 Vue 预览 CSS 缺失资源、通用打包器的 `object.data`/`video.poster` 引用、原生案例无效已提交状态恢复，以及畸形 Profile 类型的异常提示。公开[预览审计器](../../starters/vue-prototype/scripts/verify-preview.mjs)、[通用打包器](../../.agents/skills/pm-prototype-packager/scripts/package.py)与[原生案例](../../examples/material-submission/app.js)存在对应静态检查范围；这些结论仍需逐项独立复现，不提前标为本仓库已解决或正式发布阻断的已确认事故。
3. **外部试用体验采用最小修正。** ZIP 副本运行仓库维护脚本时缺少 Git 元数据的报错，可先明确脚本适用环境；不因这条反馈为普通产品使用者新增一套文件系统扫描模式。案例的 `ITERATIONS.md` 是教学叙事；暂不把它强制加入每个使用者模块和 `facts:new`，待目标用户试用证明需要再决定。中英 README 同步、状态文案和状态页更新可随对应小改动处理。
4. **维护体系按实际风险增长。** 浏览器 CI 和主分支保护建议可在已有流程反复出现缺口时以最小配置评估，不因此扩充 v0.1 的产品入口、Skill 或 Vue starter 功能。高风险 PR 的合并授权仍以[现行规则](../MAINTENANCE_POLICY.md)为准；正式 Release 仍需另行授权，外部评审不自动修改已确认政策。

## 产品主线与后续顺序

本项目继续从作者的真实需求变化、原型迭代、Skill/Agent 协作与前后端交付实践中**提炼方法**；真实项目的源码、规则、截图、数据和对话留在私有工作区。公开产品只保留重新创作的虚构案例、通用模板和可验证的工作流。核心路径仍是“需求与证据 → 事实源 → 原型迭代 → 评审和验证 → 交接 → 按接收者交付”；[Vue starter](../../starters/vue-prototype/README.md)为可选工程示范。

后续按序处理：针对其余资源与异常恢复线索建立最小复现并分别修复 → 收集外部试用反馈 → 补独立非开发产品经理试用与计时。每次只让新增检查或文件服务于一个已证实的使用障碍。四项 v0.1 成功标准以[项目宪章](../PROJECT_CHARTER.md)为准；正式发布另行判断。

## 2026-10-26 复核进展

- `page:new` 的工程外路径链接反例已在隔离虚构工程复现并修复，见[Issue #118](https://github.com/TgStudio-PM/PM-product-workflow/issues/118)与[ERR-20261026-004](../errors/ERR-20261026-004.md)；Linux CI 的新增链接用例实际运行通过。
- 通用静态打包器漏验 `object.data`、`video.poster` 已用虚构 HTML 复现并定向修复，见[Issue #123](https://github.com/TgStudio-PM/PM-product-workflow/issues/123)与[ERR-20261026-005](../errors/ERR-20261026-005.md)。本地三类虚构 Profile 构建及独立验包通过；[PR #124](https://github.com/TgStudio-PM/PM-product-workflow/pull/124) 最新提交的 Linux CI 通过后已合并。
- Vue 预览 CSS 本地资源漏验已在虚构隔离包复现：原包与更新摘要后的缺资源包均被旧验包器接受。见[Issue #125](https://github.com/TgStudio-PM/PM-product-workflow/issues/125)与[ERR-20261026-006](../errors/ERR-20261026-006.md)；[PR #126](https://github.com/TgStudio-PM/PM-product-workflow/pull/126) 最新 CI 通过后已合并。
- 原生案例无效“已提交”恢复也已用当前 `app.js` 和虚构 Node VM 输入独立复现，见[Issue #127](https://github.com/TgStudio-PM/PM-product-workflow/issues/127)与[ERR-20261026-007](../errors/ERR-20261026-007.md)；[PR #128](https://github.com/TgStudio-PM/PM-product-workflow/pull/128) 的最新 CI 通过后已合并。VM 测试不代表目标浏览器验收。
- 畸形交付 Profile 的 `kind` 对象会触发未受控 TypeError；同类 ZIP manifest 输入也已独立复现。见[Issue #129](https://github.com/TgStudio-PM/PM-product-workflow/issues/129)与[ERR-20261026-008](../errors/ERR-20261026-008.md)；受控报错修复和本地回归已完成，合并仍以关联 PR 的最新 CI 为准。非 PM 或 AI 试用仍不能替代目标用户人测。
