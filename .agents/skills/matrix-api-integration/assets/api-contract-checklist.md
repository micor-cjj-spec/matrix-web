# Matrix Frontend API Contract Checklist

Complete this checklist before integrating or changing a backend endpoint.

## Endpoint identity

- HTTP method:
- Path:
- Owning backend module:
- Controller method:
- Required permission or role:

## Request

- Path parameters and types:
- Query parameters and defaults:
- Request body DTO:
- Date/time format and timezone:
- Monetary fields transported as number or exact string:
- Enum values and unknown-value behavior:
- Idempotency key or duplicate-submit protection:

## Response

- `ApiResponse<T>` envelope confirmed:
- Success code and message semantics:
- Data DTO shape:
- Nullable and optional fields:
- Pagination fields (`records/items`, `total`, `page`, `size`):
- Sorting contract:
- Large identifier precision risk:

## Error behavior

- Validation error status and message:
- Authentication and authorization failures:
- Not-found behavior:
- State-conflict behavior, such as already posted or period closed:
- Retryable server or network failures:
- Partial-success behavior for batch APIs:

## UI state mapping

| Backend condition | UI behavior |
|---|---|
| Request pending | Loading indicator; conflicting actions disabled |
| Success with data | Render authoritative backend data |
| Success with empty data | Explicit empty state; no fabricated records |
| Validation failure | Field-level errors where possible |
| Permission denied | Disable or hide action and display meaningful feedback |
| State conflict | Refresh current record and explain the new state |
| Network/server failure | Preserve user input and provide retry behavior |
| Stale response | Ignore using request sequence or cancellation |

## Verification

- [ ] Compared frontend assumptions with the actual Java controller and DTOs.
- [ ] Tested loading, success, empty, error, and permission states.
- [ ] Tested rapid filter changes or duplicate clicks.
- [ ] Confirmed amount/date/ID precision.
- [ ] Confirmed no sensitive request or response data is logged.
- [ ] Ran `npm run build`.
- [ ] Recorded any backend dependency or unresolved contract risk.