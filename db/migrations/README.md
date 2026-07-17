# Database Migrations

Migration naming convention: `YYYYMMDDHHMMSS_description.sql`

## MVP → Full Schema Upgrade

The `db/02-schema.sql` is the **full** schema (all features). For MVP, several simplifications apply.
See `docs/04-mvp-plan.md` §Schema Simplifications.

### MVP Schema (subset of full)

Per `docs/04-mvp-plan.md` §Schema Simplifications, the full schema is kept intact — deferred columns remain nullable/unused rather than dropped. The adjustments below document what would change if you prefer to trim the schema, but the recommended approach is to **keep the full schema** and ignore unused columns.

```sql
-- 1. shift_assignments: remove unused columns
ALTER TABLE shift_assignments DROP COLUMN IF EXISTS requested_at;
ALTER TABLE shift_assignments DROP COLUMN IF EXISTS approved_by;
ALTER TABLE shift_assignments DROP COLUMN IF EXISTS cancelled_at;
ALTER TABLE shift_assignments DROP COLUMN IF EXISTS confirmed_at;
ALTER TABLE shift_assignments ALTER COLUMN status SET DEFAULT 'approved';

-- 2. shifts: remove draft status (simplify to published-only)
ALTER TABLE shifts ALTER COLUMN status SET DEFAULT 'published';

-- 3. people: drop MVP-deferred columns
ALTER TABLE people DROP COLUMN IF EXISTS subscription_token;
ALTER TABLE people DROP COLUMN IF EXISTS data_exported_at;
```

### Post-MVP Upgrade (add full features)

When ready for Phase A+, reverse the MVP simplifications:

```sql
-- 1. shift_assignments: restore columns
ALTER TABLE shift_assignments ADD COLUMN requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE shift_assignments ADD COLUMN approved_by UUID REFERENCES people(id) ON DELETE SET NULL;
ALTER TABLE shift_assignments ALTER COLUMN status SET DEFAULT 'pending';

-- 2. shifts: restore draft default
ALTER TABLE shifts ALTER COLUMN status SET DEFAULT 'draft';

-- 3. people: restore deferred columns
ALTER TABLE people ADD COLUMN subscription_token VARCHAR(128) UNIQUE;
ALTER TABLE people ADD COLUMN data_exported_at TIMESTAMPTZ;
```
