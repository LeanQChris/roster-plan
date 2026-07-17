# API Specification

Base URL: `https://{company-slug}.rosterapp.com/api/v1`

All endpoints require authentication unless marked as public. Auth via `Authorization: Bearer <session_token>`.

---

## 1. Authentication

### POST /api/v1/auth/register
Create a new company + initial company admin account.
```json
{
  "company_name": "Acme Corp",
  "email": "admin@acme.com",
  "password": "Str0ng!Pass",
  "timezone": "America/New_York"
}
```
→ `201` → `{ "user": { id, email }, "company": { id, slug }, "session_token": "..." }`

### POST /api/v1/auth/login
```json
{ "email": "admin@acme.com", "password": "Str0ng!Pass" }
```
→ `200` → `{ "session_token", "user", "company" }`
Note: `refresh_token` is not included in MVP. Session sliding extension (7d +7d) replaces refresh token rotation for MVP.

### POST /api/v1/auth/refresh
> **MVP+**: Not available in MVP. Session sliding extension replaces this.
```json
{ "refresh_token": "..." }
```
→ `200` → `{ "session_token", "refresh_token" }`

### POST /api/v1/auth/logout
→ `204`

### POST /api/v1/auth/forgot-password (MVP+)
```json
{ "email": "admin@acme.com" }
```
→ `202` (always succeeds to prevent enumeration)

### POST /api/v1/auth/reset-password (MVP+)
```json
{ "token": "...", "password": "NewStr0ng!Pass" }
```
→ `200`

### POST /api/v1/auth/magic-link (MVP+)
Request a passwordless login link via email.
```json
{ "email": "admin@acme.com" }
```
→ `202`

### POST /api/v1/auth/magic-link/verify (MVP+)
```json
{ "token": "..." }
```
→ `200` → `{ "session_token", "user", "company" }`

### POST /api/v1/auth/mfa/setup (MVP+)
Enroll TOTP MFA for current user.
→ `200` → `{ "secret": "...", "qr_code_url": "..." }`

### POST /api/v1/auth/mfa/verify (MVP+)
Verify and enable MFA.
```json
{ "totp_code": "123456" }
```
→ `200`

### POST /api/v1/auth/mfa/challenge
Second factor challenge during login (if MFA enabled).
```json
{ "session_token": "...", "totp_code": "123456" }
```
→ `200` → `{ "session_token" }`

---

## 2. Companies (Super Admin / Company Admin)

### GET /api/v1/companies
Super admin only. List all tenants.
→ `200` → `{ "companies": [{ id, name, slug, status, created_at }] }`

### GET /api/v1/companies/:companyId
Company admin+ (scoped to own company unless super admin).
→ `200` → `{ "id", "name", "slug", "timezone", "locale", "branding", "status", "created_at" }`

### PATCH /api/v1/companies/:companyId
```json
{ "timezone": "Europe/London", "branding": { "logo_url": "...", "primary_color": "#3344aa" } }
```
→ `200`

### DELETE /api/v1/companies/:companyId
Soft-delete. Super admin only.
→ `200` → `{ "deleted_at": "..." }`

### GET /api/v1/companies/:companyId/feature-flags
Company admin. List all feature flags for the company.
→ `200` → `{ "flags": [{ flag: "self_scheduling", enabled: true }] }`

### PATCH /api/v1/companies/:companyId/feature-flags
```json
{ "flag": "self_scheduling", "enabled": true }
```
→ `200`

### GET /api/v1/companies/:companyId/export (MVP+)
CSV export of all company data (people, shifts, clock entries).
Query: `?resource=shifts&from=DATE&to=DATE`.
→ `200` → CSV file download (`Content-Type: text/csv`)

### POST /api/v1/companies/:companyId/import (MVP+)
Bulk CSV import for people or shifts.
`Content-Type: multipart/form-data`
```json
{ "file": "...csv", "resource": "people" }
```
→ `202` → `{ "imported": 45, "errors": 2, "error_rows": [{ row: 12, reason: "Duplicate email" }] }`

---

## 3. Locations

> **⚠ MVP STATUS**: Locations CRUD is deferred. MVP assumes single-site per company (no locations).

### GET /api/v1/locations
List locations. `?is_active=true`.
→ `200` → `{ "locations": [{ id, name, address, city, state_province, country, timezone }] }`

### POST /api/v1/locations
```json
{ "name": "Downtown Clinic", "address": "123 Main St", "city": "Portland", "state_province": "OR", "country": "US", "timezone": "America/Los_Angeles", "latitude": 45.5152, "longitude": -122.6784, "geofence_radius_meters": 100 }
```
→ `201`

