---
name: pm-prototype-handover
description: Prepare and resume a task handover for a user's own product prototype across Coding Agent sessions. Use when asked to hand over, continue in a new session, or resume prototype work from a handover. Covers task evidence, current baseline, validation, open questions, and the next step; it does not maintain project memory or package deliverables.
---

# Prototype Handover

Create a concise, evidence-backed handover that lets another Coding Agent continue a user's prototype task from project files and the handover itself. The handover is a task index and continuation point, not a replacement for project or module facts. Keep this workflow separate from maintenance handoffs for this public repository.

## Prepare a handover

1. Identify the user's project and affected module from the current request and accessible files. Read only relevant project context, module `CURRENT`, business rules, page flow, decisions, and error records. Inspect the affected source and current task changes when they establish implementation or validation state. Do not claim to have read unavailable files or prior conversations.
2. Establish evidence for the handover. Use project decisions, user-provided confirmation, and project facts for approved requirements; use source files and observed behavior only for **当前实现**. Record unsupported or conflicting items as **待确认** and name the evidence that is missing or differs. Never infer a product requirement from code, or invent policies, APIs, permissions, persistence, or production behavior.
3. State the task's goal and scope, the actual baseline, completed work, product acceptance, machine verification, unresolved work, and a concrete next step. Distinguish product acceptance from automated checks and say what each check did not establish. Include failed approaches only when they should not be repeated, with enough detail to identify the failure; do not turn an unverified theory into a root cause.
4. Save the handover in the user's project at an appropriate, discoverable project or module location. Declare one project-root path basis in the handover and enough workspace-relative context to locate that root. Write complete relative paths from the declared basis; do not omit directory prefixes or mix unexplained bases. Markdown links are resolved from the handover file's own directory, so check that each linked target exists relative to that location. Follow existing project conventions when available. Summarize only the context needed to resume. Keep a short task short. Add sections only when the task's complexity or risks need them. Do not copy full business rules or long history into the handover.
5. Before finishing, resolve plain-text paths from the declared basis and check Markdown link targets from the handover file's directory. Check every path and claim against the current files and report the handover location, its evidence basis, remaining questions, and the next action. Do not modify unrelated modules or perform packaging as part of handover.

## Resume from a handover

Treat a handover as a lead, not proof that the workspace is unchanged. First read its declared project-root path basis and resolve its relative paths from that basis; resolve Markdown link targets from the handover file's directory. Inspect the actual working tree and relevant files, and check the applicable branch or remote state when available. If the basis is missing, a path is absent, or the path conflicts with the actual tree, record the ambiguity as **待确认** and inspect the tree for candidates. Do not silently guess a prefix or use a guessed path to overwrite facts. Reconcile the handover with current project/module facts, decisions, source, and task evidence before acting. If they conflict, preserve the discrepancy as **待确认** and follow the project's authority rules; do not blindly repeat a recorded next step. Never use or claim access to an earlier chat unless it is actually available in the current context.

## Handover block

Use this compact structure and omit inapplicable detail. Use relative links to the user's project files.

```markdown
## 接续交接

- 目标与范围：
- 路径基准：项目根目录（注明在当前工作区中的定位方式）；相关普通路径均相对此基准填写完整路径。
- 基线：分支/提交或实际核对的文件状态；注明尚未核实的部分。
- 已完成：
- 验证：产品验收；机器验证；各自未覆盖的内容。
- 待确认 / 未完成：
- 下一步：一个可执行的动作及其前置条件。
- 不要重复：已证实无效的方案、失败表现和证据；没有则写“无已确认项”。
- 相关路径：项目/模块事实、决策、源码、错误记录和验证产物；Markdown 链接相对本交接文件位置编写。
```

Do not fill gaps with guesses. If the baseline, acceptance, or cause of a failure cannot be verified, label it **待确认** and state what should be checked next. Keep private project content in the user's project; never copy it into this public Skill or an unrelated repository.
