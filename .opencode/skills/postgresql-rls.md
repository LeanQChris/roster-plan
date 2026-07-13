# PostgreSQL & Row-Level Security Skill

## When to use
Load this skill when working with the database schema, writing RLS policies, designing triggers, implementing the audit chain, or troubleshooting DB queries.

## Key references
- `db/02-schema.sql` — full schema with all tables, enums, indexes, RLS, triggers
- `db/01-data-model.md` — data model docs and relationships
- `spec/07-architecture.md` — RLS policy patterns, connection pooling, migration strategy

## Domain conventions

### Schema rules
- All primary keys are `UUID DEFAULT gen_random_uuid()` — never use SERIAL or auto-increment
- All timestamps are `TIMESTAMPTZ` stored in UTC; display conversion handled in app layer
- All tables have `company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE` for tenant isolation
- VARCHAR limits enforced at DB level — never trust client-side validation
- Two extensions required: `pgcrypto` and `citext`
- Use `CITEXT` for email columns (case-insensitive)
- Soft deletes via `deleted_at TIMESTAMPTZ` columns

### RLS pattern
Every data table has RLS enabled. The pattern:

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON <table> FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
```

Session variables are set via `SET LOCAL` (transaction-scoped) in middleware:
- `app.current_company_id` — for tenant isolation
- `app.current_user_id` — for person-scoped policies
- `app.current_user_role` — for role-based policies

### Audit chain
- `audit_entries` is append-only — triggers prevent UPDATE/DELETE
- HMAC-SHA256 chained: each entry includes SHA256 hash of previous entry
- Chain trigger (`audit_chain_hash()`) runs on `BEFORE INSERT`
- `clock_entries` is also append-only with the same trigger pattern
- `ON DELETE SET NULL` on person/assignment FKs in clock_entries preserves records after GDPR erasure

### Trigger naming convention
- `trg_<table>_<event>` — e.g., `trg_audit_entries_chain`, `trg_clock_entries_no_update`

### Index naming
- `idx_<table>_<column>` — e.g., `idx_shifts_company`, `idx_sa_person`
- Conditional indexes use `WHERE` clause: `idx_people_sub_token ON people(subscription_token) WHERE subscription_token IS NOT NULL`

### Migration strategy
- Use timestamped, sequential, idempotent migrations (node-pg-migrate or alembic)
- Backward-compatible only — no destructive changes without multi-step plan
- Migrations run before new app version starts in deploy pipeline

### Connection pooling
- PgBouncer or built-in pool (max 25 connections per instance)
- Read replica used for reporting, export, and audit log queries
