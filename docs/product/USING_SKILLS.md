# 在自己的项目中使用 Skills

按本轮任务选择现有 Skill，并向 Coding Agent 提供 Skill 文件与自己项目中相关事实、原型代码的可访问路径。Codex 是已验证的参考工具之一；其它工具是否自动发现 Skills 取决于其能力与配置。不要把本仓库根目录 `AGENTS.md` 当作产品 Skill。

## 三个 Skills 如何衔接

- [`pm-prototype-memory`](../../.agents/skills/pm-prototype-memory/SKILL.md)：围绕需求迭代维护有来源的事实、变化、冲突和错误闭环。
- [`pm-prototype-handover`](../../.agents/skills/pm-prototype-handover/SKILL.md)：准备或读取会话接续材料，按现有记录继续工作。
- [`pm-prototype-packager`](../../.agents/skills/pm-prototype-packager/SKILL.md)：确有交付需要时，用其 `scripts/package.py`、实际源码和有效 Profile 准备并核对白名单包。脚本、源码和 Profile 是运行所需；新建或调整配置时再参考[交付指南](PACKAGING.md)和公开模板。项目已有有效配置时可直接使用，不必每次复制模板。

先按[产品工作流入口](README.md)和[迭代指南](PROTOTYPE_ITERATION.md)确定本轮目标与影响。事实核对和变更后同步可用 memory；需要新会话续作时用 handover；只有接收方确需 ZIP 时再用 packager。不是每轮都要调用全部 Skills。

## 可复制的提示词

将尖括号替换为自己项目的实际名称、路径和任务信息。每次只提供本轮相关文件。

**事实同步**

```text
按 <可访问的 pm-prototype-memory Skill 路径> 核对并同步 <项目名>/<目标模块>。先读 <项目入口>、<模块事实路径> 和本轮相关原型代码。围绕 <本轮目标> 记录有来源的变化、当前实现、验收结果和待确认项；不确定的规则或接口保持待确认。
```

**接续**

```text
按 <可访问的 pm-prototype-handover Skill 路径> 为 <项目名>/<目标模块> 整理本轮接续材料。核对 <相关 CURRENT、规则、流程、决策及错误记录路径>，记录基线、已完成工作、实际验证、待确认事项和一个下一步。只依据可访问的项目记录。
```

**按需交付**

```text
按 <可访问的 pm-prototype-packager Skill 路径> 为 <项目名>/<目标模块> 准备 <接收方与交付用途> 所需的包。先核对 <权威需求、目标项目、原型入口和相关文件>，将 Profile 复制并按证据定制，使用唯一输出名构建后独立验包。实际验证之外的行为明确标为待确认。
```

使用者项目中的资料保留在授权工作区。公开仓库内容边界见[开源边界](../../maintainers/OPEN_SOURCE_BOUNDARY.md)。