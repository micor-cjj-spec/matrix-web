---
name: matrix-table-page
description: Build or modify Matrix Web data-list and report pages. Use for search forms, filters, tables, pagination, sorting, row actions, batch actions, summaries, exports, large datasets, or financial reports.
metadata:
  author: micor
  version: "1.0.0"
---

# Matrix Table Page Development

## Objective

Create predictable, scalable list and report pages that preserve business context and remain usable with large enterprise datasets.

## Required context

Before editing:

1. Read `/AGENTS.md`.
2. Read `matrix-ui` when layout or interaction changes.
3. Inspect a neighboring table page using the same component library.
4. Confirm backend pagination, filtering, sorting, summary, and export contracts.
5. Identify organization, ledger, currency, period, and permission scope.

## Page model

A table page should explicitly model:

- `filters`: user-entered search conditions.
- `appliedFilters`: conditions used for the current request when separation is useful.
- `rows`: current page data.
- `page`, `size`, and total count.
- `sort`: backend-supported sort definition.
- `loading`: initial or blocking load.
- `refreshing`: optional non-blocking refresh.
- `error`: recoverable request failure.
- `selection`: selected row identities when batch actions exist.

Avoid scattering these states across unrelated refs without a clear reason.

## Search behavior

- Define defaults deliberately.
- Search should reset to the first page unless the current contract says otherwise.
- Reset should restore documented defaults, not arbitrary empty values.
- Avoid sending empty filters in inconsistent forms such as `""`, `null`, and `undefined`.
- Debounce only fields that benefit from live search; enterprise filter forms usually use an explicit search action.
- Preserve filter state when navigating to details and returning where practical.

## Pagination and sorting

- Use backend pagination for potentially large datasets.
- Never fetch an entire financial dataset simply to paginate in the browser.
- Keep page size within supported backend limits.
- Reset to a valid page when filters reduce the result count.
- Send only backend-supported sort fields.
- Keep visual sort state synchronized with the request.
- Use stable row identifiers.

## Table columns

For every column define:

- Business meaning.
- Source field.
- Formatting.
- Alignment.
- Empty-value behavior.
- Width or overflow strategy.
- Sorting support.
- Permission or sensitivity concerns.

Financial columns:

- Right-align amounts, rates, quantities, and percentages.
- Preserve expected precision.
- Show currency when not implied by page scope.
- Keep debit and credit labels explicit.
- Do not calculate authoritative totals with JavaScript floating point.

## Row and batch actions

- Display only actions allowed by the current permission and business status.
- Do not infer editability from frontend state alone when backend rules exist.
- Require confirmation for destructive or high-impact operations.
- Disable repeated action while pending.
- Batch actions must define partial-success behavior.
- After mutations, refresh the smallest necessary scope and preserve user context.

## Loading, empty, and errors

Initial loading:

- Use the component library's table or skeleton state.

Background refresh:

- Avoid blanking an already usable page unless necessary.

Empty result:

- Distinguish “no records exist” from “filters matched nothing.”

Error:

- Show a concise message and retry option where useful.
- Preserve filters, page intent, and selection when safe.
- Never leave stale data appearing current without an error indicator.

## Reports and summaries

- Clearly show report scope.
- Do not silently combine currencies, organizations, ledgers, or periods.
- Ensure summary values use the same filters as the detail rows.
- Prefer server-calculated authoritative financial totals.
- Label estimated, partial, or delayed data explicitly.

## Export

- Export must use the currently applied scope and filters.
- Do not imply that only the visible page will export unless that is the intended behavior.
- Prevent repeated export requests.
- Handle long-running export generation clearly.
- Do not include hidden sensitive fields merely because they exist in the response.

## Request-race protection

Rapid searches or route changes can return responses out of order.

Use one of these patterns when relevant:

- Abort the previous request.
- Track request identity and ignore stale responses.
- Serialize writes when order matters.

Never allow an older response to replace newer search results.

## Implementation workflow

1. Confirm query and response contracts.
2. Define table state and scope.
3. Define filters, columns, formatting, actions, and permissions.
4. Implement request-race and duplicate-action protection.
5. Handle loading, empty, error, and partial-success states.
6. Verify large values, long text, narrow width, and wide tables.
7. Run `npm run build`.
8. Review with `matrix-frontend-review`.

## Completion report

State:

- Filters, columns, actions, and report scope changed.
- Pagination and sorting behavior.
- Mutation and race protections.
- Build result.
- Remaining API or performance risks.
