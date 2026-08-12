# Roster — Role-Based Access Control & Actor Capabilities

| | |
|---|---|
| **Document Version** | 1.0 |
| **Last Updated** | July 2026 |
| **Classification** | Internal — Engineering & Product |
| **Source Documents** | PRD, MVP Plan, API Specification, Architecture Spec, RBAC Matrix, Schema, UX Stories |
| **Status** | Approved |

---

## 1. Purpose

This document defines the four user roles within the Roster platform, the scope of each role's authority, and the specific capabilities and restrictions associated with each. It serves as the authoritative reference for implementing role-based access control across the application.

Capabilities are organized into two categories:

| Category | Description |
|----------|-------------|
| **MVP Core** | Features included in the initial release. |
| **Compliance & Data Governance** | Features related to regulatory compliance, data protection, and audit. Designed upfront; some may be deferred to post-MVP phases. |

---

## 2. Role Overview

| Icon | Role | Identifier | Scope | Provisioning |
|:----:|------|-----------|-------|-------------|
| 🔒 | **Super Admin** | `super_admin` | Global — all tenants | Seeded in database. No self-registration. |
| 🏢 | **Company Admin** | `company_admin` | Single company | Self-registers via signup flow. |
| 👔 | **Manager** | `manager` | Assigned team(s) | Invited by Company Admin or Manager. |
| 👤 | **Employee** | `employee` | Own profile and schedule | Invited by Company Admin or Manager. |

### Role Hierarchy

Each role inherits all permissions of the roles below it:

```
🔒 Super Admin (3)  →  🏢 Company Admin (2)  →  👔 Manager (1)  →  👤 Employee (0)
```

A user with role level *N* can access any resource requiring role level *≤ N*.

---

## 3. 🔒 Super Admin

| | |
|---|---|
| **Role Level** | 3 (highest) |
| **Scope** | Platform-wide — all tenants |

### 3.1 MVP Core Capabilities

#### Platform Overview

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 🌐 List all companies | Displays every registered company with name, slug, member count, status, and creation date. | Navigate to admin dashboard. Search or filter the companies table by status. |
| 👁️ View company details | Shows stats, configuration, and member list for any tenant. | Click any company row. Detail panel opens. |

#### Tenant Management

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| ⏸️ Suspend a company | Sets company status to *suspended*. Terminates all active sessions for that tenant immediately. | Click "Suspend" on company detail page → confirm in modal. |
| ▶️ Activate a company | Restores a suspended company to active status. | Click "Activate" on suspended company detail page → confirm. |
| 🗑️ Force delete a company | Soft-deletes a company. Record is marked deleted but retained for compliance. | Click "Delete" → type company name to confirm → record preserved. |

#### Authentication

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 🔑 Log in | Uses the same login form as all other roles. Redirected to admin dashboard. | Enter credentials at `/login`. System detects `super_admin` role → redirects to `/admin`. |
| 🚪 Log out | Session is invalidated. | Click profile menu → "Log Out". |

### 3.2 Compliance & Data Governance

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📋 View platform audit log | Complete cross-tenant audit trail. Filterable by actor, resource type, action, and date range. Append-only and HMAC-chained for tamper evidence. | Click "Audit Log" tab → apply filters → click any row to expand old/new values. |

### 3.3 Restrictions

| | Restriction |
|---|------------|
| 🚫 | Cannot create, edit, or delete teams, people, or shift templates |
| 🚫 | Cannot modify company settings beyond suspend/activate/delete |
| 🚫 | Cannot clock in or out |
| 🚫 | Cannot view individual company dashboards or employee schedules |

---

## 4. 🏢 Company Admin

| | |
|---|---|
| **Role Level** | 2 |
| **Scope** | Single company (own tenant) |

### 4.1 MVP Core Capabilities

#### Authentication & Account

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📝 Register a new company | Creates company record, default settings, and admin account in one operation. | Click "Create one" on login page → fill company name, email, password → "Create Account". Auto-logged in, redirected to setup wizard. |
| 🔑 Log in / Log out | Standard session-based authentication. | Enter credentials at `/login` → redirected to `/dashboard`. |

#### Company Configuration

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 👁️ View company settings | Read access to timezone, branding, and locale. | Navigate to `/company/settings`. Fields displayed in read mode. |
| ✏️ Update company settings | Modify timezone, branding (logo, primary color), and locale. | Click "Edit" → modify fields → "Save Changes". |

