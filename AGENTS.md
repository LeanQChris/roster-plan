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
| **RBAC (MVP)** | 3 roles hardcoded in middleware: `company_admin`, `manager`, `employee`. No `role_permissions` join table. `super_admin` is DB-only, no UI |
| **Clock entries** | Append-only enforced by triggers. `ON DELETE SET NULL` on person/assignment FKs to preserve records after GDPR erasure |
| **Data residency** | Regional sharding by company — `region_routing` table maps company to DB cluster (Phase D) |
| **Text fields** | VARCHAR limits enforced at DB level, never trust client-side validation |
| **Expand-on-publish** | Schedule is materialized into concrete shift rows on publish, not computed on read |

## MVP Scope (from docs/04-mvp-plan.md)

### What's IN (MVP)
Multi-tenant auth (register, login, logout), company settings, teams CRUD, people CRUD + email invite, shift templates + RRULE, shift publish (expand templates → instances), manager assigns people to shifts, basic week calendar view (read-only for employees), 1 notification email (shift assigned), role gating (3 roles, hardcoded middleware).

### What's DEFERRED (MVP+)
Self-scheduling, clock in/out, time-off requests, shift swaps, positions CRUD, skills/certifications, locations/sites, attendance reports, calendar export (iCal/webcal), notification upgrades (reminders, digest, preferences, Slack/Teams), integrations, timezone toggle, coverage heatmap, conflict detection UI, audit log UI, compliance UI, password reset, rate limiting, webcal.

### MVP Auth Details
- Session tokens stored in DB (SHA256 hash), not JWT
- No refresh tokens (session lasts 7 days, extended on use within 24h of expiry)
- No password reset (admin can reset via direct support)
- No MFA, no magic link

### MVP RBAC
```typescript
const roleHierarchy = { employee: 0, manager: 1, company_admin: 2 };
// User with role X can access any endpoint requiring role <= X
```
Permissions hardcoded in middleware, no join table.

### MVP Schema Simplifications
- `shift_assignments`: no `status` column (always `approved`), no `requested_at`, no `approved_by`
- `shifts`: no `draft` enum value (default `published`, immediately visible)
- `notifications`: `email` channel only (no `slack`, `teams`, `webhook`, `push`)
- `people`: drop `subscription_token`, `data_exported_at`
- `team_memberships`: not needed (single primary team per person)

### MVP UI Screens (13)
Login, Signup, Company Setup, Dashboard, My Schedule, Team Schedule, Assign Shift (modal), Shift Templates, Template Form, Team People, Invite People, Company Settings, Employees List.

### MVP API Endpoints (subset of spec/01-api-spec.md)
**Public**: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
**Companies**: `GET /companies/:id`, `PATCH /companies/:id`
**Teams**: `GET /teams`, `POST /teams`, `PATCH /teams/:id`, `DELETE /teams/:id`
**People**: `GET /people`, `POST /people`, `GET /people/:id`, `PATCH /people/:id`, `DELETE /people/:id`, `POST /people/:id/invite`
**Shift Templates**: `GET /teams/:tid/shift-templates`, `POST /teams/:tid/shift-templates`, `PATCH /shift-templates/:id`, `DELETE /shift-templates/:id`
**Shifts**: `GET /shifts`, `GET /shifts/:id`, `POST /shifts`, `PATCH /shifts/:id`, `DELETE /shifts/:id`, `POST /shift-templates/:tid/expand`, `POST /teams/:tid/schedules/publish`
**Assignments**: `POST /shifts/:sid/assign`, `DELETE /shift-assignments/:id`, `GET /shifts/:sid/assignments`
**Calendar**: `GET /me/schedule`, `GET /teams/:tid/schedule`

### MVP Effort Estimate
~31 days / 6 weeks (16 backend, 15.5 frontend)

## Post-MVP Phases

| Phase | What ships |
|-------|-----------|
| **Phase A** — Before the shift | Self-scheduling, calendar export (iCal/webcal), notification upgrades (reminders, digest, change alerts) |
| **Phase B** — During the shift | Clock in/out + break tracking, mobile/PWA, real-time coverage view |
| **Phase C** — After the shift | Reports (attendance, overtime, coverage), payroll export, audit + compliance UI |
| **Phase D** — Scale & enterprise | Multi-region data residency, SSO/SAML/OIDC, billing/plans, public API |

## Key specs quick reference

- **Database**: `db/02-schema.sql` — 30+ tables, all UUID PKs, TIMESTAMPTZ in UTC, RLS enabled on all data tables, HMAC-chained audit, append-only clock triggers
- **RBAC**: `spec/02-rbac-matrix.md` — 3 layers: RLS (DB), middleware (app), UI (frontend); 4 roles in full spec, 3 in MVP
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
