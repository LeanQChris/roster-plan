// Supabase CRUD per entity. Browser client; RLS auto-scopes every query to
// the signed-in user's company (no explicit company_id filters needed).
// Every function throws on a Supabase error — callers (context.tsx) catch
// and turn it into the { ok: false, error } shape the UI expects.

import { createClient } from "@/lib/supabase/client";
import type { BreakPolicy } from "@/lib/company";
import {
  ACTIVITY_ENTRY_COLUMNS,
  AUDIT_LOG_COLUMNS,
  BREAK_ENTRY_COLUMNS,
  CLOCK_ENTRY_COLUMNS,
  COMPLIANCE_VIOLATION_COLUMNS,
  LEAVE_REQUEST_COLUMNS,
  LOCATION_COLUMNS,
  PERSON_COLUMNS,
  SHIFT_ASSIGNMENT_COLUMNS,
  SHIFT_COLUMNS,
  SHIFT_TEMPLATE_COLUMNS,
  TEAM_COLUMNS,
  fromActivityEntryRow,
  fromAuditLogRow,
  fromBreakEntryRow,
  fromClockEntryRow,
  fromComplianceViolationRow,
  fromLeaveRequestRow,
  fromLocationRow,
  fromPersonRow,
  fromShiftAssignmentRow,
  fromShiftRow,
  fromShiftTemplateRow,
  fromTeamRow,
} from "./mappers";
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

function fail(error: { message: string } | null, context: string): never {
  throw new Error(error?.message ?? `${context} failed.`);
}

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

export async function fetchPeople(): Promise<Person[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("people").select(PERSON_COLUMNS);
  if (error) fail(error, "fetchPeople");
  return (data ?? []).map(fromPersonRow);
}

export interface InsertPersonInput {
  name: string;
  email: string;
  phone?: string;
  role: PersonRole;
  teamIds: string[];
  locationId: string | null;
  timezone: string;
  status?: PersonStatus;
}

export async function insertPerson(input: InsertPersonInput): Promise<Person> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("people")
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      role: input.role,
      team_ids: input.teamIds,
      location_id: input.locationId,
      timezone: input.timezone,
      status: input.status ?? "invited",
    })
    .select(PERSON_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertPerson");
  return fromPersonRow(data);
}

export async function updatePersonRow(id: string, patch: Partial<Person>): Promise<Person> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.phone !== undefined) update.phone = patch.phone ?? null;
  if (patch.role !== undefined) update.role = patch.role;
  if (patch.teamIds !== undefined) update.team_ids = patch.teamIds;
  if (patch.locationId !== undefined) update.location_id = patch.locationId;
  if (patch.timezone !== undefined) update.timezone = patch.timezone;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.notes !== undefined) update.notes = patch.notes ?? null;
  const { data, error } = await supabase
    .from("people")
    .update(update)
    .eq("id", id)
    .select(PERSON_COLUMNS)
    .single();
  if (error || !data) fail(error, "updatePersonRow");
  return fromPersonRow(data);
}

export async function deletePersonRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) fail(error, "deletePersonRow");
}

// ---------------------------------------------------------------------------
// teams
// ---------------------------------------------------------------------------

export async function fetchTeams(): Promise<Team[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("teams").select(TEAM_COLUMNS);
  if (error) fail(error, "fetchTeams");
  return (data ?? []).map(fromTeamRow);
}

export async function insertTeam(input: {
  name: string;
  description?: string;
  locationId: string | null;
  managerId: string | null;
}): Promise<Team> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: input.name,
      description: input.description ?? null,
      location_id: input.locationId,
      manager_id: input.managerId,
    })
    .select(TEAM_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertTeam");
  return fromTeamRow(data);
}

export async function updateTeamRow(id: string, patch: Partial<Team>): Promise<Team> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.description !== undefined) update.description = patch.description ?? null;
  if (patch.locationId !== undefined) update.location_id = patch.locationId;
  if (patch.managerId !== undefined) update.manager_id = patch.managerId;
  const { data, error } = await supabase
    .from("teams")
    .update(update)
    .eq("id", id)
    .select(TEAM_COLUMNS)
    .single();
  if (error || !data) fail(error, "updateTeamRow");
  return fromTeamRow(data);
}