#### Team Management

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📋 List all teams | Displays every team in the company. | Dashboard → "Your Teams" section. |
| ➕ Create a team | Defines a team with name, optional location, and optional manager. | Click "Create Team" in setup wizard or dashboard → fill name → "Create Team & Continue". |
| ✏️ Update a team | Renames a team or reassigns its manager. | Click team name → "Settings" → edit fields → "Save". |
| 🗑️ Delete a team | Removes a team. Members must be reassigned first. | Click team settings → "Delete Team" → reassign members if prompted → confirm. |

#### People Management

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📋 List all people | Displays every person in the company. Filterable by team, role, and status. | Navigate to `/people` → use filters at top of list. |
| ➕ Create a person | Adds a team member by email. System sends an invitation with a secure link. | Click "Invite People" → enter email(s) → select role per person → "Send Invites". |
| 👁️ View any person | Shows profile details for any individual in the company. | Click person's name in people list. Profile page opens. |
| ✏️ Edit any person | Modifies role, team assignment, timezone, or account status. | Click "Edit" on profile → modify fields → "Save". |
| 📧 Re-send an invite | Resends the invitation email to someone who hasn't accepted. | Click "Re-send Invite" on person profile (visible when status is "invited"). |

#### Shift Templates

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📋 List all templates | Displays shift templates across any team. | Navigate to team → "Templates" tab. |
| ➕ Create a template | Defines a recurring shift: title, start time, duration, staffing, and RRULE recurrence. | Click "Create Template" → fill fields → select recurrence → "Save Template". |
| ✏️ Update a template | Modifies any field on an existing template. | Click template → "Edit" → modify fields → "Save". |
| 🗑️ Delete a template | Removes a template. Previously published shifts are unaffected. | Click template → "Delete" → confirm in modal. |
| 👁️ Expand a template | Previews concrete instances for a date range before publishing. | Click "Expand" → select date range → preview list displayed. |

#### Shifts & Scheduling

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📋 List shifts | Queries shifts by team, date range, or assigned person. | Navigate to team → "Schedule" tab → use date picker and person filter. |
| 👁️ View a shift | Shows full details of a single shift instance. | Click any shift block on the schedule grid. Detail modal opens. |
| ➕ Create an ad-hoc shift | Creates a one-off shift not derived from any template. | Click empty slot on grid → "Create Shift" → fill details → "Create". |
| ✏️ Edit a shift | Modifies a shift's time, title, or status. | Click shift block → "Edit" → modify fields → "Save". |
| 🗑️ Delete a shift | Cancels a scheduled shift. | Click shift block → "Delete" → confirm in modal. |
| 🚀 Publish a schedule | Expands all active templates into materialized shifts for a date range. Shifts are immediately visible to employees. | Select date range → click "Publish" → confirmation shows shift count → grid populates. |
| 👤 Assign a person to a shift | Assigns a team member to a shift. System sends a notification email. Force flag available to bypass conflict detection. | Click empty slot → person dropdown → select person → "Assign". Email sent automatically. |
| 👥 Bulk assign | Assigns one person to every eligible shift in a date range (optionally filtered to one template) in a single action. Conflicting shifts are skipped and reported. | Click "Bulk Assign" on schedule → select person, date range, optional template → "Assign". Summary shows assigned/skipped/conflicts. |
| ❌ Remove a person from a shift | Unassigns an individual from a shift. | Click assigned shift → "Remove" next to name → confirm. |
| 👁️ View shift assignments | Shows all personnel assigned to a given shift. | Click shift block. Assigned names listed in detail modal. |

#### Calendar & Time Tracking

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 🗓️ View team schedule | Full team calendar view for a given week with all shifts and assignments. | Navigate to team → "Schedule". Week grid displayed. |
| ⏱️ View team clock entries | Clock-in/out history for any team member. | Navigate to person profile → "Clock Entries" tab → use date range filter. |

### 4.2 Compliance & Data Governance

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| ⚙️ View compliance settings | Read access to HIPAA mode toggle and data retention configuration. | Navigate to `/company/settings` → "Compliance" section. |
| ⚙️ Update compliance settings | Enables/disables HIPAA mode. Configures data retention periods. | Toggle HIPAA switch → set retention days → "Save". |
| 🗑️ Delete a person (GDPR) | Executes a GDPR-compliant erasure. Personal data is anonymized; clock and audit records are preserved. | Click person → "Delete (GDPR Erasure)" → confirm. Data anonymized, records preserved. |
| 📋 View company audit log | Complete audit trail showing all state changes with actor, timestamp, and before/after values. | Navigate to `/company/audit` → filter by actor, action, date → click row to expand. |

### 4.3 Restrictions

