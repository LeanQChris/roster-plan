# UX Flow & User Stories

## 1. User Flows

### 1.1 Company Signup Flow
```
Signup Page → Enter Company Name, Email, Password
  → Verify Email (click link)
  → Configure Company (default TZ, team name)
  → Invite first manager (email invite)
  → Dashboard (empty state: "Invite your team")
```

### 1.2 Employee Onboarding Flow
```
Invite Email → Click "Accept Invite"
  → Create Password
  → Set Timezone (detected from browser, editable)
  → Select Team (if multiple)
  → Dashboard (shows "No upcoming shifts")
```

### 1.3 Self-Scheduling Flow (Employee)
```
Dashboard → "Available Shifts" tab
  → Calendar shows open slots (color-coded)
  → Click slot → "Request Shift" dialog (confirm)
  → Pending state (yellow indicator on calendar)
  → Approved / Rejected → notification email
```

### 1.4 Manager Publishing Flow
```
Dashboard → "Schedule" → Select Week
  → View team coverage (green = good, yellow = light, red = under)
  → Click shift → Assign employee manually or view requests
  → Approve requests in bulk (select all → approve)
  → Click "Publish Schedule"
  → All assigned employees receive email
```

### 1.5 Shift Swap Flow (Manager-Approved Model)
```
Employee A → "My Schedule" → Click shift → "Request Swap"
  → Select Employee B from team list
  → Manager receives notification
  → Manager approves/denies from dashboard
  → Both employees receive email
```

### 1.6 Time Clock Flow
```
Dashboard → "Clock In" button (visible during shift window)
  → Timestamp recorded
  → Dashboard shows running timer
  → "Clock Out" button → prompts for notes (optional)
  → Entry recorded as immutable audit event
```

### 1.7 Calendar Export Flow
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
| Login | /login | All | Email + password form, forgot password link |
| Signup | /signup | Prospective company | Company name, email, password form |
| Dashboard | /dashboard | All | Summary: upcoming shifts, pending requests, notifications |
| My Schedule | /schedule | Employee | Calendar view (month/week/day), clock in/out |
| Available Shifts | /schedule/available | Employee | Calendar of unpicked shifts for self-scheduling |
| Team Schedule | /team/:id/schedule | Manager+ | Full team calendar, coverage heatmap |
| Manage Templates | /team/:id/templates | Manager | CRUD shift templates with recurrence rules |
| Requests | /team/:id/requests | Manager | Pending shift requests, approve/deny |
| People | /team/:id/people | Manager+ | Team member list, roles, status |
| Company Settings | /company/settings | Company admin | Branding, timezone, compliance settings |
| Audit Log | /company/audit | Company admin+ | Searchable audit log with filters |
| Admin Panel | /admin | Super admin | All tenants, platform settings |

---

## 3. User Stories

### 3.1 Authentication & Onboarding

- As a **new user**, I want to create a company with my email and password so I can start scheduling.
- As a **new user**, I want to verify my email before accessing the app.
- As an **employee**, I want to receive an invite link so I can join my company's roster.
- As an **employee**, I want to set my timezone during onboarding so my schedule displays correctly.
- As a **returning user**, I want to log in with my email and password so I can access my schedule.
- As a **user**, I want to reset my password via email if I forget it.

### 3.2 Scheduling

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

- As an **employee**, I want to clock in with one click so my start time is recorded.
- As an **employee**, I want to clock out at the end of my shift so my hours are tracked.
- As a **manager**, I want to see attendance reports showing actual vs scheduled hours.
- As a **manager**, I want to see who forgot to clock in.

### 3.4 Calendar & Export

- As an **employee**, I want to view my schedule in month/week/day views so I can plan my week.
- As an **employee**, I want to toggle between my timezone and the company timezone.
- As an **employee**, I want to download an .ics file of my shifts so I can add them to my calendar.
- As an **employee**, I want a webcal URL so my calendar auto-syncs.

### 3.5 Notifications

- As an **employee**, I want an email when I'm assigned a new shift so I don't miss it.
- As an **employee**, I want a reminder email before my shift starts.
- As an **employee**, I want an email if my shift is changed or cancelled.
- As a **manager**, I want a notification when an employee requests a shift swap.

### 3.6 Administration

- As a **company admin**, I want to invite people to my company so they can join.
- As a **company admin**, I want to remove an employee and reassign their shifts.
- As a **company admin**, I want to view and search the audit log.
- As a **company admin**, I want to export a person's data for GDPR compliance.
- As a **company admin**, I want to delete a person and their data (right to erasure).
- As a **super admin**, I want to view all tenants on the platform.
- As a **super admin**, I want to deactivate a tenant company.

### 3.7 Compliance

- As a **user**, I want to know how my data is stored and used.
- As a **company admin**, I want to enable HIPAA mode for my tenant.
- As a **company admin**, I want to configure data retention policies.
- As a **data subject**, I want to receive a copy of all my data in a portable format.