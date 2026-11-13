# PM-product-workflow

[简体中文](README.md) | [English](README.en.md)

**面向政务与复杂 B 端产品经理、Coding Agent 与开发者的桌面 Web 原型开发和持续迭代工作流。**

围绕真实需求变化，在使用者自己的原型项目中分析影响、实现代码改动、按业务路径验收，并把有来源的事实、接续信息和必要交付反馈回工作流。Codex 是已验证的参考工具之一；方法不绑定特定 Coding Agent、框架或设计系统。

> Repository is memory. Conversation is working context. 仓库保存经过确认的项目事实，对话承载当前工作上下文。

## 开始一次迭代

从[原型需求迭代与接续指南](docs/product/PROTOTYPE_ITERATION.md)开始。把本轮要改什么、项目入口与相关路径、需求来源和当前版本提供给 Coding Agent；未知信息列为待确认。在自己的原型项目中完成：

```text
需求与影响 → 原型代码开发/迭代 → 业务路径验收
           → 最小事实与版本差异同步 → 接续或交接 → 开发反馈回流
```

已有原型优先复用项目的技术栈、设计约束、组件和目录。若从明确需求开始建立首版原型，先确认目标用户、角色流程、设计约束和技术栈；缺少关键信息时列为待确认。本项目提供工作流，不交付通用应用脚手架。

可以直接按指南开展本轮工作，无需先安装 Skills 或补齐整套模板。改完由产品负责人核对受影响业务路径，再最小同步事实；接续、开发文档和打包按实际需要选择。

## 需要时再选工具

| 本轮需要 | 按需使用 |
| --- | --- |
| 评审现有界面，或落实明确的界面调整 | `gov-ui-reviewer` / `gov-ui-refactor` |
| 核对事实、同步已确认变化或记录重要错误 | `pm-prototype-memory` |
| 换会话继续未完成工作 | `pm-prototype-handover` |
| 向前端、后端或 QA 写作、更新或评审开发需求 | `gov-requirements-doc-writer` |
| 接收方确实需要 ZIP 或独立交付包 | `pm-prototype-packager` |

调用方式和可复制提示词见 [Skills 使用说明](docs/product/USING_SKILLS.md)，交付配置见[按需交付说明](docs/product/PACKAGING.md)。

## 可选资源

- **项目与模块模板**：`templates/project/`、`templates/module/`，按需复制并沿用项目现有结构。
- **协作角色**：[Tg Studio 执行型 Agent](templates/optional/EXECUTOR_ROLE.md)，搭配现有任务包按需使用，不绑定模型。
- **可选设计预设**：[`gov-enterprise-cn`](profiles/gov-enterprise-cn/PROFILE.md)，需结合项目确认的规范与规则使用。
- **三类交付配置模板**：`templates/package-profiles/`，须先复制到自己的项目，按实际文件和证据定制后再用于打包。

## 产品与贡献入口

个人项目从[产品工作流指南](docs/product/README.md)开始，无需读取仓库维护文件。维护本项目请先读[仓库维护入口](AGENTS.md)和[贡献指南](CONTRIBUTING.md)。

原创内容采用 [MIT License](LICENSE)；第三方依赖和资产遵循各自许可证。

## About

我是产品经理。这个项目来自我对实际工作和项目中反复遇到的问题、验证过的方法与可复用成果的持续总结。

Tg Studio is a product manager's open-source project. It distills recurring problems, validated practices, and reusable outcomes from day-to-day product work into a public workflow.

从大学学习、参加工作，到持续学习和使用 AI 的这段时间，我从开源社区获得了许多工具、知识和启发。如今我很高兴能把自己的实践整理成一个开源项目，为社区贡献一份力量。

From university through my professional career and continued AI learning, I have benefited greatly from open-source tools, knowledge, and communities. I am happy to organize my own practice into an open-source project and give something back.

**Keywords:** Product Manager, Coding Agent, enterprise software, government software, prototype development, handoff, delivery.
