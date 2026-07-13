# RBAC Matrix

## 1. Roles

| Role | Scope | Description | MVP? |
|---|---|---|---|
| `super_admin` | Global (all tenants) | Platform operations, all companies | ✅ |
| `company_admin` | Single company | Company settings, all teams, all people, audit log, compliance, integrations | ✅ |
| `manager` | Single team(s) | Team schedule, shift templates, approvals, team roster, reports | ✅ |
| `employee` | Self | Own schedule, self-scheduling requests, clock in/out, time-off requests | ✅ |
| `viewer` | Single team(s) (read-only) | HR, payroll, auditing — can view but not edit | ❌ MVP+ |

MVP uses 4 roles: `company_admin`, `manager`, `employee`, `super_admin`. `super_admin` is seeded in DB (no signup) and has a dedicated admin UI. `viewer` is post-MVP only. See `docs/04-mvp-plan.md` for details.

## 2. Permission Definitions

Each permission is a string `resource:action` where resource is a domain entity and action is one of: `create`, `read`, `update`, `delete`, `approve`, `export`, `invite`, `manage`.

| Permission | Applies to |
|---|---|
| `company.read` | Company settings |
| `company.update` | Company settings |
| `company.delete` | Soft-delete company |
| `company.import` | CSV import (people, shifts) |
| `company.export` | CSV export (people, shifts, reports) |
| `location.create` | Create locations/sites |
| `location.read` | View locations/sites |
| `location.update` | Edit locations/sites |
| `location.delete` | Delete locations/sites |
| `position.create` | Create job positions |
| `position.read` | View job positions |
| `position.update` | Edit job positions |
| `position.delete` | Delete job positions |
| `skill.create` | Create skills |
| `skill.read` | View skills |
| `skill.update` | Edit skills |
| `skill.delete` | Delete skills |
| `skill.assign` | Assign skills to people |
| `team.create` | Create teams |
| `team.read` | View team details |
| `team.update` | Edit team name, manager, location |
| `team.delete` | Delete team |
| `person.create` | Invite / add people |
| `person.read` | View people profiles |
| `person.update` | Edit people profiles |
| `person.delete` | Remove people (erasure) |
| `person.export` | Export person data (GDPR) |
| `shift_template.create` | Create shift templates |
| `shift_template.read` | View shift templates |
| `shift_template.update` | Edit shift templates |
| `shift_template.delete` | Delete shift templates |
| `shift.create` | Create shift instances |
| `shift.read` | View shift instances |
| `shift.update` | Edit shift instances |
| `shift.delete` | Delete shift instances |
| `shift.assign` | Assign people to shifts |
| `shift.request` | Self-scheduling (request a shift) |
| `shift.approve` | Approve/deny shift requests |
| `shift.swap` | Request a swap |
| `shift.swap_approve` | Approve/deny swaps |
| `shift.publish` | Publish/unpublish schedule |
| `clock.clock_in` | Clock in |
| `clock.clock_out` | Clock out |
| `clock.break_in` | Clock in for break |
| `clock.break_out` | Clock out from break |
| `clock.read` | View clock entries |
| `time_off.create` | Request time-off |
| `time_off.read` | View time-off requests |
| `time_off.approve` | Approve/deny time-off |
| `time_off.update` | Edit own pending time-off |
| `time_off.delete` | Cancel own time-off |
| `holiday.read` | View company holidays |
| `holiday.manage` | Create/edit/delete company holidays |
| `report.attendance` | View attendance reports |
| `report.overtime` | View overtime reports |
| `report.coverage` | View coverage reports |
| `report.labor_cost` | View labor cost reports |
| `report.compliance` | View compliance/break reports |
| `notification.read` | View own notifications |
| `notification.update` | Mark read |
| `notification.manage_preferences` | Configure notification preferences |
| `integration.manage` | Configure Slack/Teams/Google Calendar integrations |
| `audit_log.read` | View company audit log |
| `audit_log.read_all` | View platform audit log |
| `admin.companies` | Super admin: manage all companies |
| `settings.compliance` | Configure compliance mode (HIPAA toggle) |
| `settings.features` | Toggle feature flags |
| `mfa.enroll` | Enroll own MFA device |
| `mfa.enforce` | Require MFA for other users |