export async function deleteTeamRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) fail(error, "deleteTeamRow");
}

// ---------------------------------------------------------------------------
// locations
// ---------------------------------------------------------------------------

export async function fetchLocations(): Promise<Location[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("locations").select(LOCATION_COLUMNS);
  if (error) fail(error, "fetchLocations");
  return (data ?? []).map(fromLocationRow);
}

export async function insertLocation(input: {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  active: boolean;
}): Promise<Location> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("locations")
    .insert({
      name: input.name,
      description: input.description ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      country: input.country ?? null,
      active: input.active,
    })
    .select(LOCATION_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertLocation");
  return fromLocationRow(data);
}

export async function updateLocationRow(id: string, patch: Partial<Location>): Promise<Location> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.description !== undefined) update.description = patch.description ?? null;
  if (patch.address !== undefined) update.address = patch.address ?? null;
  if (patch.city !== undefined) update.city = patch.city ?? null;
  if (patch.state !== undefined) update.state = patch.state ?? null;
  if (patch.country !== undefined) update.country = patch.country ?? null;
  if (patch.active !== undefined) update.active = patch.active;
  const { data, error } = await supabase
    .from("locations")
    .update(update)
    .eq("id", id)
    .select(LOCATION_COLUMNS)
    .single();
  if (error || !data) fail(error, "updateLocationRow");
  return fromLocationRow(data);
}

export async function deleteLocationRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) fail(error, "deleteLocationRow");
}

// ---------------------------------------------------------------------------
// activity_entries
// ---------------------------------------------------------------------------

export async function fetchActivity(): Promise<ActivityEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_entries")
    .select(ACTIVITY_ENTRY_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) fail(error, "fetchActivity");
  return (data ?? []).map(fromActivityEntryRow);
}

export async function insertActivity(input: {
  personId: string;
  action: ActivityAction;
  message: string;
}): Promise<ActivityEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_entries")
    .insert({ person_id: input.personId, action: input.action, message: input.message })
    .select(ACTIVITY_ENTRY_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertActivity");
  return fromActivityEntryRow(data);
}

export async function insertActivityMany(
  inputs: { personId: string; action: ActivityAction; message: string }[],
): Promise<ActivityEntry[]> {
  if (inputs.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_entries")
    .insert(inputs.map((i) => ({ person_id: i.personId, action: i.action, message: i.message })))
    .select(ACTIVITY_ENTRY_COLUMNS);
  if (error || !data) fail(error, "insertActivityMany");
  return data.map(fromActivityEntryRow);
}

export async function markActivityReadRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("activity_entries").update({ read: true }).eq("id", id);
  if (error) fail(error, "markActivityReadRow");
}

export async function markAllActivityReadRow(personId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("activity_entries")
    .update({ read: true })
    .eq("person_id", personId)
    .eq("read", false);
  if (error) fail(error, "markAllActivityReadRow");
}

// ---------------------------------------------------------------------------
// clock_entries
// ---------------------------------------------------------------------------

export async function fetchClockEntries(): Promise<ClockEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clock_entries")
    .select(CLOCK_ENTRY_COLUMNS)
    .order("at", { ascending: false });
  if (error) fail(error, "fetchClockEntries");
  return (data ?? []).map(fromClockEntryRow);
}

export async function insertClockEntry(input: {
  personId: string;
  action: ClockAction;
  at: string;
  note?: string;
}): Promise<ClockEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clock_entries")
    .insert({
      person_id: input.personId,
      action: input.action,
      at: input.at,
      note: input.note ?? null,
    })
    .select(CLOCK_ENTRY_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertClockEntry");
  return fromClockEntryRow(data);
}

// ---------------------------------------------------------------------------
// break_entries
// ---------------------------------------------------------------------------

export async function fetchBreakEntries(): Promise<BreakEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("break_entries").select(BREAK_ENTRY_COLUMNS);
  if (error) fail(error, "fetchBreakEntries");
  return (data ?? []).map(fromBreakEntryRow);
}

