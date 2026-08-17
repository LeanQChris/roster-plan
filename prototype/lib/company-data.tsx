"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { ReactNode } from "react";
import { readCompanySetup } from "./company";
import { RRule } from "rrule";

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

interface CompanyState {
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

type CompanyAction =
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
      reviewedBy: string;
    }
  | { type: "addActivity"; entry: ActivityEntry }
  | { type: "addAudit"; entry: AuditEntry };

const TEAMS_KEY = "roster.teams";
const PEOPLE_KEY = "roster.people";
const LOCATIONS_KEY = "roster.locations";
const ACTIVITY_KEY = "roster.activity";
const CLOCK_KEY = "roster.clock";
const BREAKS_KEY = "roster.breakEntries";
const VIOLATIONS_KEY = "roster.complianceViolations";
const LEAVE_KEY = "roster.leaveRequests";
const TEMPLATES_KEY = "roster.shiftTemplates";
const SHIFTS_KEY = "roster.shifts";
const ASSIGNMENTS_KEY = "roster.shiftAssignments";
const AUDIT_KEY = "roster.auditLog";

const MEAL_BREAK_TRIGGER_MINUTES = 5 * 60;
const MEAL_BREAK_MIN_MINUTES = 30;
const REST_BREAK_TRIGGER_MINUTES = 4 * 60;
const REST_BREAK_MIN_MINUTES = 10;

