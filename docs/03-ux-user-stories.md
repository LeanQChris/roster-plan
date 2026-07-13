# UX Flow & User Stories

## 1. User Flows

### 1.1 Company Signup Flow

Registers a new tenant on the platform. The prospective company admin creates an account, verifies their email, sets up their company profile, and invites the first manager. This is the entry point for every new organization.

```
Signup Page → Enter Company Name, Email, Password
  → Verify Email (click link)
  → Configure Company (default TZ, team name)
  → Invite first manager (email invite)
  → Dashboard (empty state: "Invite your team")
```

### 1.2 Employee Onboarding Flow

Accepts an invite, creates credentials, and configures personal preferences to join the company's roster. This is how employees gain access to their schedules and start participating in the scheduling process.

```
Invite Email → Click "Accept Invite"
  → Create Password
  → Set Timezone (detected from browser, editable)
  → Select Team (if multiple)
  → Dashboard (shows "No upcoming shifts")
```

### 1.3 Self-Scheduling Flow (Employee)

Allows employees to browse available shifts and request the ones they want. Managers review and approve/reject requests. This reduces manual assignment work and gives employees flexibility in choosing their hours.

```
Dashboard → "Available Shifts" tab
  → Calendar shows open slots (color-coded)
  → Click slot → "Request Shift" dialog (confirm)
  → Pending state (yellow indicator on calendar)
  → Approved / Rejected → notification email
```

### 1.4 Manager Publishing Flow

The manager's primary workflow for building a weekly schedule — reviewing coverage, assigning employees, approving requests, and publishing the finalized roster. Published schedules notify all assigned employees and lock the schedule.

```
Dashboard → "Schedule" → Select Week
  → View team coverage (green = good, yellow = light, red = under)
  → Click shift → Assign employee manually or view requests
  → Approve requests in bulk (select all → approve)
  → Click "Publish Schedule"
  → All assigned employees receive email
```

### 1.5 Shift Swap Flow (Manager-Approved Model)

Lets an employee request to swap a shift with a coworker. The manager must approve before the swap takes effect, ensuring adequate coverage and preventing unauthorized changes.

```
Employee A → "My Schedule" → Click shift → "Request Swap"
  → Select Employee B from team list
  → Manager receives notification
  → Manager approves/denies from dashboard
  → Both employees receive email
```

### 1.6 Time Clock Flow

Records actual work hours with clock-in/clock-out timestamps. The flow provides a running timer during the shift and produces immutable audit records for payroll and compliance purposes.

```
Dashboard → "Clock In" button (visible during shift window)
  → Timestamp recorded
  → Dashboard shows running timer
  → "Clock Out" button → prompts for notes (optional)
  → Entry recorded as immutable audit event
```

### 1.7 Calendar Export Flow

Syncs scheduled shifts to external calendars (Google Calendar, Outlook, Apple Calendar) via .ics download or live webcal subscription. Keeps employees' personal calendars in sync without manual entry.

```
"My Schedule" → "Export" dropdown
  → Option 1: "Download .ics" (single file)
  → Option 2: "Copy webcal URL" (live feed)
  → Paste into Google Calendar / Outlook / Apple Calendar
```

---

## 2. Screens / Views

| Screen | Route | Audience | Description |
|---|---|---|---|
| Login | /login | All | Authenticates returning users. Email + password form with "forgot password" link and optional session persistence. Redirects to dashboard on success. |
| Signup | /signup | Prospective company | First step of tenant creation. Collects company name, admin email, and password. Triggers verification email and redirects to company setup upon confirmation. |
| Dashboard | /dashboard | All | Central hub after login. Shows a summary of upcoming shifts, pending requests (for managers), recent notifications, and quick-action buttons (clock in/out, view schedule). Role-based — content adapts to employee vs manager vs admin view. |
| My Schedule | /schedule | Employee | Personal calendar view (month/week/day toggle). Displays assigned shifts with times, locations, and role details. Includes clock in/out buttons during active shifts and export controls. |
| Available Shifts | /schedule/available | Employee | Calendar of unassigned shifts that the employee can request. Shifts are color-coded by coverage level. Clicking a slot opens a request confirmation dialog. |
| Team Schedule | /team/:id/schedule | Manager+ | Full team calendar showing all employees' shifts on a single view. Includes a coverage heatmap (green/yellow/red staffing levels) and the ability to assign employees or manage requests directly from the schedule grid. |
| Manage Templates | /team/:id/templates | Manager | CRUD interface for shift templates — recurring shift patterns with RRULE-based recurrence rules (e.g., every Mon-Wed, 2nd Friday of month). Each template defines start time, duration, required staff count, and optional position/skill requirements. |
| Requests | /team/:id/requests | Manager | Inbox for pending shift requests (self-scheduling pickups, swap requests). Supports approve/deny actions individually or in bulk. Filterable by type, status, and employee. |
| People | /team/:id/people | Manager+ | Team roster listing all members with their roles, status (active/invited/inactive), and contact info. Entry point for inviting new members, editing profiles, or removing employees. |
| Company Settings | /company/settings | Company admin | Organization-level configuration: branding (logo, primary color), default timezone and locale, compliance toggles (HIPAA mode, data retention), overtime and break thresholds, and integration settings. |
| Audit Log | /company/audit | Company admin+ | Immutable, searchable history of all changes within the tenant. Filters by actor, resource type, action, and date range. Supports drill-down into old/new values for each change. |
| Admin Panel | /admin | Super admin | Platform-level administration. Lists all tenants with their status, creation date, and region. Allows deactivating companies, viewing platform-wide metrics, and managing global settings. |

