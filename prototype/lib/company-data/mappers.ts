// Per-table fromXRow/toXRow mappers — snake_case DB rows <-> camelCase app
// types. Mirrors lib/company.ts's fromRow() style. undefined (app, field
// omitted/optional) <-> null (DB, nullable column); arrays/jsonb pass
// through directly.

import type { BreakPolicy } from "@/lib/company";
import type {
  ActivityAction,
  ActivityEntry,
  AssignmentStatus,
  AuditEntry,
  AuditTone,
  BreakEntry,
  BreakType,
  ClockAction,
  ClockEntry,
  ComplianceViolation,
  ComplianceViolationSeverity,
  ComplianceViolationStatus,
  ComplianceViolationType,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  Location,
  Person,
  PersonRole,
  PersonStatus,
  Shift,
  ShiftAssignment,
  ShiftTemplate,
  Team,
} from "./types";

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

export interface PersonRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: PersonRole;
  team_ids: string[];
  location_id: string | null;
  timezone: string;
  status: PersonStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const PERSON_COLUMNS =
  "id, name, email, phone, role, team_ids, location_id, timezone, status, notes, created_at, updated_at";

export function fromPersonRow(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role,
    teamIds: row.team_ids,
    locationId: row.location_id,
    timezone: row.timezone,
    status: row.status,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// teams
// ---------------------------------------------------------------------------

export interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  location_id: string | null;
  manager_id: string | null;
  created_at: string;
}

export const TEAM_COLUMNS = "id, name, description, location_id, manager_id, created_at";

