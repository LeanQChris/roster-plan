# MVP Plan

This document defines the **Minimum Viable Product** — the smallest shippable version that delivers core value: a manager can create shifts, assign people, and everyone can see the schedule.

---

## MVP Scope (What's In)

### Core Workflow
```
Sign up company → Add teams → Invite employees
  → Create shift templates with recurrence
  → Expand & publish schedule for a date range
  → Assign employees to shifts
  → Employees log in and view their schedule
  → Employees clock in/out during their shifts
```

### Features Kept
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
| Clock in / out | Core value — track attendance |
| 1 notification email | Essential feedback loop (shift assigned) |
| Role gating (admin/manager/employee) | Security, but simplified |

### Features Deferred (MVP+)
| Feature | Why Deferred |
|---|---|
| Self-scheduling (employee picks shifts) | Manager-assign is simpler, unblocks initial use |
| Self-scheduling approvals workflow | Builds on self-scheduling |
| Break tracking (meal/rest breaks) | Basic clock in/out sufficient for MVP |
| Time-off / leave requests | Requires approval workflow, separate from scheduling |
| Shift swaps / trades | Builds on shift assignments, requires conflict detection |
| Positions CRUD | Nice-to-have, shifts can be created without named positions |
| Skills / Certifications | Qualification tracking adds scope; MVP doesn't validate skill match |
| Locations / Sites | Single-site assumption is sufficient for first users |
| Attendance reports | Needs clock data |
| Calendar export (iCal / webcal) | Nice-to-have, not critical for first users |
| Notification upgrades (reminders, digest, preferences, Slack/Teams) | Single notification email is sufficient for MVP |
| Integrations (Slack/Teams/Google Calendar) | Manual scheduling flow doesn't need external integrations |
| Timezone toggle | Single company TZ is sufficient for MVP |
| Coverage heatmap | Visualization polish |
| Conflict detection UI | Server-side validation only (no fancy UI) |
| Audit log UI | Store it, don't show it yet |
| Compliance features | Wire up encryption, defer UI/policies |
| Password reset | Deferred to MVP+ |
| Rate limiting | Deferred to hardening phase |
| Webcal subscription | Deferred with calendar export |

---

## Data Model (MVP Subset)

Only these tables are needed for MVP. The full schema in `db/02-schema.sql` has more; MVP uses a flattened subset.

| Table | MVP? | Notes |
|---|---|---|---|
| `companies` | ✅ | Full as designed |
| `company_settings` | ✅ | Required |
| `teams` | ✅ | Full |
| `people` | ✅ | Full |
| `team_memberships` | ❌ | Cross-team assign deferred; primary team is sufficient |
| `shift_templates` | ✅ | Full |
| `recurrence_rules` | ✅ | Full RRULE support |
| `shifts` | ✅ | Full + simplified — no `draft`/`published` workflow for MVP |
| `shift_assignments` | ✅ | Simplified: status is always `approved` (no pending/self-serve) |
| `notifications` | ✅ | Only `email` channel, `pending` → `sent` |
| `audit_entries` | ✅ | Write-only for MVP (no query UI yet) |
| `locations` | ❌ | Single-site assumption for MVP |
| `positions` | ❌ | Role-agnostic shifts work without positions |
| `skills` | ❌ | No qualification validation in MVP |
| `shift_swap_requests` | ❌ | No swap workflow in MVP |
| `time_off_requests` | ❌ | Deferred with time-off feature |
| `clock_entries` | ✅ | Basic clock in/out (no break tracking) |
| `integrations` | ❌ | Deferred |
| `feature_flags` | ❌ | Deferred |
| `compliance_violations` | ❌ | Deferred |
| `region_routing` | ❌ | Phase D feature |

### Schema Simplifications for MVP

```sql
-- shift_assignments: no pending/approval flow. Manager assigns directly.
-- status is always 'approved' for MVP.
ALTER TABLE shift_assignments DROP COLUMN IF EXISTS status;
ALTER TABLE shift_assignments DROP COLUMN IF EXISTS requested_at;
ALTER TABLE shift_assignments DROP COLUMN IF EXISTS approved_by;

-- shifts: no draft/published workflow for MVP.
-- All shifts are immediately visible once created.
-- Drop 'draft' from the enum, default to 'published'.

-- notifications: only email channel for MVP.
-- Ignore 'slack','teams','webhook','push' enum values (post-MVP).

-- people: remove subscription_token, data_exported_at for MVP.

-- clock_entries: no break tracking for MVP. break_in_at/break_out_at columns
-- exist in schema for forward-compat but are not used in MVP.
-- GPS coordinates are optional (no enforcement).
```

