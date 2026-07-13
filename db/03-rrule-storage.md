# RRULE Storage Strategy

## 1. Overview

We support full **RFC 5545 RRULE** for shift recurrence. This document covers how recurrence rules are stored, expanded into concrete shift instances, and how exceptions (cancelled or rescheduled occurrences) are handled.

## 2. Storage Model

Recurrence rules are stored as a single `rrule_string` column in `recurrence_rules`:

```
recurrence_rules {
    id                UUID
    shift_template_id UUID   (1:1 with shift_templates)
    rrule_string      TEXT   "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;INTERVAL=1"
    dtstart           TIMESTAMPTZ  "2026-07-01T08:00:00Z"  (series start)
    dtend             TIMESTAMPTZ  "2026-12-31T00:00:00Z"  (series end, nullable)
    exdates           TIMESTAMPTZ[]  {exception dates}
    skip_holidays     BOOLEAN  DEFAULT false
}
```

This is a **1:1 relationship** with `shift_templates`: one template has exactly one recurrence rule.

### Position association
The `shift_templates.position_id` links each template to a required position (e.g. "Registered Nurse"). When expanded:
- The position_id is copied to each `shift` row
- The shift inherits required skills from the `template_skills` junction table → copied to `shift_skills`
- During assignment, the system validates that assigned people hold the required position/skills

## 3. Expansion Strategy: On-Publish, Not On-Read

### Decision: **Store as concrete instances on publish**
When a manager publishes a schedule for a date range, the system:
1. Reads the template's RRULE
2. Uses an RRULE library to expand into all concrete `shift` rows for that range
3. Filters out dates matching company holidays (if `skip_holidays = true`)
4. Filters out dates where the template's team has all members on approved time-off (optional)
5. Copies `shift_templates.position_id` → `shift.position_id`
6. Copies `template_skills` → `shift_skills` rows
7. Copies `shift_templates.max_count` → `shift.max_count`
8. Inserts those rows into the `shifts` table
9. Exceptions (`is_exception = true`) override or cancel specific instances

This approach was chosen over computing on every read because:
- The published schedule is a snapshot that can be queried directly without compute cost
- Exception handling is straightforward (rows are already materialized)
- Historical published schedules remain stable even if the template changes later
- Self-scheduling and assignments reference concrete shift IDs

### When expansion happens:
- **On publish**: Manager clicks "Publish" → expand and insert
- **On exception**: Manager modifies a single occurrence → `is_exception = true`, `recurrence_id` links to origin
- **On template change**: If the RRULE changes and the schedule was already published, the system archives future unpublished instances and re-expands on next publish

## 4. Exception Handling

### 4.1 Cancel a single occurrence
- Add timestamp to `recurrence_rules.exdates` array
- Mark existing `shift` row as `status = 'cancelled'` (if already published)
- New publishes will skip this date during expansion

### 4.2 Modify a single occurrence (time, title, etc.)
- Insert a new `shift` row with `is_exception = true` and `recurrence_id` pointing to the original occurrence's UUID
- The original occurrence in the pattern is skipped during expansion
- The exception shift replaces it

### 4.3 Exdate encoding
Stored as a PostgreSQL `TIMESTAMPTZ[]` array. Library handles comparison with DTSTART alignment.

## 5. Holiday Exclusion

When `recurrence_rules.skip_holidays = true`, the expansion engine must:

1. Query `holidays` for the company in the target date range
2. Collect all dates into a set
3. For each expanded instance, check if the date (wall-clock date in the template's timezone) matches a holiday
4. If yes, skip that instance (do not insert into `shifts`)

Implementation notes:
- Holiday comparison is done in the **template's timezone**, not UTC
- A holiday on "Dec 25" means the wall-clock date, which may span two UTC days
- Paid holidays can optionally generate a special "holiday pay" shift placeholder (future feature)

## 6. Time-Off Conflict During Expansion

During expansion, the system can optionally skip dates where the **entire team** or a **specific person** has approved time-off.

### Team-level expansion (for manager publishing):
By default, all dates are generated regardless of time-off. Assigned time-off is handled at assignment time via conflict detection.

### Person-specific expansion (for "generate my schedule" preview):
When expanding for an individual (e.g., showing available shifts for self-scheduling):
- Query `time_off_requests` where `person_id = X` and `status = 'approved'`
- These dates should be excluded from available shifts for that person
- The person cannot request a shift on a day they have approved time-off

### Conflict detection at assignment time:
When a manager assigns or an employee requests a shift, the server must check:
1. Does the person have an overlapping approved time-off? → **Block with `TIME_OFF_CONFLICT` error**
2. Does the person lack required skills for this shift? → **Block with `SKILL_MISMATCH` error**
3. Does the person hold the required position? → **Block with `POSITION_MISMATCH` error**
4. Double-booking? → **Block with `SHIFT_CONFLICT` error**
5. Overtime threshold? → **Block with `OVERTIME_EXCEEDED` error**
6. Minimum rest period? → **Block with `REST_PERIOD_VIOLATION` error**

## 7. RRULE Library Recommendations

| Language | Library | Notes |
|---|---|---|
| TypeScript/Node.js | `rrule` (npm) | Full RFC 5545, timezone support |
| Python | `dateutil.rrule` | Mature, well-tested |
| Go | `gorhill/go-rrule` | |
| Rust | `rrule` crate | |

The library must:
- Parse RFC 5545 RRULE strings
- Expand into datetime instances for a given range
- Compute `DTSTART` alignment
- Handle `EXDATE` and `RDATE` components (if we pass exdates)

## 8. Validated RRULE Examples

| Pattern | RRULE String |
|---|---|
| Every Mon-Fri | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;INTERVAL=1` |
| Every Mon, Wed, Fri | `FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1` |
| 2nd Tuesday of every month | `FREQ=MONTHLY;BYDAY=+2TU` |
| Every weekday, every 2 weeks | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;INTERVAL=2` |
| Daily for 30 days | `FREQ=DAILY;COUNT=30` |
| Mon-Fri until Dec 31 | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20261231T235959Z` |
| Every 3 hours on weekdays | `FREQ=HOURLY;INTERVAL=3;BYDAY=MO,TU,WE,TH,FR` |

## 9. Timezone Handling in RRULE

- `DTSTART` is stored as `TIMESTAMPTZ` (absolute UTC).
- The shift template has a `start_time` (wall clock) and the template's timezone is known.
- During expansion, the RRULE library converts `DTSTART` to the target timezone for BYDAY/BYMONTHDAY evaluation.
- The expanded `shift` row stores `start_at` in UTC and `timezone` as the IANA zone string.
- The frontend converts to the viewer's local time for display.
- Holiday exclusion uses the template's timezone to determine the wall-clock date for holiday comparison.

## 10. Edge Cases

| Case | Handling |
|---|---|
| DST start/end | Store UTC; library handles offset changes correctly |
| Leap year Feb 29 | `BYMONTHDAY=29` with `FREQ=YEARLY` only matches on Feb 29 |
| Monthly on 31st | If month has <31 days, the occurrence is skipped (RFC 5545 behavior) |
| No end date (dtend = null) | Enforce a MAX publish window (e.g., 2 years out) to prevent infinite expansion |
| Template modified after publish | Published instances stay unchanged; next publish re-expands |
| Holiday falls on weekend | Holiday date is the observed date (e.g., Dec 25 always generates); observances pre-computed by company |
| Person assigned to shift on holiday | Assignment still valid — holiday exclusion only affects generation, not existing assignments |
| Time-off approved after assignment | **Existing assignments are not auto-cancelled.** Manager must handle conflict manually or via a "sub alerts" system |