export async function insertBreakEntry(input: {
  clockEntryId: string;
  personId: string;
  type: BreakType;
  breakInAt: string;
}): Promise<BreakEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("break_entries")
    .insert({
      clock_entry_id: input.clockEntryId,
      person_id: input.personId,
      type: input.type,
      break_in_at: input.breakInAt,
    })
    .select(BREAK_ENTRY_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertBreakEntry");
  return fromBreakEntryRow(data);
}

export async function endBreakEntryRow(
  id: string,
  breakOutAt: string,
  durationMinutes: number,
): Promise<BreakEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("break_entries")
    .update({ break_out_at: breakOutAt, duration_minutes: durationMinutes })
    .eq("id", id)
    .select(BREAK_ENTRY_COLUMNS)
    .single();
  if (error || !data) fail(error, "endBreakEntryRow");
  return fromBreakEntryRow(data);
}

// ---------------------------------------------------------------------------
// compliance_violations
// ---------------------------------------------------------------------------

export async function fetchComplianceViolations(): Promise<ComplianceViolation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("compliance_violations")
    .select(COMPLIANCE_VIOLATION_COLUMNS);
  if (error) fail(error, "fetchComplianceViolations");
  return (data ?? []).map(fromComplianceViolationRow);
}

export async function insertComplianceViolation(input: {
  personId: string;
  clockEntryId: string;
  type: ComplianceViolationType;
  severity: ComplianceViolationSeverity;
  description: string;
  detectedAt: string;
}): Promise<ComplianceViolation> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("compliance_violations")
    .insert({
      person_id: input.personId,
      clock_entry_id: input.clockEntryId,
      type: input.type,
      severity: input.severity,
      description: input.description,
      detected_at: input.detectedAt,
      status: "open" as ComplianceViolationStatus,
    })
    .select(COMPLIANCE_VIOLATION_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertComplianceViolation");
  return fromComplianceViolationRow(data);
}

// ---------------------------------------------------------------------------
// leave_requests
// ---------------------------------------------------------------------------

export async function fetchLeaveRequests(): Promise<LeaveRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("leave_requests").select(LEAVE_REQUEST_COLUMNS);
  if (error) fail(error, "fetchLeaveRequests");
  return (data ?? []).map(fromLeaveRequestRow);
}

export async function insertLeaveRequest(input: {
  personId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<LeaveRequest> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      person_id: input.personId,
      type: input.type,
      start_date: input.startDate,
      end_date: input.endDate,
      reason: input.reason ?? null,
      status: "pending" as LeaveStatus,
    })
    .select(LEAVE_REQUEST_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertLeaveRequest");
  return fromLeaveRequestRow(data);
}

export async function updateLeaveRequestRow(
  id: string,
  patch: Partial<LeaveRequest>,
): Promise<LeaveRequest> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.startDate !== undefined) update.start_date = patch.startDate;
  if (patch.endDate !== undefined) update.end_date = patch.endDate;
  if (patch.reason !== undefined) update.reason = patch.reason ?? null;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.reviewerComment !== undefined) update.reviewer_comment = patch.reviewerComment ?? null;
  if (patch.reviewedBy !== undefined) update.reviewed_by = patch.reviewedBy ?? null;
  if (patch.reviewedAt !== undefined) update.reviewed_at = patch.reviewedAt ?? null;
  const { data, error } = await supabase
    .from("leave_requests")
    .update(update)
    .eq("id", id)
    .select(LEAVE_REQUEST_COLUMNS)
    .single();
  if (error || !data) fail(error, "updateLeaveRequestRow");
  return fromLeaveRequestRow(data);
}

// ---------------------------------------------------------------------------
// shift_templates
// ---------------------------------------------------------------------------

export async function fetchShiftTemplates(): Promise<ShiftTemplate[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("shift_templates").select(SHIFT_TEMPLATE_COLUMNS);
  if (error) fail(error, "fetchShiftTemplates");
  return (data ?? []).map(fromShiftTemplateRow);
}

