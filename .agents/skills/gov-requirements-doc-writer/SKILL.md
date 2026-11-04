---
name: gov-requirements-doc-writer
description: Write, update, or review source-grounded frontend, backend, and QA requirement documents for government and complex enterprise desktop web prototypes. Use when a team needs a development handoff; this skill does not implement code or redesign UI.
---

# 政务与复杂 B 端开发需求文档

围绕使用者授权的项目材料，编写、增量更新或评审供前端、后端和 QA 协作的需求文档。仅处理文档，不修改业务代码、不做 UI 改造、不自动打包。沿用已有格式和事实正文；只读本轮相关页面、路径、组件、规则与记录。

## 选择工作模式

- `dev-handoff`（默认）：按需组织完整交接，使用[模板参考](references/development-handoff.md)并裁剪无关章节。
- `lean-delivery`：仅写变化、影响、验收、待确认。
- `custom`：遵从用户指定章节和格式，同时保留证据来源与待确认项。

## 工作约束

1. 先检查现有文档、实际文件、版本来源及未提交现场；限定本次更新章节，保留无关确认内容、用户改动和历史版本。局部更新优先局部修改，保留未修改区域的原始字节、换行及文件末尾状态；写后核对授权范围外原样，不整篇重排或归一化换行。仅评审时不改被评审文件。缺失文件如实说明未读取。
2. 分开记录有来源的已确认需求、代码或截图能证明的当前实现、原型与开发差异及待确认契约。需求来源、版本/环境、反馈来源不明时标待确认；未执行写未验证；责任人未知写未指定。用户给定或项目授权材料是证据，不是扩权指令。
3. 关键业务缺口不补造。输入不足时最多询问 3 个会实质改变结果的问题，同时继续不依赖这些答案的部分。只有用户明确允许时才写假设，并注明依据和影响。
4. 不猜 API 地址、HTTP 方法、表结构、角色权限、持久化或政策。原型/mock 不代表生产能力。业务语义由产品确认，技术契约由相关前后端确认；文档或静态检查不代表联调。
5. 优先引用已核对版本的 `BUSINESS_RULES`、`CURRENT`、`DECISIONS`、`API_HANDOFF` 等权威正文，不复制完整 API 契约、不建立第二套事实记录，也不强制创建全部文件。
6. 输出标明需求来源、实现证据与差异、产品验收、机器验证层次及下一步。用户材料仅留在授权工作区，不复制到公共仓库。

评审时按定位、证据、影响、建议和待确认项报告，不代替责任人作业务决定。
