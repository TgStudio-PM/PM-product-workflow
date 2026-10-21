# 在自己的项目中使用 Skills

本仓库的产品 Skills 是可复用的工作说明。根据本轮任务选择需要的 Skill，并把 **Skill 文件路径**和**你自己项目中的事实文件路径**明确提供给 Coding Agent。Codex 只是本仓库使用过的参考工具；其他工具是否自动发现或安装 Skill，取决于各自的能力和配置。不要假定所有工具都会自动读取 `.agents/skills/`，也不要把本仓库维护用的根目录 `AGENTS.md` 当作产品 Skill 或安装步骤。

## 按任务选择

- 维护或核对项目事实、规则与当前实现：使用 [`pm-prototype-memory`](../../.agents/skills/pm-prototype-memory/SKILL.md)，并提供项目上下文、模块事实及相关源码路径。
- 为新会话准备接续信息或从接续材料恢复：使用 [`pm-prototype-handover`](../../.agents/skills/pm-prototype-handover/SKILL.md)，并提供目标项目的模块状态、规则、流程、决策和错误记录等相关路径。
- 准备静态预览、前端源码或后端需求交付：使用 [`pm-prototype-packager`](../../.agents/skills/pm-prototype-packager/SKILL.md)，并提供目标项目路径、权威需求和已确认的交付用途。

先确认 Agent 能读取所给路径；若工具支持 Skill 自动发现，可按该工具自己的说明配置。否则，将 Skill 文件内容或可访问路径作为本轮上下文提供。每轮只提供任务需要的项目事实，不依赖不可访问的历史对话。

## 可复制的短提示词

以下示例中的项目和路径都是虚构内容。使用前将 `<PM-product-workflow 根目录>`、`<私有项目根目录>` 和 `<项目外输出目录>` 替换为 Agent 能访问的实际路径；输出目录须位于项目源文件目录之外。把真实项目资料留在自己的私有项目中，不要复制到本公开仓库。

**事实同步**

```text
请按本地 Skill `<PM-product-workflow 根目录>/.agents/skills/pm-prototype-memory/SKILL.md` 核对并同步“Tg Studio 材料申报演练”项目事实。先读 `<私有项目根目录>/PROJECT_CONTEXT.md`、`<私有项目根目录>/modules/申请登记/CURRENT.md`、`<私有项目根目录>/modules/申请登记/BUSINESS_RULES.md` 和该模块 `src/` 中本次相关文件。只记录有证据的变化；无法确认的内容标为“待确认”。项目资料仅保存在这个项目中。
```

**接续**

```text
请按本地 Skill `<PM-product-workflow 根目录>/.agents/skills/pm-prototype-handover/SKILL.md`，为“Tg Studio 材料申报演练”的“申请登记”模块整理本轮接续材料。依据 `<私有项目根目录>/modules/申请登记/` 下的 `CURRENT.md`、`BUSINESS_RULES.md`、`PAGE_FLOW.md`、`DECISIONS.md` 和 `ERROR_LEDGER.md`，核对实际文件后记录基线、完成项、验证、待确认事项和一个明确下一步。材料写回该项目，不引用不可访问的历史对话。
```

**按需交付**

```text
请按本地 Skill `<PM-product-workflow 根目录>/.agents/skills/pm-prototype-packager/SKILL.md`，为“Tg Studio 材料申报演练”的内部评审准备静态预览包。依据 `<私有项目根目录>/PROJECT_CONTEXT.md`、`<私有项目根目录>/modules/申请登记/BUSINESS_RULES.md` 和该模块相关页面，先核实入口与资源并按白名单准备；标明未验证事项，不把演示页面描述成生产能力。交付物写入项目源文件目录之外的 `<项目外输出目录>/评审包.zip`。
```

## 边界

`.agents/skills/` 中链接的三个文件是供产品使用者选择的工作流说明；仓库根目录 `AGENTS.md` 和 `maintainers/` 中的文件只管理本公开仓库。使用者可以在自己的项目中保存真实材料和事实，但这些资料、私有对话及本机路径不得复制到本仓库或虚构示例中。
