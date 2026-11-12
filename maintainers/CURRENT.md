# 当前状态

本文件记录 PM-product-workflow 仓库状态；产品使用者从[产品工作流指南](../docs/product/README.md)开始，无需读取维护状态。使用者项目的模块状态仍使用[模块 CURRENT 模板](../templates/module/CURRENT.md)。

最后更新：2026-11-12

## 稳定基线与定位

- v0.1 开发中；稳定基线以 `main` 已合并能力为准，短期 PR 状态以 GitHub 为准。
- 产品定位、公开边界、合并授权与原型迭代原则见[项目宪章](PROJECT_CHARTER.md)、[开源边界](OPEN_SOURCE_BOUNDARY.md)及[ADR 0002](decisions/0002-delegated-merge-authority.md)、[ADR 0005](decisions/0005-workflow-only-product.md)。旧 ADR 0003/0004 中与固定 demo/starter 相关的产品用途已按 ADR 0005 替代；原工程记录留作历史。
- 产品主线是围绕需求变化开发和迭代使用者的桌面 Web 原型，按业务路径验收并同步有来源的事实；事实模板、接续和按需交付提供支撑。

## 已交付能力与待验收

- 六个工作流 Skills：`pm-prototype-memory`、`gov-requirements-doc-writer`、`pm-prototype-handover`、`pm-prototype-packager`、`gov-ui-reviewer`、`gov-ui-refactor`。UI 入口共用现有 Profile；协作可选用 Tg Studio 执行角色与已有任务包。见 [ADR 0007](decisions/0007-ui-skills-and-lifecycle-feedback.md)。
- 需求到代码落地的负责人实践已用于方法提炼：迭代指南补充开发对照、评审处置和交付版本反馈。这是负责人自用实践，不是独立非开发产品经理验收。
- 项目与模块事实模板、可选 `gov-enterprise-cn` Profile、原型迭代与接续指南、按需交付指南。
- 三类交付配置模板作为待定制起点；具体文件白名单必须依据使用者项目证据生成，不可直接套用。
- 独立非开发产品经理在其有权访问的原型项目上完成四项主链的实际试用仍待进行。既有 demo、AI 或工程演练不计作该验收。
- 当具体交付要求离线使用时，仍须实测目标 `file://` 入口和核心业务路径并独立验包；不要求每项任务都制作离线包。

旧 demo/starter 的工程、浏览器与截图记录继续保留在原 acceptance/errors 文件中，结论只适用于各自记载的版本和范围；演示专项未完成不标通过，也不再构成当前统一门槛。正式 Release 另行授权。

## 下一步

1. 优先跟踪原型到开发实现的一致性、评审处置和交付反馈中的实际阻力；复用现有 Skills、Profile 与模板，避免重复记录或扩建演示。
2. 安排独立非开发产品经理在自己的授权原型项目中完成一次需求迭代、业务路径验收、事实同步和接续；记录实际障碍，不以旧演示代替。
3. 依据使用者真实交付要求检验相应交付材料；若要求离线使用，再在目标环境执行对应验收。

## 阻塞与错误

- 目标使用者的完整四项工作流人测尚未完成，但这不阻止有证据的工程改进。
- 已关闭错误继续见[错误记录目录](errors/)。既有覆盖截图与原始 JSON 撤销验收用途的限制仍按 [ERR-20261028-002](errors/ERR-20261028-002.md) 执行；错误闭环不代表产品人测完成。

## 更新规则

仅在版本、稳定基线、下一步、阻塞或错误状态改变时更新；PR 列表、详细哈希及逐项脚本记录留在 Git 历史、PR 与原始验收/错误记录中。
