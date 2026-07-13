# Roster — Agent Guide

## Project state

Greenfield design/spec project. Nothing implemented. All `.md` (requirements, specs, compliance), one `.sql` schema, one `prototype.html`.

## Directory structure

| Path | What it is |
|------|-----------|
| `docs/` | PRD, feature breakdown, UX stories, MVP plan |
| `spec/` | API spec, RBAC matrix, calendar export, pagination, webhooks, sessions, architecture, emails, audit events, testing |
| `db/` | Data model, full SQL schema (`02-schema.sql`), RRULE storage strategy |
| `compliance/` | GDPR, CCPA, SOC2, HIPAA, security, data residency, incident response, Australia |
| `docs/adr/` | Architecture Decision Records |
| `prototype.html` | Single-file HTML/CSS prototype (Tailwind CSS via CDN) |

## Architecture decisions (honor these when implementing)

| Decision | Detail |
|----------|--------|
| **Database** | PostgreSQL with RLS on every table scoped by `company_id` |
| **Primary keys** | UUID with `gen_random_uuid()` |
| **Timestamps** | `TIMESTAMPTZ` in UTC; display conversion in app layer |
| **Audit log** | HMAC-SHA256 chained, append-only triggers prevent UPDATE/DELETE |
| **Auth** | Session tokens stored hashed (SHA256) in DB, not JWT. bcrypt cost 12. No refresh tokens for MVP (session lasts 7d, extended +7d on use within 24h of expiry) |
| **RRULE** | RFC 5545 — store as string, expand on publish (not on read) |
| **RBAC (MVP)** | 4 roles hardcoded in middleware: `company_admin`, `manager`, `employee`, `super_admin`. No `role_permissions` join table. `super_admin` is seeded in DB (no signup), uses same login flow |
| **Clock entries** | Append-only enforced by triggers. `ON DELETE SET NULL` on person/assignment FKs to preserve records after GDPR erasure. Included in MVP (basic clock in/out, no break tracking) |
| **Data residency** | Regional sharding by company — `region_routing` table maps company to DB cluster (Phase D) |
| **Text fields** | VARCHAR limits enforced at DB level, never trust client-side validation |
| **Expand-on-publish** | Schedule is materialized into concrete shift rows on publish, not computed on read |

## MVP Scope (from docs/04-mvp-plan.md)

The full MVP scope, deferred features, schema simplifications, UI screens, and effort estimate are defined **once** in `docs/04-mvp-plan.md`. That document is the single source of truth. Key highlights:

### What's IN (MVP)
Multi-tenant auth (register, login, logout), company settings, teams CRUD, people CRUD + email invite, shift templates + RRULE, shift publish (expand templates → instances), manager assigns people to shifts, basic week calendar view (read-only for employees), clock in/out, 1 notification email (shift assigned), role gating (4 roles, hardcoded middleware), super admin module (list companies, suspend/activate, platform audit).

### What's DEFERRED (MVP+)
Self-scheduling, break tracking, time-off requests, shift swaps, positions CRUD, skills/certifications, locations/sites, attendance reports, calendar export (iCal/webcal), notification upgrades (reminders, digest, preferences, Slack/Teams), integrations, timezone toggle, coverage heatmap, conflict detection UI, audit log UI, compliance UI, password reset, rate limiting, webcal.

### MVP Auth Details
- Session tokens stored in DB (SHA256 hash), not JWT
- No refresh tokens (session lasts 7 days, extended on use within 24h of expiry)
- No password reset (admin can reset via direct support)
- No MFA, no magic link

### MVP RBAC
```typescript
const roleHierarchy = { employee: 0, manager: 1, company_admin: 2, super_admin: 3 };
// User with role X can access any endpoint requiring role <= X
```
Permissions hardcoded in middleware, no join table. `super_admin` is seeded in DB (no signup), uses same login flow.