## 3. Role → Permission Mapping

For MVP, only a subset of these permissions is enforced. Permissions for swap, time-off, positions, skills, locations, integrations, holidays, reports, notification preferences, and MFA are defined here for forward-planning but are **not implemented in MVP middleware**. Clock in/out permissions (`clock.clock_in`, `clock.clock_out`, `clock.read`) **are** implemented in MVP. See `docs/04-mvp-plan.md` for the exact MVP endpoint list.

### super_admin
| Permission | Granted |
|---|---|
| All `company.*` | ✅ (all companies) |
| All `location.*` | ✅ (all companies) |
| All `position.*` | ✅ (all companies) |
| All `skill.*` | ✅ (all companies) |
| All `team.*` | ✅ (all companies) |
| All `person.*` | ✅ (all companies) |
| All `shift_template.*` | ✅ (all companies) |
| All `shift.*` | ✅ (all companies) |
| All `clock.*` | ✅ (all companies) |
| All `time_off.*` | ✅ (all companies) |
| All `holiday.*` | ✅ (all companies) |
| All `report.*` | ✅ (all companies) |
| All `notification.*` | ✅ |
| All `integration.*` | ✅ (all companies) |
| `audit_log.read` | ✅ (all companies) |
| `audit_log.read_all` | ✅ |
| `admin.companies` | ✅ |
| `settings.compliance` | ✅ (all companies) |
| `settings.features` | ✅ (all companies) |
| `mfa.enroll` | ✅ |
| `mfa.enforce` | ✅ (all companies) |

### Company Admin
| Permission | Granted |
|---|---|
| `company.read` | ✅ (own only) |
| `company.update` | ✅ (own only) |
| `company.import` | ✅ |
| `company.export` | ✅ |
| All `location.*` | ✅ |
| All `position.*` | ✅ |
| All `skill.*` | ✅ |
| All `team.*` | ✅ |
| All `person.*` | ✅ |
| `shift_template.*` | ✅ |
| `shift.*` | ✅ |
| `shift.approve` | ✅ |
| `shift.swap_approve` | ✅ |
| `shift.publish` | ✅ |
| `clock.read` | ✅ |
| All `time_off.*` | ✅ |
| All `holiday.*` | ✅ |
| All `report.*` | ✅ |
| `audit_log.read` | ✅ |
| `integration.manage` | ✅ |
| `settings.compliance` | ✅ |
| `settings.features` | ✅ |
| `mfa.enroll` | ✅ |
| `mfa.enforce` | ✅ |

