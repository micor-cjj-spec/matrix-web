# Frontend Agent Validation Workflow

Use these checks after AI-assisted Matrix Web changes.

## Skill structure

```bash
python .agents/scripts/validate_skills.py
```

Validates every project Skill and its required frontmatter.

## Sensitive logging and literals

```bash
node .agents/skills/matrix-frontend-review/scripts/scan-sensitive-logs.mjs src/path/to/changed.vue
```

With no explicit path, the script checks changed and untracked frontend files detected by Git. It rejects likely token/password logging and hard-coded bearer credentials, and warns about general `console.log` statements.

## Reusable assets

- Element Plus table page:
  `.agents/skills/matrix-table-page/assets/element-plus-table-page-template.vue`
- Vuetify table page:
  `.agents/skills/matrix-table-page/assets/vuetify-table-page-template.vue`
- Element Plus form page:
  `.agents/skills/matrix-form-page/assets/element-plus-form-page-template.vue`
- Vuetify form page:
  `.agents/skills/matrix-form-page/assets/vuetify-form-page-template.vue`
- API contract checklist:
  `.agents/skills/matrix-api-integration/assets/api-contract-checklist.md`

Copy the asset that matches the surrounding feature and replace every `TODO(matrix)` placeholder. Do not mix component libraries in one page without an explicit migration decision.

## Required runtime validation

```bash
npm run build
```

Then perform browser smoke tests for loading, success, empty, error, permission, duplicate-submit, and narrow-width behavior.

These checks supplement review and browser testing; they do not prove business correctness.