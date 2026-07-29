# Matrix Web Repository Instructions

## 1. Workspace context

Matrix Web is the frontend application for the Matrix enterprise intelligent finance platform. It is developed together with the sibling backend repository `matrix`.

When a task involves development, bug fixing, feature work, API integration, permissions, finance workflows, or end-to-end behavior, consider both repositories:

- Frontend: `matrix-web`
- Backend: `matrix`

Local development currently uses:

- Frontend: `C:\Users\20602\IdeaProjects\matrix-web`
- Backend: `C:\Users\20602\IdeaProjects\matrix`

Use these paths only when they exist. Do not assume every AI agent or CI runner uses the same filesystem.

Routing rules:

1. Vue pages, components, routes, UI behavior, browser state, frontend API clients, and Vite configuration belong primarily to `matrix-web`.
2. Java services, Spring Boot, gateway, authentication, finance services, database behavior, and backend contracts belong primarily to `matrix`.
3. Login, permissions, vouchers, ledgers, reports, master data, AR/AP, and integration failures may require inspecting both repositories.
4. Do not invent frontend fields, statuses, or endpoint contracts when the backend implementation can be inspected.

## 2. Product positioning

Matrix Web is an enterprise financial application. Its interface should be professional, information-dense, stable, and suitable for long working sessions.

Avoid consumer-app decoration, oversized cards, unnecessary gradients, decorative animation, emoji as functional icons, and visual patterns that reduce information density without improving comprehension.

## 3. Technology baseline

- Vue 3.5
- Vite 6
- Vue Router 4
- Pinia 3
- Axios 1
- Sass
- Element Plus
- Vuetify

Do not silently upgrade dependencies or add another UI framework.

The codebase currently contains both Element Plus and Vuetify. For new work:

- Reuse the component system already used by the surrounding feature.
- Do not mix Element Plus and Vuetify inside one page unless an existing shared component requires it.
- Do not introduce a third component library.
- Prefer gradual convergence over broad visual rewrites.

## 4. Source responsibilities

- `src/views`: route-level pages and feature views.
- `src/components`: reusable components with clear contracts.
- `src/router`: route definitions, navigation guards, and route metadata.
- `src/stores`: shared application state only; avoid using stores as a replacement for local component state.
- `src/api` or existing request modules: backend API access.
- `src/utils`: framework-independent utilities and shared browser helpers.
- `src/assets`: static resources and shared visual assets.

Follow the current repository structure when a nearby feature already establishes a convention.

## 5. Mandatory Vue rules

- Use Vue 3 Composition API for new substantial components.
- Keep route pages focused on orchestration; extract reusable or complex sections into components.
- Do not duplicate request, formatting, or permission logic across pages.
- Use computed state for derived values instead of synchronizing duplicate state manually.
- Clean up timers, subscriptions, listeners, and in-flight work when appropriate.
- Do not mutate props.
- Use stable keys for lists; never use the array index when row identity exists.
- Keep page-specific state local unless multiple routes genuinely share it.
- Do not hide business-critical behavior inside visual components without an explicit component contract.

## 6. Enterprise UI requirements

Every data-oriented page must intentionally support the relevant states:

- Initial loading
- Background refresh
- Empty result
- Request failure
- Permission denied
- Partial data or unavailable fields
- Long text and large numeric values
- Slow or repeated user actions

Financial UI rules:

- Right-align monetary and quantity columns.
- Format monetary values consistently and preserve precision required by the API.
- Never use JavaScript floating-point arithmetic for authoritative financial calculations.
- Display organization, ledger, currency, and accounting period context prominently when they affect meaning.
- Clearly distinguish debit and credit.
- Do not rely on color alone to communicate status or risk.
- Require confirmation for destructive or irreversible financial actions.
- Preserve filters and pagination when returning from detail or edit pages where practical.
- Prevent duplicate submissions while write requests are pending.

## 7. Forms

- Define defaults intentionally; do not let `undefined`, empty string, and `null` become interchangeable by accident.
- Keep client-side rules aligned with backend validation.
- Do not claim success until the server confirms the write.
- Surface field-level validation when possible and preserve user input after recoverable failures.
- Disable or guard repeated submission.
- Distinguish create, edit, view, audit, and other workflow modes explicitly.
- Financial records must respect backend state restrictions; do not expose edit actions for immutable states.

## 8. Tables and reports

- Keep filters, pagination, sorting, and URL or navigation state coherent.
- Use backend pagination for potentially large datasets.
- Do not load entire financial datasets into the browser merely to paginate or aggregate locally.
- Use explicit empty, loading, and error presentations instead of blank tables.
- Right-align numbers and use consistent date, status, amount, and currency formatters.
- For reports, state the scope and avoid silently combining different currencies, organizations, ledgers, or periods.
- Export behavior must match current filters and scope.

## 9. API integration

- Reuse the repository's request abstraction and authentication handling.
- Do not call Axios directly from many components when a feature API module can centralize the contract.
- Treat backend DTOs and enums as the source of truth.
- Normalize response handling in the API layer, not repeatedly in templates.
- Handle unauthorized, forbidden, validation, conflict, and server errors deliberately.
- Cancel or ignore stale responses when rapid navigation or repeated searches can race.
- Never log tokens, credentials, personal information, or sensitive financial payloads.

Read `.agents/skills/matrix-api-integration/SKILL.md` before substantial API integration work.

## 10. Accessibility and interaction

- Interactive controls must be keyboard reachable.
- Inputs require associated labels or equivalent accessible names.
- Modal focus and close behavior must be predictable.
- Do not communicate state only through color.
- Maintain visible focus states.
- Use concise, actionable error messages.
- Avoid unexpected navigation or destructive actions without confirmation.

## 11. Skill routing

Read every applicable skill before implementation:

- General UI, layout, components, responsive behavior, design consistency:
  `.agents/skills/matrix-ui/SKILL.md`
- Search forms, data tables, pagination, sorting, exports:
  `.agents/skills/matrix-table-page/SKILL.md`
- Create/edit/view forms, validation, submit behavior:
  `.agents/skills/matrix-form-page/SKILL.md`
- Axios, endpoints, DTO mapping, auth, error handling, integration:
  `.agents/skills/matrix-api-integration/SKILL.md`
- Review, regression risk, accessibility, pre-merge checks:
  `.agents/skills/matrix-frontend-review/SKILL.md`

A task may require multiple skills. A voucher edit page, for example, normally requires UI, form-page, API-integration, and frontend-review skills.

## 12. Development workflow

1. Identify the route, feature, and neighboring implementation pattern.
2. Read applicable skills and references.
3. Confirm the backend contract for data, statuses, permissions, and errors.
4. Define loading, empty, error, permission, and success states.
5. Implement the smallest complete change.
6. Check keyboard behavior, responsive layout, and long-content behavior.
7. Run the production build.
8. Review API races, duplicate submission, permissions, financial presentation, and regression risks.
9. Report changed files, behavior, validation, and remaining risks.

## 13. Validation commands

```bash
npm install
npm run build
npm run dev
```

Use the repository's existing package manager and lockfile. Do not replace the lockfile or package manager without an explicit migration decision.

## 14. Definition of done

A frontend change is complete only when:

- The intended user flow works end to end.
- Loading, empty, error, and permission states are handled where relevant.
- Backend contracts and financial statuses are respected.
- Duplicate submission and stale-response risks have been considered.
- Layout, keyboard behavior, long text, and large values have been checked.
- The production build passes.
- No secret, token, sensitive payload, generated artifact, or unrelated dependency was introduced.
- The final report states what changed, how it was validated, and any remaining risks.