### PATCH /api/v1/locations/:locationId
→ `200`

### DELETE /api/v1/locations/:locationId
→ `200` (reassign teams/locations first)

---

## 4. Positions

> **⚠ MVP STATUS**: Positions CRUD is deferred to MVP+. Shifts work without positions in MVP.

### GET /api/v1/positions
List positions. `?is_active=true`.
→ `200` → `{ "positions": [{ id, name, description, pay_rate }] }`

### POST /api/v1/positions
```json
{ "name": "Registered Nurse", "description": "RN with active license", "pay_rate": 45.00 }
```
→ `201`

### PATCH /api/v1/positions/:positionId
→ `200`

### DELETE /api/v1/positions/:positionId
→ `200`

---

## 5. Skills

> **⚠ MVP STATUS**: Skills CRUD is deferred to MVP+. No qualification validation in MVP.

### GET /api/v1/skills
List skills. `?is_active=true`.
→ `200` → `{ "skills": [{ id, name, description }] }`

### POST /api/v1/skills
```json
{ "name": "CPR Certified", "description": "Valid CPR certification" }
```
→ `201`

### PATCH /api/v1/skills/:skillId
→ `200`

### DELETE /api/v1/skills/:skillId
→ `200`

### POST /api/v1/people/:personId/skills
Assign a skill to a person.
```json
{ "skill_id": "uuid", "acquired_at": "2025-01-15", "expires_at": "2027-01-15" }
```
→ `201`

### DELETE /api/v1/people/:personId/skills/:skillId
Remove skill from person.
→ `200`

### GET /api/v1/people/:personId/skills
List skills assigned to a person.
→ `200` → `{ "skills": [{ skill_id, name, acquired_at, expires_at }] }`

---

## 6. Teams (Company Admin / Manager)

### GET /api/v1/teams
List teams. `?location_id=X`.
→ `200` → `{ "teams": [{ id, name, location_id, manager_id, member_count }] }`

### POST /api/v1/teams
```json
{ "name": "Engineering", "location_id": "uuid", "manager_id": "person_uuid" }
```
→ `201`

### PATCH /api/v1/teams/:teamId
```json
{ "name": "Engineering (Core)", "location_id": "new_uuid", "manager_id": "new_person_uuid" }
```
→ `200`

### DELETE /api/v1/teams/:teamId
→ `200` (reassign members first)

---

## 7. People (Company Admin / Manager)

### GET /api/v1/people
List people in the company. Filters: `?team_id=X&status=active&role=employee&position_id=Y&location_id=Z`.
→ `200` → `{ "people": [{ id, name, email, timezone, role, team_id, position_id, location_id, employee_id, status, mfa_enabled }] }`

### POST /api/v1/people
Create person → sends invite email.
```json
{
  "name": "Jane Doe",
  "email": "jane@acme.com",
  "phone": "+15051234567",
  "timezone": "America/Los_Angeles",
  "team_id": "uuid",
  "position_id": "uuid",
  "location_id": "uuid",
  "employee_id": "EMP-00123",
  "role": "employee"
}
```
→ `201`

### GET /api/v1/people/:personId
→ `200` → `{ id, name, email, phone, timezone, role, team_id, position_id, location_id, employee_id, status, mfa_enabled, created_at, updated_at }`

### PATCH /api/v1/people/:personId
```json
{ "timezone": "Europe/Berlin", "position_id": "new_uuid", "status": "inactive" }
```
→ `200`

### DELETE /api/v1/people/:personId
GDPR erasure — deletes personal data, anonymizes audit trail.
→ `200`

### GET /api/v1/people/:personId/export
GDPR data portability.
→ `200` → `{ "person": {...}, "shifts": [...], "clock_entries": [...], "time_off": [...], "audit_entries": [...] }`

### POST /api/v1/people/:personId/invite
Re-send invite email.
→ `200`

---

## 8. Shift Templates (Manager)

### GET /api/v1/teams/:teamId/shift-templates
→ `200` → `{ "templates": [{ id, title, position_id, duration_minutes, required_count, max_count, rrule, skills: [...], is_active }] }`

### POST /api/v1/teams/:teamId/shift-templates
```json
{
  "title": "Morning Support",
  "description": "Front-line support shift",
  "duration_minutes": 480,
  "required_count": 2,
  "max_count": 3,
  "start_time": "08:00",
  "timezone": "America/New_York",
  "position_id": "uuid",
  "rrule": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  "is_active": true,
  "skip_holidays": true,
  "required_skills": [{ "skill_id": "uuid", "min_count": 1 }],
  "team_id": "uuid"
}
```
→ `201` → `{ "template": {...} }`

