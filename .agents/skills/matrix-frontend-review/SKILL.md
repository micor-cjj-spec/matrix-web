---
name: matrix-frontend-review
description: Review Matrix Web changes for correctness and release risk. Use for pull request review, regression analysis, pre-merge validation, accessibility review, API-contract review, financial UI review, performance checks, or AI-generated frontend code inspection.
metadata:
  author: micor
  version: "1.0.0"
---

# Matrix Frontend Review

## Objective

Identify concrete correctness, workflow, integration, accessibility, security, and maintainability risks before frontend changes are merged or released.

## Review posture

Prioritize defects and user impact over stylistic preference.

Do not report hypothetical concerns without connecting them to a specific code path, state, contract, or user flow.

## Required context

Before reviewing:

1. Read `/AGENTS.md`.
2. Read applicable implementation skills.
3. Understand the user flow and backend contract.
4. Inspect the full changed component or module, not only isolated diff lines when context matters.
5. Identify affected routes, permissions, statuses, APIs, and shared components.
6. Use `assets/review-checklist.md` for a pre-merge pass.

## Severity levels

### Critical

Likely to cause severe financial corruption, credential exposure, broad unauthorized access, irreversible user harm, or a production-blocking failure.

### High

Likely to break a primary workflow, allow an invalid financial action, lose user data, create duplicate writes, expose sensitive data, or present materially wrong financial information.

### Medium

Produces incorrect behavior in realistic conditions, weak error recovery, stale data, accessibility barriers, significant regression risk, or material maintainability problems.

### Low

Localized quality issue with limited user impact. Do not inflate stylistic preferences into defects.

## Review dimensions

### 1. Functional correctness

Check:

- Route and component behavior.
- Create, edit, view, and workflow modes.
- Loading, empty, error, permission, and success states.
- Field defaults and value normalization.
- Navigation after successful and failed actions.
- State cleanup when components unmount or routes change.

### 2. Financial correctness

Check:

- Amount, rate, quantity, percentage, debit, and credit presentation.
- Currency and accounting-period scope.
- Status-dependent action availability.
- Disabled editing for immutable records.
- Destructive-action confirmation.
- No authoritative financial calculations using JavaScript floating point.
- No misleading totals created from only the visible page.

### 3. API contract

Check:

- Endpoint, method, parameter, and body shape.
- Response envelope and DTO mapping.
- Enum, date, decimal, and pagination serialization.
- Unauthorized, forbidden, validation, conflict, and server-error handling.
- Request cancellation or stale-response protection.
- Duplicate-write prevention.
- Uncertain write outcomes after timeout.

### 4. State management

Check:

- Derived state is computed rather than duplicated.
- Props are not mutated.
- Store usage is justified by cross-route sharing.
- Watchers do not create loops or hidden synchronization.
- List and line-entry items use stable keys.
- Dirty-state logic distinguishes initialization from user edits.

### 5. UI consistency

Check:

- The surrounding component library is reused.
- Element Plus and Vuetify are not mixed unnecessarily in one page.
- Similar pages use consistent spacing, hierarchy, actions, and statuses.
- Long text, large values, and wide tables are handled.
- Empty and failed states are not blank.

### 6. Accessibility

Check:

- Keyboard access.
- Accessible labels and names.
- Visible focus.
- Modal focus and close behavior.
- Status is not communicated only through color.
- Icon-only controls have labels.
- Errors are associated with the relevant field or action.

### 7. Security and privacy

Check:

- Tokens are not logged or persisted insecurely.
- Sensitive financial or personal payloads are not exposed in console output or errors.
- Model-generated content is not rendered as trusted HTML.
- Permission checks are not assumed solely from hidden buttons.
- File downloads and URLs do not leak credentials.

### 8. Performance

Check:

- Large datasets use backend pagination.
- Repeated rendering and watchers are reasonable.
- Search requests are controlled.
- Heavy components or dependencies are not added without need.
- Large reports are not aggregated inefficiently in the browser.
- Repeated formatters or transformations are not unnecessarily recomputed.

### 9. Maintainability

Check:

- API logic is centralized appropriately.
- Reusable behavior is extracted without over-abstraction.
- Component responsibilities remain clear.
- Naming uses business terminology.
- Comments explain constraints rather than restating code.
- Dead branches, mocks, temporary logs, and unused imports are removed.

### 10. Validation evidence

Check whether the change author ran:

```bash
npm run build
```

Also look for evidence of:

- Relevant manual flow checks.
- Error-path checks.
- Width and long-content checks.
- Integration verification where available.

Do not treat a passing build as proof that the workflow is correct.

## Finding format

Each actionable finding should include:

- Severity.
- File and location.
- Problem.
- Concrete consequence.
- Recommended correction.

Example:

```text
Severity: High
Location: src/views/.../VoucherForm.vue, submit handler
Problem: The submit button remains enabled while the request is pending.
Consequence: A double click can create two non-idempotent write requests.
Recommendation: Guard the handler and bind the pending state to the action control.
```

## Review workflow

1. Summarize the intended behavior.
2. Trace the primary user flow.
3. Trace failure, permission, and conflict paths.
4. Compare frontend assumptions with backend contracts.
5. Review financial display and workflow restrictions.
6. Review race, duplicate-action, and stale-state risks.
7. Review accessibility and responsive behavior.
8. Review build and manual validation evidence.
9. Report findings ordered by severity.
10. If no material defects are found, state residual risks and untested areas.

## Completion report

Return:

1. Actionable findings ordered by severity.
2. Questions only where contract ambiguity materially affects correctness.
3. Validation gaps.
4. A concise overall risk assessment.
