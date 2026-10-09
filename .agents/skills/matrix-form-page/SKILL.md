---
name: matrix-form-page
description: Build or modify Matrix Web create, edit, view, approval, audit, or workflow forms. Use for validation, defaults, field dependencies, save, submit, unsaved changes, dynamic forms, or financial document editing.
metadata:
  author: micor
  version: "1.0.0"
---

# Matrix Form Page Development

## Objective

Build reliable enterprise forms that preserve user input, respect backend workflow states, and prevent ambiguous or duplicate financial mutations.

## Required context

Before editing:

1. Read `/AGENTS.md`.
2. Read `matrix-ui` when changing layout or interaction.
3. Inspect a neighboring form using the same component library.
4. Confirm request and response DTOs, backend validation, status transitions, and permissions.
5. Identify form mode: create, edit, view, submit, audit, reject, post, reverse, or another explicit workflow action.

## Form model

Define intentionally:

- Initial values.
- Loaded server values.
- Editable values.
- Derived display values.
- Field validation state.
- Dirty state.
- Pending request state.
- Form mode and business status.

Do not let `undefined`, empty string, `null`, zero, and missing fields become interchangeable accidentally.

## Mode and status

- Keep route mode and business status explicit.
- Do not expose editing for backend-immutable states.
- Read-only fields should be clearly readable, not merely disabled without context.
- Status transitions must use dedicated actions when the backend models them separately.
- Do not treat “save draft,” “submit,” “audit,” “post,” and “reverse” as equivalent save operations.

## Validation

- Match backend constraints and terminology.
- Use field-level validation for local input errors.
- Use form-level validation for cross-field rules.
- Do not reimplement complex financial authority solely in the browser.
- Keep validation messages specific and actionable.
- Preserve server validation messages where safe and useful.
- Revalidate dependent fields when controlling fields change.

Financial examples requiring explicit handling include:

- Debit-credit exclusivity and balance.
- Accounting period availability.
- Currency, exchange rate, and original amount relationships.
- Required organization, ledger, account, customer, or supplier scope.
- Document status restrictions.

## Data loading

For edit or view mode:

1. Load the record and required reference data deliberately.
2. Do not render default values as real server values during loading.
3. Handle not found, forbidden, stale, and failed requests distinctly.
4. Avoid overwriting user edits if background reference data refreshes.
5. Normalize backend data before binding it to controls.

## Submission

- Validate before sending.
- Prevent duplicate submission.
- Do not show success until the server confirms it.
- Keep the button in a pending state during the request.
- Preserve user input after recoverable errors.
- Map the form model to a request DTO explicitly; do not send internal UI-only fields.
- Refresh or navigate only after successful completion.
- Avoid losing server-generated IDs, numbers, statuses, or timestamps after save.

## Unsaved changes

When leaving would lose meaningful user input:

- Track dirty state.
- Confirm route navigation, dialog close, or mode change.
- Do not warn when only server initialization changed the model.
- Clear dirty state after a confirmed successful save or reset.

## Dynamic fields

- Use stable field identities.
- Remove obsolete validation and payload values when a conditional section becomes inactive, unless the backend explicitly needs them.
- Avoid deeply nested watchers that synchronize duplicate state.
- Prefer computed values and explicit event handlers.
- For line-entry forms, preserve row identity and validate each line with a meaningful row number.

## Financial line-entry forms

- Use stable row IDs independent of array position.
- Right-align numeric inputs.
- Define decimal precision and rounding presentation.
- Never use JavaScript floating-point totals as the authoritative accounting result.
- Display client-side totals only as assistance; rely on backend validation for final correctness.
- Prevent a row from having incompatible debit and credit values.
- Clearly identify invalid lines.
- Preserve lines after recoverable submission failures.

## Errors and conflicts

Handle at least:

- Local validation errors.
- Backend validation errors.
- Unauthorized or forbidden access.
- Record not found.
- Version or status conflict.
- Network failure.
- Server failure.

For status conflicts, refresh the authoritative record before allowing another mutation.

## Implementation workflow

1. Define modes, statuses, and permissions.
2. Confirm DTOs and backend validation.
3. Define initialization, normalization, validation, and payload mapping.
4. Implement loading and error states.
5. Implement submit protection and unsaved-change handling.
6. Verify create, edit, view, failure, and conflict paths.
7. Run `npm run build`.
8. Review with `matrix-frontend-review`.

## Completion report

State:

- Form modes and fields changed.
- Validation and payload behavior.
- Status and permission restrictions.
- Duplicate-submit and unsaved-change behavior.
- Build result.
- Remaining backend-contract or workflow risks.