export async function insertShiftTemplate(input: {
  teamId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  startTime: string;
  requiredCount: number;
  maxCount?: number;
  isActive: boolean;
  recurrenceRule?: string;
  breakPolicyOverride?: Partial<BreakPolicy>;
}): Promise<ShiftTemplate> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shift_templates")
    .insert({
      team_id: input.teamId,
      title: input.title,
      description: input.description ?? null,
      duration_minutes: input.durationMinutes,
      start_time: input.startTime,
      required_count: input.requiredCount,
      max_count: input.maxCount ?? null,
      is_active: input.isActive,
      recurrence_rule: input.recurrenceRule ?? null,
      break_policy_override: input.breakPolicyOverride ?? null,
    })
    .select(SHIFT_TEMPLATE_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertShiftTemplate");
  return fromShiftTemplateRow(data);
}

export async function updateShiftTemplateRow(
  id: string,
  patch: Partial<ShiftTemplate>,
): Promise<ShiftTemplate> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description ?? null;
  if (patch.durationMinutes !== undefined) update.duration_minutes = patch.durationMinutes;
  if (patch.startTime !== undefined) update.start_time = patch.startTime;
  if (patch.requiredCount !== undefined) update.required_count = patch.requiredCount;
  if (patch.maxCount !== undefined) update.max_count = patch.maxCount ?? null;
  if (patch.isActive !== undefined) update.is_active = patch.isActive;
  if (patch.recurrenceRule !== undefined) update.recurrence_rule = patch.recurrenceRule ?? null;
  if (patch.breakPolicyOverride !== undefined)
    update.break_policy_override = patch.breakPolicyOverride ?? null;
  const { data, error } = await supabase
    .from("shift_templates")
    .update(update)
    .eq("id", id)
    .select(SHIFT_TEMPLATE_COLUMNS)
    .single();
  if (error || !data) fail(error, "updateShiftTemplateRow");
  return fromShiftTemplateRow(data);
}

export async function deleteShiftTemplateRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("shift_templates").delete().eq("id", id);
  if (error) fail(error, "deleteShiftTemplateRow");
}

// ---------------------------------------------------------------------------
// shifts
// ---------------------------------------------------------------------------

export async function fetchShifts(): Promise<Shift[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("shifts").select(SHIFT_COLUMNS);
  if (error) fail(error, "fetchShifts");
  return (data ?? []).map(fromShiftRow);
}

export interface InsertShiftInput {
  teamId: string;
  templateId?: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  requiredCount: number;
}

export async function insertShift(input: InsertShiftInput): Promise<Shift> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shifts")
    .insert({
      team_id: input.teamId,
      template_id: input.templateId ?? null,
      title: input.title,
      description: input.description ?? null,
      date: input.date,
      start_time: input.startTime,
      duration_minutes: input.durationMinutes,
      required_count: input.requiredCount,
    })
    .select(SHIFT_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertShift");
  return fromShiftRow(data);
}

export async function insertShiftsMany(inputs: InsertShiftInput[]): Promise<Shift[]> {
  if (inputs.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shifts")
    .insert(
      inputs.map((input) => ({
        team_id: input.teamId,
        template_id: input.templateId ?? null,
        title: input.title,
        description: input.description ?? null,
        date: input.date,
        start_time: input.startTime,
        duration_minutes: input.durationMinutes,
        required_count: input.requiredCount,
      })),
    )
    .select(SHIFT_COLUMNS);
  if (error || !data) fail(error, "insertShiftsMany");
  return data.map(fromShiftRow);
}

export async function updateShiftRow(id: string, patch: Partial<Shift>): Promise<Shift> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description ?? null;
  if (patch.date !== undefined) update.date = patch.date;
  if (patch.startTime !== undefined) update.start_time = patch.startTime;
  if (patch.durationMinutes !== undefined) update.duration_minutes = patch.durationMinutes;
  if (patch.requiredCount !== undefined) update.required_count = patch.requiredCount;
  const { data, error } = await supabase
    .from("shifts")
    .update(update)
    .eq("id", id)
    .select(SHIFT_COLUMNS)
    .single();
  if (error || !data) fail(error, "updateShiftRow");
  return fromShiftRow(data);
}

export async function deleteShiftRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("shifts").delete().eq("id", id);
  if (error) fail(error, "deleteShiftRow");
}

