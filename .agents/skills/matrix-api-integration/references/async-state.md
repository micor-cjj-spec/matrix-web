# Async State and Request-Race Reference

Use this reference when a page can issue repeated searches, change routes quickly, stream responses, or perform non-idempotent writes.

## Read requests

For replaceable reads such as search and autocomplete:

- Abort the previous request when the request layer supports it, or
- Assign a monotonically increasing request ID and ignore responses that are no longer current.

Do not allow an older response to replace newer user intent.

## Route changes

When a route changes while a request is pending:

- Cancel or ignore the obsolete result.
- Avoid updating state for a component that is no longer active.
- Do not show errors from a request the user intentionally abandoned.

## Write requests

For create, submit, audit, post, reverse, delete, and similar operations:

- Guard the handler against repeated execution.
- Bind pending state to the initiating control.
- Do not automatically retry unless the operation is confirmed idempotent.
- If a timeout leaves the outcome uncertain, refresh or reconcile authoritative state before another attempt.

## Loading states

Distinguish when useful:

- `loading`: initial content is unavailable.
- `refreshing`: existing content remains usable while updating.
- `submitting`: a write is pending.
- `exporting`: a file-generation request is pending.

Avoid one global boolean when independent operations can occur safely in parallel.

## Error ownership

Handle errors at the layer that can provide the best recovery:

- Request layer: authentication expiry and common transport normalization.
- Feature API layer: endpoint-specific mapping.
- Page or component: user action, input preservation, retry, and navigation.

Avoid displaying the same error multiple times from interceptors and components.