### PATCH /api/v1/shift-templates/:templateId
→ `200`

### DELETE /api/v1/shift-templates/:templateId
→ `200`

### POST /api/v1/shift-templates/:templateId/expand
Expand an RRULE template into concrete instances for a date range.
```json
{ "start": "2026-07-01", "end": "2026-12-31" }
```
→ `200` → `{ "shifts": [{ start_at, end_at, date }] }`

---

## 9. Shifts (Scheduled Instances)

### GET /api/v1/shifts
Query with `?team_id=X&location_id=Y&position_id=Z&start=2026-07-01&end=2026-07-31&person_id=Y&status=published`.

### GET /api/v1/shifts/:shiftId
→ `200` → `{ id, template_id, team_id, location_id, position_id, start_at, end_at, timezone, assigned_to, required_count, max_count, status, skills: [...] }`

### POST /api/v1/shifts
Create a single shift instance (not template-based).
```json
{
  "team_id": "uuid",
  "location_id": "uuid",
  "position_id": "uuid",
  "start_at": "2026-07-15T08:00:00Z",
  "end_at": "2026-07-15T16:00:00Z",
  "timezone": "America/New_York",
  "required_count": 1,
  "max_count": 2,
  "title": "Special Ops Shift"
}
```
→ `201`

### PATCH /api/v1/shifts/:shiftId
→ `200`

### DELETE /api/v1/shifts/:shiftId
→ `200`

### POST /api/v1/teams/:teamId/schedules/publish
Expand all active templates for a team and date range, create shifts.
```json
{ "start": "2026-07-13", "end": "2026-07-19" }
```
→ `200` → `{ "shifts_created": 24, "shifts_skipped": 2 (holidays) }`

---

## 10. Shift Assignments

### GET /api/v1/shifts/:shiftId/assignments
List all people assigned to this shift.
→ `200` → `{ "assignments": [{ person_id, person_name, status, requested_at, skills_match: true }] }`

### POST /api/v1/shifts/:shiftId/assignments (Employee — Self-Scheduling) (MVP+)
```json
{ "person_id": "uuid" }
```
→ `201` → status = `pending` (needs manager approval)

### POST /api/v1/shifts/:shiftId/assign (Manager) — MVP
```json
{ "person_id": "uuid", "force": false }
```
→ `201` → status = `approved`. `force: true` bypasses conflict detection.

### PATCH /api/v1/shift-assignments/:assignmentId (Manager approve/deny)
```json
{ "status": "approved" }
```
→ `200`

### DELETE /api/v1/shift-assignments/:assignmentId
Remove assignment. → `200`

---

## 11. Shift Swaps

> **⚠ MVP STATUS**: Shift swaps are deferred to MVP+. Do not implement during MVP.

### POST /api/v1/shift-assignments/:assignmentId/swap-request
Request a swap.
```json
{ "target_id": "person_uuid" }
```
→ `201` → `{ "swap_request": { id, status: "pending" } }`

### PATCH /api/v1/swap-requests/:swapId/accept
Target employee accepts swap.
→ `200`

### PATCH /api/v1/swap-requests/:swapId/manager-decision
Manager approves or denies swap.
```json
{ "approved": true }
```
→ `200`

### GET /api/v1/teams/:teamId/swap-requests
List pending swap requests for a team.
→ `200` → `{ "requests": [...], "count": 3 }`

---

## 12. Clock Entries

### POST /api/v1/clock/clock-in
```json
{ "shift_assignment_id": "uuid", "latitude": 45.5152, "longitude": -122.6784, "notes": "" }
```
> `latitude`/`longitude` (GPS) are MVP+; clock-in in MVP sends `shift_assignment_id` and `notes` only.
→ `201` → `{ "id", "clock_in_at", "latitude", "longitude", "status": "active" }`

### POST /api/v1/clock/:clockEntryId/clock-out
```json
{ "notes": "Overtime approval pending" }
```
→ `200` → `{ "id", "clock_in_at", "clock_out_at", "duration_minutes" }`

### POST /api/v1/clock/:clockEntryId/break-in (MVP+)
Start meal break.
→ `200` → `{ "break_in_at": "..." }`

