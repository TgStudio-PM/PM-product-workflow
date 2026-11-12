# 在自己的项目中使用 Skills

按本轮任务选择现有 Skill，并向 Coding Agent 提供 Skill 文件与自己项目中相关事实、原型代码的可访问路径。Codex 是已验证的参考工具之一；其它工具是否自动发现 Skills 取决于其能力与配置。不要把本仓库根目录 `AGENTS.md` 当作产品 Skill。

## 六个 Skills 如何按需使用

- [`pm-prototype-memory`](../../.agents/skills/pm-prototype-memory/SKILL.md)：围绕需求迭代维护有来源的事实、变化、冲突和错误闭环。
- [`gov-requirements-doc-writer`](../../.agents/skills/gov-requirements-doc-writer/SKILL.md)：按需编写、增量更新或评审面向前端、后端和 QA 的开发需求文档；可独立调用。需要时可在事实核对之后、准备交付包之前使用，但不要求串行调用全部 Skills。
- [`pm-prototype-handover`](../../.agents/skills/pm-prototype-handover/SKILL.md)：准备或读取会话接续材料，按现有记录继续工作。
- [`pm-prototype-packager`](../../.agents/skills/pm-prototype-packager/SKILL.md)：确有交付需要时，用其 `scripts/package.py`、实际源码和有效 Profile 准备并核对白名单包。脚本、源码和 Profile 是运行所需；新建或调整配置时再参考[交付指南](PACKAGING.md)和公开模板。项目已有有效配置时可直接使用，不必每次复制模板。
- [`gov-ui-reviewer`](../../.agents/skills/gov-ui-reviewer/SKILL.md)：只读走查现有页面，或按修正版本复核发现；与现有 Profile 配合。
- [`gov-ui-refactor`](../../.agents/skills/gov-ui-refactor/SKILL.md)：保留项目现有技术栈和组件，落实本轮明确的界面调整。

先按[产品工作流入口](README.md)和[迭代指南](PROTOTYPE_ITERATION.md)确定本轮目标与影响。事实核对和变更后同步可用 memory；需要新会话续作时用 handover；只有接收方确需 ZIP 时再用 packager。不是每轮都要调用全部 Skills。

需要形成开发需求文档时，再按本轮范围选用 `gov-requirements-doc-writer`；不把营销 PRD 或每轮文档作为默认产物。原型开发和代码变更仍按项目授权另行完成。

## 可复制的提示词

将尖括号替换为自己项目的实际名称、路径和任务信息。每次只提供本轮相关文件。

**事实同步**

```text
按 <可访问的 pm-prototype-memory Skill 路径> 核对并同步 <项目名>/<目标模块>。先读 <项目入口>、<模块事实路径> 和本轮相关原型代码。围绕 <本轮目标> 记录有来源的变化、当前实现、验收结果和待确认项；不确定的规则或接口保持待确认。
```

**开发需求文档**

Skill 路径指向本轮选定的版本，避免与本机同名技能混用。

```text
按 <可访问的 gov-requirements-doc-writer Skill 路径> 以 <dev-handoff/lean-delivery/custom> 模式，为 <项目/模块> 编写或更新开发需求文档。输入路径：<需求来源、授权原型代码/截图、现有事实文档及版本>；输出位置：<授权工作区路径>；更新范围：<仅本轮受影响章节/仅评审不修改原件>。保留有来源的已确认项、当前实现证据和待确认差异，不猜缺失契约。
```

**接续**

```text
按 <可访问的 pm-prototype-handover Skill 路径> 为 <项目名>/<目标模块> 整理本轮接续材料。核对 <相关 CURRENT、规则、流程、决策及错误记录路径>，记录基线、已完成工作、实际验证、待确认事项和一个下一步。只依据可访问的项目记录。
```

**按需交付**

```text
按 <可访问的 pm-prototype-packager Skill 路径> 为 <项目名>/<目标模块> 准备 <接收方与交付用途> 所需的包。先核对 <权威需求、目标项目、原型入口和相关文件>，优先复用并核对项目已有的有效 Profile；缺少适用配置时，再复制模板并按证据定制。使用唯一输出名构建后独立验包。实际验证之外的行为明确标为待确认。
```

**界面评审或调整**

```text
按 <本次公开版本 gov-ui-reviewer / gov-ui-refactor 的 Skill 路径>，对 <项目/页面及版本> 做 <只读评审/明确范围的代码调整>。输入：<页面路径、现有规范和本轮需求>；目标桌面环境：<视口、缩放>；输出：<新评审记录/授权代码范围>。沿用现有组件和业务规则，说明实际检查结果和待确认项。
```

公开 UI Skills 与本机可能存在的同名版本分开选择。使用仓库路径，或按工具规则复制完整 Skill 目录；需要默认 Profile 时一并保留其相对路径资源，也可提供自己的规范。无需安装全部 Skills，不覆盖已有同名安装。