| | Restriction |
|---|------------|
| 🚫 | Cannot suspend, activate, or delete other companies |
| 🚫 | Cannot access the platform-wide audit log (Super Admin only) |
| 🚫 | Cannot create or modify Super Admin accounts |

---

## 5. 👔 Manager

| | |
|---|---|
| **Role Level** | 1 |
| **Scope** | Assigned team(s) only |

### 5.1 MVP Core Capabilities

#### Authentication

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📧 Accept an invitation | Activates account via secure invite link. | Click link in email → land on `/accept-invite` → set password → "Activate Account" → redirected to dashboard. |
| 🔑 Log in / Log out | Standard session-based authentication. | Enter credentials at `/login` → redirected to `/dashboard`. |

#### Team & People Visibility

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📋 List assigned teams | Shows teams where the manager is the designated lead. | Dashboard → "Your Teams" section. |
| 👁️ View team details | Shows team name, member roster, and configuration. | Click team name → team detail page opens. |
| 📋 List team members | Displays all people on their team(s). | Navigate to team → "People" tab. |
| 👁️ View a person | Shows profile details for team members. | Click person's name in team member list. |
| ➕ Invite a person | Adds a team member by email. System sends an invitation. | Click "Invite People" → enter email → select role → "Send Invite". |
| ✏️ Edit a person | Modifies timezone and phone number only (non-role fields). | Click person → "Edit" → only timezone and phone editable → "Save". |

#### Shift Templates

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📋 List all templates | Displays shift templates for their team. | Navigate to team → "Templates" tab. |
| ➕ Create a template | Defines a recurring shift pattern with title, time, duration, staffing, and recurrence. | Click "Create Template" → fill fields → select recurrence → "Save". |
| ✏️ Update a template | Edits any field on an existing template. | Click template → "Edit" → modify fields → "Save". |
| 🗑️ Delete a template | Removes a template. Published shifts are unaffected. | Click template → "Delete" → confirm. |
| 👁️ Expand a template | Previews instances for a date range before publishing. | Click "Expand" → select date range → preview displayed. |

#### Shifts & Scheduling

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📋 List shifts | Shows team shifts for a specified date range. | Navigate to team → "Schedule" → use date picker. |
| 👁️ View a shift | Inspects details of a single shift. | Click shift block on grid → detail modal opens. |
| ➕ Create an ad-hoc shift | Creates a one-off shift not tied to any template. | Click empty slot → "Create Shift" → fill details → "Create". |
| ✏️ Edit a shift | Modifies a shift's time or title. | Click shift → "Edit" → modify → "Save". |
| 🗑️ Delete a shift | Cancels a scheduled shift. | Click shift → "Delete" → confirm. |
| 🚀 Publish a schedule | Expands all active templates into concrete shifts for a date range. Immediately visible to employees. | Select date range → "Publish" → confirmation shown → grid populates. |

#### Shift Assignments

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 👤 Assign a person to a shift | Assigns a team member. Notification email sent automatically. Force flag available. | Click empty slot → person dropdown → select → "Assign". |
| ❌ Remove a person from a shift | Unassigns an individual. | Click assigned shift → "Remove" next to name → confirm. |
| 👁️ View shift assignments | Shows all personnel on a given shift. | Click shift block → names listed in modal. |

#### Calendar & Time Tracking

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 🗓️ View team schedule | Full team calendar for a given week with all shifts and assignments. | Navigate to team → "Schedule". Week grid displayed. |
| ⏱️ View team clock entries | Clock-in/out history for any team member. | Click person → "Clock Entries" tab. |

### 5.2 Compliance & Data Governance

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📋 View team audit log | Audit trail scoped to their team's activity. | Navigate to team → "Audit" tab → filter by action or date. |

### 5.3 Restrictions

| | Restriction |
|---|------------|
| 🚫 | Cannot create, edit, or delete teams |
| 🚫 | Cannot change a person's role or account status |
| 🚫 | Cannot edit company settings |
| 🚫 | Cannot view other teams' schedules, people, or templates |
| 🚫 | Cannot suspend or activate companies |
| 🚫 | Cannot access the platform-wide audit log |

---

## 6. 👤 Employee

| | |
|---|---|
| **Role Level** | 0 (lowest) |
| **Scope** | Own profile, schedule, and time entries only |

### 6.1 MVP Core Capabilities

#### Authentication

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 📧 Accept an invitation | Activates account via secure invite link. | Click link in email → set password on `/accept-invite` → "Activate Account". |
| 🔑 Log in / Log out | Standard session-based authentication. | Enter credentials at `/login` → redirected to `/dashboard`. |

