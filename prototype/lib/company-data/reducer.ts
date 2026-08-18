import type { CompanyAction, CompanyState } from "./types";

export const initialState: CompanyState = {
  teams: [],
  people: [],
  locations: [],
  activity: [],
  clockEntries: [],
  breakEntries: [],
  complianceViolations: [],
  leaveRequests: [],
  shiftTemplates: [],
  shifts: [],
  shiftAssignments: [],
  auditLog: [],
};

export function reducer(state: CompanyState, action: CompanyAction): CompanyState {
  switch (action.type) {
    case "hydrate":
      return action.data;
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
          p.id === action.id ? { ...p, ...action.patch } : p,
        ),
      };
    }
    case "resendInvite":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.id ? { ...p, status: "invited" } : p,
        ),
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
          l.id === action.id ? { ...l, ...action.patch } : l,
        ),
      };
    case "cancelLeaveRequest":
      return {
        ...state,
        leaveRequests: state.leaveRequests.map((l) =>
          l.id === action.id ? { ...l, status: "cancelled" as const } : l,
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
                reviewedAt: action.reviewedAt,
                updatedAt: action.reviewedAt,
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
          t.id === action.id ? { ...t, ...action.patch } : t,
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
    case "addAssignments":
      return {
        ...state,
        shiftAssignments: [...action.assignments, ...state.shiftAssignments],
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
                approvedAt: action.approvedAt,
                approvedBy: action.approvedBy,
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
}