---

## API Endpoints (MVP Minimal Set)

The full API spec has more; here is the exact MVP endpoint list.

### Public
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register company + admin |
| POST | `/api/v1/auth/login` | Log in |
| POST | `/api/v1/auth/logout` | Log out |

### Companies
| Method | Path | Who | Description |
|---|---|---|---|
| GET | `/api/v1/companies/:id` | Company admin+ | Read company settings |
| PATCH | `/api/v1/companies/:id` | Company admin | Update company settings |

### Teams
| Method | Path | Who | Description |
|---|---|---|---|
| GET | `/api/v1/teams` | All | List teams in company |
| POST | `/api/v1/teams` | Company admin | Create team |
| PATCH | `/api/v1/teams/:id` | Company admin | Update team |
| DELETE | `/api/v1/teams/:id` | Company admin | Delete team (reassign members first) |

### People
| Method | Path | Who | Description |
|---|---|---|---|
| GET | `/api/v1/people` | All | List people in company (filter by team) |
| POST | `/api/v1/people` | Company admin | Create person (also sends invite email) |
| GET | `/api/v1/people/:id` | All | View person profile |
| PATCH | `/api/v1/people/:id` | Company admin | Edit person |
| DELETE | `/api/v1/people/:id` | Company admin | Soft-delete person |
| POST | `/api/v1/people/:id/invite` | Company admin | Re-send invite email |

### Shift Templates
| Method | Path | Who | Description |
|---|---|---|---|
| GET | `/api/v1/teams/:teamId/shift-templates` | Manager+ | List templates |
| POST | `/api/v1/teams/:teamId/shift-templates` | Manager | Create template |
| PATCH | `/api/v1/shift-templates/:id` | Manager | Update template |
| DELETE | `/api/v1/shift-templates/:id` | Manager | Delete template |

### Shifts
| Method | Path | Who | Description |
|---|---|---|---|
| GET | `/api/v1/shifts` | Manager+ | Query (`?team_id=X&start=ISO&end=ISO`) |
| GET | `/api/v1/shifts/:id` | All | View single shift |
| POST | `/api/v1/shifts` | Manager | Create ad-hoc shift |
| PATCH | `/api/v1/shifts/:id` | Manager | Edit shift |
| DELETE | `/api/v1/shifts/:id` | Manager | Cancel shift |
| POST | `/api/v1/shift-templates/:templateId/expand` | Manager | Expand RRULE into instances for a date range |
| POST | `/api/v1/teams/:teamId/schedules/publish` | Manager | Expand all active templates for range and create shifts |

### Assignments
| Method | Path | Who | Description |
|---|---|---|---|
| POST | `/api/v1/shifts/:shiftId/assign` | Manager | Assign person to shift |
| DELETE | `/api/v1/shift-assignments/:id` | Manager | Remove assignment |
| GET | `/api/v1/shifts/:shiftId/assignments` | Manager+ | List assignments for shift |

### Clock
| Method | Path | Who | Description |
|---|---|---|---|
| POST | `/api/v1/clock/clock-in` | Employee | Clock in to an assigned shift |
| POST | `/api/v1/clock/:clockEntryId/clock-out` | Employee | Clock out from shift |
| GET | `/api/v1/people/:personId/clock-entries` | Self, Manager+ | View clock entries for range (`?from=&to=`) |

### Calendar (Employee-facing)
| Method | Path | Who | Description |
|---|---|---|---|
| GET | `/api/v1/me/schedule` | Employee | `?start=ISO&end=ISO` → my shifts for range (includes clock status) |
| GET | `/api/v1/teams/:teamId/schedule` | Manager+ | Full team schedule for range |

---

## MVP User Flows (End-to-End)

### Flow 1: Company Setup (done once)

```
1. User goes to /signup
2. Fills: Company Name, Email, Password
3. Clicks "Create Company"
4. Auto-logged in → redirected to /company/setup
5. Sets: Company timezone, creates first team name
6. Clicks "Invite Team" → /invite page
7. Enters employee emails one by one or bulk paste
8. Each gets invite email with signup link
9. Done → Dashboard
```

