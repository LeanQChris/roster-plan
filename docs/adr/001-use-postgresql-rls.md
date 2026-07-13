# ADR 001: PostgreSQL Row-Level Security for Multi-Tenant Isolation

**Status:** Accepted  
**Date:** 2026-07-13

## Context

The roster app serves multiple companies (tenants) from a single database instance. We need strong isolation guarantees so that Company A can never see Company B's data, even in the event of an application bug.

## Decision

Use PostgreSQL Row-Level Security (RLS) as the primary tenant isolation mechanism.

- Every data table gets a `company_id` column and an RLS policy scoping queries to the current company
- The application sets `app.current_company_id` via `SET LOCAL` at the start of each request (transaction-scoped, preventing connection pool leakage)
- RLS is default-deny: if `app.current_company_id` is not set, queries return empty results

## Consequences

- **Positive**: Defense-in-depth — RLS works even if application middleware is bypassed
- **Positive**: Developers don't need to remember to add `WHERE company_id = ?` to every query
- **Positive**: Adheres to SOC 2, HIPAA, and GDPR isolation requirements
- **Negative**: Slightly more complex triggers and migrations
- **Negative**: All tables must include `company_id` (including junction tables), adding some denormalization

## Alternatives Considered

- **Schema-per-tenant**: Isolated schemas but harder to manage migrations across hundreds of schemas
- **Database-per-tenant**: Best isolation but expensive and operationally complex for MVP
- **Application-level filtering only**: Simpler but vulnerable to developer error
