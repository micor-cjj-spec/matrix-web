# Matrix Web AI Skills

This directory is the canonical project-level skill library for AI-assisted frontend development in `matrix-web`.

## Entry point

Read `/AGENTS.md` first. It contains repository-wide rules that always apply.

Then load every skill relevant to the task:

- `matrix-ui`: general visual system, layout, component and interaction work.
- `matrix-table-page`: data tables, search conditions, pagination, sorting and export.
- `matrix-form-page`: create, edit, view and workflow forms.
- `matrix-api-integration`: API modules, Axios, DTO mapping, auth and errors.
- `matrix-frontend-review`: review and pre-merge risk analysis.

A task may require several skills. For example, a new voucher maintenance page generally requires `matrix-ui`, `matrix-form-page`, `matrix-api-integration`, and `matrix-frontend-review`.

## Directory roles

Each skill directory may contain:

- `SKILL.md`: activation description, workflow and mandatory rules.
- `references/`: detailed guidance loaded only when needed.
- `assets/`: reusable checklists and templates.
- `scripts/`: deterministic validation or generation tools.

## Maintenance principles

- Keep repository-wide invariants in `/AGENTS.md`.
- Keep repeatable task workflows in skills.
- Keep detailed explanations in `references/`.
- Keep templates and checklists in `assets/`.
- Do not duplicate the same rule across many files unless a short reminder is necessary for safety.
- Update these instructions when the actual project architecture or UI conventions change.