### Flow 2: Manager Creates Schedule (weekly flow)

```
1. Manager logs in → Dashboard → "Schedule" tab
2. Selects a team from dropdown
3. Clicks "Create Schedule" for week of July 13–19
4. Sees a list of active shift templates for the team
5. Clicks "Expand" on a template → preview of all instances
6. Can add ad-hoc shifts manually
7. Clicks each shift → "Assign Person" → selects from team members
8. Repeats for all shifts
9. Clicks "Publish" → all shifts saved, emails sent
```

### Flow 3: Employee Views Schedule (daily flow)

```
1. Employee logs in → Dashboard
2. Sees: "Your upcoming shifts" list (next 7 days)
3. Clicks "View full schedule" → /me/schedule
4. Week calendar shows shifts as blocks
5. Shift blocks show: title, time (in company TZ), team name, clock status
6. Current/upcoming shift shows "Clock In" button
```

### Flow 4: Employee Clocks In/Out (per shift)

```
1. Employee logs in → Dashboard
2. Sees upcoming shifts with "Clock In" button next to current shift
3. Clicks "Clock In" → timestamp recorded, button changes to "Clock Out"
4. Timer displayed on dashboard while clocked in
5. Clicks "Clock Out" → optional notes prompt → records end time
6. Clock entry visible in My Schedule for that shift block
```

---

## MVP UI Screens (Exact List)

