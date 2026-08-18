// Pure business-logic helpers — no I/O, no framework dependencies. Ported
// unchanged from the pre-Supabase lib/company-data.tsx except
// resolveBreakPolicy, which is now async (getBreakPolicy() reads company
// settings from Supabase).

import { getBreakPolicy } from "@/lib/company";
import type { BreakPolicy } from "@/lib/company";
import type {
  BreakEntry,
  BreakType,
  CompanyState,
  ComplianceViolationSeverity,
  ComplianceViolationType,
  LeaveRequest,
} from "./types";

// Client-side placeholder id for objects that aren't persisted yet (e.g.
// previewShifts' unpersisted preview Shift[] — real ids come from the DB
// once published).
let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_preview_${Date.now()}_${idCounter}`;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function shiftsOverlap(
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

export function shiftTimesOverlap(
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

export function hasApprovedLeaveOn(
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

export function minutesBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

export async function resolveBreakPolicy(
  state: CompanyState,
  personId: string,
  sessionAtISO: string,
): Promise<BreakPolicy> {
  const base = await getBreakPolicy();
  const sessionDate = sessionAtISO.slice(0, 10);
  const assignment = state.shiftAssignments.find((a) => {
    if (a.personId !== personId) return false;
    const shift = state.shifts.find((s) => s.id === a.shiftId);
    return shift?.date === sessionDate;
  });
  const shift = assignment
    ? state.shifts.find((s) => s.id === assignment.shiftId)
    : undefined;
  const template = shift?.templateId
    ? state.shiftTemplates.find((t) => t.id === shift.templateId)
    : undefined;
  return template?.breakPolicyOverride
    ? { ...base, ...template.breakPolicyOverride }
    : base;
}

export function inferBreakType(
  sessionMinutes: number,
  existingTypes: BreakType[],
  policy: BreakPolicy,
): BreakType {
  if (sessionMinutes >= policy.mealBreakThresholdMinutes && !existingTypes.includes("meal")) {
    return "meal";
  }
  return "rest";
}

export function evaluateBreakCompliance(
  sessionMinutes: number,
  breaks: BreakEntry[],
  policy: BreakPolicy,
): { type: ComplianceViolationType; severity: ComplianceViolationSeverity; description: string }[] {
  const violations: {
    type: ComplianceViolationType;
    severity: ComplianceViolationSeverity;
    description: string;
  }[] = [];

  if (!policy.enabled) return violations;

  if (sessionMinutes >= policy.mealBreakThresholdMinutes) {
    const mealBreaks = breaks.filter((b) => b.type === "meal" && b.durationMinutes !== undefined);
    if (mealBreaks.length === 0) {
      violations.push({
        type: "meal_break_missing",
        severity: "critical",
        description: `No meal break taken during a ${Math.round(sessionMinutes / 60)}h+ shift.`,
      });
    } else if (!mealBreaks.some((b) => (b.durationMinutes ?? 0) >= policy.mealBreakMinMinutes)) {
      violations.push({
        type: "meal_break_too_short",
        severity: "warning",
        description: `Meal break(s) taken but none reached the ${policy.mealBreakMinMinutes}-minute minimum.`,
      });
    }
  }

  if (sessionMinutes >= policy.restBreakThresholdMinutes) {
    const restBreaks = breaks.filter((b) => b.type === "rest" && b.durationMinutes !== undefined);
    if (restBreaks.length === 0) {
      violations.push({
        type: "rest_break_missing",
        severity: "critical",
        description: `No rest break taken during a ${Math.round(sessionMinutes / 60)}h+ shift.`,
      });
    } else if (!restBreaks.some((b) => (b.durationMinutes ?? 0) >= policy.restBreakMinMinutes)) {
      violations.push({
        type: "rest_break_too_short",
        severity: "warning",
        description: `Rest break(s) taken but none reached the ${policy.restBreakMinMinutes}-minute minimum.`,
      });
    }
  }

  return violations;
}
