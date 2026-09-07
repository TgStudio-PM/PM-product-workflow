# gov-enterprise-cn

Default design and review profile for Chinese government and complex enterprise web management systems.

## Priorities

1. Correct business terminology and state meaning.
2. Clear role boundaries, permissions, and prohibited actions.
3. Traceable operations, results, and exception handling.
4. Efficient tables, filters, forms, material lists, and batch actions.
5. Consistency with the host project's existing design system and component library.

## Interaction guidance

- Keep query fields, list columns, details, and exports consistent where they represent the same concept.
- Make status, required action, responsible role, and next step visible together.
- Enforce prohibited actions through controls and business logic, not warning copy alone.
- Use confirmation for destructive or hard-to-reverse actions and show the concrete impact.
- Preserve search conditions and work context when users return from details or complete a subtask.
- Prefer readable information density over decorative whitespace in frequent administrative work.

## Review classification

- Business error: conflicts with confirmed terminology, rules, roles, or flows.
- Profile violation: conflicts with a rule in this profile or a project override.
- Design suggestion: an optional improvement that needs product judgment.

## Project adaptation

This profile does not replace an existing platform standard. Record project-specific overrides in `DESIGN_PROFILE.md` and cite their evidence.
