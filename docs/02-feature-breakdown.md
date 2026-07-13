# Feature Breakdown & Implementation Roadmap

This document breaks every feature into atomic units and organizes them into implementation phases. Each phase is self-contained and deployable.

---

## Phase 1: Foundation (Core Infrastructure)

### P1.1 — Project Scaffolding
- [ ] Initialize monorepo structure (frontend + backend + shared)
- [ ] Database connection pool + migrations runner
- [ ] Environment configuration (dev/staging/prod)
- [ ] CI/CD pipeline skeleton (lint, test, build, deploy)
- [ ] Logging, error tracking, health check endpoint

### P1.2 — Multi-Tenant Company Model
- [ ] Create `companies` table with tenant isolation key
- [ ] Company signup endpoint (POST /api/companies)
- [ ] Row-Level Security (RLS) policies scoping all queries to `company_id`
- [ ] Per-company configuration (timezone, locale, branding)
- [ ] Soft-delete with 30-day retention window

### P1.3 — Authentication & Session Management
- [ ] User registration with email + hashed password (bcrypt, cost 12)
- [ ] Login with session token (no refresh tokens for MVP — 7d sliding session)
- [ ] Session invalidation on logout

### P1.4 — RBAC Foundation
- [ ] `roles` table with system roles: super_admin, company_admin, manager, employee
- [ ] `permissions` and `role_permissions` join tables (post-MVP; MVP hardcodes permissions in middleware)
- [ ] Role assignment during invite or by company admin
- [ ] Permission check middleware / guard on every protected route
- [ ] Default role seeding on company creation

### P1.5 — Org Hierarchy (Teams & People)
- [ ] `teams` table with company_id, name, manager_id
- [ ] `people` table with company_id, team_id, name, email, timezone, role, status
- [ ] Person profile CRUD (company admin only)
- [ ] Team CRUD (company admin and manager)
- [ ] Cross-team assignment junction table `team_memberships` (post-MVP — MVP uses single team per person)

---

## Phase 2: Scheduling

### P2.1 — Shift Templates
- [ ] `shift_templates` table: title, description, duration_minutes, required_count, team_id
- [ ] Template CRUD (manager role)
- [ ] Template listing with team filter

### P2.2 — RRULE Recurrence Engine
- [ ] Recurrence rules per template (FREQ, INTERVAL, BYDAY, BYMONTHDAY, etc.)
- [ ] Recurrence expansion to concrete instances within a date range
- [ ] Recurrence exceptions (cancel/modify a single occurrence)
- [ ] Store expanded instances in `shift_instances` or compute on read (see db/03-rrule-storage.md)

### P2.3 — Self-Scheduling Workflow
- [ ] Employee sees available open shifts (not yet assigned)
- [ ] Employee requests assignment (shift request)
- [ ] Manager dashboard to approve/bulk/deny requests
- [ ] Auto-assignment fallback: if no request submitted by cutoff, manager assigns
- [ ] Employee swap requests (manager must approve — No self-swap model)

### P2.4 — Conflict Detection
- [ ] Double-booking prevention (same person, overlapping shift)
- [ ] Overtime rules > 40h/week or > 12h/day configurable per company
- [ ] Minimum rest period between shifts (configurable, default 8h)
- [ ] Conflict highlight in UI (red indicator, tooltip with reason)

### P2.5 — Published Schedule
- [ ] Draft → Published workflow (lock shifts against further changes)
- [ ] Published schedule view (read-only for employees)
- [ ] Re-publish triggers diff notification

### P2.6 — Clock In/Out
- [ ] Clock-in button on web UI (requires active shift assignment)
- [ ] Clock-out button, records actual end time
- [ ] Immutable clock_entries table (append-only)
- [ ] Grace period / late clock-in handling
- [ ] Clock status indicator on schedule view

---

## Phase 3: Reports

### P3.1 — Attendance Reports
- [ ] Actual vs scheduled delta per person per period
- [ ] Missed clock-ins (scheduled shift with no clock entry)
- [ ] Overtime calculation
- [ ] Export to CSV

---

## Phase 4: Calendar & Export

