# PM-product-workflow

[简体中文](README.md) | [English](README.en.md)

**A Coding Agent workflow for product managers building government and complex enterprise products, covering prototype iteration, context governance, and delivery.**

PM-product-workflow keeps requirements, business rules, prototypes, reviews, validation, and handoffs in the project repository, so product managers and developers can maintain one consistent source of truth across multiple Coding Agent sessions.

> Repository is memory. Conversation is working context.

## Choose your path

### Use the product workflow

If you want to apply this workflow to your own product project, begin with the [product workflow guide](docs/product/README.md), copy the files under `templates/`, and select a design profile from `profiles/`.

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
| Project and module fact templates | Available | `templates/project/` and `templates/module/` |
| Government and complex enterprise design profile | Available and evolving | `profiles/gov-enterprise-cn/` |
| Product method and quick start | Available | `docs/product/` |
| Three core Skills | Planned | `.agents/skills/` after implementation |
| Three-iteration fictional example | Planned | `examples/material-submission/` after implementation |

Planned core Skills:

- `pm-prototype-memory`: maintains facts, changes, conflicts, and error history.
- `pm-prototype-handover`: creates concise continuation notes or complete handoff material.
- `pm-prototype-packager`: validates and prepares independently runnable prototype delivery packages.

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
- [ ] Publish `pm-prototype-memory`.
- [ ] Publish `pm-prototype-handover`.
- [ ] Publish `pm-prototype-packager`.
- [ ] Complete a runnable fictional example with three iterations.
- [ ] Complete the `gov-enterprise-cn` profile and v0.1 acceptance.

## Contributing and license

Contributions to templates, fully fictional examples, validation rules, and new profiles are welcome. Read the [contribution guide](CONTRIBUTING.md) before opening a pull request.

Original content is licensed under the [MIT License](LICENSE). Third-party dependencies and assets remain subject to their respective licenses.

## About

I am a product manager. This project distills recurring problems, validated practices, and reusable outcomes from my day-to-day work into a public workflow, without exposing real project materials.

From university through my professional career and continued AI learning, I have benefited greatly from open-source tools, knowledge, and communities. I am happy to organize my own practice into an open-source project and give something back.

**Keywords:** Product Manager, Coding Agent, AI workflow, enterprise software, government software, prototype development, context governance, handoff, delivery.
