# PM-product-workflow

[简体中文](README.md) | [English](README.en.md)

**面向政务与复杂 B 端产品经理的桌面 Web 原型需求迭代与接续工作流。**

**A desktop web prototype requirement-iteration and handoff workflow for government and complex enterprise product managers using Coding Agents.**

它帮助产品经理与 Coding Agent 围绕需求变化，在现有原型中分析影响、落实改动、验收业务路径、同步有证据的事实，并按接收方交接。手机适配可按项目需要处理，不是首要目标。

> Repository is memory. Conversation is working context.  
> 仓库保存经过确认的项目事实，对话承载当前工作上下文。

## 开始产品工作流

优先阅读[原型需求迭代与接续指南](docs/product/PROTOTYPE_ITERATION.md)，再从[产品工作流入口](docs/product/README.md)选择事实模板、已有 Skills 和按需交付说明。核心链是：

```text
需求变化 → 澄清与影响面 → 复用既有框架修改 → 业务路径验收
         → 同步已确认事实/版本差异 → 按接收方交接 → 开发反馈回流
```

导航不是需求全集；需求、原型表现和实现说明分别记录。未知来源或版本标为待确认，不从代码推断已确认需求或生产能力。Codex 是首版参考实现，方法保持 Coding Agent 中立。

### 参与试用 / Try it

主要试用任务是由产品经理完成一次需求迭代与接续；AI 可以协助，参与者本人判断结果。查看[外部试用手册](docs/product/EXTERNAL_TRIAL.md)，用[反馈模板](docs/product/TRIAL_REPORT_TEMPLATE.md)记录实际执行、未执行和受阻步骤。基础浏览、AI-only 和工程试用是辅助观察，不能替代目标 PM 人测。

## 选择入口 / Choose your path

### 使用产品工作流

如果你要在自己的项目中迭代桌面 Web 业务原型，从[主指南](docs/product/PROTOTYPE_ITERATION.md)和[产品工作流入口](docs/product/README.md)开始；需要时复制 `templates/`、按任务选择现有 Skills，并从 `profiles/` 选择设计预设。真实授权资料保留在你自己的工作区，不复制到本公开仓库。

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

## 产品状态与范围

首版面向政务与复杂 B 端产品经理，重点是桌面 Web 管理原型；手机不是主目标。Tg Studio 是本仓库示例身份，Vue starter 与完全虚构的材料申报案例是可选辅助，不代表实际项目交付质量。页面导航也不代表全部需求。

## 当前内容

| 能力 | 状态 | 位置 |
| --- | --- | --- |
| 项目与模块事实模板 | 可用，中文优先 | `templates/project/`、`templates/module/` |
| 政务与复杂 B 端 Web 可选预设 | 可用，持续完善；可由项目设计配置覆盖 | `profiles/gov-enterprise-cn/`、`templates/project/DESIGN_PROFILE.md` |
| 页面评审模板 | 可用；平台不合规判断需项目提供权威条款 | `profiles/gov-enterprise-cn/REVIEW_TEMPLATE.md` |
| 虚构页面评审示例 | 可用，内容见示例文件 | `examples/material-submission/reviews/gov-enterprise-cn.md` |
| 产品方法与迭代主指南 | 指南已提供；完整目标 PM 主任务人测待完成 | `docs/product/PROTOTYPE_ITERATION.md`、`docs/product/README.md` |
| `pm-prototype-memory` Skill | 已交付 | `.agents/skills/pm-prototype-memory/SKILL.md` |
| 材料申报虚构案例 | 四轮记录已提供：前两轮迭代页面规则，第三轮演练中断接续，第四轮修复无效本地提交状态恢复 | `examples/material-submission/` |
| Tg Studio Vue 原型工程模板 | 已交付，可选使用 | `starters/vue-prototype/` |
| `pm-prototype-handover` Skill | 已交付 | `.agents/skills/pm-prototype-handover/SKILL.md` |
| 三类交付 Profile 与使用说明 | 已交付 | `examples/package-profiles/`、`docs/product/PACKAGING.md` |
| `pm-prototype-packager` Skill | 已交付 | `.agents/skills/pm-prototype-packager/SKILL.md` |