### POST /api/v1/clock/:clockEntryId/break-out (MVP+)
End meal break.
```json
{ "notes": "" }
```
→ `200` → `{ "break_in_at", "break_out_at", "break_duration_minutes" }`

### GET /api/v1/people/:personId/clock-entries
Query: `?from=2026-07-01&to=2026-07-31`.
→ `200` → `{ "entries": [...], "total_actual_minutes": 9600, "total_scheduled_minutes": 9600, "total_break_minutes": 300 }`

### GET /api/v1/teams/:teamId/attendance (MVP+)
Live attendance view.
Query: `?date=2026-07-13`.
→ `200` → `{ "shifts": [{ shift_id, title, start_at, end_at, people: [{ person_id, name, clocked_in_at, clocked_out_at, status: "on_time"|"late"|"no_show"|"on_break" }] }] }`

---

## 13. Time-Off Requests

> **⚠ MVP STATUS**: Time-off requests are deferred to MVP+. Do not implement during MVP.

### GET /api/v1/people/:personId/time-off
List time-off for a person. `?status=approved&from=DATE&to=DATE`.
→ `200` → `{ "requests": [{ id, type, start_at, end_at, status, reason, reviewed_by }] }`

### POST /api/v1/people/:personId/time-off
Request time-off. `?status=approved&from=DATE&to=DATE`.
```json
{ "type": "vacation", "start_at": "2026-08-01T00:00:00Z", "end_at": "2026-08-07T23:59:59Z", "reason": "Family vacation" }
```
→ `201`

### PATCH /api/v1/time-off/:requestId
Update own pending request.
→ `200`

### DELETE /api/v1/time-off/:requestId
Cancel own pending request.
→ `200`

### GET /api/v1/teams/:teamId/time-off (Manager)
View all time-off for a team, filter by status/date.
→ `200` → `{ "requests": [...], "coverage_gaps": [{ date, affected_count }] }`

### PATCH /api/v1/time-off/:requestId/approve (Manager)
```json
{ "status": "approved" }
```
→ `200`

### PATCH /api/v1/time-off/:requestId/deny (Manager)
```json
{ "status": "denied", "reason": "Insufficient coverage that day" }
```
→ `200`

---

## 14. Holidays

> **⚠ MVP STATUS**: Holidays CRUD is deferred to MVP+. No holiday exclusion during expansion in MVP.

### GET /api/v1/holidays
List company holidays. `?year=2026`.
→ `200` → `{ "holidays": [{ id, name, date, is_recurring, paid }] }`

### POST /api/v1/holidays
```json
{ "name": "Christmas Day", "date": "2026-12-25", "is_recurring": true, "paid": true }
```
→ `201`

### DELETE /api/v1/holidays/:holidayId
→ `200`

---

## 15. Calendar / Export

> **⚠ MVP STATUS**: `GET /api/v1/me/schedule` and `GET /api/v1/teams/:teamId/schedule` are in MVP (read-only week calendar view). iCal export, webcal, and PDF are deferred to MVP+.

### GET /api/v1/me/schedule
Current user's personal schedule. `?start=ISO&end=ISO`.
→ `200` → shifts with assigned status, clock status, timezone info

### GET /api/v1/teams/:teamId/schedule
Full team schedule. Same query params and response.

### GET /api/v1/people/:personId/calendar.ics
Returns `text/calendar` .ics file for download.

### GET /api/v1/people/:personId/webcal.ics
Returns .ics for webcal subscription. `?token=<subscription_token>`.
Accepts `If-None-Match` for caching.

### GET /api/v1/teams/:teamId/calendar.ics
Team-wide calendar export.

### GET /api/v1/teams/:teamId/schedule.pdf (MVP+)
PDF printable weekly schedule.
→ `200` → `Content-Type: application/pdf`

---

## 16. Reports

> **⚠ MVP STATUS**: Reports are deferred to Phase C. Do not implement during MVP.

### GET /api/v1/reports/attendance
`?team_id=X&from=DATE&to=DATE&person_id=Y`.
→ `200` → `{ "rows": [{ person_id, name, scheduled_minutes, actual_minutes, late_count, no_show_count }], "summary": {...} }`

### GET /api/v1/reports/overtime
`?team_id=X&from=DATE&to=DATE`.
→ `200` → `{ "rows": [{ person_id, name, total_hours, threshold_hours, overtime_hours, cost }] }`

### GET /api/v1/reports/coverage
`?team_id=X&from=DATE&to=DATE`.
→ `200` → `{ "rows": [{ date, shift_count, filled_count, gap_count, coverage_pct }] }`