### MVP Schema Simplifications
See `docs/04-mvp-plan.md §Schema Simplifications` for authoritative list. Note: the full schema (`db/02-schema.sql`) defines all tables/columns for forward-compat — MVP simply ignores deferred columns (they're nullable/unused, not dropped).

### MVP UI Screens (14 — no new pages, clock integrated into Dashboard + My Schedule)
Login, Signup, Company Setup, Dashboard, My Schedule, Team Schedule, Assign Shift (modal), Shift Templates, Template Form, Team People, Invite People, Company Settings, Employees List, Admin Dashboard.

### MVP API Endpoints (subset of spec/01-api-spec.md)
NOTE: All endpoints use the `/api/v1` prefix. Full details in `spec/01-api-spec.md`.
**Public**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`
**Companies**: `GET /api/v1/companies/:id`, `PATCH /api/v1/companies/:id`
**Teams**: `GET /api/v1/teams`, `POST /api/v1/teams`, `PATCH /api/v1/teams/:id`, `DELETE /api/v1/teams/:id`
**People**: `GET /api/v1/people`, `POST /api/v1/people`, `GET /api/v1/people/:id`, `PATCH /api/v1/people/:id`, `DELETE /api/v1/people/:id`, `POST /api/v1/people/:id/invite`
**Shift Templates**: `GET /api/v1/teams/:tid/shift-templates`, `POST /api/v1/teams/:tid/shift-templates`, `PATCH /api/v1/shift-templates/:id`, `DELETE /api/v1/shift-templates/:id`
**Shifts**: `GET /api/v1/shifts`, `GET /api/v1/shifts/:id`, `POST /api/v1/shifts`, `PATCH /api/v1/shifts/:id`, `DELETE /api/v1/shifts/:id`, `POST /api/v1/shift-templates/:tid/expand`, `POST /api/v1/teams/:tid/schedules/publish`
**Assignments**: `POST /api/v1/shifts/:sid/assign`, `DELETE /api/v1/shift-assignments/:id`, `GET /api/v1/shifts/:sid/assignments`
**Clock**: `POST /api/v1/clock/clock-in`, `POST /api/v1/clock/:cid/clock-out`, `GET /api/v1/people/:pid/clock-entries`
**Admin**: `GET /api/v1/admin/companies`, `PATCH /api/v1/admin/companies/:cid`, `GET /api/v1/admin/audit-log`
**Calendar**: `GET /api/v1/me/schedule`, `GET /api/v1/teams/:tid/schedule`

### MVP Effort Estimate
~38.5 days / 8 weeks (19 backend, 19.5 frontend)

## Post-MVP Phases

| Phase | What ships |
|-------|-----------|
| **Phase A** — Before the shift | Self-scheduling, calendar export (iCal/webcal), notification upgrades (reminders, digest, change alerts) |
| **Phase B** — During the shift | Break tracking (meal/rest), mobile/PWA, real-time attendance view |
| **Phase C** — After the shift | Reports (attendance, overtime, coverage), payroll export, audit + compliance UI |
| **Phase D** — Scale & enterprise | Multi-region data residency, SSO/SAML/OIDC, billing/plans, public API |

## Key specs quick reference

- **Database**: `db/02-schema.sql` — 30+ tables, all UUID PKs, TIMESTAMPTZ in UTC, RLS enabled on all data tables, HMAC-chained audit, append-only clock triggers
- **RBAC**: `spec/02-rbac-matrix.md` — 3 layers: RLS (DB), middleware (app), UI (frontend); 4 roles in full spec and MVP
- **Sessions**: `spec/06-session-management.md` — 7-day sliding sessions, extended +7d on API call within 24h of expiry
- **Calendar export**: `spec/03-calendar-export-spec.md` — RFC 5545 .ics, webcal subscription with secret token (MVP+)
- **Pagination**: `spec/04-pagination.md` — offset-based with cursor-readiness, default 50 per page
- **Webhooks**: `spec/05-webhooks.md` — event catalog, HMAC signatures, retry with backoff (MVP+)

## Compliance (research / reference — not MVP implementation)

| Doc | Coverage |
|-----|----------|
| `01-GDPR.md` | Full GDPR plan — rights, erasure, portability, DPA, breach notification, DPIA |
| `02-CCPA.md` | CCPA/CPRA rights, service provider vs contractor, annual metrics |
| `03-SOC2.md` | SOC 2 Type I target — 5 trust criteria mapped to controls |
| `04-HIPAA.md` | HIPAA mode toggle, PHI identification, security rule, BAA requirements |
| `05-security.md` | Security architecture — network, app, data, secrets, SDLC, pen testing |
| `06-data-residency.md` | Multi-region sharding strategy (Phase D) |
| `07-incident-response-plan.md` | IR plan — severity levels, team, response phases, notification requirements |
| `08-Australia.md` | Australian Privacy Principles, NDB scheme, APP 8 cross-border |

## Audit checklist (verify before implementing)

1. Every feature in MVP must be in the MVP-In list
2. No MVP feature references a deferred table/column
3. Architecture decisions above are honored (no join table, expand-on-publish, etc.)
4. API endpoints match MVP subset only
5. Schema simplifications are applied (no `draft` status, no `slack` channel, etc.)
6. Cross-doc numbers match (session lifetime=7d, same role names, etc.)

## Recommended implementation stack

- Backend: Node.js/TypeScript or Python
- Frontend: React (routing, state management, UI library TBD)
- DB: PostgreSQL (pgcrypto, citext extensions required)
- Email: SendGrid / SES / Resend
- RRULE library: `rrule` npm package (TypeScript), `dateutil.rrule` (Python)
- Hosting: AWS/GCP/Azure with multi-region capability
