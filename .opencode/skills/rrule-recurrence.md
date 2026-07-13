# RRULE & Recurrence Scheduling Skill

## When to use
Load this skill when working with shift templates, recurrence rules, schedule publishing, exception handling, or any time-based expansion logic.

## Key references
- `db/03-rrule-storage.md` — full RRULE storage strategy, expansion approach, exception handling
- `docs/04-mvp-plan.md` — MVP scope: shift templates, expand/publish flow
- `db/02-schema.sql` — `recurrence_rules`, `shift_templates`, `shifts` tables
- `spec/01-api-spec.md` — API endpoints for template expand and schedule publish

## Domain model

### Core entities
- **Shift Template** (`shift_templates`): defines a recurring pattern — title, duration, start_time, required_count, position
- **Recurrence Rule** (`recurrence_rules`): 1:1 with template — stores RFC 5545 RRULE string, dtstart, dtend, exdates
- **Shift** (`shifts`): concrete instance — materialized on publish, has start_at/end_at in UTC
- **Holiday** (`holidays`): dates to skip when `skip_holidays = true`

### Position & skills association
- `shift_templates.position_id` links each template to a required position
- `template_skills` stores required skills per template
- On expansion: `position_id` and skills are copied to shift rows

## Expansion strategy: On-publish, not on-read

### Decision rationale
- Published schedule is a snapshot queryable without compute cost
- Exception handling is straightforward (rows materialized)
- Historical schedules stay stable if template changes
- Self-scheduling and assignments reference concrete shift IDs

### When expansion happens
1. **On publish**: Manager clicks "Publish" → expand and insert for date range
2. **On exception**: Manager modifies single occurrence → `is_exception = true`
3. **On template change**: Archive future unpublished instances, re-expand on next publish

### Expansion flow
```
RRULE string → library parses → expand for [start, end] range
  → Filter by exdates
  → Filter by holidays (if skip_holidays)
  → Copy template fields (position_id, skills, max_count)
  → INSERT each new shift row
  → Skip dates already in shifts table (idempotent)
```

## Conflict detection at assignment time

| Check | Error Code |
|---|---|
| Overlapping shift | `SHIFT_CONFLICT` |
| Approved time-off conflict | `TIME_OFF_CONFLICT` |
| Missing required skill | `SKILL_MISMATCH` |
| Missing required position | `POSITION_MISMATCH` |
| Overtime threshold exceeded | `OVERTIME_EXCEEDED` |
| Minimum rest period violation | `REST_PERIOD_VIOLATION` |

## Library recommendations
- TypeScript: `rrule` npm package (full RFC 5545, timezone support)
- Python: `dateutil.rrule`
- Must handle: DST transitions, leap year Feb 29, monthly 31st skip, EXDATE/RDATE

## Timezone handling
- DTSTART stored as `TIMESTAMPTZ` (absolute UTC)
- Template has wall-clock `start_time` and known timezone
- BYDAY/BYMONTHDAY evaluation done in template's timezone
- Holiday exclusion uses template's timezone for wall-clock date comparison
- MAX publish window: 2 years (prevents infinite expansion when dtend = null)

## MVP simplifications
- No draft/published workflow — shifts immediately visible
- Assignment status always `approved` (no pending/approval flow)
- Single company timezone for display (no per-user toggle)
