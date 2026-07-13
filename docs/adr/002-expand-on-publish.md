# ADR 002: Expand Schedule on Publish, Not on Read

**Status:** Accepted  
**Date:** 2026-07-13

## Context

Shift templates use RRULE recurrence (e.g., "every Monday, Wednesday, Friday"). When displaying the schedule, we must decide whether to compute recurring instances on every read or materialize them into concrete rows at publish time.

## Decision

**Expand on publish.** When a manager publishes a schedule for a date range, the system:

1. Reads each active template's RRULE
2. Expands into concrete `shift` rows for the target range
3. Stores them in the `shifts` table
4. Subsequent reads are simple range queries on the `shifts` table

## Consequences

- **Positive**: Schedule queries are fast (simple indexed range scan, no RRULE computation)
- **Positive**: Historical published schedules remain stable even if a template changes later
- **Positive**: Exception handling is straightforward (materialized rows have `is_exception` flag)
- **Positive**: Self-scheduling and assignments reference concrete shift IDs
- **Negative**: More storage for materialized rows
- **Negative**: Re-publishing is needed if the RRULE changes and future instances need updating

## Alternatives Considered

- **Compute on read**: Store RRULE, expand on every query. Avoids storage but adds compute cost on every read and makes exception handling complex.
- **Hybrid**: Cache expanded instances in Redis. Adds cache invalidation complexity.
