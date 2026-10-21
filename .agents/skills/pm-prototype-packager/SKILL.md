---
name: pm-prototype-packager
description: Prepare and verify a product prototype delivery for static preview, frontend source, or backend requirement review. Use when a user needs a scoped handoff package; keep packaging separate from prototype memory and task handover.
---

# Prototype Packager

Create a delivery that matches what the recipient needs. Use an explicit allowlist profile and keep package structure checks, engineering/runtime checks, and product acceptance as separate results.

## Workflow

1. Confirm the recipient and purpose: choose `static-preview`, `frontend-source`, or `backend-requirements`. They may be prepared separately when recipients need different materials. Read [the packaging guide](../../../docs/product/PACKAGING.md) and inspect the matching example profile under `../../../examples/package-profiles/`. Treat examples as schemas and fictional samples; adapt the allowlist to the user's project and its confirmed delivery needs.
2. Inspect the actual project tree and authoritative requirements. Use project-relative paths in the profile. Include only files required for that delivery, verify each required path and entry, and keep output outside the source tree. Never copy real project material into this public repository or its examples. Do not treat this repository's public-content scanner as acceptance for a user's project.
3. Build and integrity-check the archive with this Skill's `scripts/package.py`, using the selected source root, profile, and an output path outside the source. Review the generated README, manifest, SHA256 list, and archive contents against the allowlist. Resolve missing files, forbidden content, or broken local references before handoff.
4. Perform the checks appropriate to the delivery:
   - **Static preview:** extract the archive, open its entry in the recipient's target browser using `file://`, and exercise the agreed core flow. A structural scan is heuristic; it cannot prove arbitrary JavaScript is offline. Report exactly which browser and flow were checked.
   - **Frontend source:** use a clean extracted copy; inspect its documented install and build commands, install from the lockfile, then run available type checks and build/preview verification. Report runtime or browser checks separately. A successful build does not establish that product behavior is correct.
   - **Backend requirements:** check that facts, fields, flow, and unresolved questions are understandable and traceable to project evidence. Have product and relevant frontend/backend collaborators confirm the contract. Mark unknown API paths, methods, permissions, persistence, and error semantics as **待确认**; never present mock data or UI behavior as a production API.
5. Compare the final archive with the profile and report excluded items or limitations. If a check cannot be performed in the available environment, mark it **未运行** and name the needed environment or reviewer. Do not silently substitute one validation layer for another.

## Boundaries

- Use only confirmed project materials the user is authorized to share with the named recipient. Keep private source, screenshots, business rules, data, and credentials out of this public repository.
- Static preview packaging may reject common network APIs or module loading, but cannot prove arbitrary JavaScript has no network behavior. Browser testing is required for `file://` claims.
- A mock, successful archive check, or successful build does not prove a production service, backend contract, persistence, access control, or policy.
- This Skill prepares delivery packages. Use the project-memory workflow for durable product facts and the handover workflow for continuing a task; do not duplicate those records here.

## Report

Return the delivery kind and recipient, profile and source paths, output archive path, included/excluded scope, archive integrity and SHA256 result, engineering/runtime checks, product acceptance and target browser where relevant, unresolved items, and known limitations. Keep structure verification, runtime verification, and product/contract acceptance distinct.