### GET /api/v1/reports/compliance
`?team_id=X&from=DATE&to=DATE`.
→ `200` → `{ "missed_breaks": [...], "late_clock_ins": [...], "rest_violations": [...], "meal_violations": [...] }`

---

## 17. Integrations (Company Admin)

> **⚠ MVP STATUS**: Integrations (Slack, Teams, Google Calendar) are deferred to Phase B+. Do not implement during MVP.

### GET /api/v1/integrations
List configured integrations.
→ `200` → `{ "integrations": [{ id, type, name, is_active, last_sent_at }] }`

### POST /api/v1/integrations
```json
{ "type": "slack", "name": "#shift-alerts", "config": { "webhook_url": "https://hooks.slack.com/...", "channel": "shift-alerts" } }
```
→ `201`

### PATCH /api/v1/integrations/:integrationId
→ `200`

### DELETE /api/v1/integrations/:integrationId
→ `200`

### POST /api/v1/integrations/:integrationId/test
Send a test notification.
→ `200` → `{ "success": true }`

---

## 18. Notifications

> **⚠ MVP STATUS**: Only `shift_assigned` and invite emails are sent in MVP. Notification read/preferences endpoints and other notification types are MVP+.

### GET /api/v1/notifications
List notifications for the current user. `?unread_only=true&type=shift_reminder`.
→ `200` → `{ "notifications": [...], "unread_count": 3 }`

### PATCH /api/v1/notifications/:notificationId/read
Mark as read. → `200`

### PATCH /api/v1/notifications/read-all
→ `200`

### GET /api/v1/notification-preferences
Get current user's notification preferences.
→ `200` → `{ "preferences": [{ type, channel, enabled }] }`

### PATCH /api/v1/notification-preferences
```json
{ "type": "shift_reminder", "channel": "email", "enabled": false }
```
→ `200`

---

## 19. Audit Log

> **⚠ MVP STATUS**: Audit log API endpoint is write-only for MVP (DB triggers capture changes). The GET endpoint is deferred — no query UI in MVP. See `docs/04-mvp-plan.md`.

### GET /api/v1/audit-log
Company-scoped audit log (inferred from session). Query: `?actor_id=X&resource_type=shift&action=create&from=DATE&to=DATE&page=1`.
→ `200` → `{ "entries": [...], "total": 123, "page": 1, "prev_hash": "sha256..." }`

---

## 20. Admin (Super Admin)

### GET /api/v1/admin/companies
List all companies with stats.
Query: `?status=active&page=1&per_page=50`.
→ `200` → `{ "companies": [{ id, name, slug, timezone, status, member_count, created_at, last_active_at }], "total": 12, "page": 1 }`

### PATCH /api/v1/admin/companies/:companyId
Suspend, activate, force delete.
```json
{ "status": "suspended" }
```
→ `200`

### GET /api/v1/admin/audit-log
Platform-wide audit log (all companies).
Query: `?actor_id=X&resource_type=company&action=update&from=DATE&to=DATE&page=1`.
→ `200` → `{ "entries": [...], "total": 123, "page": 1 }`

---

## Error Response Format

All errors follow a consistent shape:
```json
{
  "error": {
    "code": "SHIFT_CONFLICT",
    "message": "Person is already assigned to an overlapping shift on 2026-07-15",
    "details": { "conflicting_shift_id": "uuid" }
  }
}
```

### Error Codes

| Code | When |
|---|---|
| `VALIDATION_ERROR` | Input fails schema validation |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Authenticated but not authorized |
| `TENANT_MISMATCH` | Cross-tenant access attempt |
| `RATE_LIMITED` | Too many requests |
| `SHIFT_CONFLICT` | Overlapping shift assignment |
| `TIME_OFF_CONFLICT` | Person has approved time-off covering this period |
| `SKILL_MISMATCH` | Person lacks required skills for this shift |
| `POSITION_MISMATCH` | Person's position doesn't match shift requirement |
| `OVERTIME_EXCEEDED` | Assignment would exceed overtime threshold |
| `REST_PERIOD_VIOLATION` | Insufficient gap between shifts |
| `MEAL_VIOLATION` | Missing required meal break |
| `BREAK_VIOLATION` | Missing required rest break |
| `CLOCK_ACTIVE` | Person already clocked in |
| `SWAP_SELF` | Cannot swap with yourself |
| `SWAP_CONFLICT` | Target person has conflicting shift |
| `IMPORT_ERROR` | CSV import failed |
| `INTEGRATION_ERROR` | External integration (Slack/Teams) failed |