#### Schedule

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 🗓️ View own schedule | Personal weekly calendar showing assigned shifts with clock status (not started, in progress, completed, missed). | Navigate to `/me/schedule`. Week grid shows personal shifts with status indicators. |
| 👁️ View a shift | Shows details of a single assigned shift. | Click shift block on personal calendar → detail modal opens. |

#### Time Tracking

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 🟢 Clock in | Records shift start. Requires an active assignment. Entry is immutable once created. | Click "Clock In" on dashboard next to current shift. Timestamp recorded. Timer starts. Button changes to "Clock Out". |
| 🔴 Clock out | Records shift end. Duration calculated automatically. | Click "Clock Out". Optional notes prompt. Duration calculated. Entry saved. |
| ⏱️ View own clock entries | Personal clock-in/out history for a date range. | Navigate to profile → "Clock Entries" tab → use date range filter. |

#### Profile

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 👁️ View own profile | Shows own person record. | Click profile menu → "My Profile". |
| ✏️ Update own profile | Modifies timezone and phone number only. | Click "Edit" → only timezone and phone editable → "Save". |

#### Notifications

| Capability | What It Does | How It Works |
|-----------|-------------|-------------|
| 🔔 View notifications | Shows own notification inbox. | Click bell icon in header. Notification list displayed. |
| ✅ Mark as read | Marks individual or all notifications as read. | Click notification to mark single as read. Click "Mark All Read" to clear all. |

#### Read-Only Visibility

| Resource | Accessible Data | How It Works |
|----------|----------------|-------------|
| 👥 Own team | Team name and member list | Displayed on dashboard under "Your Team". |
| 🗓️ Own shifts | Shift title, scheduled time, team name, clock status | Displayed on personal schedule calendar. |
| 📋 Shift templates | Team's templates (read-only) | Viewable on team templates page (no edit controls). |
| 🏢 Company | Company name and timezone | Shown in profile and schedule headers. |

### 6.2 Compliance & Data Governance

No compliance-specific capabilities are available at the Employee level. Employees are the subjects of compliance protections (data erasure, audit trails) but do not have administrative access to these systems.

### 6.3 Restrictions

| | Restriction |
|---|------------|
| 🚫 | Cannot create, edit, or delete shifts, templates, teams, or people |
| 🚫 | Cannot assign anyone to shifts (including themselves) |
| 🚫 | Cannot publish schedules |
| 🚫 | Cannot view other employees' schedules, clock entries, or profiles |
| 🚫 | Cannot edit company settings |
| 🚫 | Cannot invite new people |
| 🚫 | Cannot access the admin panel or audit logs |

---

## 7. Permission Summary Matrix

### 7.1 MVP Core Permissions

| | Capability | 👤 Employee | 👔 Manager | 🏢 Company Admin | 🔒 Super Admin |
|---|------------|:--------:|:-------:|:-------------:|:-----------:|
| | **Authentication** | | | | |
| 📝 | Register a new company | — | — | ✅ | — |
| 🔑 | Log in / Log out | ✅ | ✅ | ✅ | ✅ |
| 📧 | Accept an invitation | ✅ | ✅ | — | — |
| | **Company** | | | | |
| 👁️ | View company settings | Read-only | Read-only | ✅ | ✅ (all) |
| ✏️ | Edit company settings | — | — | ✅ | ✅ (all) |
| ⏸️ | Suspend / Activate company | — | — | — | ✅ |
| 🗑️ | Delete company | — | — | — | ✅ |
| | **Teams** | | | | |
| 👁️ | View teams | Read-only (own) | Read-only (own) | ✅ | ✅ (all) |
| ➕ | Create team | — | — | ✅ | ✅ |
| ✏️ | Edit team | — | — | ✅ | ✅ |
| 🗑️ | Delete team | — | — | ✅ | ✅ |
| | **People** | | | | |
| 👁️ | View people | Self only | Own team | ✅ | ✅ (all) |
| ➕ | Invite / Create person | — | ✅ | ✅ | ✅ |
| ✏️ | Edit person | Self (tz, phone) | Own team (non-role) | ✅ | ✅ |
| | **Shift Templates** | | | | |
| 👁️ | View templates | Read-only (own) | ✅ (own team) | ✅ | ✅ (all) |
| ➕ | Create template | — | ✅ | ✅ | ✅ |
| ✏️ | Edit template | — | ✅ | ✅ | ✅ |
| 🗑️ | Delete template | — | ✅ | ✅ | ✅ |
| | **Shifts** | | | | |
| 👁️ | View shifts | Own only | Own team | ✅ | ✅ (all) |
| ➕ | Create ad-hoc shift | — | ✅ | ✅ | ✅ |
| ✏️ | Edit shift | — | ✅ (own team) | ✅ | ✅ |
| 🗑️ | Delete shift | — | ✅ (own team) | ✅ | ✅ |
| 🚀 | Publish schedule | — | ✅ | ✅ | ✅ |
| | **Assignments** | | | | |
| 👤 | Assign person to shift | — | ✅ | ✅ | ✅ |
| ❌ | Remove assignment | — | ✅ | ✅ | ✅ |
| 👁️ | View assignments | — | ✅ | ✅ | ✅ |
| | **Time Tracking** | | | | |
| 🟢 | Clock in | ✅ | — | — | — |
| 🔴 | Clock out | ✅ | — | — | — |
| ⏱️ | View own clock entries | ✅ | — | — | — |
| ⏱️ | View team clock entries | — | ✅ | ✅ | ✅ |
| | **Calendar** | | | | |
| 🗓️ | View own schedule | ✅ | — | — | — |
| 🗓️ | View team schedule | — | ✅ | ✅ | ✅ |
| | **Notifications** | | | | |
| 🔔 | View and manage read status | ✅ | ✅ | ✅ | ✅ |