| # | Screen | Route | Users | Core Content |
|---|---|---|---|---|
| 1 | Login | `/login` | All | Email + password form, "Create company" link |
| 2 | Signup | `/signup` | Public | Company name, email, password, submit |
| 3 | Company Setup | `/company/setup` | Company admin | Timezone picker, locale, create first team |
| 4 | Dashboard | `/dashboard` | All | Welcome message, upcoming shifts list (employee) with Clock In/Out button, shortcuts (manager) |
| 5 | My Schedule | `/me/schedule` | Employee | Week view calendar, shift blocks with clock status (clocked in/out/missed) |
| 6 | Team Schedule | `/teams/:id/schedule` | Manager+ | Week view, shift blocks, click shift to assign |
| 7 | Assign Shift | *(modal on #6)* | Manager | Person picker dropdown, confirm button |
| 8 | Shift Templates | `/teams/:id/templates` | Manager | List of templates, create/edit form, expand button |
| 9 | Template Form | *(modal or page)* | Manager | Title, duration, start time, RRULE string, required count |
| 10 | Team People | `/teams/:id/people` | Manager+ | List of members, invite button, remove |
| 11 | Invite People | `/invite` | Company admin | Email input(s), team selector, send button |
| 12 | Company Settings | `/company/settings` | Company admin | Company name, timezone, branding (optional) |
| 13 | Employees List | `/people` | Company admin | Full company people list, filter by team |

**Not included in MVP**: Audit log UI, admin panel, export buttons, timezone toggle, coverage heatmap, notification preferences, profile page, break tracking, attendance live view.

---

## Backend Implementation Notes (MVP)

### Authentication
- Session tokens stored in database, not JWT (allows invalidation).
- No refresh tokens for MVP (session lasts 7 days, extend on use).
- No password reset for MVP (admin can reset via direct support).

### RBAC (Simplified for MVP)
- 3 roles: `company_admin`, `manager`, `employee`.
- `super_admin` is a database-level role, no UI.
- Permission check is a simple middleware: `requireRole('manager')`.
- No `role_permissions` join table for MVP — permissions are hardcoded by role in middleware.

```typescript
// MVP RBAC: hardcoded role hierarchy
const roleHierarchy = {
    employee: 0,
    manager: 1,
    company_admin: 2,
};
// A user with role X can access any endpoint requiring role <= X.
```

### Shift Publishing (Simplified)
- No "draft" state for MVP.
- When manager clicks "Publish":
  1. For each active template, expand RRULE for the target week.
  2. Create shift rows (skip already-existing dates).
  3. Return created shift IDs.
- Shifts are immediately visible to employees.
- No conflict detection UI (server throws error on double-assign, caught in save).

### Invite Flow (Simplified)
- `POST /api/v1/people` creates person with `status = 'invited'`.
- Backend sends email with a one-time token link: `/accept-invite?token=XXX`.
- Accept-invite page: set password → status becomes `active`.
- No email template customization for MVP (plain-text or basic HTML).

### Email (Simplified)
- Single transactional email provider integration.
- Two email templates: (1) Invite email, (2) Shift assigned notification.
- Send synchronously during API request (no queue for MVP — acceptable at small scale).
- Retry: attempt send, log failure, show error to user if email fails.

### Audit Log (Write-Only)
- All writes to people, teams, shifts, assignments are logged.
- No audit log UI in MVP.
- HMAC chain is fully implemented as designed.

### Calendar View (Simplified)
- Week view only (no month or day) for MVP.
- Shifts render as horizontal bars in a 7-column grid.
- Single timezone: company timezone. No toggle.
- Employee view: read-only. Manager view: click shift → assign modal.
- Clock status indicator shown on each shift block (clocked in/out/missed).
- Fully server-rendered or single-page app — tech choice deferred.

### Clock In/Out (Simplified)
- Employee must have an active shift assignment to clock in.
- Clock-in records `shift_assignment_id`, timestamp, and optional notes.
- Clock-out closes the entry and auto-calculates duration.
- No break tracking for MVP (break_in_at/break_out_at columns exist but unused).
- No GPS enforcement (latitude/longitude columns are optional).
- Clock entries are append-only (enforced by DB triggers).
- No grace period enforcement (configured but not validated in MVP).
- Manager can view clock entries for their team via `GET /api/v1/people/:personId/clock-entries`.

---

## Frontend MVP Pages (Specification)

### Page: Login (`/login`)
```
+--------------------------------------+
|  [Logo]                              |
|                                      |
|  Email    [____________________]     |
|  Password [____________________]     |
|                                      |
|  [Log In]                            |
|                                      |
|  Don't have a company?               |
|  [Create one]                        |
+--------------------------------------+
```

### Page: Signup (`/signup`)
```
+--------------------------------------+
|  Create Your Company                 |
|                                      |
|  Company name  [________________]    |
|  Your email    [________________]    |
|  Password      [________________]    |
|  Confirm       [________________]    |
|                                      |
|  [Create Account]                    |
+--------------------------------------+
```

### Page: Company Setup (`/company/setup`)
```
+--------------------------------------+
|  Set Up Your Company                 |
|                                      |
|  Timezone  [America/New_York    ▼]   |
|                                      |
|  First Team Name  [________________] |
|                                      |
|  [Continue to Dashboard]             |
+--------------------------------------+
```

### Page: Dashboard (`/dashboard`)

**Manager view:**
```
+--------------------------------------+
|  Dashboard              [John M ▼]   |
+--------------------------------------+
|  This Week:                           |
|  ┌──────────────────────────────┐     |
|  │ Team: Engineering          │     |
|  │ Mon 13  Tue 14  Wed 15 ... │     |
|  │ [view full schedule]       │     |
|  └──────────────────────────────┘     |
|                                      |
|  Quick Links:                         |
|  • Templates for Engineering         |
|  • Team People                       |
|  • Company Settings                  |
+--------------------------------------+
```

**Employee view:**
```
+--------------------------------------+
|  Dashboard              [Jane D ▼]   |
+--------------------------------------+
|  Your Upcoming Shifts:               |
|                                      |
|  Today, Jul 13                        |
|   08:00–16:00  Morning Support       |
|                Engineering           |
|                                      |
|  Tomorrow, Jul 14                     |
|   08:00–16:00  Morning Support       |
|                Engineering           |
|                                      |
|  [View Full Schedule →]             |
+--------------------------------------+
```

### Page: Team Schedule (`/teams/:id/schedule`)

```
+---------------------------------------------------+
| Engineering Schedule        Week of Jul 13, 2026   |
| [< Prev]  [Next >]                     Company TZ |
+---------------------------------------------------+
|        | Mon 13  | Tue 14  | Wed 15 | Thu 16 |...|
|--------|---------|---------|--------|--------|---|
| 08:00  | Morning | Morning | Morning| Morning|    |
|        | Support | Support | Support| Support|    |
|        | Alice   | Alice   | Alice  | Bob    |    |
|        | Bob     | [empty] | [empty]|        |    |
|--------|---------|---------|--------|--------|---|
| 16:00  | Evening | Evening |        |        |    |
|        | Carol   | Carol   |        |        |    |
|--------|---------|---------|--------|--------|---|
|                                            [Publish]
```

- Click an empty slot → "Assign Person" modal.
- Click an assigned slot → "Remove" or "Reassign".

---

## Data Flow: Shift Publishing (Critical Path)

```
Manager clicks "Publish Week of Jul 13"
  │
  ├─ 1. GET /api/v1/teams/:teamId/shift-templates?is_active=true
  │     → Returns templates with recurrence_rules
  │
  ├─ 2. For each template:
  │     ├─ Parse RRULE with library
  │     ├─ Expand for range (Jul 13 00:00:00Z to Jul 19 23:59:59Z)
  │     ├─ Exclude dates already in shifts table (template_id + start_at)
  │     └─ INSERT each new shift row
  │
  ├─ 3. Return list of created shifts
  │
  └─ 4. Frontend re-renders schedule grid
```

---

## Excluded from MVP (Will Break)

| Scenario | Why Not Handled | When It Will Break |
|---|---|---|
| Employee works multiple teams | Cross-team assign deferred | Won't appear on secondary team schedule |
| Shift spans midnight | Stored as UTC, rendered same day | May appear on wrong day in calendar |
| DST transition week | Single company TZ, basic rendering | Might show 1-hour offset visually |
| Break tracking (meal/rest) | Feature deferred | No break compliance data |
| 500+ employees per company | No pagination for MVP | Browser may lag loading all shifts |
| Mobile browsing | No responsive design for MVP | Layout breaks on small screens |
| Email delivery failure | No queue, no retry | User sees error, shift still saved |
| Manager leaves company | No reassignment flow | Team has no manager |
| Two managers edit same shift | No optimistic locking | Last write wins |

Each of these gets addressed in the post-MVP roadmap below.

---

## Post-MVP Roadmap

After the employee can see their schedule and clock in/out, the natural progression follows the employee's relationship with their shifts over time: **before → during → after** their shift happens.

```
┌─────────────────────────────────────────────────────────┐
│                    MVP (Done)                            │
│  Employee sees schedule ⟶ Manager assigns shifts        │
│  ⟶ Clock in/out ⟶ Emails sent                          │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE A: Before the Shift                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ Self-schedule │  │ Calendar     │  │ Notifications │ │
│  │ (pick shifts) │  │ export       │  │ (reminders,   │ │
│  │ + swap/cover  │  │ (iCal/webcal)│  │  digest)      │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE B: During the Shift                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ Break tracking│  │ Mobile       │  │ Real-time     │ │
│  │ (meal/rest)   │  │ (app or PWA) │  │ coverage view │ │
│  │ + GPS proof   │  │              │  │ + attendance  │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE C: After the Shift                               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ Reports &    │  │ Payroll      │  │ Audit &       │ │
│  │ analytics    │  │ export       │  │ compliance UI │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE D: Scale & Enterprise                            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ Multi-region  │  │ SSO/SAML    │  │ Public API    │ │
│  │ data residency│  │ Enterprise  │  │ + rate limits │ │
│  │ + billing     │  │ auth        │  │               │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Phase A: Before the Shift

After an employee sees their schedule, they need **control** over it before the shift happens.

#### A1: Self-Scheduling (Employee picks shifts)

**The problem**: Manager spends hours assigning every shift manually. Employees have no say.

**The feature**:
- Employee visits "Available Shifts" tab → sees unassigned shifts for their team
- Clicks a shift → "Request Shift" → pending badge on calendar
- Manager sees a "Requests" queue grouped by shift
- Manager approves/denies in bulk (select all, approve)
- Auto-assign fallback: if nobody requests by cutoff, manager assigns manually
- Notifications: employee gets email on approval or denial

**Employee UX**:
```
  Available Shifts ─ Engineering ─ Jul 13-19
┌──────────────────────────────────────────────────────┐
│ Mon 13  │ Tue 14  │ Wed 15  │ Thu 16  │ Fri 17     │
│         │         │         │         │            │
│ 08:00   │ 08:00   │ 08:00   │ 08:00   │ 08:00      │
│ [Pick]  │ [Pick]  │ [Pick]  │ [Pick]  │ [Pick]     │
│         │         │         │         │            │
│ 16:00   │ 16:00   │ 16:00   │         │            │
│ [Pick]  │ [Pick]  │ [Pick]  │         │            │
└──────────────────────────────────────────────────────┘
```

**Why this order**: Self-scheduling is the highest-value feature after basic schedule viewing. It saves managers hours per week and gives employees agency.

#### A2: Calendar Export (iCal + Webcal)

**The problem**: Employee has to open the app to check their schedule. They want it in their existing calendar (Google, Apple, Outlook).

**The feature**:
- "Export" button on My Schedule page
- Option 1: Download `.ics` file — imports as static events
- Option 2: Copy webcal URL — paste into any calendar app for live sync
- Secret subscription token per person (rotate-able)
- Changes to schedule auto-update via webcal poll

**Why this order**: After self-scheduling, employees have an active, changing schedule. Export makes it accessible without opening the app.

#### A3: Notifications Upgrade

**The problem**: Employee forgets about a shift. Manager doesn't know about conflicts.

**The features (in priority order)**:
1. **Reminder emails**: Send X minutes before shift start (configurable per company, default 60)
2. **Daily digest**: "Tomorrow's schedule" email at 6pm
3. **Change notifications**: Email when any assigned shift changes or is cancelled
4. **Notification preferences**: Each person can opt in/out of reminder types

**Why this order**: Reminders are the most impactful (reduce no-shows), then digest (planning), then change alerts (awareness).

---

### Phase B: During the Shift

After employees can control their schedule and clock in/out, they need **richer execution** capabilities.

#### B1: Break Tracking (Meal / Rest Breaks)

**The problem**: Manager doesn't know if employees are taking required meal and rest breaks. Labor law compliance requires tracking.

**The feature**:
- Employee on an active clock sees "Start Break" button
- Break timer starts → "End Break" button appears
- System tracks meal break (≥30min) vs rest break (≥10min) based on shift duration
- Compliance violation detected if break is missed or too short
- Configurable thresholds: meal break trigger (default 5h), rest break trigger (default 4h)

**Manager view**:
```
  Attendance ─ Engineering ─ Jul 13
┌──────────────────────────────────────────────────┐
│ Shift           │ Person │ Clocked │ Breaks      │
├─────────────────┼────────┼─────────┼─────────────┤
│ Morning Support │ Alice  │ 08:01   │ 12:30-13:00 │
│                 │ Bob    │ 08:12   │ ❌ missed   │
│                 │ Carol  │ —       │ —           │
└──────────────────────────────────────────────────┘
```

#### B2: Attendance Live View

**The problem**: Manager can see individual clock entries but lacks a live dashboard of who's on the floor.

**The feature**:
- Live view of who is clocked in right now, by team
- Who's scheduled next (upcoming shifts)
- Status indicators: on time, late, no-show, on break
- Quick action: message available person to cover

**Why this order**: Break tracking gives the data needed for a live attendance view.

#### B3: Mobile (PWA or Native)

**The problem**: Employee can't clock in/out or view schedule easily from a phone.

**The feature**:
- Responsive web or Progressive Web App (PWA) for v1
- Key mobile flows: clock in/out, view schedule, approve requests (manager)
- Push notifications for reminders and changes
- GPS location capture on clock-in (optional, configurable per company)

**Why this order**: Break tracking + attendance view are higher value than mobile responsiveness.

---

### Phase C: After the Shift

After shifts are executed, you need to **close the loop**.

#### C1: Reports & Analytics

**The problem**: Nobody knows who worked the most, who was late, or overtime trends.

**The features**:
- **Attendance report**: Person × date range → scheduled vs actual hours, late count, no-show count
- **Overtime report**: Who exceeded weekly/daily thresholds
- **Coverage report**: % of shifts filled vs open per team per week
- **Export all reports to CSV**

**Why this order**: Managers need the data loop closed before compliance or payroll matters.

#### C2: Payroll Export

**The problem**: Payroll team manually enters hours from paper schedules.

**The feature**:
- Export hours worked (from clock entries) in a format compatible with:
  - Gusto, ADP, BambooHR (CSV template per integration)
  - Payroll API integration (post-v1 for each provider)
- Data exported: person name, date, clock in, clock out, break (future), total hours
- Manager reviews and approves hours before export

#### C3: Audit & Compliance UI

**The problem**: Company admin needs to prove compliance but can't see the audit log.

**The features**:
- Audit log page: searchable, filterable by actor, action, resource, date range
- View HMAC chain (verify integrity of log entries)
- GDPR export (person data download)
- GDPR erasure (delete person with anonymization)
- HIPAA toggle in company settings activates additional safeguards

---

### Phase D: Scale & Enterprise

After product-market fit, these unlock larger customers.

#### D1: Multi-Region Data Residency

- Companies can choose a data storage region at signup
- Data routed to EU, US, or APAC database clusters
- Required for GDPR-compliant EU companies and HIPAA US companies

#### D2: SSO / SAML / OIDC

- Enterprise single sign-on
- Supported providers: Okta, Azure AD, Google Workspace, OneLogin
- SCIM provisioning (auto-create/disable users)

#### D3: Billing & Plans

- Self-serve subscription plans (monthly per active employee)
- Stripe integration with metered billing
- Plan tiers: Free (1 team), Pro (unlimited), Enterprise (SSO, SLA)

#### D4: Public API

- Rate-limited REST API with API keys per company
- Webhooks for shift events (assign, clock, cancel)
- Integration marketplace: Slack, Teams, Discord

---

### Summary: Value Per Phase

| Phase | Unlocks For Employee | Unlocks For Manager | Business Value |
|---|---|---|---|
| **MVP** | See my schedule, clock in/out | Create + assign shifts, track attendance | Core scheduling + attendance |
| **Phase A** | Pick my shifts, export to calendar | Self-service reduces admin work | 50% less manager time |
| **Phase B** | Break tracking, mobile | Live attendance view | Labor law compliance |
| **Phase C** | See my hours | Reports, payroll export | Compliance + payroll |
| **Phase D** | — | Enterprise scale | Revenue growth |

---

## Acceptance Criteria (MVP Complete)

- [ ] A new user can sign up a company, set timezone, and create a team
- [ ] Company admin can invite people by email; they can accept and log in
- [ ] Manager can create a shift template with an RRULE recurrence
- [ ] Manager can expand templates into concrete shifts for a specific week
- [ ] Manager can assign people to individual shifts
- [ ] Manager can publish the schedule
- [ ] Employee can log in and see their assigned shifts on a week calendar
- [ ] Employee receives an email when assigned to a shift
- [ ] Employee can clock in to an assigned shift
- [ ] Employee can clock out, recording actual end time
- [ ] Employee can see clock status (clocked in/out) on their schedule
- [ ] Manager can view clock entries for their team members
- [ ] Company admin can edit company settings
- [ ] All state changes are recorded in the audit log (no UI needed)
- [ ] Session persists across page reloads
- [ ] Logging out invalidates the session

---

## Estimated Effort (Guesstimate)

| Area | Backend (days) | Frontend (days) | Notes |
|---|---|---|---|
| Auth + company | 2 | 2 | Register, login, setup page |
| Teams + People CRUD | 2 | 2 | Includes invite email |
| Shift templates + RRULE | 3 | 2 | Need RRULE library integration |
| Shift expansion + publish | 2 | 1 | Core schedule logic |
| Assignments | 1 | 1 | Assign modal + backend |
| Schedule calendar view | 1 | 4 | Week grid most complex UI |
| Clock in/out | 1.5 | 2 | Clock in/out endpoints, timer UI, clock status on schedule |
| Dashboard | 0.5 | 2 | Upcoming shifts, quick links |
| Emails | 1 | 0 | Template + send logic |
| Audit log | 1 | 0 | DB triggers only |
| Company settings | 0.5 | 0.5 | Form + API |
| Infrastructure | 2 | 1 | Deployment, DB, CI, env |
| **Total** | **17.5** | **17.5** | **~35 days / 7 weeks** |

---

## MVP Delivery Milestone

```
Week 1-2:   Auth, Teams, People (infrastructure + foundation)
Week 3-4:   Templates, RRULE, Shifts, Assignments (core scheduling)
Week 5:     Calendar view, Dashboard, Emails, Clock in/out (employee experience)
Week 6-7:   Polish, bug fixes, deployment, internal dogfooding
```

At week 7, the app is deployed with real data from 1–2 pilot companies. After validation, the MVP+ backlog (self-scheduling, break tracking, export) begins.