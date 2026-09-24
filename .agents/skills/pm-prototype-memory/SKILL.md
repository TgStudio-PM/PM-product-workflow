---
name: pm-prototype-memory
description: Maintain evidence-backed project and module facts for Coding Agent prototype work. Use when starting or changing a prototype task, reconciling confirmed rules with current implementation, or checking whether pages, code, and project records have drifted. Does not cover handover or delivery packaging.
---

# Prototype Memory

Use repository facts to continue prototype work without treating conversation history as the durable source. Keep product requirements, current implementation, and unresolved questions distinct.

## Workflow

1. Read the project context and module registry first. Select only the module facts relevant to the task: current state, business rules, page flow, decisions, and error ledger when one exists. Read source pages or code when the task depends on current behavior.
2. Mark information as **已确认**, **待确认**, or **当前实现**. A page or code proves what currently happens; it does not prove that behavior is an approved business rule. Cite the repository file or user-provided evidence for confirmed facts. Never fill gaps with invented policy, role, permission, API, data, or production behavior.
3. Before changing a prototype, identify the affected facts. When a confirmed rule, page flow, decision, or current baseline changes, update its authoritative record in the same task. Keep the project registry and module state concise; link to detailed rules rather than copying them.
4. Before finishing, compare the changed page and code with the applicable facts. Check that labels, required fields, validation, states, available actions, and next steps agree. Report any unresolved discrepancy as **待确认** with its evidence; do not silently choose code or documentation as authoritative.
5. Record only material recurring or delivery-affecting errors in the project error ledger. After two equivalent failed attempts, stop repeating them, preserve the reproducible evidence, and test one specific root-cause hypothesis at a time.

## Conflict and evidence

- Higher-level project decisions and confirmed rules are not silently overridden by lower-level task notes or implementation.
- If evidence conflicts, describe each source and the difference, then seek the decision needed to resolve it. Continue only work that does not depend on that decision.
- Use relative repository paths in records. Do not claim to have read unavailable conversations or files.
- For static prototypes, describe only local interaction that has been implemented and verified; do not imply a real backend, persistent service, upload, permission system, or production process.

## Expected result

Leave the relevant project/module records consistent with the completed change. Report what changed, which evidence was checked, product acceptance and machine verification separately, and the next concrete step. This skill covers project memory and drift checks only; use another workflow if the task is specifically about preparing a handover or packaging a deliverable.
