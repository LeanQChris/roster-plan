# MVP Scoping & Feature Triage Skill

## When to use
Load this skill when evaluating feature requests against MVP scope, planning implementation phases, validating acceptance criteria, or making scope trade-off decisions.

## Key references
- `docs/04-mvp-plan.md` — authoritative MVP scope definition, acceptance criteria, post-MVP roadmap
- `docs/01-PRD.md` — full product requirements (v1 scope)
- `docs/02-feature-breakdown.md` — atomic feature breakdown across all phases
- `docs/03-ux-user-stories.md` — user stories for all features

## MVP scope rules

### What's in (MVP)
| Feature | Rationale |
|---|---|
| Multi-tenant auth | Required for any value |
| Company settings | Required for setup |
| Teams CRUD | Required for org structure |
| People CRUD + invite | Required to have employees |
| Shift templates + RRULE | Core value — recurring schedules |
| Shift instances + publish | Core value — making schedule live |
| Manager assigns shifts | Core value — who works when |
| Basic calendar view | Core value — see the schedule |
| Clock in/out | Core value — track actual hours |
| 1 notification email | Essential feedback loop (shift assigned) |
| Role gating (4 roles) | Security, with super admin oversight |
| Super admin module | Platform management |

### What's deferred (MVP+)
Self-scheduling, attendance reports, calendar export, timezone toggle, coverage heatmap, conflict detection UI, audit log UI, compliance UI, password reset, rate limiting, webcal, break tracking, time-off requests, shift swaps

### Schema simplifications for MVP
Per `docs/04-mvp-plan.md` §Schema Simplifications: the full schema is kept intact — deferred columns remain nullable/unused rather than dropped.
- `shift_assignments`: no approval workflow (status always `approved` after manager assign), `requested_at`/`approved_by` unused
- `shifts`: no `draft`/`published` workflow (status always `published` after expand)
- `notifications`: `email` channel only (no `slack`, `teams`, `webhook`, `push`)
- `people`: `subscription_token`, `data_exported_at` unused
- `team_memberships`: not needed (single primary team per person)

### RBAC simplification
- 4 roles in MVP: `company_admin`, `manager`, `employee`, `super_admin`
- `viewer` role exists in schema (not in MVP)
- `super_admin` is seeded in DB (no signup), has dedicated admin UI
- Permissions hardcoded in middleware (no join table)
- Role hierarchy with level numbers for comparison

### UI simplification
- Week view only (no month/day toggle)
- Single company timezone (no per-user toggle)
- Read-only for employees (no edit/delete)
- 14 screens total (see MVP plan for exact list)

## Implementation phases

### Phase order
```
Week 1-2: Auth, Teams, People (foundation)
Week 3-4: Templates, RRULE, Shifts, Assignments (core scheduling)
Week 5-6: Calendar view, Clock, Dashboard, Emails (employee experience)
Week 7:   Super admin module, Admin UI
Week 8:   Polish, bug fixes, deployment, dogfooding
```

Total: ~38.5 days / 8 weeks (19 backend + 19.5 frontend)

### Key architectual decisions to honor
- Session tokens stored in DB (not JWT) — allows invalidation
- No refresh tokens for MVP (7-day sessions, extend on use)
- RRULE expand on publish, not on read
- Audit log is write-only (no UI) for MVP
- Email sent synchronously (no queue for MVP)
- Single region deployment

## Acceptance criteria (MVP complete)
- [ ] Signup company → set timezone → create team
- [ ] Invite people → they accept → log in
- [ ] Manager creates shift template with RRULE
- [ ] Manager expands templates → concrete shifts for a week
- [ ] Manager assigns people to individual shifts
- [ ] Manager publishes schedule
- [ ] Employee logs in → sees assigned shifts on week calendar
- [ ] Employee receives email when assigned to shift
- [ ] Company admin edits company settings
- [ ] All state changes recorded in audit log
- [ ] Session persists across reloads
- [ ] Logout invalidates session

## Post-MVP roadmap

### Phase A: Before the shift
Self-scheduling → Calendar export → Notifications upgrade

### Phase B: During the shift
Break tracking → Mobile (PWA) → Real-time attendance view

### Phase C: After the shift
Reports & analytics → Payroll export → Audit & compliance UI

### Phase D: Scale & enterprise
Multi-region data residency → SSO/SAML/OIDC → Billing → Public API
