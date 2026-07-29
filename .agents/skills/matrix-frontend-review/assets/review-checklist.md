# Matrix Web Pre-Merge Review Checklist

Use this checklist for changed behavior, not only changed lines.

## Scope

- [ ] The affected route, page, component, store, API module, and backend dependency are identified.
- [ ] The intended user flow and business status are understood.
- [ ] Cross-repository impact on `matrix` has been considered.

## Functional states

- [ ] Initial loading is handled.
- [ ] Background refresh does not misleadingly blank current data.
- [ ] Empty state distinguishes no data from no filter matches where relevant.
- [ ] Request failure is visible and actionable.
- [ ] Unauthorized and forbidden behavior is intentional.
- [ ] Not-found and status-conflict behavior is intentional.
- [ ] Successful writes use the authoritative server response.

## Forms

- [ ] Create, edit, view, and workflow modes are explicit.
- [ ] Defaults distinguish missing, null, empty, zero, and false values.
- [ ] Client validation aligns with backend validation.
- [ ] Server validation messages are handled safely.
- [ ] Duplicate submission is prevented.
- [ ] Recoverable failure preserves meaningful input.
- [ ] Unsaved-change behavior is intentional.
- [ ] UI-only fields are not sent to the backend.

## Tables and reports

- [ ] Large datasets use backend pagination.
- [ ] Search resets pagination appropriately.
- [ ] Sorting matches backend-supported fields.
- [ ] Stable row identities are used.
- [ ] Monetary and numeric values are right-aligned and consistently formatted.
- [ ] Long text and large values do not break the layout.
- [ ] Summary values use the same scope as detail rows.
- [ ] Export matches applied filters and permissions.
- [ ] Batch actions define partial-success behavior.

## Financial workflow

- [ ] Organization, ledger, currency, and period scope are visible where needed.
- [ ] Debit and credit are explicitly distinguished.
- [ ] Immutable statuses do not expose edit actions.
- [ ] High-impact financial actions require confirmation.
- [ ] JavaScript floating point is not used for authoritative financial totals.
- [ ] The UI does not claim a financial write succeeded before server confirmation.

## API integration

- [ ] Endpoint method, path, parameters, body, and response match the backend.
- [ ] Pagination indexing and total count are handled correctly.
- [ ] Dates, enums, decimals, zero, and false values serialize correctly.
- [ ] Unauthorized, forbidden, validation, conflict, timeout, and server errors are handled.
- [ ] Rapid requests cannot allow an older response to replace newer data.
- [ ] Non-idempotent writes are not retried automatically without support.
- [ ] Tokens and sensitive payloads are not logged.

## Vue state

- [ ] Props are not mutated.
- [ ] Derived values use computed state where appropriate.
- [ ] Watchers are necessary and do not create hidden synchronization loops.
- [ ] Shared stores are used only for genuinely shared state.
- [ ] Timers, listeners, subscriptions, and requests are cleaned up where needed.
- [ ] Lists and dynamic form lines use stable keys.

## UI consistency

- [ ] The surrounding component library is reused.
- [ ] Element Plus and Vuetify are not mixed unnecessarily in one page.
- [ ] No third UI framework was introduced.
- [ ] Primary, secondary, and dangerous actions are visually clear.
- [ ] Loading, empty, error, and permission states are not blank.
- [ ] The layout was checked around 1280px and 1920px.

## Accessibility

- [ ] Interactive controls are keyboard reachable.
- [ ] Inputs and icon-only controls have accessible names.
- [ ] Visible focus states remain available.
- [ ] Modal or drawer focus behavior is predictable.
- [ ] Status and errors are not communicated through color alone.
- [ ] Error messages identify the problem and next action.

## Security and privacy

- [ ] Tokens, passwords, private data, and sensitive financial payloads are not exposed.
- [ ] Permission behavior is not enforced only by hidden UI.
- [ ] Untrusted HTML, including model output, is not rendered unsafely.
- [ ] Download or redirect URLs do not expose credentials.
- [ ] Temporary console logging has been removed.

## Performance

- [ ] Full datasets are not loaded for browser-side pagination or aggregation without justification.
- [ ] Repeated search requests are controlled.
- [ ] Expensive derived data is not recomputed unnecessarily.
- [ ] New dependencies are justified.
- [ ] Wide tables scroll inside a controlled region rather than the whole page.

## Validation

- [ ] `npm run build` passes.
- [ ] The browser console is clean for the tested flow.
- [ ] Primary success flow was checked.
- [ ] At least one relevant failure or validation flow was checked.
- [ ] Remaining integration or environment gaps are documented.