let seq = 0;
export const nextId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${(seq += 1).toString(36)}`;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function shiftsOverlap(
  a: { date: string; startTime: string; durationMinutes: number },
  b: { date: string; startTime: string; durationMinutes: number },
): boolean {
  if (a.date !== b.date) return false;
  const aStart = timeToMinutes(a.startTime);
  const aEnd = aStart + a.durationMinutes;
  const bStart = timeToMinutes(b.startTime);
  const bEnd = bStart + b.durationMinutes;
  return aStart < bEnd && bStart < aEnd;
}

function shiftTimesOverlap(
  aStart: string,
  aDuration: number,
  bStart: string,
  bDuration: number,
): boolean {
  const [ah, am] = aStart.split(":").map(Number);
  const [bh, bm] = bStart.split(":").map(Number);
  const a1 = ah * 60 + am;
  const b1 = bh * 60 + bm;
  return a1 < b1 + bDuration && b1 < a1 + aDuration;
}

function hasApprovedLeaveOn(
  personId: string,
  date: string,
  leaveRequests: LeaveRequest[],
): LeaveRequest | undefined {
  return leaveRequests.find(
    (l) =>
      l.personId === personId &&
      l.status === "approved" &&
      l.startDate <= date &&
      date <= l.endDate,
  );
}

function minutesBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

function inferBreakType(sessionMinutes: number, existingTypes: BreakType[]): BreakType {
  if (sessionMinutes >= MEAL_BREAK_TRIGGER_MINUTES && !existingTypes.includes("meal")) {
    return "meal";
  }
  return "rest";
}

function evaluateBreakCompliance(
  sessionMinutes: number,
  breaks: BreakEntry[],
): { type: ComplianceViolationType; severity: ComplianceViolationSeverity; description: string }[] {
  const violations: {
    type: ComplianceViolationType;
    severity: ComplianceViolationSeverity;
    description: string;
  }[] = [];

  if (sessionMinutes >= MEAL_BREAK_TRIGGER_MINUTES) {
    const mealBreaks = breaks.filter((b) => b.type === "meal" && b.durationMinutes !== undefined);
    if (mealBreaks.length === 0) {
      violations.push({
        type: "meal_break_missing",
        severity: "critical",
        description: `No meal break taken during a ${Math.round(sessionMinutes / 60)}h+ shift.`,
      });
    } else if (!mealBreaks.some((b) => (b.durationMinutes ?? 0) >= MEAL_BREAK_MIN_MINUTES)) {
      violations.push({
        type: "meal_break_too_short",
        severity: "warning",
        description: `Meal break(s) taken but none reached the ${MEAL_BREAK_MIN_MINUTES}-minute minimum.`,
      });
    }
  }

  if (sessionMinutes >= REST_BREAK_TRIGGER_MINUTES) {
    const restBreaks = breaks.filter((b) => b.type === "rest" && b.durationMinutes !== undefined);
    if (restBreaks.length === 0) {
      violations.push({
        type: "rest_break_missing",
        severity: "critical",
        description: `No rest break taken during a ${Math.round(sessionMinutes / 60)}h+ shift.`,
      });
    } else if (!restBreaks.some((b) => (b.durationMinutes ?? 0) >= REST_BREAK_MIN_MINUTES)) {
      violations.push({
        type: "rest_break_too_short",
        severity: "warning",
        description: `Rest break(s) taken but none reached the ${REST_BREAK_MIN_MINUTES}-minute minimum.`,
      });
    }
  }

  return violations;
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — state stays in memory
  }
}

function initState(): CompanyState {
  const teams = readStored<Team[]>(TEAMS_KEY, []).map((t) => ({
    ...t,
    managerId: t.managerId ?? null,
  }));
  const people = readStored<
    (Person & { teamId?: string | null; teamIds?: string[] })[]
  >(PEOPLE_KEY, []).map((p) => ({
    ...p,
    teamIds: p.teamIds ?? (p.teamId ? [p.teamId] : []),
  }));
  const locations = readStored<Location[]>(LOCATIONS_KEY, []);
  const activity = readStored<ActivityEntry[]>(ACTIVITY_KEY, []);
  const clockEntries = readStored<ClockEntry[]>(CLOCK_KEY, []);
  const breakEntries = readStored<BreakEntry[]>(BREAKS_KEY, []);
  const complianceViolations = readStored<ComplianceViolation[]>(VIOLATIONS_KEY, []);
  const leaveRequests = readStored<LeaveRequest[]>(LEAVE_KEY, []);
  const shiftTemplates = readStored<ShiftTemplate[]>(TEMPLATES_KEY, []);
  const shifts = readStored<Shift[]>(SHIFTS_KEY, []);
  const shiftAssignments = readStored<ShiftAssignment[]>(ASSIGNMENTS_KEY, []);
  const auditLog = readStored<AuditEntry[]>(AUDIT_KEY, []);

  if (teams.length === 0) {
    const setup = readCompanySetup();
    if (setup?.team) {
      const first: Team = {
        id: nextId("team"),
        name: setup.team,
        description: "Your first team",
        locationId: null,
        managerId: null,
        createdAt: new Date().toISOString(),
      };
      teams.push(first);
      writeStored(TEAMS_KEY, teams);
    }
  }
  return {
    teams,
    people,
    locations,
    activity,
    clockEntries,
    breakEntries,
    complianceViolations,
    leaveRequests,
    shiftTemplates,
    shifts,
    shiftAssignments,
    auditLog,
  };
}

const reducer = (state: CompanyState, action: CompanyAction): CompanyState => {
  switch (action.type) {
    case "createTeam":
      return { ...state, teams: [action.team, ...state.teams] };
    case "updateTeam":
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t,
        ),
      };
    case "deleteTeam":
      return {
        ...state,
        teams: state.teams.filter((t) => t.id !== action.id),
        people: state.people.map((p) =>
          p.teamIds.includes(action.id)
            ? { ...p, teamIds: p.teamIds.filter((x) => x !== action.id) }
            : p,
        ),
      };
    case "addPerson":
      return {
        ...state,
        people: [action.person, ...state.people],
        activity: [
          {
            id: nextId("activity"),
            personId: action.person.id,
            action: "invited",
            message: "Invited to the company",
            timestamp: new Date().toISOString(),
            read: false,
          },
          ...state.activity,
        ],
      };
    case "updatePerson": {
      const target = state.people.find((p) => p.id === action.id);
      if (!target) return state;
      const demoting =
        action.patch.role !== undefined &&
        action.patch.role !== "manager" &&
        target.role === "manager";
      let teams = state.teams;
      if (demoting) {
        teams = teams.map((t) =>
          t.managerId === target.id ? { ...t, managerId: null } : t,
        );
      }
      return {
        ...state,
        teams,
        people: state.people.map((p) =>
          p.id === action.id
            ? { ...p, ...action.patch, updatedAt: new Date().toISOString() }
            : p,
        ),
        activity: [
          {
            id: nextId("activity"),
            personId: action.id,
            action: "updated",
            message: "Profile updated",
            timestamp: new Date().toISOString(),
            read: false,
          },
          ...state.activity,
        ],
      };
    }
    case "resendInvite":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.id
            ? { ...p, status: "invited", updatedAt: new Date().toISOString() }
            : p,
        ),
        activity: [
          {
            id: nextId("activity"),
            personId: action.id,
            action: "resent",
            message: "Invite resent",
            timestamp: new Date().toISOString(),
            read: false,
          },
          ...state.activity,
        ],
      };
    case "deletePerson":
      return {
        ...state,
        people: state.people.filter((p) => p.id !== action.id),
        clockEntries: state.clockEntries.filter(
          (c) => c.personId !== action.id,
        ),
        breakEntries: state.breakEntries.filter(
          (b) => b.personId !== action.id,
        ),
        complianceViolations: state.complianceViolations.filter(
          (v) => v.personId !== action.id,
        ),
        leaveRequests: state.leaveRequests.filter(
          (l) => l.personId !== action.id,
        ),
        // Clear any team where this person was the manager.
        teams: state.teams.map((t) =>
          t.managerId === action.id ? { ...t, managerId: null } : t,
        ),
      };
    case "createLocation":
      return { ...state, locations: [action.location, ...state.locations] };
    case "updateLocation":
      return {
        ...state,
        locations: state.locations.map((l) =>
          l.id === action.id ? { ...l, ...action.patch } : l,
        ),
      };
    case "deleteLocation":
      return {
        ...state,
        locations: state.locations.filter((l) => l.id !== action.id),
        teams: state.teams.map((t) =>
          t.locationId === action.id ? { ...t, locationId: null } : t,
        ),
        people: state.people.map((p) =>
          p.locationId === action.id ? { ...p, locationId: null } : p,
        ),
      };
    case "addClockEntry":
      return { ...state, clockEntries: [action.entry, ...state.clockEntries] };
    case "addBreakEntry":
      return { ...state, breakEntries: [action.entry, ...state.breakEntries] };
    case "endBreakEntry":
      return {
        ...state,
        breakEntries: state.breakEntries.map((b) =>
          b.id === action.id
            ? {
                ...b,
                breakOutAt: action.breakOutAt,
                durationMinutes: action.durationMinutes,
              }
            : b,
        ),
      };
    case "addComplianceViolation":
      return {
        ...state,
        complianceViolations: [action.violation, ...state.complianceViolations],
      };
    case "addLeaveRequest":
      return { ...state, leaveRequests: [action.request, ...state.leaveRequests] };
    case "updateLeaveRequest":
      return {
        ...state,
        leaveRequests: state.leaveRequests.map((l) =>
          l.id === action.id
            ? { ...l, ...action.patch, updatedAt: new Date().toISOString() }
            : l,
        ),
      };
    case "cancelLeaveRequest":
      return {
        ...state,
        leaveRequests: state.leaveRequests.map((l) =>
          l.id === action.id
            ? {
                ...l,
                status: "cancelled" as const,
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
      };
    case "reviewLeaveRequest":
      return {
        ...state,
        leaveRequests: state.leaveRequests.map((l) =>
          l.id === action.id
            ? {
                ...l,
                status: action.status,
                reviewerComment: action.reviewerComment,
                reviewedBy: action.reviewedBy,
                reviewedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
      };
    case "createShiftTemplate":
      return {
        ...state,
        shiftTemplates: [action.template, ...state.shiftTemplates],
      };
    case "updateShiftTemplate":
      return {
        ...state,
        shiftTemplates: state.shiftTemplates.map((t) =>
          t.id === action.id
            ? { ...t, ...action.patch, updatedAt: new Date().toISOString() }
            : t,
        ),
      };
    case "deleteShiftTemplate":
      return {
        ...state,
        shiftTemplates: state.shiftTemplates.filter((t) => t.id !== action.id),
      };
    case "addShifts":
      return { ...state, shifts: [...action.shifts, ...state.shifts] };
    case "createShift":
      return { ...state, shifts: [action.shift, ...state.shifts] };
    case "updateShift":
      return {
        ...state,
        shifts: state.shifts.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s,
        ),
      };
    case "deleteShift":
      return {
        ...state,
        shifts: state.shifts.filter((s) => s.id !== action.id),
        shiftAssignments: state.shiftAssignments.filter(
          (a) => a.shiftId !== action.id,
        ),
      };
    case "deleteShifts":
      return {
        ...state,
        shifts: state.shifts.filter((s) => !action.ids.includes(s.id)),
        shiftAssignments: state.shiftAssignments.filter(
          (a) => !action.ids.includes(a.shiftId),
        ),
      };
    case "updateTemplateShifts":
      return {
        ...state,
        shifts: state.shifts.map((s) =>
          s.templateId === action.templateId &&
          (!action.rangeStart || s.date >= action.rangeStart) &&
          (!action.rangeEnd || s.date <= action.rangeEnd)
            ? { ...s, ...action.patch }
            : s,
        ),
      };
    case "addAssignment":
      return {
        ...state,
        shiftAssignments: [action.assignment, ...state.shiftAssignments],
      };
    case "removeAssignment":
      return {
        ...state,
        shiftAssignments: state.shiftAssignments.filter(
          (a) => a.id !== action.id,
        ),
      };
    case "cancelAssignment":
      return {
        ...state,
        shiftAssignments: state.shiftAssignments.map((a) =>
          a.id === action.id
            ? {
                ...a,
                status: "cancelled" as const,
                cancelledAt: action.cancelledAt,
              }
            : a,
        ),
      };
    case "reviewAssignment":
      return {
        ...state,
        shiftAssignments: state.shiftAssignments.map((a) =>
          a.id === action.id
            ? {
                ...a,
                status: action.status,
                approvedAt: action.status === "approved" ? new Date().toISOString() : undefined,
                approvedBy: action.status === "approved" ? action.reviewedBy : undefined,
              }
            : a,
        ),
      };
    case "addActivity":
      return { ...state, activity: [action.entry, ...state.activity] };
    case "markActivityRead":
      return {
        ...state,
        activity: state.activity.map((a) =>
          a.id === action.id ? { ...a, read: true } : a,
        ),
      };
    case "markAllActivityRead":
      return {
        ...state,
        activity: state.activity.map((a) =>
          a.personId === action.personId ? { ...a, read: true } : a,
        ),
      };
    case "addAudit":
      return { ...state, auditLog: [action.entry, ...state.auditLog] };
  }
};

interface InviteInput {
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
}

interface CompanyContextValue extends CompanyState {
  createTeam: (
    name: string,
    description?: string,
    locationId?: string | null,
    managerId?: string | null,
  ) => Team | null;
  updateTeam: (id: string, patch: Partial<Team>) => boolean;
  deleteTeam: (id: string) => void;
  invitePerson: (input: InviteInput) => { ok: boolean; error?: string; personId?: string };
  updatePerson: (id: string, patch: Partial<Person>) => boolean;
  resendInvite: (id: string) => void;
  deletePerson: (id: string) => void;
  createLocation: (input: LocationInput) => Location | null;
  updateLocation: (id: string, patch: Partial<Location>) => boolean;
  deleteLocation: (id: string) => void;
  addClockEntry: (personId: string, action: ClockAction, note?: string) => void;
  startBreak: (
    personId: string,
    type?: BreakType,
  ) => { ok: boolean; error?: string; entry?: BreakEntry };
  endBreak: (breakId: string) => { ok: boolean; error?: string };
  getActiveBreakForPerson: (personId: string) => BreakEntry | null;
  getBreaksForClockEntry: (clockEntryId: string) => BreakEntry[];
  getViolationsForClockEntry: (clockEntryId: string) => ComplianceViolation[];
  requestLeave: (
    personId: string,
    input: {
      type: LeaveType;
      startDate: string;
      endDate: string;
      reason?: string;
    },
  ) => { ok: boolean; error?: string };
  updateLeaveRequest: (id: string, patch: Partial<LeaveRequest>) => boolean;
  cancelLeaveRequest: (id: string) => void;
  approveLeave: (id: string, reviewedBy: string) => void;
  denyLeave: (id: string, reviewedBy: string, comment?: string) => void;
  markActivityRead: (id: string) => void;
  markAllActivityRead: (personId: string) => void;
  createShiftTemplate: (input: ShiftTemplateInput) => {
    ok: boolean;
    error?: string;
    template?: ShiftTemplate;
  };
  updateShiftTemplate: (id: string, patch: Partial<ShiftTemplate>) => boolean;
  deleteShiftTemplate: (id: string) => void;
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
  ) => Shift[];
  createShift: (input: {
    teamId: string;
    title: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    requiredCount: number;
  }) => { ok: boolean; error?: string; shift?: Shift };
  updateShift: (
    id: string,
    patch: Partial<Shift>,
  ) => { ok: boolean; error?: string };
  deleteShift: (id: string) => void;
  assignPerson: (
    shiftId: string,
    personId: string,
    override?: boolean,
  ) => { ok: boolean; error?: string; conflict?: boolean };
  deleteShifts: (ids: string[]) => void;
  createShifts: (input: {
    teamId: string;
    title: string;
    startTime: string;
    durationMinutes: number;
    requiredCount: number;
    dates: string[];
  }) => { ok: boolean; error?: string; count: number };
  applyTemplateToShifts: (
    templateId: string,
    patch: Partial<Shift>,
    rangeStart?: string,
    rangeEnd?: string,
  ) => number;
  removeAssignment: (id: string) => void;
  bulkAssign: (input: BulkAssignInput) => BulkAssignResult;
  requestShift: (
    shiftId: string,
    personId: string,
  ) => { ok: boolean; error?: string; conflict?: boolean };
  cancelSelfAssignment: (id: string) => void;
  approveShiftRequest: (assignmentId: string, reviewedBy: string) => void;
  denyShiftRequest: (assignmentId: string, reviewedBy: string) => void;
  getAvailableShiftsForPerson: (personId: string, teamId: string) => Shift[];
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  useEffect(() => {
    writeStored(TEAMS_KEY, state.teams);
  }, [state.teams]);

  useEffect(() => {
    writeStored(PEOPLE_KEY, state.people);
  }, [state.people]);

  useEffect(() => {
    writeStored(LOCATIONS_KEY, state.locations);
  }, [state.locations]);

  useEffect(() => {
    writeStored(ACTIVITY_KEY, state.activity);
  }, [state.activity]);

  useEffect(() => {
    writeStored(CLOCK_KEY, state.clockEntries);
  }, [state.clockEntries]);

  useEffect(() => {
    writeStored(BREAKS_KEY, state.breakEntries);
  }, [state.breakEntries]);

  useEffect(() => {
    writeStored(VIOLATIONS_KEY, state.complianceViolations);
  }, [state.complianceViolations]);

  useEffect(() => {
    writeStored(LEAVE_KEY, state.leaveRequests);
  }, [state.leaveRequests]);

  useEffect(() => {
    writeStored(TEMPLATES_KEY, state.shiftTemplates);
  }, [state.shiftTemplates]);

  useEffect(() => {
    writeStored(SHIFTS_KEY, state.shifts);
  }, [state.shifts]);

  useEffect(() => {
    writeStored(ASSIGNMENTS_KEY, state.shiftAssignments);
  }, [state.shiftAssignments]);

  useEffect(() => {
    writeStored(AUDIT_KEY, state.auditLog);
  }, [state.auditLog]);

  const createTeam = useCallback(
    (
      name: string,
      description?: string,
      locationId?: string | null,
      managerId?: string | null,
    ): Team | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      if (
        state.teams.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())
      ) {
        return null;
      }
      const team: Team = {
        id: nextId("team"),
        name: trimmed,
        description: description?.trim() || undefined,
        locationId: locationId ?? null,
        managerId: managerId ?? null,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "createTeam", team });
      return team;
    },
    [state.teams],
  );

  const updateTeam = useCallback((id: string, patch: Partial<Team>) => {
    if (patch.name !== undefined && !patch.name.trim()) return false;
    dispatch({ type: "updateTeam", id, patch });
    return true;
  }, []);

  const deleteTeam = useCallback((id: string) => {
    dispatch({ type: "deleteTeam", id });
  }, []);

  const invitePerson = useCallback(
    (input: InviteInput): { ok: boolean; error?: string; personId?: string } => {
      const email = input.email.trim().toLowerCase();
      if (!input.name.trim() || !email) {
        return { ok: false, error: "Name and email are required." };
      }
      if (state.people.some((p) => p.email.toLowerCase() === email)) {
        return {
          ok: false,
          error: "Someone with that email is already in this company.",
        };
      }
      const person: Person = {
        id: nextId("person"),
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() || undefined,
        role: input.role,
        teamIds: input.teamIds,
        locationId: input.locationId,
        timezone: input.timezone,
        status: "invited",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "addPerson", person });
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("audit"),
          timestamp: new Date().toISOString(),
          action: "person.invited",
          tone: "success",
          resource: "Person",
          resourceId: person.id,
          teamId: input.teamIds[0] ?? undefined,
          message: `${person.name} invited as ${person.role}`,
        },
      });
      return { ok: true, personId: person.id };
    },
    [state.people],
  );

  const updatePerson = useCallback((id: string, patch: Partial<Person>) => {
    dispatch({ type: "updatePerson", id, patch });
    return true;
  }, []);

  const resendInvite = useCallback((id: string) => {
    dispatch({ type: "resendInvite", id });
  }, []);

  const deletePerson = useCallback((id: string) => {
    dispatch({ type: "deletePerson", id });
  }, []);

  const createLocation = useCallback(
    (input: LocationInput): Location | null => {
      const trimmed = input.name.trim();
      if (!trimmed) return null;
      if (
        state.locations.some(
          (l) => l.name.toLowerCase() === trimmed.toLowerCase(),
        )
      ) {
        return null;
      }
      const location: Location = {
        id: nextId("location"),
        name: trimmed,
        description: input.description?.trim() || undefined,
        address: input.address?.trim() || undefined,
        city: input.city?.trim() || undefined,
        state: input.state?.trim() || undefined,
        country: input.country?.trim() || undefined,
        active: input.active,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "createLocation", location });
      return location;
    },
    [state.locations],
  );

  const updateLocation = useCallback((id: string, patch: Partial<Location>) => {
    if (patch.name !== undefined && !patch.name.trim()) return false;
    dispatch({ type: "updateLocation", id, patch });
    return true;
  }, []);

  const deleteLocation = useCallback((id: string) => {
    dispatch({ type: "deleteLocation", id });
  }, []);

  const addClockEntry = useCallback(
    (personId: string, action: ClockAction, note?: string) => {
      const at = new Date().toISOString();
      const entry: ClockEntry = {
        id: nextId("clock"),
        personId,
        action,
        at,
        note: note?.trim() || undefined,
      };
      dispatch({ type: "addClockEntry", entry });

      if (action !== "out") return;

      const session = state.clockEntries
        .filter((c) => c.personId === personId && c.action === "in")
        .sort((a, b) => b.at.localeCompare(a.at))[0];
      if (!session) return;

      const person = state.people.find((p) => p.id === personId);
      let sessionBreaks = state.breakEntries.filter(
        (b) => b.clockEntryId === session.id,
      );

      const openBreak = sessionBreaks.find((b) => !b.breakOutAt);
      if (openBreak) {
        const durationMinutes = minutesBetween(openBreak.breakInAt, at);
        dispatch({
          type: "endBreakEntry",
          id: openBreak.id,
          breakOutAt: at,
          durationMinutes,
        });
        dispatch({
          type: "addAudit",
          entry: {
            id: nextId("audit"),
            timestamp: at,
            action: "break.auto_closed",
            tone: "warning",
            resource: "BreakEntry",
            resourceId: openBreak.id,
            teamId: person?.teamIds[0] ?? undefined,
            message: `${person?.name ?? "Someone"}'s ${openBreak.type} break auto-closed on clock out (${durationMinutes}m)`,
          },
        });
        sessionBreaks = sessionBreaks.map((b) =>
          b.id === openBreak.id ? { ...b, breakOutAt: at, durationMinutes } : b,
        );
      }

      const sessionMinutes = minutesBetween(session.at, at);
      const violations = evaluateBreakCompliance(sessionMinutes, sessionBreaks);
      for (const v of violations) {
        const violation: ComplianceViolation = {
          id: nextId("violation"),
          personId,
          clockEntryId: session.id,
          type: v.type,
          severity: v.severity,
          description: v.description,
          detectedAt: at,
          status: "open",
        };
        dispatch({ type: "addComplianceViolation", violation });
        dispatch({
          type: "addActivity",
          entry: {
            id: nextId("activity"),
            personId,
            action: "notified",
            message: v.description,
            timestamp: at,
            read: false,
          },
        });
        dispatch({
          type: "addAudit",
          entry: {
            id: nextId("audit"),
            timestamp: at,
            action: `compliance.${v.type}`,
            tone: v.severity === "critical" ? "danger" : "warning",
            resource: "ComplianceViolation",
            resourceId: violation.id,
            teamId: person?.teamIds[0] ?? undefined,
            message: `${person?.name ?? "Someone"}: ${v.description}`,
          },
        });
      }
    },
    [state.clockEntries, state.breakEntries, state.people],
  );

  const startBreak = useCallback(
    (
      personId: string,
      type?: BreakType,
    ): { ok: boolean; error?: string; entry?: BreakEntry } => {
      const latestEntry = state.clockEntries
        .filter((c) => c.personId === personId)
        .sort((a, b) => b.at.localeCompare(a.at))[0];
      if (!latestEntry || latestEntry.action !== "in") {
        return { ok: false, error: "You must be clocked in to start a break." };
      }
      const session = latestEntry;
      const alreadyOnBreak = state.breakEntries.some(
        (b) => b.clockEntryId === session.id && !b.breakOutAt,
      );
      if (alreadyOnBreak) {
        return { ok: false, error: "You are already on a break." };
      }

      const now = new Date().toISOString();
      const sessionMinutes = minutesBetween(session.at, now);
      const existingTypes = state.breakEntries
        .filter((b) => b.clockEntryId === session.id)
        .map((b) => b.type);
      const resolvedType = type ?? inferBreakType(sessionMinutes, existingTypes);

      const entry: BreakEntry = {
        id: nextId("break"),
        clockEntryId: session.id,
        personId,
        type: resolvedType,
        breakInAt: now,
        createdAt: now,
      };
      dispatch({ type: "addBreakEntry", entry });

      const person = state.people.find((p) => p.id === personId);
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("audit"),
          timestamp: now,
          action: "break.started",
          tone: "neutral",
          resource: "BreakEntry",
          resourceId: entry.id,
          teamId: person?.teamIds[0] ?? undefined,
          message: `${person?.name ?? "Someone"} started a ${resolvedType} break`,
        },
      });

      return { ok: true, entry };
    },
    [state.clockEntries, state.breakEntries, state.people],
  );

  const endBreak = useCallback(
    (breakId: string): { ok: boolean; error?: string } => {
      const existing = state.breakEntries.find((b) => b.id === breakId);
      if (!existing || existing.breakOutAt) {
        return { ok: false, error: "Break not found or already ended." };
      }
      const now = new Date().toISOString();
      const durationMinutes = minutesBetween(existing.breakInAt, now);
      dispatch({
        type: "endBreakEntry",
        id: breakId,
        breakOutAt: now,
        durationMinutes,
      });

      const person = state.people.find((p) => p.id === existing.personId);
      const minMinutes =
        existing.type === "meal" ? MEAL_BREAK_MIN_MINUTES : REST_BREAK_MIN_MINUTES;
      const tooShort = durationMinutes < minMinutes;
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("audit"),
          timestamp: now,
          action: "break.ended",
          tone: tooShort ? "warning" : "neutral",
          resource: "BreakEntry",
          resourceId: breakId,
          teamId: person?.teamIds[0] ?? undefined,
          message: `${person?.name ?? "Someone"} ended a ${existing.type} break (${durationMinutes}m)${tooShort ? " \u2014 under minimum" : ""}`,
        },
      });

      return { ok: true };
    },
    [state.breakEntries, state.people],
  );

  const getActiveBreakForPerson = useCallback(
    (personId: string): BreakEntry | null => {
      const session = state.clockEntries
        .filter((c) => c.personId === personId && c.action === "in")
        .sort((a, b) => b.at.localeCompare(a.at))[0];
      if (!session) return null;
      return (
        state.breakEntries.find(
          (b) => b.clockEntryId === session.id && !b.breakOutAt,
        ) ?? null
      );
    },
    [state.clockEntries, state.breakEntries],
  );

  const getBreaksForClockEntry = useCallback(
    (clockEntryId: string): BreakEntry[] =>
      state.breakEntries.filter((b) => b.clockEntryId === clockEntryId),
    [state.breakEntries],
  );

  const getViolationsForClockEntry = useCallback(
    (clockEntryId: string): ComplianceViolation[] =>
      state.complianceViolations.filter((v) => v.clockEntryId === clockEntryId),
    [state.complianceViolations],
  );

  const requestLeave = useCallback(
    (
      personId: string,
      input: {
        type: LeaveType;
        startDate: string;
        endDate: string;
        reason?: string;
      },
    ): { ok: boolean; error?: string } => {
      if (!input.startDate || !input.endDate) {
        return { ok: false, error: "Start and end dates are required." };
      }
      if (input.endDate < input.startDate) {
        return { ok: false, error: "End date must be on or after start date." };
      }
      const now = new Date().toISOString();
      const request: LeaveRequest = {
        id: nextId("leave"),
        personId,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason?.trim() || undefined,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: "addLeaveRequest", request });
      const person = state.people.find((p) => p.id === personId);
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("audit"),
          timestamp: now,
          action: "time_off.create",
          tone: "neutral",
          resource: "LeaveRequest",
          resourceId: request.id,
          teamId: person?.teamIds[0] ?? undefined,
          message: `${person?.name ?? "Someone"} requested ${request.type} leave (${request.startDate} \u2013 ${request.endDate})`,
        },
      });
      return { ok: true };
    },
    [state.people],
  );

  const updateLeaveRequest = useCallback(
    (id: string, patch: Partial<LeaveRequest>): boolean => {
      const existing = state.leaveRequests.find((l) => l.id === id);
      if (!existing) return false;
      if (existing.status !== "pending") return false;
      if (patch.endDate !== undefined && patch.startDate !== undefined) {
        const start = patch.startDate ?? existing.startDate;
        const end = patch.endDate ?? existing.endDate;
        if (end < start) return false;
      }
      dispatch({ type: "updateLeaveRequest", id, patch });
      return true;
    },
    [state.leaveRequests],
  );

  const cancelLeaveRequest = useCallback((id: string) => {
    dispatch({ type: "cancelLeaveRequest", id });
  }, []);

  const reviewLeave = useCallback(
    (
      id: string,
      status: "approved" | "denied",
      reviewedBy: string,
      reviewerComment?: string,
    ) => {
      dispatch({
        type: "reviewLeaveRequest",
        id,
        status,
        reviewerComment,
        reviewedBy,
      });
      const request = state.leaveRequests.find((l) => l.id === id);
      if (!request) return;
      const person = state.people.find((p) => p.id === request.personId);
      dispatch({
        type: "addActivity",
        entry: {
          id: nextId("activity"),
          personId: request.personId,
          action: "notified",
          message: `Your ${request.type} leave (${request.startDate} \u2013 ${request.endDate}) was ${status}${
            reviewerComment ? ` \u2014 ${reviewerComment}` : ""
          }`,
          timestamp: new Date().toISOString(),
          read: false,
        },
      });
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("audit"),
          timestamp: new Date().toISOString(),
          action: `time_off.${status}`,
          tone: status === "approved" ? "success" : "warning",
          resource: "LeaveRequest",
          resourceId: request.id,
          teamId: person?.teamIds[0] ?? undefined,
          message: `${reviewedBy} ${status} ${person?.name ?? "someone"}'s ${request.type} leave (${request.startDate} \u2013 ${request.endDate})`,
        },
      });
    },
    [state.leaveRequests, state.people],
  );

  const approveLeave = useCallback(
    (id: string, reviewedBy: string) => reviewLeave(id, "approved", reviewedBy),
    [reviewLeave],
  );

  const denyLeave = useCallback(
    (id: string, reviewedBy: string, comment?: string) =>
      reviewLeave(id, "denied", reviewedBy, comment?.trim() || undefined),
    [reviewLeave],
  );

  const markActivityRead = useCallback((id: string) => {
    dispatch({ type: "markActivityRead", id });
  }, []);

  const markAllActivityRead = useCallback((personId: string) => {
    dispatch({ type: "markAllActivityRead", personId });
  }, []);

  const createShiftTemplate = useCallback(
    (
      input: ShiftTemplateInput,
    ): { ok: boolean; error?: string; template?: ShiftTemplate } => {
      const trimmed = input.title.trim();
      if (!trimmed) return { ok: false, error: "Title is required." };
      if (input.durationMinutes <= 0)
        return { ok: false, error: "Duration must be greater than 0." };
      if (input.requiredCount < 1)
        return { ok: false, error: "Staff required must be at least 1." };
      if (
        input.maxCount !== undefined &&
        input.maxCount < input.requiredCount
      ) {
        return {
          ok: false,
          error: "Max count must be greater than or equal to staff required.",
        };
      }
      const now = new Date().toISOString();
      const template: ShiftTemplate = {
        id: nextId("template"),
        teamId: input.teamId,
        title: trimmed,
        description: input.description?.trim() || undefined,
        durationMinutes: input.durationMinutes,
        startTime: input.startTime,
        requiredCount: input.requiredCount,
        maxCount: input.maxCount,
        isActive: input.isActive,
        recurrenceRule: input.recurrenceRule?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: "createShiftTemplate", template });
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("audit"),
          timestamp: new Date().toISOString(),
          action: "template.created",
          tone: "success",
          resource: "ShiftTemplate",
          resourceId: template.id,
          teamId: template.teamId,
          message: `Template "${template.title}" created`,
        },
      });
      return { ok: true, template };
    },
    [],
  );

  const updateShiftTemplate = useCallback(
    (id: string, patch: Partial<ShiftTemplate>) => {
      if (patch.title !== undefined && !patch.title.trim()) return false;
      const existing = state.shiftTemplates.find((t) => t.id === id);
      dispatch({ type: "updateShiftTemplate", id, patch });
      if (existing) {
        dispatch({
          type: "addAudit",
          entry: {
            id: nextId("audit"),
            timestamp: new Date().toISOString(),
            action: "template.updated",
            tone: "neutral",
            resource: "ShiftTemplate",
            resourceId: id,
            teamId: existing.teamId,
            message: `Template "${patch.title ?? existing.title}" updated`,
          },
        });
      }
      return true;
    },
    [state.shiftTemplates],
  );

  const deleteShiftTemplate = useCallback(
    (id: string) => {
      const existing = state.shiftTemplates.find((t) => t.id === id);
      dispatch({ type: "deleteShiftTemplate", id });
      if (existing) {
        dispatch({
          type: "addAudit",
          entry: {
            id: nextId("audit"),
            timestamp: new Date().toISOString(),
            action: "template.deleted",
            tone: "warning",
            resource: "ShiftTemplate",
            resourceId: id,
            teamId: existing.teamId,
            message: `Template "${existing.title}" deleted`,
          },
        });
      }
    },
    [state.shiftTemplates],
  );

  const getShiftTemplatesByTeam = useCallback(
    (teamId: string) => state.shiftTemplates.filter((t) => t.teamId === teamId),
    [state.shiftTemplates],
  );

  const previewShifts = useCallback(
    (
      teamId: string,
      rangeStart: string,
      rangeEnd: string,
    ): { planned: Shift[]; skippedCount: number; conflictIds: string[] } => {
      const templates = state.shiftTemplates.filter(
        (t) => t.teamId === teamId && t.isActive && t.recurrenceRule,
      );
      const start = new Date(rangeStart + "T00:00:00");
      const end = new Date(rangeEnd + "T23:59:59");
      const planned: Shift[] = [];
      let skippedCount = 0;
      const existingDates = new Set(
        state.shifts
          .filter((s) => s.teamId === teamId)
          .map((s) => `${s.date}|${s.startTime}`),
      );
      for (const template of templates) {
        try {
          const rule = RRule.fromString(template.recurrenceRule!);
          const dates = rule.between(start, end, true);
          for (const date of dates) {
            const dateStr = date.toISOString().slice(0, 10);
            const key = `${dateStr}|${template.startTime}`;
            if (existingDates.has(key)) {
              skippedCount++;
              continue;
            }
            planned.push({
              id: nextId("shift"),
              teamId,
              templateId: template.id,
              title: template.title,
              description: template.description,
              date: dateStr,
              startTime: template.startTime,
              durationMinutes: template.durationMinutes,
              requiredCount: template.requiredCount,
              createdAt: new Date().toISOString(),
            });
          }
        } catch {
          // invalid RRULE — skip this template
        }
      }

      // Conflict detection: a planned shift conflicts if its time overlaps
      // an existing shift on the same team/date, or another planned shift.
      const conflictIds = new Set<string>();
      const existingShifts = state.shifts.filter((s) => s.teamId === teamId);
      for (let i = 0; i < planned.length; i++) {
        const p = planned[i];
        if (existingShifts.some((ex) => shiftsOverlap(p, ex))) {
          conflictIds.add(p.id);
        }
        for (let j = i + 1; j < planned.length; j++) {
          if (shiftsOverlap(p, planned[j])) {
            conflictIds.add(p.id);
            conflictIds.add(planned[j].id);
          }
        }
      }

      return { planned, skippedCount, conflictIds: Array.from(conflictIds) };
    },
    [state.shiftTemplates, state.shifts],
  );

  const publishShifts = useCallback(
    (
      teamId: string,
      rangeStart: string,
      rangeEnd: string,
      shiftsToPublish?: Shift[],
    ): Shift[] => {
      const toPublish =
        shiftsToPublish ?? previewShifts(teamId, rangeStart, rangeEnd).planned;
      if (toPublish.length > 0) {
        dispatch({ type: "addShifts", shifts: toPublish });

        const team = state.teams.find((t) => t.id === teamId);
        dispatch({
          type: "addAudit",
          entry: {
            id: nextId("audit"),
            timestamp: new Date().toISOString(),
            action: "shift.published",
            tone: "success",
            resource: "Shift",
            resourceId: teamId,
            teamId,
            message: `${toPublish.length} shift${toPublish.length === 1 ? "" : "s"} published for ${team?.name ?? "team"} (${rangeStart} \u2013 ${rangeEnd})`,
          },
        });

        const teamMembers = state.people.filter(
          (p) => p.teamIds.includes(teamId) && p.status !== "inactive",
        );
        for (const person of teamMembers) {
          dispatch({
            type: "addActivity",
            entry: {
              id: nextId("activity"),
              personId: person.id,
              action: "notified",
              message: `New shifts published for ${rangeStart} \u2013 ${rangeEnd}`,
              timestamp: new Date().toISOString(),
              read: false,
            },
          });
        }
      }
      return toPublish;
    },
    [previewShifts, state.teams, state.people],
  );

  const createShift = useCallback(
    (input: {
      teamId: string;
      title: string;
      date: string;
      startTime: string;
      durationMinutes: number;
      requiredCount: number;
    }): { ok: boolean; error?: string; shift?: Shift } => {
      const trimmed = input.title.trim();
      if (!trimmed) return { ok: false, error: "Title is required." };
      if (!input.date) return { ok: false, error: "Date is required." };
      if (input.durationMinutes <= 0)
        return { ok: false, error: "Duration must be greater than 0." };
      if (input.requiredCount < 1)
        return { ok: false, error: "Staff required must be at least 1." };

      const shift: Shift = {
        id: nextId("shift"),
        teamId: input.teamId,
        title: trimmed,
        date: input.date,
        startTime: input.startTime,
        durationMinutes: input.durationMinutes,
        requiredCount: input.requiredCount,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "createShift", shift });
      return { ok: true, shift };
    },
    [],
  );

  const deleteShift = useCallback((id: string) => {
    dispatch({ type: "deleteShift", id });
  }, []);

  const deleteShifts = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    dispatch({ type: "deleteShifts", ids });
  }, []);

  const createShifts = useCallback(
    (input: {
      teamId: string;
      title: string;
      startTime: string;
      durationMinutes: number;
      requiredCount: number;
      dates: string[];
    }): { ok: boolean; error?: string; count: number } => {
      if (!input.title.trim())
        return { ok: false, error: "Title is required.", count: 0 };
      if (input.dates.length === 0)
        return { ok: false, error: "Pick at least one date.", count: 0 };
      if (input.durationMinutes <= 0)
        return {
          ok: false,
          error: "Duration must be greater than 0.",
          count: 0,
        };
      if (input.requiredCount < 1)
        return {
          ok: false,
          error: "Staff required must be at least 1.",
          count: 0,
        };
      const shifts: Shift[] = input.dates.map((date) => ({
        id: nextId("shift"),
        teamId: input.teamId,
        title: input.title.trim(),
        date,
        startTime: input.startTime,
        durationMinutes: input.durationMinutes,
        requiredCount: input.requiredCount,
        createdAt: new Date().toISOString(),
      }));
      dispatch({ type: "addShifts", shifts });
      return { ok: true, count: shifts.length };
    },
    [],
  );

  const applyTemplateToShifts = useCallback(
    (
      templateId: string,
      patch: Partial<Shift>,
      rangeStart?: string,
      rangeEnd?: string,
    ): number => {
      const ids = state.shifts
        .filter(
          (s) =>
            s.templateId === templateId &&
            (!rangeStart || s.date >= rangeStart) &&
            (!rangeEnd || s.date <= rangeEnd),
        )
        .map((s) => s.id);
      if (ids.length > 0) {
        dispatch({
          type: "updateTemplateShifts",
          templateId,
          patch,
          rangeStart,
          rangeEnd,
        });
      }
      return ids.length;
    },
    [state.shifts],
  );

  const updateShift = useCallback(
    (id: string, patch: Partial<Shift>): { ok: boolean; error?: string } => {
      if (patch.title !== undefined && !patch.title.trim()) {
        return { ok: false, error: "Title is required." };
      }
      if (patch.durationMinutes !== undefined && patch.durationMinutes <= 0) {
        return { ok: false, error: "Duration must be greater than 0." };
      }
      if (patch.requiredCount !== undefined && patch.requiredCount < 1) {
        return { ok: false, error: "Staff required must be at least 1." };
      }
      dispatch({ type: "updateShift", id, patch });
      return { ok: true };
    },
    [],
  );

  const assignPerson = useCallback(
    (
      shiftId: string,
      personId: string,
      override = false,
    ): { ok: boolean; error?: string; conflict?: boolean } => {
      const already = state.shiftAssignments.some(
        (a) => a.shiftId === shiftId && a.personId === personId,
      );
      if (already)
        return {
          ok: false,
          error: "This person is already assigned to this shift.",
        };

      const targetShift = state.shifts.find((s) => s.id === shiftId);
      if (!targetShift) return { ok: false, error: "Shift not found." };

      if (!override) {
        const approvedLeave = hasApprovedLeaveOn(
          personId,
          targetShift.date,
          state.leaveRequests,
        );
        if (approvedLeave) {
          return {
            ok: false,
            conflict: true,
            error: `TIME_OFF_CONFLICT: ${approvedLeave.type} leave approved ${approvedLeave.startDate} \u2013 ${approvedLeave.endDate}.`,
          };
        }

        const personShiftIds = new Set(
          state.shiftAssignments
            .filter((a) => a.personId === personId)
            .map((a) => a.shiftId),
        );
        const conflictingShift = state.shifts.find(
          (s) =>
            s.id !== shiftId &&
            personShiftIds.has(s.id) &&
            shiftsOverlap(s, targetShift),
        );
        if (conflictingShift) {
          return {
            ok: false,
            conflict: true,
            error: `Conflicts with "${conflictingShift.title}" on ${conflictingShift.date} at ${conflictingShift.startTime}.`,
          };
        }
      }

      const assignment: ShiftAssignment = {
        id: nextId("assignment"),
        shiftId,
        personId,
        status: "approved",
        requestedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "addAssignment", assignment });

      dispatch({
        type: "addActivity",
        entry: {
          id: nextId("activity"),
          personId,
          action: "notified",
          message: `Assigned to "${targetShift.title}" on ${targetShift.date} at ${targetShift.startTime}`,
          timestamp: new Date().toISOString(),
          read: false,
        },
      });

      const person = state.people.find((p) => p.id === personId);
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("audit"),
          timestamp: new Date().toISOString(),
          action: override ? "shift.assigned.override" : "shift.assigned",
          tone: override ? "warning" : "success",
          resource: "ShiftAssignment",
          resourceId: assignment.id,
          teamId: targetShift.teamId,
          message: `${person?.name ?? "Someone"} assigned to "${targetShift.title}" on ${targetShift.date}${override ? " (conflict overridden)" : ""}`,
        },
      });

      return { ok: true };
    },
    [state.shiftAssignments, state.shifts, state.people, state.leaveRequests],
  );

  const removeAssignment = useCallback((id: string) => {
    dispatch({ type: "removeAssignment", id });
  }, []);

  const cancelSelfAssignment = useCallback(
    (id: string) => {
      const assignment = state.shiftAssignments.find((a) => a.id === id);
      if (!assignment) return;
      dispatch({
        type: "cancelAssignment",
        id,
        cancelledAt: new Date().toISOString(),
      });
      const shift = state.shifts.find((s) => s.id === assignment.shiftId);
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("audit"),
          timestamp: new Date().toISOString(),
          action: "shift.unassigned",
          tone: "warning",
          resource: "ShiftAssignment",
          resourceId: id,
          teamId: shift?.teamId,
          message: `Self-assigned shift cancelled: "${shift?.title ?? "shift"}" on ${shift?.date ?? ""}`,
        },
      });
    },
    [state.shiftAssignments, state.shifts],
  );

  const approveShiftRequest = useCallback(
    (assignmentId: string, reviewedBy: string) => {
      const assignment = state.shiftAssignments.find((a) => a.id === assignmentId);
      if (!assignment || assignment.status !== "pending") return;
      dispatch({ type: "reviewAssignment", id: assignmentId, status: "approved", reviewedBy });
      const shift = state.shifts.find((s) => s.id === assignment.shiftId);
      const person = state.people.find((p) => p.id === assignment.personId);
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("audit"),
          timestamp: new Date().toISOString(),
          action: "shift.request.approved",
          tone: "success",
          resource: "ShiftAssignment",
          resourceId: assignmentId,
          teamId: shift?.teamId,
          message: `${person?.name ?? "Someone"}'s request for "${shift?.title ?? "shift"}" on ${shift?.date ?? ""} approved by ${reviewedBy}`,
        },
      });
    },
    [state.shiftAssignments, state.shifts, state.people],
  );

  const denyShiftRequest = useCallback(
    (assignmentId: string, reviewedBy: string) => {
      const assignment = state.shiftAssignments.find((a) => a.id === assignmentId);
      if (!assignment || assignment.status !== "pending") return;
      dispatch({ type: "reviewAssignment", id: assignmentId, status: "rejected", reviewedBy });
      const shift = state.shifts.find((s) => s.id === assignment.shiftId);
      const person = state.people.find((p) => p.id === assignment.personId);
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("audit"),
          timestamp: new Date().toISOString(),
          action: "shift.request.denied",
          tone: "warning",
          resource: "ShiftAssignment",
          resourceId: assignmentId,
          teamId: shift?.teamId,
          message: `${person?.name ?? "Someone"}'s request for "${shift?.title ?? "shift"}" on ${shift?.date ?? ""} denied by ${reviewedBy}`,
        },
      });
    },
    [state.shiftAssignments, state.shifts, state.people],
  );

  const requestShift = useCallback(
    (
      shiftId: string,
      personId: string,
    ): { ok: boolean; error?: string; conflict?: boolean } => {
      const already = state.shiftAssignments.some(
        (a) =>
          a.shiftId === shiftId &&
          a.personId === personId &&
          a.status !== "cancelled",
      );
      if (already) {
        return {
          ok: false,
          error: "You are already assigned to this shift.",
        };
      }

      const targetShift = state.shifts.find((s) => s.id === shiftId);
      if (!targetShift) return { ok: false, error: "Shift not found." };

      const approvedLeave = hasApprovedLeaveOn(
        personId,
        targetShift.date,
        state.leaveRequests,
      );
      if (approvedLeave) {
        return {
          ok: false,
          conflict: true,
          error: `TIME_OFF_CONFLICT: ${approvedLeave.type} leave approved ${approvedLeave.startDate} – ${approvedLeave.endDate}.`,
        };
      }

      const personShiftIds = new Set(
        state.shiftAssignments
          .filter((a) => a.personId === personId && a.status !== "cancelled")
          .map((a) => a.shiftId),
      );
      const conflictingShift = state.shifts.find(
        (s) =>
          s.id !== shiftId &&
          personShiftIds.has(s.id) &&
          shiftsOverlap(s, targetShift),
      );
      if (conflictingShift) {
        return {
          ok: false,
          conflict: true,
          error: `Conflicts with "${conflictingShift.title}" on ${conflictingShift.date} at ${conflictingShift.startTime}.`,
        };
      }

      const now = new Date().toISOString();
      const assignment: ShiftAssignment = {
        id: nextId("assignment"),
        shiftId,
        personId,
        status: "pending",
        requestedAt: now,
        createdAt: now,
      };
      dispatch({ type: "addAssignment", assignment });

      dispatch({
        type: "addActivity",
        entry: {
          id: nextId("activity"),
          personId,
          action: "notified",
          message: `Requested to join "${targetShift.title}" on ${targetShift.date} at ${targetShift.startTime}`,
          timestamp: now,
          read: false,
        },
      });

      const person = state.people.find((p) => p.id === personId);
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("audit"),
          timestamp: now,
          action: "shift.requested",
          tone: "neutral",
          resource: "ShiftAssignment",
          resourceId: assignment.id,
          teamId: targetShift.teamId,
          message: `${person?.name ?? "Someone"} requested to join "${targetShift.title}" on ${targetShift.date}`,
        },
      });

      return { ok: true };
    },
    [state.shiftAssignments, state.shifts, state.people, state.leaveRequests],
  );

  const getAvailableShiftsForPerson = useCallback(
    (personId: string, teamId: string): Shift[] => {
      const assignedShiftIds = new Set(
        state.shiftAssignments
          .filter(
            (a) =>
              a.personId === personId &&
              a.status !== "cancelled",
          )
          .map((a) => a.shiftId),
      );
      return state.shifts.filter(
        (s) => s.teamId === teamId && !assignedShiftIds.has(s.id),
      );
    },
    [state.shifts, state.shiftAssignments],
  );

  const bulkAssign = useCallback(
    (input: BulkAssignInput): BulkAssignResult => {
      const eligible = state.shifts.filter(
        (s) =>
          s.teamId === input.teamId &&
          s.date >= input.start &&
          s.date <= input.end &&
          (!input.templateId || s.templateId === input.templateId),
      );
      const personAssignments = state.shiftAssignments.filter(
        (a) => a.personId === input.personId,
      );
      const assignedShiftIds = new Set(personAssignments.map((a) => a.shiftId));
      const assigned: ShiftAssignment[] = [];
      const skipped: BulkAssignSkip[] = [];

      for (const shift of eligible) {
        if (assignedShiftIds.has(shift.id)) {
          skipped.push({ shiftId: shift.id, reason: "already assigned" });
          continue;
        }
        if (!input.force) {
          const approvedLeave = hasApprovedLeaveOn(
            input.personId,
            shift.date,
            state.leaveRequests,
          );
          if (approvedLeave) {
            skipped.push({
              shiftId: shift.id,
              reason: "approved time-off on this date",
            });
            continue;
          }
          const overlaps = personAssignments.some((a) => {
            const other = state.shifts.find((s) => s.id === a.shiftId);
            return (
              !!other &&
              other.date === shift.date &&
              shiftTimesOverlap(
                shift.startTime,
                shift.durationMinutes,
                other.startTime,
                other.durationMinutes,
              )
            );
          });
          if (overlaps) {
            skipped.push({
              shiftId: shift.id,
              reason: "overlaps existing assignment",
            });
            continue;
          }
        }
        const assignment: ShiftAssignment = {
          id: nextId("assignment"),
          shiftId: shift.id,
          personId: input.personId,
          status: "approved",
          requestedAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: "addAssignment", assignment });
        assigned.push(assignment);
      }
      return { assigned, skipped };
    },
    [state.shifts, state.shiftAssignments, state.leaveRequests],
  );

  const value = useMemo<CompanyContextValue>(
    () => ({
      ...state,
      createTeam,
      updateTeam,
      deleteTeam,
      invitePerson,
      updatePerson,
      resendInvite,
      deletePerson,
      createLocation,
      updateLocation,
      deleteLocation,
      addClockEntry,
      startBreak,
      endBreak,
      getActiveBreakForPerson,
      getBreaksForClockEntry,
      getViolationsForClockEntry,
      requestLeave,
      updateLeaveRequest,
      cancelLeaveRequest,
      approveLeave,
      denyLeave,
      markActivityRead,
      markAllActivityRead,
      createShiftTemplate,
      updateShiftTemplate,
      deleteShiftTemplate,
      getShiftTemplatesByTeam,
      previewShifts,
      publishShifts,
      createShift,
      updateShift,
      deleteShift,
      deleteShifts,
      createShifts,
      applyTemplateToShifts,
      assignPerson,
      removeAssignment,
      bulkAssign,
      requestShift,
      cancelSelfAssignment,
      approveShiftRequest,
      denyShiftRequest,
      getAvailableShiftsForPerson,
    }),
    [
      state,
      createTeam,
      updateTeam,
      deleteTeam,
      invitePerson,
      updatePerson,
      resendInvite,
      deletePerson,
      createLocation,
      updateLocation,
      deleteLocation,
      addClockEntry,
      startBreak,
      endBreak,
      getActiveBreakForPerson,
      getBreaksForClockEntry,
      getViolationsForClockEntry,
      requestLeave,
      updateLeaveRequest,
      cancelLeaveRequest,
      approveLeave,
      denyLeave,
      markActivityRead,
      markAllActivityRead,
      createShiftTemplate,
      updateShiftTemplate,
      deleteShiftTemplate,
      getShiftTemplatesByTeam,
      previewShifts,
      publishShifts,
      createShift,
      updateShift,
      deleteShift,
      deleteShifts,
      createShifts,
      applyTemplateToShifts,
      assignPerson,
      removeAssignment,
      bulkAssign,
      requestShift,
      cancelSelfAssignment,
      approveShiftRequest,
      denyShiftRequest,
      getAvailableShiftsForPerson,
    ],
  );

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextValue {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within <CompanyProvider>");
  return ctx;
}