export function fromTeamRow(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    locationId: row.location_id,
    managerId: row.manager_id,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// locations
// ---------------------------------------------------------------------------

export interface LocationRow {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  active: boolean;
  created_at: string;
}

export const LOCATION_COLUMNS =
  "id, name, description, address, city, state, country, active, created_at";

export function fromLocationRow(row: LocationRow): Location {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    country: row.country ?? undefined,
    active: row.active,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// activity_entries
// ---------------------------------------------------------------------------

export interface ActivityEntryRow {
  id: string;
  person_id: string;
  action: ActivityAction;
  message: string;
  read: boolean;
  created_at: string;
}

export const ACTIVITY_ENTRY_COLUMNS = "id, person_id, action, message, read, created_at";

export function fromActivityEntryRow(row: ActivityEntryRow): ActivityEntry {
  return {
    id: row.id,
    personId: row.person_id,
    action: row.action,
    message: row.message,
    timestamp: row.created_at,
    read: row.read,
  };
}

// ---------------------------------------------------------------------------
// clock_entries
// ---------------------------------------------------------------------------

export interface ClockEntryRow {
  id: string;
  person_id: string;
  action: ClockAction;
  at: string;
  note: string | null;
}

export const CLOCK_ENTRY_COLUMNS = "id, person_id, action, at, note";

export function fromClockEntryRow(row: ClockEntryRow): ClockEntry {
  return {
    id: row.id,
    personId: row.person_id,
    action: row.action,
    at: row.at,
    note: row.note ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// break_entries
// ---------------------------------------------------------------------------

export interface BreakEntryRow {
  id: string;
  clock_entry_id: string;
  person_id: string;
  type: BreakType;
  break_in_at: string;
  break_out_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export const BREAK_ENTRY_COLUMNS =
  "id, clock_entry_id, person_id, type, break_in_at, break_out_at, duration_minutes, created_at";

export function fromBreakEntryRow(row: BreakEntryRow): BreakEntry {
  return {
    id: row.id,
    clockEntryId: row.clock_entry_id,
    personId: row.person_id,
    type: row.type,
    breakInAt: row.break_in_at,
    breakOutAt: row.break_out_at ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// compliance_violations
// ---------------------------------------------------------------------------

export interface ComplianceViolationRow {
  id: string;
  person_id: string;
  clock_entry_id: string;
  type: ComplianceViolationType;
  severity: ComplianceViolationSeverity;
  description: string;
  detected_at: string;
  status: ComplianceViolationStatus;
}

export const COMPLIANCE_VIOLATION_COLUMNS =
  "id, person_id, clock_entry_id, type, severity, description, detected_at, status";

export function fromComplianceViolationRow(row: ComplianceViolationRow): ComplianceViolation {
  return {
    id: row.id,
    personId: row.person_id,
    clockEntryId: row.clock_entry_id,
    type: row.type,
    severity: row.severity,
    description: row.description,
    detectedAt: row.detected_at,
    status: row.status,
  };
}

// ---------------------------------------------------------------------------
// leave_requests
// ---------------------------------------------------------------------------

export interface LeaveRequestRow {
  id: string;
  person_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  reviewer_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const LEAVE_REQUEST_COLUMNS =
  "id, person_id, type, start_date, end_date, reason, status, reviewer_comment, reviewed_by, reviewed_at, created_at, updated_at";

export function fromLeaveRequestRow(row: LeaveRequestRow): LeaveRequest {
  return {
    id: row.id,
    personId: row.person_id,
    type: row.type,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason ?? undefined,
    status: row.status,
    reviewerComment: row.reviewer_comment ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// shift_templates
// ---------------------------------------------------------------------------

export interface ShiftTemplateRow {
  id: string;
  team_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  start_time: string;
  required_count: number;
  max_count: number | null;
  is_active: boolean;
  recurrence_rule: string | null;
  break_policy_override: Partial<BreakPolicy> | null;
  created_at: string;
  updated_at: string;
}

export const SHIFT_TEMPLATE_COLUMNS =
  "id, team_id, title, description, duration_minutes, start_time, required_count, max_count, is_active, recurrence_rule, break_policy_override, created_at, updated_at";

export function fromShiftTemplateRow(row: ShiftTemplateRow): ShiftTemplate {
  return {
    id: row.id,
    teamId: row.team_id,
    title: row.title,
    description: row.description ?? undefined,
    durationMinutes: row.duration_minutes,
    startTime: row.start_time,
    requiredCount: row.required_count,
    maxCount: row.max_count ?? undefined,
    isActive: row.is_active,
    recurrenceRule: row.recurrence_rule ?? undefined,
    breakPolicyOverride: row.break_policy_override ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// shifts
// ---------------------------------------------------------------------------

export interface ShiftRow {
  id: string;
  team_id: string;
  template_id: string | null;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  duration_minutes: number;
  required_count: number;
  created_at: string;
}

export const SHIFT_COLUMNS =
  "id, team_id, template_id, title, description, date, start_time, duration_minutes, required_count, created_at";

export function fromShiftRow(row: ShiftRow): Shift {
  return {
    id: row.id,
    teamId: row.team_id,
    templateId: row.template_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    date: row.date,
    startTime: row.start_time,
    durationMinutes: row.duration_minutes,
    requiredCount: row.required_count,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// shift_assignments
// ---------------------------------------------------------------------------

export interface ShiftAssignmentRow {
  id: string;
  shift_id: string;
  person_id: string;
  status: AssignmentStatus;
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export const SHIFT_ASSIGNMENT_COLUMNS =
  "id, shift_id, person_id, status, requested_at, approved_at, approved_by, cancelled_at, created_at";

export function fromShiftAssignmentRow(row: ShiftAssignmentRow): ShiftAssignment {
  return {
    id: row.id,
    shiftId: row.shift_id,
    personId: row.person_id,
    status: row.status,
    requestedAt: row.requested_at,
    approvedAt: row.approved_at ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// audit_log
// ---------------------------------------------------------------------------

export interface AuditLogRow {
  id: string;
  action: string;
  tone: AuditTone;
  resource: string;
  resource_id: string;
  team_id: string | null;
  message: string;
  created_at: string;
}

export const AUDIT_LOG_COLUMNS =
  "id, action, tone, resource, resource_id, team_id, message, created_at";

export function fromAuditLogRow(row: AuditLogRow): AuditEntry {
  return {
    id: row.id,
    timestamp: row.created_at,
    action: row.action,
    tone: row.tone,
    resource: row.resource,
    resourceId: row.resource_id,
    teamId: row.team_id ?? undefined,
    message: row.message,
  };
}
