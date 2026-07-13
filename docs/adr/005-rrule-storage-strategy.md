# ADR 005: Store RRULE as RFC 5545 String (Not Structured Columns)

**Status:** Accepted  
**Date:** 2026-07-13

## Context

Shift templates need recurrence rules (e.g., "every weekday", "2nd Tuesday of month"). We must decide how to store these rules.

## Decision

Store RRULE as a single RFC 5545 string in a TEXT column (`recurrence_rules.rrule_string`).

- Use a mature RRULE library (`rrule` for TypeScript, `dateutil.rrule` for Python) to parse and expand
- The string is stored as-is — no normalization, no structured columns for individual RRULE parts (FREQ, BYDAY, INTERVAL, etc.)
- Expansion happens only at publish time (see ADR 002), using the library

## Consequences

- **Positive**: Supports the full RFC 5545 spec without schema changes for every RRULE property
- **Positive**: Simple to store, simple to pass to the RRULE library
- **Positive**: Easy migration — just copy the string
- **Negative**: Cannot query by RRULE properties directly (e.g., "find all templates that repeat on Mondays")
- **Negative**: Clients must use the same library to parse and display the rule

## Alternatives Considered

- **Structured columns**: Individual columns for FREQ, BYDAY, etc. — complex schema, hard to extend, every RRULE property needs a migration
- **JSONB**: More flexible than columns, but duplicates library parsing logic