核心 Skills：

- `pm-prototype-memory`（已交付）：维护事实、变更、冲突和错误闭环。
- `pm-prototype-handover`（已交付）：生成短接续或完整交接材料。
- `pm-prototype-packager`（已交付）：按静态预览、前端源码和后端需求材料准备白名单交付包，并分别说明验收边界。

### 可选 Vue 工程模板

如果你希望从现成的 Vue 工程结构开始，可以查看[Tg Studio Vue 原型工程模板](starters/vue-prototype/README.md)。它用 Vue 3 + Vite 展示页面注册、页面模板、mock 数据、共享组件、前后端交接和静态预览打包。Vue 模板是可选的工程实现；上面的产品工作流和其他模板不依赖 Vue。

模板已交付，可按需使用。新增简单页面的目标用时尚未经过非开发产品经理计时验收；`file://` 行为仍应在实际目标浏览器中验证。案例为完全虚构的 Tg Studio 材料申报演示，不提供真实 API、身份认证、文件上传或生产办理能力。

### 原型交付包

交付前先选择静态预览、前端源码或后端需求材料，并按对应白名单准备文件。查看[中文交付说明](docs/product/PACKAGING.md)和[三类虚构 profile 样例](examples/package-profiles/)。`pm-prototype-packager` Skill 已交付，可指导按用途选包、检查证据并遵守生产接口边界。

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
- [x] 发布 `pm-prototype-memory` 与材料申报四轮离线虚构案例（第三轮为模拟接续练习，第四轮修复异常状态恢复）
- [x] 交付可选的 Tg Studio Vue 原型工程模板
- [x] 交付 `pm-prototype-handover`
- [x] 交付三类虚构交付 Profile、使用说明与 `pm-prototype-packager`
- [x] 提供围绕需求迭代、事实同步和接续的产品主指南
- [ ] 完善 `gov-enterprise-cn` Profile 并完成 v0.1 验收

PR141 原生案例的 Chrome 155、Edge 155 本地 HTTP 恢复、政务蓝与窄屏复验已通过；验收范围和限制见[错误记录 ERR-20261028-004](maintainers/errors/ERR-20261028-004.md)。HTTP 结果不代表 `file://` 离线交互已通过。Chrome、Edge 历史 `file://` 验收适用于[2026-10-21 产品验收记录](maintainers/acceptance/2026-10-21-v01-product-audit.md)所述当时重建的静态包；最新原生案例和蓝色 Vue 页面仍待目标环境 `file://` 验证。

独立非开发产品经理完成一次完整需求迭代与接续主任务的人测仍待完成。新增简单页面的五分钟目标是可选工程效率观察，尚无目标 PM 计时验收证据。真实接口与生产行为未确认；本仓库不声称生产对接能力。项目尚未正式发布 v0.1。

## 贡献与许可

欢迎提交模板改进、完全虚构的案例、验证规则和新的 Profile。贡献前请阅读[贡献指南](CONTRIBUTING.md)。

原创内容采用 [MIT License](LICENSE)。第三方依赖和资产遵循各自许可证。

## 关于 / About

我是产品经理。这个项目来自我对实际工作和项目中反复遇到的问题、验证过的方法与可复用成果的持续总结。公开内容只保留通用工作流、模板和经验，不包含任何真实项目材料。

从大学学习、参加工作，到持续学习和使用 AI 的这段时间，我从开源社区获得了许多工具、知识和启发。如今我很高兴能把自己的实践整理成一个开源项目，为社区贡献一份力量。

I am a product manager. This project distills recurring problems, validated practices, and reusable outcomes from my day-to-day work into a public workflow, without exposing real project materials.

From university through my professional career and continued AI learning, I have benefited greatly from open-source tools, knowledge, and communities. I am happy to organize my own practice into an open-source project and give something back.

**Keywords:** Product Manager, Coding Agent, AI workflow, enterprise software, government software, prototype development, context governance, handoff, delivery.
