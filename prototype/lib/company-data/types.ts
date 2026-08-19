import type { BreakPolicy } from "@/lib/company";

export type PersonRole = "employee" | "manager";
export type PersonStatus = "active" | "invited" | "inactive";

export interface Team {
  id: string;
  name: string;
  description?: string;
  locationId: string | null;
  managerId: string | null;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  active: boolean;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: PersonRole;
  teamIds: string[];
  locationId: string | null;
  timezone: string;
  status: PersonStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityAction = "invited" | "updated" | "resent" | "notified";

export interface ActivityEntry {
  id: string;
  personId: string;
  action: ActivityAction;
  message: string;
  timestamp: string;
  read: boolean;
}

export type ClockAction = "in" | "out";

export interface ClockEntry {
  id: string;
  personId: string;
  action: ClockAction;
  at: string;
  note?: string;
}

export type BreakType = "meal" | "rest";

export interface BreakEntry {
  id: string;
  clockEntryId: string; // id of the "in" ClockEntry that started this session
  personId: string;
  type: BreakType;
  breakInAt: string;
  breakOutAt?: string;
  durationMinutes?: number;
  createdAt: string;
}

export type ComplianceViolationType =
  | "meal_break_missing"
  | "meal_break_too_short"
  | "rest_break_missing"
  | "rest_break_too_short";
export type ComplianceViolationSeverity = "warning" | "critical";
export type ComplianceViolationStatus = "open" | "acknowledged" | "resolved" | "dismissed";

export interface ComplianceViolation {
  id: string;
  personId: string;
  clockEntryId: string;
  type: ComplianceViolationType;
  severity: ComplianceViolationSeverity;
  description: string;
  detectedAt: string;
  status: ComplianceViolationStatus;
}

export type LeaveType = "vacation" | "sick" | "personal" | "bereavement" | "other";
export type LeaveStatus = "pending" | "approved" | "denied" | "cancelled";

export interface LeaveRequest {
  id: string;
  personId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  reviewerComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftTemplate {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  teamId: string;
  templateId?: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  requiredCount: number;
  createdAt: string;
}

export type AssignmentStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface ShiftAssignment {
  id: string;
  shiftId: string;
  personId: string;
  status: AssignmentStatus;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  cancelledAt?: string;
  createdAt: string;
}

export type AuditTone = "neutral" | "success" | "warning" | "danger";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  tone: AuditTone;
  resource: string;
  resourceId: string;
  teamId?: string;
  message: string;
}

export interface BulkAssignInput {
  teamId: string;
  personId: string;
  templateId?: string;
  start: string;
  end: string;
  force?: boolean;
}

export interface BulkAssignSkip {
  shiftId: string;
  reason: string;
}

export interface BulkAssignResult {
  assigned: ShiftAssignment[];
  skipped: BulkAssignSkip[];
}

export interface CompanyState {
  teams: Team[];
  people: Person[];
  locations: Location[];
  activity: ActivityEntry[];
  clockEntries: ClockEntry[];
  breakEntries: BreakEntry[];
  complianceViolations: ComplianceViolation[];
  leaveRequests: LeaveRequest[];
  shiftTemplates: ShiftTemplate[];
  shifts: Shift[];
  shiftAssignments: ShiftAssignment[];
  auditLog: AuditEntry[];
}

export type CompanyAction =
  | { type: "hydrate"; data: CompanyState }
  | { type: "createTeam"; team: Team }
  | { type: "updateTeam"; id: string; patch: Partial<Team> }
  | { type: "deleteTeam"; id: string }
  | { type: "addPerson"; person: Person }
  | { type: "updatePerson"; id: string; patch: Partial<Person> }
  | { type: "resendInvite"; id: string }
  | { type: "deletePerson"; id: string }
  | { type: "createLocation"; location: Location }
  | { type: "updateLocation"; id: string; patch: Partial<Location> }
  | { type: "deleteLocation"; id: string }
  | { type: "addClockEntry"; entry: ClockEntry }
  | { type: "addBreakEntry"; entry: BreakEntry }
  | { type: "endBreakEntry"; id: string; breakOutAt: string; durationMinutes: number }
  | { type: "addComplianceViolation"; violation: ComplianceViolation }
  | { type: "markActivityRead"; id: string }
  | { type: "markAllActivityRead"; personId: string }
  | { type: "addLeaveRequest"; request: LeaveRequest }
  | { type: "updateLeaveRequest"; id: string; patch: Partial<LeaveRequest> }
  | { type: "cancelLeaveRequest"; id: string }
  | {
      type: "reviewLeaveRequest";
      id: string;
      status: "approved" | "denied";
      reviewerComment?: string;
      reviewedBy: string;
      reviewedAt: string;
    }
  | { type: "createShiftTemplate"; template: ShiftTemplate }
  | { type: "updateShiftTemplate"; id: string; patch: Partial<ShiftTemplate> }
  | { type: "deleteShiftTemplate"; id: string }
  | { type: "addShifts"; shifts: Shift[] }
  | { type: "createShift"; shift: Shift }
  | { type: "updateShift"; id: string; patch: Partial<Shift> }
  | { type: "deleteShift"; id: string }
  | { type: "deleteShifts"; ids: string[] }
  | {
      type: "updateTemplateShifts";
      templateId: string;
      patch: Partial<Shift>;
      rangeStart?: string;
      rangeEnd?: string;
    }
  | { type: "addAssignment"; assignment: ShiftAssignment }
  | { type: "addAssignments"; assignments: ShiftAssignment[] }
  | { type: "removeAssignment"; id: string }
  | {
      type: "cancelAssignment";
      id: string;
      cancelledAt: string;
    }
  | {
      type: "reviewAssignment";
      id: string;
      status: "approved" | "rejected";
      approvedAt?: string;
      approvedBy?: string;
    }
  | { type: "addActivity"; entry: ActivityEntry }
  | { type: "addAudit"; entry: AuditEntry };

export interface InviteInput {
  name: string;
  email: string;
  phone?: string;
  role: PersonRole;
  teamIds: string[];
  locationId: string | null;
  timezone: string;
}

export interface LocationInput {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  active: boolean;
}

export interface ShiftTemplateInput {
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
}

export interface CompanyContextValue extends CompanyState {
  loading: boolean;
  createTeam: (
    name: string,
    description?: string,
    locationId?: string | null,
    managerId?: string | null,
  ) => Promise<Team | null>;
  updateTeam: (id: string, patch: Partial<Team>) => Promise<boolean>;
  deleteTeam: (id: string) => Promise<void>;
  invitePerson: (input: InviteInput) => Promise<{ ok: boolean; error?: string; personId?: string }>;
  updatePerson: (id: string, patch: Partial<Person>) => Promise<boolean>;
  resendInvite: (id: string) => Promise<{ ok: boolean; error?: string }>;
  deletePerson: (id: string) => Promise<void>;
  createLocation: (input: LocationInput) => Promise<Location | null>;
  updateLocation: (id: string, patch: Partial<Location>) => Promise<boolean>;
  deleteLocation: (id: string) => Promise<void>;
  addClockEntry: (personId: string, action: ClockAction, note?: string) => Promise<void>;
  startBreak: (
    personId: string,
    type?: BreakType,
  ) => Promise<{ ok: boolean; error?: string; entry?: BreakEntry }>;
  endBreak: (breakId: string) => Promise<{ ok: boolean; error?: string }>;
  getActiveBreakForPerson: (personId: string) => BreakEntry | null;
  getBreaksForClockEntry: (clockEntryId: string) => BreakEntry[];
  getViolationsForClockEntry: (clockEntryId: string) => ComplianceViolation[];
  getBreakPolicyForPerson: (personId: string) => Promise<BreakPolicy>;
  requestLeave: (
    personId: string,
    input: {
      type: LeaveType;
      startDate: string;
      endDate: string;
      reason?: string;
    },
  ) => Promise<{ ok: boolean; error?: string }>;
  updateLeaveRequest: (id: string, patch: Partial<LeaveRequest>) => Promise<boolean>;
  cancelLeaveRequest: (id: string) => Promise<void>;
  approveLeave: (id: string, reviewedBy: string) => Promise<void>;
  denyLeave: (id: string, reviewedBy: string, comment?: string) => Promise<void>;
  markActivityRead: (id: string) => Promise<void>;
  markAllActivityRead: (personId: string) => Promise<void>;
  createShiftTemplate: (input: ShiftTemplateInput) => Promise<{
    ok: boolean;
    error?: string;
    template?: ShiftTemplate;
  }>;
  updateShiftTemplate: (id: string, patch: Partial<ShiftTemplate>) => Promise<boolean>;
  deleteShiftTemplate: (id: string) => Promise<void>;
  getShiftTemplatesByTeam: (teamId: string) => ShiftTemplate[];
  previewShifts: (
    teamId: string,
    rangeStart: string,
    rangeEnd: string,
  ) => { planned: Shift[]; skippedCount: number; conflictIds: string[] };
  publishShifts: (
    teamId: string,
    rangeStart: string,
    rangeEnd: string,
    shiftsToPublish?: Shift[],
  ) => Promise<Shift[]>;
  createShift: (input: {
    teamId: string;
    title: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    requiredCount: number;
  }) => Promise<{ ok: boolean; error?: string; shift?: Shift }>;
  updateShift: (
    id: string,
    patch: Partial<Shift>,
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteShift: (id: string) => Promise<void>;
  assignPerson: (
    shiftId: string,
    personId: string,
    override?: boolean,
  ) => Promise<{ ok: boolean; error?: string; conflict?: boolean }>;
  deleteShifts: (ids: string[]) => Promise<void>;
  createShifts: (input: {
    teamId: string;
    title: string;
    startTime: string;
    durationMinutes: number;
    requiredCount: number;
    dates: string[];
  }) => Promise<{ ok: boolean; error?: string; count: number }>;
  applyTemplateToShifts: (
    templateId: string,
    patch: Partial<Shift>,
    rangeStart?: string,
    rangeEnd?: string,
  ) => Promise<number>;
  removeAssignment: (id: string) => Promise<void>;
  bulkAssign: (input: BulkAssignInput) => Promise<BulkAssignResult>;
  requestShift: (
    shiftId: string,
    personId: string,
  ) => Promise<{ ok: boolean; error?: string; conflict?: boolean }>;
  cancelSelfAssignment: (id: string) => Promise<void>;
  approveShiftRequest: (assignmentId: string, reviewedBy: string) => Promise<void>;
  denyShiftRequest: (assignmentId: string, reviewedBy: string) => Promise<void>;
  getAvailableShiftsForPerson: (personId: string, teamId: string) => Shift[];
}
