# Grill Me — Project Documentation Audit Skill

## When to use
Load this skill to run a critical audit ("grill session") on the project's documentation. Use it to catch contradictions, hallucinations, over-engineering, and scope leaks before implementation starts or after doc changes.

## How to run
1. Read every `.md` file in the project (docs/, spec/, db/, compliance/, root)
2. Also read `db/02-schema.sql` and check it against doc claims
3. Also check `AGENTS.md` for architecture decisions (these are ground truth)
4. Classify each finding into one of three buckets

## Finding classifications

### 🔴 Contradiction (must fix)
Same document or cross-document says two different things. Examples:
- Spec says X, MVP plan says NOT X
- Table mentioned in docs but not in schema
- Feature listed as v1 in PRD but as MVP+ in MVP plan
- Different numbers for same config (e.g. session lifetime, timeouts, rate limits)

### 🟡 Hallucination (must fix)
Something that doesn't make sense or is factually wrong:
- Feature justified by wrong use case (e.g. magic link "for forgetting passwords")
- Company HR policy written as if it's a software feature
- Non-existent tables/endpoints referenced
- Template rendering bugs (duplicate variables, wrong field names)

### 🟠 Over-engineering (annotate, don't remove)
Detail that is correct but far beyond current project phase:
- Full infrastructure design for Phase D features
- Multi-region sharding, webhook delivery logs, GPC signal detection
- Mark these with `> **Phase:** X` annotations pointing to their actual phase

## What NOT to flag
- Things explicitly called out as MVP+ / post-MVP / Phase D in the document itself
- The full SQL schema — it's intentionally ahead of MVP
- Compliance documents describing regulations — those are research, not implementation specs

## Cross-reference checklist

### Check these ground truths (from AGENTS.md)
- RBAC: 4 roles hardcoded in middleware (employee, manager, company_admin, super_admin), NO role_permissions join table for MVP
- RRULE: expand on publish, not on read
- Audit log: HMAC-SHA256 chained, append-only triggers
- Clock entries: append-only, `ON DELETE SET NULL` on person/assignment FKs
- Session tokens: stored hashed (SHA256) in DB, not JWT
- No refresh tokens for MVP
- Timestamps: all TIMESTAMPTZ in UTC
- Primary keys: UUID with gen_random_uuid()

### Check these against MVP plan (docs/04-mvp-plan.md)
- MVP feature list: auth, company, teams, people, shift templates + RRULE, shift instances + publish, assignments, basic calendar, 1 email notification, role gating
- Everything else is deferred: self-scheduling, clock, reports, export, audit UI, password reset, etc.
- API endpoints: only the subset listed in MVP plan §API Endpoints
- Schema simplifications: no team_memberships, simplified shift_assignments, no draft status, email-only notifications

## Output format
Present findings grouped by category with file paths and line numbers. End with a recommended action for each.

## After the audit
After presenting findings, offer to fix them:
1. Fix contradictions to match the most authoritative source (MVP plan > AGENTS.md > PRD > spec)
2. Remove hallucinated content or replace with correct description
3. Annotate over-engineering with phase markers
