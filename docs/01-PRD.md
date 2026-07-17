# Product Requirements Document: Global Roster Application

## 1. Executive Summary

A multi-tenant, web-based roster application that enables globally distributed teams to manage employee scheduling across time zones. Each company operates as an isolated tenant with their own teams, people, schedules, and shift rules. The application supports full RRULE-based recurrence, self-scheduling workflows, time-clock tracking, comprehensive audit trails, and compliance with GDPR, CCPA, SOC 2, and HIPAA.

## 2. Product Vision

Empower any organization — from a single-site team to a multinational enterprise — to manage their workforce schedule with confidence, regardless of where their people are. Every shift is timezone-aware. Every change is audited. Every person sees their schedule in their own local time.

## 3. Target Audience

| Persona | Description | Needs |
|---|---|---|
| Super Admin | Platform operator | Manage all tenants, billing, infrastructure, compliance |
| Company Admin | Multi-tenant company owner | Configure company settings, manage teams, view all schedules, audit logs, handle compliance |
| Manager | Team/department lead | Define shift templates, approve employee availability, view coverage, manage shift swaps, approve time-off |
| Employee | Scheduled team member | View my schedule, submit availability, clock in/out, export to personal calendar, request time-off |

## 4. Core Features (v1)

### 4.1 Multi-Tenant Company Management
- Company signup with unique tenant ID (subdomain or domain-based)
- Per-company configuration: name, locale, default timezone, branding (logo, primary color), subscription plan
- Invite-based member onboarding (email invite → create password → join company)
- Soft-delete companies with data retention policies
- **CSV import/export** for bulk employee and shift data migration
- **Company-level feature flags** (toggle HIPAA mode, self-scheduling on/off, etc.)

### 4.2 Org Hierarchy

```
Company
 ├── Locations / Sites (optional)
 │    └── Teams
 └── Teams
      ├── Positions / Roles (e.g. Cashier, Nurse, Engineer)
      └── People
           └── Skills / Certifications
```

- Each person belongs to exactly one primary team; can be cross-assigned to additional teams
- Employee profile: name, email, timezone, role, status (active/inactive), start date, **employee ID (external)**
- Manager/lead designation per team
- **Locations/Sites** — companies with multiple physical sites (stores, warehouses, clinics) can group teams by location
- **Positions** — reusable job roles (e.g. "Cashier", "Registered Nurse") that templates and shifts are associated with; multiple people can hold the same position
- **Skills/Certifications** — track qualifications per person (e.g. "Forklift Certified", "CPR"); shifts can require specific skills; system highlights unqualified assignments

### 4.3 Authentication & Authorization
- Email + password authentication
- Session-based auth (MVP: no refresh tokens — 7d sliding sessions; MVP+ adds refresh token rotation)
- Strict multi-tenant data isolation
- Roles with granular permissions (see RBAC matrix)
- **Passwordless magic link** login (MVP+, post-v1)
- **Multi-factor authentication (TOTP)** — required in HIPAA mode, optional otherwise

### 4.4 Shift Scheduling (Manager-Driven with Self-Scheduling Path)
- Manager defines shift templates: title, duration, position, **required skills**, required count, recurrence
- Employees view available shifts and request assignments
- Manager reviews and publishes finalized schedules
- Conflict detection for double-booking, overtime, **minimum rest period**, **skills mismatch**
- Full RRULE (RFC 5545) recurrence support
- **Bulk shift operations**: create, assign, move, or delete many shifts at once
- **Shift swap/trade**: employees can offer a shift to a teammate; manager approves or auto-approves
- **Draft/published** workflow with version diff on re-publish

### 4.5 Time Clock
- Employees clock in/out via web UI (**and mobile PWA** — v1+)
- **GPS location capture** on clock-in (v1+)
- **Break tracking**: clock out for meal break, clock back in (v1+)
- Tracks actual vs scheduled times
- Clock data is immutable (audit requirement)
- Managers can view attendance reports (v1+)
- **Grace period** configurable per company (v1+)
- **Early/late notifications** (v1+)

### 4.6 Time-Off & Leave Management (v1+)
- **Employee requests time off** (full day, partial day, hourly) with type (vacation, sick, personal, holiday)
- **Manager approval workflow** with optional chain of approval
- **Leave calendar** visible to team to prevent scheduling gaps
- **Blackout dates** — employee is automatically excluded from shift assignments during time-off
- **Accrual tracking** (optional): track PTO/sick leave balance per employee
- **Company holiday calendar**: mark company-wide days off; no shifts generated on holidays