---

## 3. User Stories

### 3.1 Authentication & Onboarding

Covers account creation, login, invite acceptance, and password recovery — all the touchpoints for getting users into the system securely and configuring their initial preferences.

- As a **new user**, I want to create a company with my email and password so I can start scheduling.
- As a **new user**, I want to verify my email before accessing the app.
- As an **employee**, I want to receive an invite link so I can join my company's roster.
- As an **employee**, I want to set my timezone during onboarding so my schedule displays correctly.
- As a **returning user**, I want to log in with my email and password so I can access my schedule.
- As a **user**, I want to reset my password via email if I forget it.

### 3.2 Scheduling

The core of the application — defining recurring shift patterns, assigning employees, managing requests, and publishing finalized schedules. Covers both the manager's scheduling workflow and the employee's self-scheduling experience.

- As an **employee**, I want to see open shifts for my team so I can pick when I work.
- As an **employee**, I want to request a specific shift so my manager knows my preference.
- As an **employee**, I want to see the status of my shift requests (pending/approved/rejected).
- As a **manager**, I want to define shift templates so recurring shifts are consistent.
- As a **manager**, I want to set recurrence patterns (every Mon-Wed, 2nd Friday of month) so I don't recreate shifts.
- As a **manager**, I want to see a coverage heatmap so I know if we're understaffed.
- As a **manager**, I want to approve or deny shift requests in bulk so I save time.
- As a **manager**, I want to publish a schedule so it becomes final.
- As a **manager**, I want to manually assign an employee to a shift as a fallback.

### 3.3 Time Tracking

Captures actual work hours through clock-in/clock-out events. Provides visibility into attendance, overtime, and compliance with break requirements. All entries are immutable for audit integrity.

- As an **employee**, I want to clock in with one click so my start time is recorded.
- As an **employee**, I want to clock out at the end of my shift so my hours are tracked.
- As a **manager**, I want to see attendance reports showing actual vs scheduled hours.
- As a **manager**, I want to see who forgot to clock in.

### 3.4 Calendar & Export

Viewing schedules in flexible calendar layouts and syncing shifts to external calendars. Supports personal timezone display and push/pull export via .ics and webcal.

- As an **employee**, I want to view my schedule in month/week/day views so I can plan my week.
- As an **employee**, I want to toggle between my timezone and the company timezone.
- As an **employee**, I want to download an .ics file of my shifts so I can add them to my calendar.
- As an **employee**, I want a webcal URL so my calendar auto-syncs.

### 3.5 Notifications

Keeps users informed of important events — shift assignments, schedule changes, reminders, and approval outcomes. MVP delivers email only; post-MVP adds Slack, Teams, and push channels.

- As an **employee**, I want an email when I'm assigned a new shift so I don't miss it.
- As an **employee**, I want a reminder email before my shift starts.
- As an **employee**, I want an email if my shift is changed or cancelled.
- As a **manager**, I want a notification when an employee requests a shift swap.

### 3.6 Administration

Company and platform-level management — inviting/removing people, viewing audit logs, managing data retention, and handling GDPR rights requests. Super admins have cross-tenant visibility.

- As a **company admin**, I want to invite people to my company so they can join.
- As a **company admin**, I want to remove an employee and reassign their shifts.
- As a **company admin**, I want to view and search the audit log.
- As a **company admin**, I want to export a person's data for GDPR compliance.
- As a **company admin**, I want to delete a person and their data (right to erasure).
- As a **super admin**, I want to view all tenants on the platform.
- As a **super admin**, I want to deactivate a tenant company.

### 3.7 Compliance

Regulatory and governance requirements — transparency around data usage, HIPAA mode for healthcare tenants, configurable data retention, and data portability/erasure for GDPR data subject rights.

- As a **user**, I want to know how my data is stored and used.
- As a **company admin**, I want to enable HIPAA mode for my tenant.
- As a **company admin**, I want to configure data retention policies.
- As a **data subject**, I want to receive a copy of all my data in a portable format.