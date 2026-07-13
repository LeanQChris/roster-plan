# Audit Event Catalog

## 1. Overview

Every state change is recorded in the `audit_entries` table. The audit log is append-only (triggers prevent UPDATE/DELETE) and tamper-evident via HMAC-SHA256 chaining.

## 2. Event Catalog

Each event is defined by a `resource_type` + `action` pair.

### 2.1 Companies

| Action | When | `old_values` | `new_values` |
|--------|------|--------------|--------------|
| `create` | Company registered | – | `{ name, slug, timezone }` |
| `update` | Company settings changed | `{ field: old }` | `{ field: new }` |
| `delete` | Soft-delete | `{ status, deleted_at }` | `{ status: 'deleted' }` |
| `feature_flag.update` | Feature flag toggled | `{ flag, enabled: false }` | `{ flag, enabled: true }` |
| `import` | CSV import completed | – | `{ resource, imported_count, error_count }` |
| `export` | CSV export requested | – | `{ resource, from, to }` |

### 2.2 Locations

| Action | When |
|--------|------|
| `create` | Location created |
| `update` | Location edited |
| `delete` | Location soft-deleted |

`old_values`/`new_values` contain the changed fields only.

### 2.3 Positions

| Action | When |
|--------|------|
| `create` | Position created |
| `update` | Position edited |
| `delete` | Position soft-deleted |

### 2.4 Skills

| Action | When |
|--------|------|
| `create` | Skill created |
| `update` | Skill edited |
| `delete` | Skill soft-deleted |
| `assign` | Skill assigned to a person (`resource_id` = person_id; `old/new` contain skill info) |
| `remove` | Skill removed from a person |

### 2.5 Teams

| Action | When | Notes |
|--------|------|-------|
| `create` | Team created | |
| `update` | Team edited | Includes manager change |
| `delete` | Team soft-deleted | |

### 2.6 People

| Action | When | Notes |
|--------|------|-------|
| `create` | Person record created | Includes invited_at |
| `update` | Person profile edited | role, team, status, timezone, position changes all logged |
| `delete` | GDPR erasure | `new_values` = `{ deleted_at: ..., anonymized: true }` — actual data not stored |
| `invite` | Invite email sent | |
| `invite.accept` | Person accepted invite | |
| `export` | GDPR data export | `new_values` = `{ exported_at }` |

### 2.7 Shift Templates

| Action | When | Notes |
|--------|------|-------|
| `create` | Template + recurrence rule created | |
| `update` | Template or RRULE changed | |
| `delete` | Template deleted | Does not affect published shifts |
| `expand` | Template expanded into instances | `new_values` = `{ shift_count, date_range }` |

### 2.8 Shifts

| Action | When | Notes |
|--------|------|-------|
| `create` | Shift instance created (ad-hoc or via expand) | |
| `update` | Shift time, title, or status changed | |
| `delete` | Shift cancelled/deleted | `old_values` = full shift record |
| `publish` | Schedule published for a team + date range | `new_values` = `{ team_id, range, shift_count }` |

### 2.9 Shift Assignments

| Action | When | Notes |
|--------|------|-------|
| `assign` | Person assigned to shift | `new_values` = `{ person_id, person_name }` |
| `unassign` | Assignment removed | `old_values` = `{ person_id, person_name }` |
| `approve` | Self-schedule request approved | `old_values` = `{ status: 'pending' }`, `new_values` = `{ status: 'approved', approved_by }` |
| `deny` | Self-schedule request denied | |
| `swap.request` | Swap requested | `new_values` = `{ requester, target, swap_id }` |
| `swap.accept` | Target accepted swap | |
| `swap.approve` | Manager approved swap | |
| `swap.deny` | Manager denied swap | |

### 2.10 Clock Entries

| Action | When | Notes |
|--------|------|-------|
| `clock_in` | Employee clocked in | `new_values` = `{ clock_in_at, location_id }` |
| `clock_out` | Employee clocked out | `old_values` = `{ clock_in_at }`, `new_values` = `{ clock_out_at, duration_minutes }` |
| `break_in` | Break started | |
| `break_out` | Break ended | |

Clock entries themselves are immutable. The audit log records the *act* of clocking in/out, not the data.

### 2.11 Time-Off

| Action | When |
|--------|------|
| `create` | Time-off requested |
| `update` | Pending request edited by requestor |
| `delete` | Pending request cancelled |
| `approve` | Manager approved |
| `deny` | Manager denied |

### 2.12 Holidays

| Action | When |
|--------|------|
| `create` | Holiday added to calendar |
| `delete` | Holiday removed |

### 2.13 Integrations

| Action | When |
|--------|------|
| `create` | Integration configured (Slack/Teams/etc.) |
| `update` | Integration config changed |
| `delete` | Integration removed |
| `test` | Test notification sent | `new_values` = `{ success }` |

### 2.14 Notifications

| Action | When |
|--------|------|
| `send` | Notification sent | `new_values` = `{ type, channel, status }` |
| `bounce` | Email bounced | `new_values` = `{ status: 'bounced', error }` |

## 3. Retention Policy

| Environment | Retention | Enforcement |
|-------------|-----------|-------------|
| Production | 3 years (minimum for SOC 2 / GDPR) | Hard-delete via cron job monthly |
| Staging | 90 days | Same mechanism |
| Dev | 30 days | Same mechanism |

## 4. HMAC Chain Verification

Each entry hash is computed as:

```
hash = SHA256(prev_hash || resource_type || resource_id || action || old_values || new_values || created_at)
```

The first entry for a company uses `prev_hash = 0x00...00` (64 zeroes).

To verify the chain integrity:
1. Read entries ordered by `created_at ASC`
2. Recompute each hash
3. Compare with stored `hash`
4. Verify each entry's `prev_hash` matches previous entry's `hash`

## 5. Query Patterns

The audit log query endpoint supports:

| Filter | Example | Notes |
|--------|---------|-------|
| `actor_id` | `?actor_id=uuid` | Filter by who did it |
| `resource_type` | `?resource_type=shift` | Filter by entity type |
| `resource_id` | `?resource_id=uuid` | Filter by specific entity |
| `action` | `?action=assign` | Filter by action |
| `from` / `to` | `?from=2026-07-01&to=2026-07-31` | Date range |
| `page` / `limit` | `?page=1&limit=50` | Pagination |

All filters are optional and can be combined (AND logic).
