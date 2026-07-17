# Roster

Multi-tenant workforce scheduling platform — manage shifts, teams, and time tracking across global organizations.

## Status

**Design / Spec phase.** Nothing implemented. This repository contains requirements, architecture decisions, compliance research, and a PostgreSQL schema.

## Quick Links

| Area | Key Docs |
|------|----------|
| Product | [PRD](docs/01-PRD.md), [Feature Breakdown](docs/02-feature-breakdown.md), [UX Stories](docs/03-ux-user-stories.md), [MVP Plan](docs/04-mvp-plan.md), [MVP Story (walkthrough)](roster-story.html) |
| API | [Full Spec](spec/01-api-spec.md), [RBAC Matrix](spec/02-rbac-matrix.md), [Pagination](spec/04-pagination.md), [Sessions](spec/06-session-management.md) |
| Database | [Data Model](db/01-data-model.md), [Schema](db/02-schema.sql), [RRULE Strategy](db/03-rrule-storage.md) |
| Architecture | [Overview](spec/07-architecture.md), [ADRs](docs/adr/) |
| Compliance | [GDPR](compliance/01-GDPR.md), [CCPA](compliance/02-CCPA.md), [SOC 2](compliance/03-SOC2.md), [HIPAA](compliance/04-HIPAA.md), [Security](compliance/05-security.md) |


## Architecture Overview

```
Company (multi-tenant)
  ├── Teams
  │    ├── Shift Templates (with RRULE recurrence)
  │    ├── Shifts (concrete instances on publish)
  │    └── People
  └── Locations, Positions, Skills
```

- **Backend**: Node.js/TypeScript or Python
- **Frontend**: React
- **Database**: PostgreSQL with Row-Level Security
- **Auth**: Session tokens (SHA256 hashed in DB), not JWT

## MVP Scope

See [MVP Plan](docs/04-mvp-plan.md). Core deliverable:

> Manager signs up → creates teams → invites people → builds shift templates with recurrence → publishes schedule → assigns people → employees view their week. Clock in/out included for attendance tracking.

Estimated effort: **~38.5 days / 8 weeks** (19 backend, 19.5 frontend).

## Phases

| Phase | Focus |
|-------|-------|
| **MVP** | Core scheduling loop + clock in/out |
| **Phase A** | Self-scheduling, calendar export, reminders |
| **Phase B** | Break tracking, mobile/PWA, live attendance |
| **Phase C** | Reports, payroll export, audit UI |
| **Phase D** | Multi-region, SSO, billing, public API |

## Directory Layout

```
├── docs/          Product requirements, UX stories, MVP plan
├── spec/          API spec, RBAC, pagination, sessions, architecture
├── db/            Data model, SQL schema, RRULE strategy
├── compliance/    GDPR, CCPA, SOC2, HIPAA, security, IR plan
├── docs/adr/      Architecture Decision Records
└── er/            DBML diagram
```