export async function deleteShiftsMany(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.from("shifts").delete().in("id", ids);
  if (error) fail(error, "deleteShiftsMany");
}

export async function updateShiftsByTemplate(
  templateId: string,
  patch: Partial<Shift>,
  rangeStart?: string,
  rangeEnd?: string,
): Promise<Shift[]> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description ?? null;
  if (patch.date !== undefined) update.date = patch.date;
  if (patch.startTime !== undefined) update.start_time = patch.startTime;
  if (patch.durationMinutes !== undefined) update.duration_minutes = patch.durationMinutes;
  if (patch.requiredCount !== undefined) update.required_count = patch.requiredCount;

  let query = supabase.from("shifts").update(update).eq("template_id", templateId);
  if (rangeStart) query = query.gte("date", rangeStart);
  if (rangeEnd) query = query.lte("date", rangeEnd);
  const { data, error } = await query.select(SHIFT_COLUMNS);
  if (error) fail(error, "updateShiftsByTemplate");
  return (data ?? []).map(fromShiftRow);
}

// ---------------------------------------------------------------------------
// shift_assignments
// ---------------------------------------------------------------------------

export async function fetchShiftAssignments(): Promise<ShiftAssignment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shift_assignments")
    .select(SHIFT_ASSIGNMENT_COLUMNS);
  if (error) fail(error, "fetchShiftAssignments");
  return (data ?? []).map(fromShiftAssignmentRow);
}

export interface InsertAssignmentInput {
  shiftId: string;
  personId: string;
  status: AssignmentStatus;
  approvedAt?: string;
}

export async function insertAssignment(input: InsertAssignmentInput): Promise<ShiftAssignment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shift_assignments")
    .insert({
      shift_id: input.shiftId,
      person_id: input.personId,
      status: input.status,
      approved_at: input.approvedAt ?? null,
    })
    .select(SHIFT_ASSIGNMENT_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertAssignment");
  return fromShiftAssignmentRow(data);
}

export async function insertAssignmentsMany(
  inputs: InsertAssignmentInput[],
): Promise<ShiftAssignment[]> {
  if (inputs.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shift_assignments")
    .insert(
      inputs.map((input) => ({
        shift_id: input.shiftId,
        person_id: input.personId,
        status: input.status,
        approved_at: input.approvedAt ?? null,
      })),
    )
    .select(SHIFT_ASSIGNMENT_COLUMNS);
  if (error || !data) fail(error, "insertAssignmentsMany");
  return data.map(fromShiftAssignmentRow);
}

export async function updateAssignmentRow(
  id: string,
  patch: Partial<ShiftAssignment>,
): Promise<ShiftAssignment> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.approvedAt !== undefined) update.approved_at = patch.approvedAt ?? null;
  if (patch.approvedBy !== undefined) update.approved_by = patch.approvedBy ?? null;
  if (patch.cancelledAt !== undefined) update.cancelled_at = patch.cancelledAt ?? null;
  const { data, error } = await supabase
    .from("shift_assignments")
    .update(update)
    .eq("id", id)
    .select(SHIFT_ASSIGNMENT_COLUMNS)
    .single();
  if (error || !data) fail(error, "updateAssignmentRow");
  return fromShiftAssignmentRow(data);
}

export async function deleteAssignmentRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("shift_assignments").delete().eq("id", id);
  if (error) fail(error, "deleteAssignmentRow");
}

// ---------------------------------------------------------------------------
// audit_log
// ---------------------------------------------------------------------------

export async function fetchAuditLog(): Promise<AuditEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select(AUDIT_LOG_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) fail(error, "fetchAuditLog");
  return (data ?? []).map(fromAuditLogRow);
}

export async function insertAudit(input: {
  action: string;
  tone: AuditTone;
  resource: string;
  resourceId: string;
  teamId?: string;
  message: string;
}): Promise<AuditEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .insert({
      action: input.action,
      tone: input.tone,
      resource: input.resource,
      resource_id: input.resourceId,
      team_id: input.teamId ?? null,
      message: input.message,
    })
    .select(AUDIT_LOG_COLUMNS)
    .single();
  if (error || !data) fail(error, "insertAudit");
  return fromAuditLogRow(data);
}
