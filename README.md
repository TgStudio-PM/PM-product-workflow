# PM-product-workflow

[简体中文](README.md) | [English](README.en.md)

**面向政务与复杂 B 端产品经理的 Coding Agent 原型迭代、上下文治理与交付工作流。**

**A Coding Agent workflow for product managers building government and complex enterprise products, covering prototype iteration, context governance, and delivery.**

它把需求、业务规则、原型、评审、验证和交接沉淀在项目仓库中，让产品经理与开发者在多轮 Coding Agent 协作中持续维护同一份事实。

> Repository is memory. Conversation is working context.  
> 仓库保存经过确认的项目事实，对话承载当前工作上下文。

## 选择入口 / Choose your path

### 使用产品工作流

如果你想把这套方法用于自己的产品项目，从[产品工作流指南](docs/product/README.md)开始，然后复制 `templates/` 并选择 `profiles/` 中的设计预设。

普通使用者不需要读取根目录 `AGENTS.md` 或 `maintainers/`；它们只负责维护本开源仓库。

### 参与维护本仓库

如果你要修改 PM-product-workflow 本身，先读取[仓库维护入口](AGENTS.md)和[贡献指南](CONTRIBUTING.md)。仓库状态、边界、风险分级、决策和检查工具集中在 `maintainers/`。

## 适合谁

- 使用 Coding Agent 分析需求、设计业务并制作原型的产品经理。
- 与产品经理共同维护规则、原型和交付物的开发者。
- 容易遇到多对话失忆、规则漂移、重复返工和交付边界不清的长期项目。

核心机制可以迁移到其他产品，但首版主要维护：

```text
gov-enterprise-cn
政务与复杂 B 端 Web 管理系统
```

它关注查询台账、复杂表单、材料申报、批量操作、多角色协作、状态流转、防误操作和可追溯性。Codex 是首版参考实现，公开方法不绑定具体 Coding Agent、前端框架或设计系统。

## 工作方式

```text
理解资料 → 确认规则 → 实现原型 → 评审修改
        → 同步事实 → 验证 → 交付 → 接续开发
```

每轮工作结束时，项目仓库应能回答：

1. 本轮改变了什么？
2. 哪些页面和业务规则受到影响？
3. 哪些内容已经验证，哪些仍待确认？
4. 下一个 Coding Agent 会话从哪里继续？

## 当前内容

| 能力 | 状态 | 位置 |
| --- | --- | --- |
| 项目与模块事实模板 | 可用 | `templates/project/`、`templates/module/` |
| 政务与复杂 B 端设计预设 | 可用，持续完善 | `profiles/gov-enterprise-cn/` |
| 产品方法与快速开始 | 可用 | `docs/product/` |
| 三个核心 Skills | 规划中 | 完成后放入 `.agents/skills/` |
| 三轮迭代虚构案例 | 规划中 | 完成后放入 `examples/material-submission/` |

计划中的核心 Skills：

- `pm-prototype-memory`：维护事实、变更、冲突和错误闭环。
- `pm-prototype-handover`：生成短接续或完整交接材料。
- `pm-prototype-packager`：检查并整理可独立运行的原型交付包。

## 仓库结构

```text
docs/product/                  产品使用指南
templates/                     使用者项目与模块模板
profiles/                      可选择或扩展的设计预设
.agents/skills/                已发布的产品 Skills
examples/                      完全虚构的可运行案例

AGENTS.md                      本仓库维护入口
maintainers/                   本仓库治理、状态和检查工具
.github/                       Issue、PR 与 CI 配置
```

`.agents/skills/` 和 `examples/` 只在有真实可用内容后加入仓库，不创建空目录表示完成。

## 开源边界

本仓库只接收原创、完全虚构且完成授权检查的内容。真实项目代码、截图、业务材料、人员数据、生产接口、账号密钥、本机路径、历史对话和来源不明的第三方资产不得进入仓库，也不能通过替换名称包装公开。

完整维护红线见[开源边界](maintainers/OPEN_SOURCE_BOUNDARY.md)。产品使用者可借鉴这一原则建立自己项目的公开或交付边界。

## 路线图

- [x] 建立 README、开源边界和基础模板
- [x] 建立长期治理、分级维护和接力协议
- [x] 分离产品使用入口与仓库自管理入口
- [ ] 发布 `pm-prototype-memory`
- [ ] 发布 `pm-prototype-handover`
- [ ] 发布 `pm-prototype-packager`
- [ ] 完成三轮迭代的可运行虚构案例
- [ ] 完善 `gov-enterprise-cn` Profile 并完成 v0.1 验收

## 贡献与许可

欢迎提交模板改进、完全虚构的案例、验证规则和新的 Profile。贡献前请阅读[贡献指南](CONTRIBUTING.md)。

原创内容采用 [MIT License](LICENSE)。第三方依赖和资产遵循各自许可证。

## 关于 / About

我是产品经理。这个项目来自我对实际工作和项目中反复遇到的问题、验证过的方法与可复用成果的持续总结。公开内容只保留通用工作流、模板和经验，不包含任何真实项目材料。

从大学学习、参加工作，到持续学习和使用 AI 的这段时间，我从开源社区获得了许多工具、知识和启发。如今我很高兴能把自己的实践整理成一个开源项目，为社区贡献一份力量。

I am a product manager. This project distills recurring problems, validated practices, and reusable outcomes from my day-to-day work into a public workflow, without exposing real project materials.

From university through my professional career and continued AI learning, I have benefited greatly from open-source tools, knowledge, and communities. I am happy to organize my own practice into an open-source project and give something back.

**Keywords:** Product Manager, Coding Agent, AI workflow, enterprise software, government software, prototype development, context governance, handoff, delivery.
