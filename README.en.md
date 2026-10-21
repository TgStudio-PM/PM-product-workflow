# PM-product-workflow

[简体中文](README.md) | [English](README.en.md)

**A Coding Agent workflow for product managers building government and complex enterprise products, covering prototype iteration, context governance, and delivery.**

PM-product-workflow keeps requirements, business rules, prototypes, reviews, validation, and handoffs in the project repository, so product managers and developers can maintain one consistent source of truth across multiple Coding Agent sessions.

> Repository is memory. Conversation is working context.

## Choose your path

### Use the product workflow

If you want to apply this workflow to your own product project, begin with the [product workflow guide](docs/product/README.md), see [how to use the Skills](docs/product/USING_SKILLS.md), copy the files under `templates/`, and select a design profile from `profiles/`.

Product users do not need to read the root `AGENTS.md` or `maintainers/` directory. Those files govern this public repository itself.

### Contribute to this repository

If you want to modify PM-product-workflow, read the [repository maintenance entry](AGENTS.md) and [contribution guide](CONTRIBUTING.md) first. Repository status, boundaries, risk levels, decisions, and checks live under `maintainers/`.

## Who it is for

- Product managers who use Coding Agents to analyze requirements, design business flows, and build prototypes.
- Developers who collaborate with product managers on rules, prototypes, and delivery artifacts.
- Long-running projects affected by lost context, rule drift, repeated work, or unclear delivery boundaries.

The core method can be adapted to other products, while the first release primarily maintains:

```text
gov-enterprise-cn
Government and complex enterprise web management systems
```

This profile focuses on search and ledger pages, complex forms, material submission, batch operations, multi-role collaboration, status transitions, error prevention, and traceability. Codex is the first reference implementation, but the public method is not tied to a specific Coding Agent, frontend framework, or design system.

## Workflow

```text
Understand evidence → Confirm rules → Implement prototype → Review and revise
                    → Sync facts → Validate → Deliver → Continue in a new session
```

At the end of each iteration, the project repository should answer:

1. What changed?
2. Which pages and business rules were affected?
3. What has been validated, and what remains pending?
4. Where should the next Coding Agent session continue?

## Current contents

| Capability | Status | Location |
| --- | --- | --- |
| Project and module fact templates | Available, Chinese-first | `templates/project/` and `templates/module/` |
| Optional government and complex enterprise web profile | Available and evolving; projects may override it | `profiles/gov-enterprise-cn/`, `templates/project/DESIGN_PROFILE.md` |
| Page review template | Available; non-compliance findings require authoritative project-provided criteria | `profiles/gov-enterprise-cn/REVIEW_TEMPLATE.md` |
| Fictional page review example | Available; see the example file | `examples/material-submission/reviews/gov-enterprise-cn.md` |
| Product method and quick start | Available | `docs/product/` |
| `pm-prototype-memory` Skill | Delivered | `.agents/skills/pm-prototype-memory/SKILL.md` |
| Fictional material-submission example | Three iterations documented; iteration three is a simulated interruption and fact-reconciliation exercise that changes no page or business rule | `examples/material-submission/` |
| Tg Studio Vue prototype starter | Delivered; optional to use | `starters/vue-prototype/` |
| `pm-prototype-handover` Skill | Delivered | `.agents/skills/pm-prototype-handover/SKILL.md` |
| Three delivery profiles and guide | Delivered | `examples/package-profiles/`, `docs/product/PACKAGING.md` |
| `pm-prototype-packager` Skill | Delivered | `.agents/skills/pm-prototype-packager/SKILL.md` |

Core Skills:

- `pm-prototype-memory` (delivered): maintains facts, changes, conflicts, and error history.
- `pm-prototype-handover` (delivered): creates concise continuation notes or complete handoff material.
- `pm-prototype-packager` (delivered): prepares allowlisted static preview, frontend source, and backend requirements packages with distinct acceptance boundaries.

### Optional Vue starter

If you want to start from a Vue project structure, see the [Tg Studio Vue prototype starter](starters/vue-prototype/README.md). It demonstrates page registration, a copyable page template, mock data, shared components, frontend/backend handoff notes, and static preview packaging with Vue 3 + Vite. This is an optional engineering starter; the product workflow and other templates do not depend on Vue.

The starter is delivered and optional. The target time for adding a simple page has not been measured by a non-developer product manager; `file://` behavior should still be checked in each target browser. Its material-submission case is fully fictional and provides no real API, authentication, file upload, or production processing.

### Prototype delivery packages

Choose a static preview, frontend source, or backend requirements package before selecting files. See the [Chinese packaging guide](docs/product/PACKAGING.md) and [three fictional profile examples](examples/package-profiles/). The `pm-prototype-packager` Skill is delivered and guides package selection, evidence checks, and production-interface boundaries.

## Repository structure

```text
docs/product/                  Product usage guide
templates/                     Project and module templates
profiles/                      Selectable and extensible design profiles
.agents/skills/                Published product Skills
examples/                      Fully fictional runnable examples

AGENTS.md                      Repository maintenance entry
maintainers/                   Repository governance, status, and checks
.github/                       Issue, pull request, and CI configuration
```

`.agents/skills/` and `examples/` are added only when working content is ready. Empty directories are not used to imply unfinished capabilities are available.

## Open-source boundary

This repository accepts only original, fully fictional content whose ownership and publication rights have been checked. Real project code, screenshots, business materials, personal data, production endpoints, credentials, local paths, conversation history, and third-party assets with unclear licenses must not enter the repository. Renaming real content does not make it safe to publish.

See the complete [open-source boundary](maintainers/OPEN_SOURCE_BOUNDARY.md). Product users can apply the same principle when defining publication or delivery boundaries for their own projects.

## Roadmap

- [x] Establish the README, publication boundary, and base templates.
- [x] Establish durable governance, tiered maintenance, and continuation rules.
- [x] Separate the product entry from repository self-management.
- [x] Publish `pm-prototype-memory` and three offline fictional material-submission iterations (the third is a simulated continuation exercise).
- [x] Deliver the optional Tg Studio Vue prototype starter.
- [x] Deliver `pm-prototype-handover`.
- [x] Deliver three fictional delivery profiles, the packaging guide, and `pm-prototype-packager`.
- [ ] Complete the `gov-enterprise-cn` profile and v0.1 acceptance.

See the [October 21, 2026 v0.1 product acceptance](maintainers/acceptance/2026-10-21-v01-product-audit.md) for the blank-context review. Browser execution and testing by a non-developer product manager remain pending; v0.1 has not been formally released.

## Contributing and license

Contributions to templates, fully fictional examples, validation rules, and new profiles are welcome. Read the [contribution guide](CONTRIBUTING.md) before opening a pull request.

Original content is licensed under the [MIT License](LICENSE). Third-party dependencies and assets remain subject to their respective licenses.

## About

I am a product manager. This project distills recurring problems, validated practices, and reusable outcomes from my day-to-day work into a public workflow, without exposing real project materials.

From university through my professional career and continued AI learning, I have benefited greatly from open-source tools, knowledge, and communities. I am happy to organize my own practice into an open-source project and give something back.

**Keywords:** Product Manager, Coding Agent, AI workflow, enterprise software, government software, prototype development, context governance, handoff, delivery.
