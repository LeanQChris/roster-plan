"use client";

import { useMemo } from "react";
import type { Person, Shift, ShiftAssignment } from "@/lib/company-data";
import { localDateStr } from "@/lib/format";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function dateKey(d: Date): string {
  return localDateStr(d);
}

function getMonthGrid(monthStart: Date): Date[][] {
  const gridStart = new Date(monthStart);
  const day = gridStart.getDay();
  gridStart.setDate(gridStart.getDate() + (day === 0 ? -6 : 1 - day));
  gridStart.setHours(0, 0, 0, 0);

  const cursor = new Date(gridStart);
  const lastDay = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const weeks: Date[][] = [];
  do {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  } while (weeks[weeks.length - 1][6] <= lastDay);
  return weeks;
}

interface MonthCalendarProps {
  monthStart: Date;
  shifts: Shift[];
  assignments: ShiftAssignment[];
  people: Person[];
  onClickShift: (shift: Shift) => void;
  onDayClick: (date: string) => void;
}

export default function MonthCalendar({
  monthStart,
  shifts,
  assignments,
  people,
  onClickShift,
  onDayClick,
}: MonthCalendarProps) {
  const weeks = useMemo(() => getMonthGrid(monthStart), [monthStart]);
  const today = localDateStr(new Date());
  const monthKey = dateKey(monthStart);

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
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [shifts]);

  const assignmentCountByShift = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assignments) map.set(a.shiftId, (map.get(a.shiftId) ?? 0) + 1);
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

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 border-b border-hairline">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-ink-subtle"
              >
                {day}
              </div>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div
              key={wi}
              className={`grid grid-cols-7 ${wi > 0 ? "border-t border-hairline/60" : ""}`}
            >
              {week.map((day) => {
                const key = dateKey(day);
                const inMonth = key.slice(0, 7) === monthKey.slice(0, 7);
                const isToday = key === today;
                const dayShifts = shiftsByDate.get(key) ?? [];
                return (
                  <div
                    key={key}
                    className={`group min-h-[104px] border-r border-hairline/60 px-1.5 pb-1.5 pt-1 last:border-r-0 ${
                      inMonth ? "bg-surface-2" : "bg-surface-1"
                    } ${isToday ? "bg-primary-weak/30" : ""}`}
                  >
                    <div className="flex items-center justify-between px-0.5 pb-0.5">
                      <span
                        className={`flex size-6 items-center justify-center rounded-full text-[12px] font-semibold ${
                          isToday
                            ? "bg-primary text-white"
                            : inMonth
                              ? "text-ink"
                              : "text-ink-faint"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDayClick(key)}
                        className="rounded p-0.5 text-ink-faint opacity-0 transition-opacity hover:bg-surface-3 hover:text-ink group-hover:opacity-100"
                        title="Add shift on this day"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-1">
                      {dayShifts.slice(0, 3).map((shift) => {
                        const count = assignmentCountByShift.get(shift.id) ?? 0;
                        const isUnderstaffed = count < shift.requiredCount;
                        const names = (assignedPersonIdsByShift.get(shift.id) ?? [])
                          .map((id) => personMap.get(id)?.name)
                          .filter(Boolean)
                          .slice(0, 1)
                          .join("") as string;
                        return (
                          <button
                            key={shift.id}
                            type="button"
                            onClick={() => onClickShift(shift)}
                            className={`block w-full rounded-md border px-1.5 py-1 text-left transition-colors hover:border-primary/40 ${
                              isUnderstaffed
                                ? "border-warning/70 bg-warning-weak hover:bg-warning-weak/80"
                                : "border-hairline bg-surface-1 hover:bg-surface-3"
                            }`}
                          >
                            <p className="truncate text-[11px] font-medium text-ink">
                              {shift.startTime}–{getEndTime(shift.startTime, shift.durationMinutes)}{" "}
                              {shift.title}
                            </p>
                            <p className="text-[10px] text-ink-subtle">
                              {count}/{shift.requiredCount}
                              {names ? ` · ${names}` : ""}
                            </p>
                          </button>
                        );
                      })}
                      {dayShifts.length > 3 && (
                        <p className="px-1 text-[10px] font-medium text-ink-subtle">
                          +{dayShifts.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}