### Manager
| Permission | Granted |
|---|---|
| `company.read` | ✅ (own, read-only) |
| `company.export` | ✅ (own team) |
| `location.read` | ✅ (own team's location) |
| `position.read` | ✅ |
| `skill.read` | ✅ |
| `skill.assign` | ✅ (own team) |
| `team.read` | ✅ (own team(s)) |
| `person.read` | ✅ (own team) |
| `person.update` | ✅ (own team, non-role fields) |
| `shift_template.create` | ✅ |
| `shift_template.read` | ✅ |
| `shift_template.update` | ✅ |
| `shift_template.delete` | ✅ |
| `shift.create` | ✅ |
| `shift.read` | ✅ (own team) |
| `shift.update` | ✅ (own team) |
| `shift.delete` | ✅ (own team) |
| `shift.assign` | ✅ |
| `shift.approve` | ✅ |
| `shift.swap_approve` | ✅ |
| `shift.publish` | ✅ |
| `clock.read` | ✅ (own team) |
| `time_off.read` | ✅ (own team) |
| `time_off.approve` | ✅ (own team) |
| `holiday.read` | ✅ |
| `report.attendance` | ✅ (own team) |
| `report.overtime` | ✅ (own team) |
| `report.coverage` | ✅ (own team) |
| `report.compliance` | ✅ (own team) |
| `audit_log.read` | ✅ (own team scope) |
| `mfa.enroll` | ✅ |

### Employee
| Permission | Granted | MVP? |
|---|---|---|
| `company.read` | ✅ (own, read-only) | ✅ |
| `position.read` | ✅ | ❌ MVP+ (positions deferred) |
| `skill.read` | ✅ | ❌ MVP+ (skills deferred) |
| `team.read` | ✅ (own team, read-only) | ✅ |
| `person.read` | ✅ (self only) | ✅ |
| `person.update` | ✅ (own timezone, phone only) | ✅ |
| `shift_template.read` | ✅ (own team) | ✅ |
| `shift.read` | ✅ (own + own team published) | ✅ |
| `shift.request` | ✅ (self-scheduling) | ❌ MVP+ |
| `shift.swap` | ✅ (request swap from manager) | ❌ MVP+ |
| `clock.clock_in` | ✅ | ✅ |
| `clock.clock_out` | ✅ | ✅ |
| `clock.break_in` | ✅ | ❌ MVP+ |
| `clock.break_out` | ✅ | ❌ MVP+ |
| `clock.read` | ✅ (self only) | ✅ |
| `time_off.create` | ✅ | ❌ MVP+ |
| `time_off.read` | ✅ (self only) | ❌ MVP+ |
| `time_off.update` | ✅ (own pending only) | ❌ MVP+ |
| `time_off.delete` | ✅ (own pending only) | ❌ MVP+ |
| `holiday.read` | ✅ | ❌ MVP+ |
| `notification.read` | ✅ | ✅ |
| `notification.update` | ✅ | ✅ |
| `notification.manage_preferences` | ✅ | ❌ MVP+ |
| `mfa.enroll` | ✅ | ❌ MVP+ |

### Viewer (Read-only)
| Permission | Granted |
|---|---|
| `company.read` | ✅ |
| `location.read` | ✅ |
| `position.read` | ✅ |
| `skill.read` | ✅ |
| `team.read` | ✅ (assigned teams) |
| `person.read` | ✅ (assigned teams) |
| `shift_template.read` | ✅ (assigned teams) |
| `shift.read` | ✅ (assigned teams) |
| `clock.read` | ✅ (assigned teams) |
| `time_off.read` | ✅ (assigned teams) |
| `holiday.read` | ✅ |
| `report.attendance` | ✅ (assigned teams) |
| `report.overtime` | ✅ (assigned teams) |
| `report.coverage` | ✅ (assigned teams) |
| `report.labor_cost` | ✅ (assigned teams) |
| `report.compliance` | ✅ (assigned teams) |
| `audit_log.read` | ✅ (assigned teams) |

## 4. Enforcement

Enforcement is three-layered:

### Layer 1: Database Row-Level Security (RLS)
PostgreSQL RLS policies on every table, default-deny, scoped by `company_id`. This ensures data isolation even if an application bug bypasses middleware.

### Layer 2: Application Middleware
API route guard verifies:
1. Session is valid (auth middleware)
2. User belongs to the company being accessed (tenant middleware)
3. User's role has the required permission (rbac middleware)

### Layer 3: UI
Frontend route guards and component-level visibility based on the permissions available to the user's role.

```typescript
// Example middleware pattern
// POST /api/v1/people
requirePermission('person.create', req.user, req.companyId)
```

## 5. MVP Simplification Note

For MVP, RBAC is simplified:
- 4 roles: `company_admin`, `manager`, `employee`, `super_admin`
- `viewer` role exists in the database schema (full enum) but has no UI screens in MVP
- `super_admin` is seeded in DB (no signup), uses same login flow, has dedicated admin UI
- Permissions are hardcoded by role in middleware, not stored in a join table
- `employee` permission set is the most restricted
- `manager` inherits all `employee` permissions plus scheduling and team management
- `company_admin` inherits all permissions for their company
- `super_admin` inherits all permissions across all companies plus admin actions

```typescript
// MVP RBAC: hardcoded role hierarchy
const roleHierarchy = {
    employee: 0,
    manager: 1,
    company_admin: 2,
    super_admin: 3,
};
// A user with role X can access any endpoint requiring role <= X.
```