# Pagination Convention

## 1. Decision: Offset-Based with Cursor-Readiness

All list endpoints use **offset-based pagination** for MVP (simpler to implement, sufficient up to ~10K rows). The response shape is designed so a cursor-based migration is a backward-compatible addition.

## 2. Request Parameters

Every list endpoint accepts these optional query parameters:

| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| `page` | integer | 1 | — | Page number (1-indexed) |
| `limit` | integer | 50 | 200 | Results per page |
| `sort` | string | `created_at` | — | Field name to sort by |
| `order` | enum | `desc` | — | `asc` or `desc` |

Only whitelisted `sort` fields are accepted per endpoint — invalid values return `VALIDATION_ERROR`.

## 3. Response Format

All paginated responses wrap results in a standard envelope:

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 342,
    "total_pages": 7,
    "has_next": true,
    "has_prev": false
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data` | array | The page of results |
| `meta.page` | integer | Current page number |
| `meta.limit` | integer | Items per page (reflects actual, may be capped) |
| `meta.total` | integer | Total matching records (absent on very large sets if perf-sensitive) |
| `meta.total_pages` | integer | Ceiling of `total / limit` |
| `meta.has_next` | boolean | `true` if there are more pages after this one |
| `meta.has_prev` | boolean | `true` if this is not the first page |

## 4. Default Page Sizes by Endpoint Type

| Endpoint Type | Default Limit | Max Limit |
|---------------|--------------|-----------|
| People list | 50 | 200 |
| Shifts list | 100 | 500 |
| Shift templates | 50 | 200 |
| Teams list | 25 | 100 |
| Locations list | 50 | 200 |
| Positions list | 50 | 200 |
| Skills list | 50 | 200 |
| Time-off list | 50 | 200 |
| Notifications | 25 | 100 |
| Audit log | 50 | 200 |
| Clock entries | 50 | 200 |
| Reports output | 100 | 500 |
| Holidays list | 100 | 365 |

## 5. Sorting Conventions

- Default sort is always `created_at desc` (newest first)
- Whitelisted sort fields per endpoint are documented in the API spec
- Multi-field sort is not supported in MVP (single field only)
- Sort on `updated_at` is available on any entity that has it

## 6. Future Cursor Migration

The `meta` block is designed so a cursor property can be added:

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 3420,
    "cursors": {
      "next": "eyJpZCI6IjEyMyIsIl9wb2ludCI6Im5leHQifQ==",
      "prev": null
    }
  }
}
```

Cursor tokens are base64-encoded opaque strings containing the sort key of the last/first item on the current page. The switch to cursor mode would be endpoint-specific and gated by a feature flag.

## 7. Edge Cases

| Case | Behavior |
|------|----------|
| `page` < 1 | Coerce to 1 |
| `limit` > max | Cap at max, return `meta.limit` showing capped value |
| `page` exceeds total_pages | Return `meta.has_next = false`, `data = []` |
| `sort` field not whitelisted | Return `VALIDATION_ERROR` |
| No results match filters | `data = []`, `total = 0`, `total_pages = 0` |
| Very large total (10K+) | `total` and `total_pages` may be omitted for performance (`total` = null) |
