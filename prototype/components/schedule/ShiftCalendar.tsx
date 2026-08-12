"use client";

import { useMemo } from "react";
import type { Person, Shift, ShiftAssignment } from "@/lib/company-data";
import { localDateStr } from "@/lib/format";
import { AlertTriangleIcon } from "@/components/ui/icons";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }
  return days;
}

function dateKey(d: Date): string {
  return localDateStr(d);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function shiftsOverlap(a: Shift, b: Shift): boolean {
  if (a.date !== b.date) return false;
  const aStart = timeToMinutes(a.startTime);
  const aEnd = aStart + a.durationMinutes;
  const bStart = timeToMinutes(b.startTime);
  const bEnd = bStart + b.durationMinutes;
  return aStart < bEnd && bStart < aEnd;
}

interface ShiftCalendarProps {
  weekStart: Date;
  shifts: Shift[];
  assignments: ShiftAssignment[];
  people: Person[];
  onClickShift: (shift: Shift) => void;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (shift: Shift) => void;
}

export default function ShiftCalendar({
  weekStart,
  shifts,
  assignments,
  people,
  onClickShift,
  selectMode = false,
  selectedIds,
  onToggleSelect,
}: ShiftCalendarProps) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const today = localDateStr(new Date());

  const personMap = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of people) map.set(p.id, p);
    return map;
  }, [people]);

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    // sort each day's shifts by start time
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [shifts]);

  const assignmentCountByShift = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assignments) {
      map.set(a.shiftId, (map.get(a.shiftId) ?? 0) + 1);
    }
    return map;
  }, [assignments]);

  const assignedPersonIdsByShift = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of assignments) {
      const list = map.get(a.shiftId) ?? [];
      list.push(a.personId);
      map.set(a.shiftId, list);
    }
    return map;
  }, [assignments]);

  const conflictShiftIds = useMemo(() => {
    const shiftMap = new Map(shifts.map((s) => [s.id, s]));
    const shiftsByPerson = new Map<string, Shift[]>();
    for (const a of assignments) {
      const shift = shiftMap.get(a.shiftId);
      if (!shift) continue;
      const list = shiftsByPerson.get(a.personId) ?? [];
      list.push(shift);
      shiftsByPerson.set(a.personId, list);
    }
    const conflicts = new Set<string>();
    for (const personShifts of shiftsByPerson.values()) {
      for (let i = 0; i < personShifts.length; i++) {
        for (let j = i + 1; j < personShifts.length; j++) {
          if (shiftsOverlap(personShifts[i], personShifts[j])) {
            conflicts.add(personShifts[i].id);
            conflicts.add(personShifts[j].id);
          }
        }
      }
    }
    return conflicts;
  }, [assignments, shifts]);

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-hairline">
              <th className="w-20 px-3 py-2.5" />
              {days.map((day, i) => {
                const key = dateKey(day);
                const isToday = key === today;
                return (
                  <th
                    key={i}
                    className={`px-3 py-2.5 text-center ${
                      isToday ? "bg-primary-weak" : ""
                    }`}
                  >
                    <p
                      className={`text-[11px] font-medium uppercase tracking-wide ${
                        isToday ? "text-primary" : "text-ink-subtle"
                      }`}
                    >
                      {DAY_NAMES[i]}
                    </p>
                    <span
                      className={`mt-0.5 flex size-6 items-center justify-center rounded-full text-[15px] font-semibold ${
                        isToday ? "bg-primary text-white" : "text-ink"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {days.map((day, dayIdx) => {
              const key = dateKey(day);
              const dayShifts = shiftsByDate.get(key) ?? [];
              const isToday = key === today;
              return (
                <tr
                  key={dayIdx}
                  className={`border-b border-hairline/60 last:border-b-0 ${
                    isToday ? "bg-primary-weak/30" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-[11px] text-ink-subtle">
                    {FULL_DAY_NAMES[dayIdx].slice(0, 3)}
                  </td>
                  <td colSpan={6} className="px-2 py-1.5">
                    {dayShifts.length === 0 ? (
                      <p className="py-2 text-center text-[11px] text-ink-faint">
                        No shifts
                      </p>
                    ) : (
                      <div className="space-y-1.5 py-1">
                        {dayShifts.map((shift) => {
                          const count =
                            assignmentCountByShift.get(shift.id) ?? 0;
                          const assignedIds =
                            assignedPersonIdsByShift.get(shift.id) ?? [];
                          const assignedNames = assignedIds
                            .map((id) => personMap.get(id)?.name)
                            .filter(Boolean)
                            .slice(0, 3);
                          const overflow = assignedIds.length - 3;
                          const isUnderstaffed = count < shift.requiredCount;
                          const hasConflict = conflictShiftIds.has(shift.id);
                          const isSelected =
                            selectMode && selectedIds?.has(shift.id);

                          return (
                            <button
                              key={shift.id}
                              type="button"
                              className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary-weak hover:bg-primary-weak/80"
                                  : isUnderstaffed
                                    ? "border-warning/80 bg-warning-weak hover:bg-warning-weak/80"
                                    : "border-hairline bg-surface-1 hover:bg-surface-3"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-medium text-ink">
                                    {shift.title}
                                  </p>
                                  <p className="text-[11px] text-ink-subtle">
                                    {shift.startTime} –{" "}
                                    {getEndTime(
                                      shift.startTime,
                                      shift.durationMinutes,
                                    )}
                                    {" · "}
                                    {formatDuration(shift.durationMinutes)}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  {hasConflict && (
                                    <span className="flex items-center gap-1 rounded-md border border-danger/30 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-danger">
                                      <AlertTriangleIcon className="size-3" />
                                      Conflict
                                    </span>
                                  )}
                                  <span
                                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                                      isUnderstaffed
                                        ? "border-warning/30 bg-surface-2 text-warning"
                                        : "border-hairline bg-surface-2 text-ink-muted"
                                    }`}
                                  >
                                    {count}/{shift.requiredCount}
                                  </span>
                                </div>
                                <span
                                  className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                                    isSelected
                                      ? "border-primary/40 bg-surface-2 text-primary"
                                      : isUnderstaffed
                                        ? "border-warning/30 bg-surface-2 text-warning"
                                        : "border-hairline bg-surface-2 text-ink-muted"
                                  }`}
                                >
                                  {selectMode
                                    ? isSelected
                                      ? "✓"
                                      : ""
                                    : `${count}/${shift.requiredCount}`}
                                </span>
                              </div>
                              {assignedNames.length > 0 && !selectMode && (
                                <p className="mt-1 truncate text-[11px] text-ink-subtle">
                                  {assignedNames.join(", ")}
                                  {overflow > 0 && ` +${overflow}`}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