### 7.2 Compliance & Data Governance Permissions

| | Capability | 👤 Employee | 👔 Manager | 🏢 Company Admin | 🔒 Super Admin |
|---|------------|:--------:|:-------:|:-------------:|:-----------:|
| | **Audit** | | | | |
| 📋 | View company audit log | — | ✅ (team scope) | ✅ | ✅ |
| 📋 | View platform audit log | — | — | — | ✅ |
| | **Data Protection** | | | | |
| 🗑️ | Delete person (GDPR erasure) | — | — | ✅ | ✅ |
| | **Compliance Settings** | | | | |
| ⚙️ | View compliance settings | — | — | ✅ | ✅ (all) |
| ⚙️ | Edit compliance settings | — | — | ✅ | ✅ (all) |

---

## 8. Technical Enforcement

Access control is enforced at three independent layers, ensuring defense in depth.

### 8.1 Database Row-Level Security (RLS)

Every data table includes a `company_id` column with a corresponding RLS policy. All queries are automatically filtered by the current tenant context. This isolation cannot be bypassed, even in the event of an application-level vulnerability.

### 8.2 Application Middleware

Each API request passes through three middleware stages before reaching business logic:

| Stage | Name | Responsibility |
|:-----:|------|---------------|
| 1 | **Authentication** | Validates the session token against the database. Loads user and company context. |
| 2 | **Tenant Isolation** | Sets the PostgreSQL session variable `app.current_company_id`, activating RLS filtering. |
| 3 | **Role Authorization** | Compares the user's role against the endpoint's required permission level. Returns 403 if insufficient. |

### 8.3 Frontend Route Guards

The user interface renders role-adapted views. Navigation menus, action buttons, and form fields are conditionally displayed based on the authenticated user's role. Employees never see admin controls. Managers never see cross-tenant data.

---

## 9. System Components

| Component | Icon | Responsibility |
|-----------|:----:|---------------|
| **Frontend** | 🖥️ | React SPA. Renders role-adapted views. Manages client-side routing and session state. |
| **API Server** | ⚙️ | Processes all requests through the authentication, tenant, and RBAC middleware chain. Executes business logic. |
| **PostgreSQL** | 🗄️ | Enforces row-level security, append-only constraints on audit and clock entries, and HMAC chain integrity via triggers. |
| **Email Service** | 📧 | Delivers transactional emails — invitations and shift assignment alerts. Synchronous in MVP; async queue post-MVP. |

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **RBAC** | Role-Based Access Control. Permission model where access is determined by assigned role. |
| **RLS** | Row-Level Security. PostgreSQL feature that restricts row access based on policies. |
| **Tenant** | An isolated company instance. All data is scoped by `company_id`. |
| **HMAC** | Hash-based Message Authentication Code. Used for tamper-evident audit chaining. |
| **RRULE** | RFC 5545 recurrence rule format. Defines repeating shift patterns. |
| **GDPR** | General Data Protection Regulation. EU data protection law requiring erasure and portability rights. |
| **HIPAA** | Health Insurance Portability and Accountability Act. US healthcare data protection law. |

---

*This document is derived from the Roster project specifications: PRD, MVP Plan, API Specification, Architecture Document, Session Management Spec, RBAC Matrix, Database Schema, Data Model, and UX User Stories.*