### P4.1 — UI Calendar Views
- [ ] Month view with shift blocks, color-coded by team
- [ ] Week view with hour-grid details
- [ ] Day view with clock in/out overlays
- [ ] Timezone toggle (local TZ vs person's TZ vs company TZ)
- [ ] Navigation (prev/next, jump to today)

### P4.2 — iCal Export
- [ ] Generate RFC 5545 compliant .ics file for a single person or entire team
- [ ] Include RRULE recurrences as VTIMEZONE components
- [ ] Include clock-in/out events (optional)
- [ ] Download button on calendar view

### P4.3 — Webcal Subscription
- [ ] Generate unique, secret subscription URL per person
- [ ] CalDAV-compatible endpoint returning .ics
- [ ] URL rotation on demand
- [ ] Cache with ETag for efficient polling

---

## Phase 5: Notifications

### P5.1 — Email Infrastructure
- [ ] Transactional email provider integration (Resend / SendGrid / SES)
- [ ] Email templates (welcome, shift assigned, shift changed, shift cancelled, reminder)
- [ ] Queue-based sending (non-blocking, retry with backoff)
- [ ] Bounce / complaint handling

### P5.2 — Scheduled Notifications
- [ ] Reminder trigger: X minutes/hours before shift start
- [ ] Daily digest email (tomorrow's schedule)
- [ ] Notification preference per person (opt-in/out of categories)

---

## Phase 6: Audit & Compliance

### P6.1 — Immutable Audit Log
- [ ] Database triggers: INSERT only, never UPDATE/DELETE on audit_entries and clock_entries
- [ ] HMAC chain (each entry includes hash of previous entry)
- [ ] Audit log query API (company admin + super admin only)
- [ ] Retention policy (minimum 3 years for SOC 2 / GDPR)

### P6.2 — Data Deletion / Export
- [ ] Right to erasure endpoint (company admin triggers deletion of person)
- [ ] Data portability export (JSON dump of person's data)
- [ ] Company deletion with 30-day grace hard-delete
- [ ] Clock entries use `ON DELETE SET NULL` — records preserved after person deletion (GDPR §3.3)

### P6.3 — Compliance Violation Tracking
- [ ] `compliance_violations` table: records missed breaks, late clock-ins, overtime violations, rest period violations
- [ ] Auto-detected by system on clock-out (meal/rest breaks) or schedule publish (overtime, rest periods)
- [ ] Status workflow: open → acknowledged → resolved / dismissed
- [ ] Compliance report backed by violations table
- [ ] Notifications to manager on critical violations

### P6.4 — Encryption
- [ ] TLS 1.3 in transit (terminated at load balancer)
- [ ] AES-256 encryption at rest (database-level or EBS-level)
- [ ] Customer-managed key support (KMS / Cloud HSM)

---

## Phase 7: Hardening & Polish

### P7.1 — Rate Limiting & Throttling
- [ ] Per-endpoint rate limits (POST: 10/min, GET: 60/min default)
- [ ] Burst protection sliding window

### P7.2 — Monitoring & Alerting
- [ ] Metrics dashboards (requests, latency, errors, audit log size)
- [ ] Alerts on p50 > 1s, error rate > 1%, uptime drops
- [ ] Audit monitoring (anomalous access patterns)

### P7.3 — Multi-Region Data Residency (see compliance/06-data-residency.md)

---

## Phase 7.5: MVP+ (Deferred from Phase 1)

The following are deferred from Foundation/Phase 1 to reduce MVP scope. See `docs/04-mvp-plan.md` for the full deferral rationale.

| Feature | Original Phase | Notes |
|---|---|---|
| Password reset flow (email with reset link, 15-min expiry) | P1.3 | Deferred: admin resets via direct support in MVP |
| Rate limiting on auth endpoints | P1.3 | Deferred to hardening phase |
| Refresh token rotation | P1.3 | 7d sliding sessions replace refresh tokens for MVP |

## Phase 8: Post-v1 (Future)

| Feature | Notes |
|---|---|
| Mobile app (iOS/Android) | Push notifications, GPS clock-in |
| Public REST API | Rate-limited, API keys per company |
| SSO (SAML/OIDC) | Enterprise SSO support |
| Payroll integration | Export hours to Gusto, ADP, etc. |
| Shift market / bidding | Employees bid on premium shifts |
| ML-based scheduling | Auto-optimize schedule for coverage and preference |