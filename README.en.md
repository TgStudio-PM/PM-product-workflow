# PM-product-workflow

[简体中文](README.md) | [English](README.en.md)

**A desktop web prototype development and continuous-iteration workflow for government and complex enterprise product managers, Coding Agents, and developers.**

Work from real requirement changes in the user's own prototype project: analyze impact, implement code changes, review business paths, and feed evidence-based facts, continuation notes, and needed handoff material back into the workflow. Codex is one verified reference tool; the method is not tied to a specific Coding Agent, framework, or design system.

> Repository is memory. Conversation is working context.

## Start an iteration

Begin with the [prototype iteration and continuation guide](docs/product/PROTOTYPE_ITERATION.md) and the [product workflow entry](docs/product/README.md). Provide the current requirement in your own prototype project, follow that project's existing context entry, then:

```text
Requirement and impact → Prototype code development/iteration → Business-path review
                       → Minimal fact and version sync → Continuation or handoff → Developer feedback
```

For an existing prototype, reuse its stack, design constraints, components, and structure. When starting an initial prototype from clear requirements, first confirm users, roles and workflows, design constraints, and technical stack. Mark important gaps as pending. This project provides a workflow; it does not deliver a general-purpose application scaffold.

## Workflow resources

- **Methods**: [iteration and continuation guide](docs/product/PROTOTYPE_ITERATION.md), [Skills guide](docs/product/USING_SKILLS.md), and [on-demand packaging guide](docs/product/PACKAGING.md).
- **Three existing Skills**: `pm-prototype-memory` maintains facts and changes; `pm-prototype-handover` supports session continuation; `pm-prototype-packager` prepares allowlisted delivery packages for an actual need.
- **Project and module templates**: `templates/project/` and `templates/module/`; copy only what is needed and follow the project's existing structure.
- **Optional design profile**: [`gov-enterprise-cn`](profiles/gov-enterprise-cn/PROFILE.md), to be used with project-confirmed standards and rules.
- **Three delivery-profile templates**: `templates/package-profiles/`; copy them into your project and customize them from actual files and evidence before packaging.

## Product and contribution entry

For your own project, start with the [product workflow guide](docs/product/README.md); you do not need the repository maintenance files. To contribute here, read the [repository maintenance entry](AGENTS.md) and [contribution guide](CONTRIBUTING.md).

Keep authorized private materials in your own workspace. See the [open-source boundary](maintainers/OPEN_SOURCE_BOUNDARY.md).

Original content is licensed under the [MIT License](LICENSE). Third-party dependencies and assets remain subject to their respective licenses.

## About

Tg Studio is a product manager's open-source project. It distills recurring problems, validated practices, and reusable outcomes from day-to-day product work into a public workflow, without exposing real project materials.

From university through my professional career and continued AI learning, I have benefited greatly from open-source tools, knowledge, and communities. I am happy to organize my own practice into an open-source project and give something back.

**Keywords:** Product Manager, Coding Agent, enterprise software, government software, prototype development, handoff, delivery.