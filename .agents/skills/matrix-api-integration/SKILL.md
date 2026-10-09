---
name: matrix-api-integration
description: Integrate Matrix Web with backend APIs. Use for Axios clients, endpoint modules, request and response DTO mapping, authentication, permissions, pagination, error handling, file upload or download, streaming, request cancellation, or frontend-backend debugging.
metadata:
  author: micor
  version: "1.0.0"
---

# Matrix API Integration

## Objective

Create explicit, maintainable frontend-backend contracts that preserve authentication, business status, error meaning, and financial data precision.

## Required context

Before editing:

1. Read `/AGENTS.md`.
2. Inspect the existing request abstraction, token handling, interceptors, and feature API modules.
3. Inspect the relevant backend controller, DTO, enum, and response structure when accessible.
4. Confirm endpoint path, HTTP method, parameters, body, response, errors, permissions, and idempotency expectations.
5. Identify whether rapid requests can race or writes can be repeated.

## Source of truth

Use the backend implementation and agreed API contract as the source of truth.

Do not invent:

- Field names.
- Status values.
- Pagination shapes.
- Date formats.
- Error codes.
- Permission behavior.
- Whether a write operation is idempotent.

When the contract is unclear, document the uncertainty and avoid presenting guesses as verified behavior.

## API modules

- Keep endpoint details out of route templates when a feature API module can own them.
- Group functions by business capability, not by HTTP verb.
- Use descriptive names such as `postVoucher`, `listVoucherLines`, or `reverseVoucher`.
- Keep request DTO mapping explicit.
- Normalize recurring response envelopes in one place.
- Do not spread endpoint paths and response-unwrapping logic across multiple components.

## Authentication and authorization

- Reuse existing token handling.
- Never log tokens or include them in user-visible errors.
- Handle unauthorized and forbidden responses distinctly.
- Route guards improve UX but do not replace backend authorization.
- Do not display business actions that the user cannot execute when permission data is available.
- Remove tokens from URLs after supported token-based entry flows.

## Request parameters

- Normalize empty values consistently.
- Use backend-supported date and enum formats.
- Encode arrays, pagination, and sorting according to the established contract.
- Do not send UI-only state.
- Preserve zero and false values; do not drop them through truthiness checks.
- Use multipart requests only for endpoints that require them.

## Response mapping

- Distinguish transport success from business success when the response envelope contains business codes.
- Map server fields into view models when presentation needs differ.
- Preserve server-generated identifiers, statuses, timestamps, and trace data.
- Do not convert precise decimal strings into floating-point numbers when precision matters.
- Treat absent optional fields separately from explicit zero or empty values.

## Errors

Handle intentionally:

- Network unavailable or timeout.
- Unauthorized.
- Forbidden.
- Validation failure.
- Not found.
- Status or version conflict.
- Rate limit or repeated operation.
- Server failure.

Error messages should:

- Be concise and actionable.
- Preserve useful backend business messages.
- Avoid stack traces, internal URLs, SQL details, or sensitive payloads.
- Avoid falsely claiming that a write failed when its outcome is uncertain after a timeout.

For uncertain write outcomes, refresh or reconcile the record before retrying automatically.

## Loading and duplicate writes

- Track pending state around writes.
- Disable repeated controls or deduplicate the action.
- Do not automatically retry non-idempotent writes unless the backend contract supports it.
- For long operations, show progress or a clear pending state.
- Separate initial load from background refresh when useful.

## Request races

For searches, autocomplete, or rapid navigation:

- Abort the previous request, or
- Track the latest request identity and ignore stale responses.

For writes:

- Preserve operation ordering when later operations depend on earlier ones.
- Never let a stale response overwrite a newly confirmed state.

## Pagination and sorting

- Keep the visual state aligned with the exact request.
- Use only supported backend sort fields.
- Confirm whether page indexing starts at zero or one.
- Do not infer total count from page length when the API provides an explicit total.
- Reset to page one after meaningful filter changes unless the contract says otherwise.

## Files and exports

Uploads:

- Validate basic file type and size for user feedback, while relying on backend validation for authority.
- Use multipart encoding correctly.
- Surface parsing errors without losing the user's context.

Downloads and exports:

- Use the applied filter scope.
- Handle binary responses and filenames safely.
- Avoid exposing authorization tokens in generated URLs.
- Prevent duplicate export requests.

## Streaming and AI responses

- Define connection close, timeout, cancellation, parse-error, and partial-response behavior.
- Do not treat incomplete streamed content as a completed authoritative result.
- Preserve trace IDs and citations when returned.
- Never render model output as trusted HTML without sanitization.

## Integration debugging workflow

1. Reproduce the request from the frontend.
2. Record method, path, parameters, body shape, and response status without secrets.
3. Compare with the backend controller and DTO.
4. Check gateway path rewriting and context paths.
5. Check token and permission behavior.
6. Check date, number, enum, and pagination serialization.
7. Check request races and stale state.
8. Fix the owning layer rather than adding repeated component workarounds.

## Verification

At minimum:

```bash
npm run build
```

Also verify the relevant success, validation, unauthorized/forbidden, and failure paths when the environment permits.

## Completion report

State:

- Endpoints and DTO mappings changed.
- Authentication, permission, and error behavior.
- Race and duplicate-write protections.
- Build and integration checks performed.
- Any contract uncertainty or backend dependency.