### 4.7 Labor Law Compliance (v1+)
- **Automatic overtime detection**: configurable thresholds (daily > 8h, weekly > 40h, California daily > 12h)
- **Meal break compliance**: trigger if shift > 5 hours and no break clocked (6h for CA)
- **Rest break compliance**: trigger if shift > 4 hours without a rest period
- **Minimum rest between shifts**: enforce 8-hour gap (configurable per location/state)
- **Predictive scheduling laws** (future): post schedule N days in advance; penalty for last-minute changes
- **Configurable per state/province**: rules vary by jurisdiction; companies configure where each location/team operates

### 4.8 Calendar & Export (v1+)
- Month / Week / Day views with timezone‑aware rendering (viewer's local TZ or toggle to employee's TZ)
- Individual "My Schedule" view with subscribe link
- **iCal (.ics) export** for downloading schedules
- **Webcal subscription** for live, auto-updating calendar sync
- **Google Calendar direct sync** (2-way: push shifts to Google Calendar, pull external events as conflicts)
- **PDF printable schedule** (weekly view for printing/postings where digital access is limited)

### 4.9 Notifications (v1+)
- **Transactional email**: Shift assignment, change, cancellation, clock reminders, time-off approvals
- Configurable reminder lead time (e.g., 1 hour before, 1 day before)
- Queue-based email delivery via transactional email provider (Resend / SendGrid / SES)
- **Slack / Microsoft Teams webhook integration** for shift notifications
- **Push notifications** via PWA or mobile app
- Notification preference per person (channel + opt-in/out by type)
- **Daily digest**: "Tomorrow's schedule" email

### 4.10 Audit Log
- Immutable, append-only log of all state changes
- Records: actor, action, resource type, resource ID, old/new values, timestamp
- **Audit log UI** with search, filters, date range, CSV export (v1+)

### 4.11 Reporting (v1+)
- **Attendance report**: scheduled vs actual hours, late count, no-show count, by person/team/date
- **Overtime report**: who exceeded thresholds, by how much, cost impact
- **Coverage report**: % shifts filled vs open, by team/position/week
- **Labor cost report**: hours × pay rate (if rates configured per position/person)
- **Compliance report**: missed breaks, late clock-ins, rest violations
- All reports exportable to CSV

### 4.12 Compliance (v1+)
- GDPR: right to access, rectification, erasure, data portability, consent records
- CCPA: opt-out of sale (none sold), deletion requests, disclosure obligations
- SOC 2: security, availability, processing integrity, confidentiality, privacy
- HIPAA: BAA support, PHI identification for covered entities, access controls, encryption at rest and in transit
- **Labor law compliance**: configurable rules engine per jurisdiction (meal breaks, rest breaks, overtime, predictive scheduling)

## 5. Assumptions & Constraints
- No native mobile app for v1 (PWA with push notifications instead)
- No public API for v1 (internal frontend → backend only)
- No billing/monetization for v1
- PostgreSQL as the primary database (chosen for RLS, JSONB, audit trigger support)
- UTC storage for all timestamps; per-person and per-company timezone for display
- Cloud deployment (AWS / GCP / Azure) with multi-region capability

## 6. Success Metrics
- Tenant onboarding time < 5 minutes
- Shift creation to published schedule latency < 2 seconds p95
- Calendar export endpoint response < 500ms
- Audit log write latency < 50ms
- 99.9% uptime (target)
- Zero data leakage across tenants (annually verified)
- **Employee no-show rate reduction of 20% within 3 months of adoption**
- **Manager time spent scheduling reduced by 50% vs manual process**

## 7. Out of Scope (v1)

| Feature | Rationale |
|---|---|
| Mobile native apps (iOS/Android) | PWA covers MVP needs; native apps post-v1 |
| Public REST API | Internal only for v1; public API with rate limits later |
| Time-off accrual / PTO balance tracking | Complex, requires payroll integration; post-v1 |
| Predictive scheduling law engine | Emerging regulation, varies by city; post-v1 |
| Payroll integration (Gusto, ADP) | Depends on stable clock data; Phase C |
| Shift differential / pay rate engine | Cost tracking feature; Phase D |
| AI/ML auto-scheduling | Requires historical data volume; post-v1 |
| SCIM provisioning | Enterprise SSO feature; Phase D |