"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCompany } from "@/lib/company-data";
import type { Shift } from "@/lib/company-data";
import { localDateStr } from "@/lib/format";
import Modal from "@/components/ui/Modal";
import MonthCalendar from "@/components/schedule/MonthCalendar";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/ui/icons";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateRange(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];
  if (startMonth === endMonth) {
    return startMonth + " " + start.getDate() + " \u2013 " + end.getDate() + ", " + start.getFullYear();
  }
  return startMonth + " " + start.getDate() + " \u2013 " + endMonth + " " + end.getDate() + ", " + start.getFullYear();
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

export default function EmployeeSchedulePage() {
  const { user } = useAuth();
  const {
    people,
    shifts,
    shiftAssignments,
    teams,
    cancelSelfAssignment,
  } = useCompany();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [view, setView] = useState<"week" | "month">("week");
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<Shift | null>(null);

  const myPerson = useMemo(
    () =>
      people.find(
        (p) => p.role === "employee" && p.email.toLowerCase() === user?.email.toLowerCase(),
      ) ?? null,
    [people, user?.email],
  );

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return end;
  }, [weekStart]);

  const weekStartStr = localDateStr(weekStart);
  const weekEndStr = localDateStr(weekEnd);
  const today = localDateStr(new Date());

  const viewRange = useMemo(() => {
    if (view === "week") return { start: weekStart, end: weekEnd };
    const start = new Date(monthCursor);
    const day = start.getDay();
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
    start.setHours(0, 0, 0, 0);
    const last = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
    const end = new Date(last);
    const endDay = end.getDay();
    end.setDate(last.getDate() + (endDay === 0 ? 0 : 7 - endDay));
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }, [view, weekStart, weekEnd, monthCursor]);

  const viewStartStr = localDateStr(viewRange.start);
  const viewEndStr = localDateStr(viewRange.end);

  const myAssignmentShiftIds = useMemo(() => {
    if (!myPerson) return new Set<string>();
    const ids = new Set<string>();
    for (const a of shiftAssignments) {
      if (a.personId === myPerson.id && a.status !== "cancelled") ids.add(a.shiftId);
    }
    return ids;
  }, [shiftAssignments, myPerson]);

  const myAssignmentMap = useMemo(() => {
    if (!myPerson) return new Map<string, (typeof shiftAssignments)[0]>();
    const map = new Map<string, (typeof shiftAssignments)[0]>();
    for (const a of shiftAssignments) {
      if (a.personId === myPerson.id && a.status !== "cancelled") {
        map.set(a.shiftId, a);
      }
    }
    return map;
  }, [shiftAssignments, myPerson]);

  const myShifts = useMemo(() => {
    return shifts
      .filter((s) => myAssignmentShiftIds.has(s.id) && s.date >= viewStartStr && s.date <= viewEndStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [shifts, myAssignmentShiftIds, viewStartStr, viewEndStr]);

  const teamMap = useMemo(() => {
    const map = new Map<string, (typeof teams)[0]>();
    for (const t of teams) map.set(t.id, t);
    return map;
  }, [teams]);

  const goPrev = () => {
    if (view === "month") {
      const prev = new Date(monthCursor);
      prev.setMonth(prev.getMonth() - 1);
      setMonthCursor(prev);
    } else {
      const prev = new Date(weekStart);
      prev.setDate(prev.getDate() - 7);
      setWeekStart(prev);
    }
  };

  const goNext = () => {
    if (view === "month") {
      const next = new Date(monthCursor);
      next.setMonth(next.getMonth() + 1);
      setMonthCursor(next);
    } else {
      const next = new Date(weekStart);
      next.setDate(next.getDate() + 7);
      setWeekStart(next);
    }
  };

  const goToday = () => {
    if (view === "month") {
      const now = new Date();
      setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    } else {
      setWeekStart(getMonday(new Date()));
    }
  };

  const days = getWeekDays(weekStart);
  const shiftsByDate = new Map<string, Shift[]>();
  for (const s of myShifts) {
    const list = shiftsByDate.get(s.date) ?? [];
    list.push(s);
    shiftsByDate.set(s.date, list);
  }

  const selectedTeam = selectedShift ? teamMap.get(selectedShift.teamId) : null;

  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
          <CalendarIcon className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            My Schedule
          </h1>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {myPerson ? myPerson.name : "No linked team member record"}
          </p>
        </div>
      </div>

      {!myPerson ? (
        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <UsersIcon className="mx-auto size-11 text-ink-faint" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">
            You&apos;re not linked to a team member record yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Ask your manager to invite you with the employee role.
          </p>
        </div>
      ) : (
        <>
          {/* Week navigation */}
          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-8 items-center gap-1 rounded-lg border border-hairline bg-surface-2 px-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
            >
              <ChevronLeftIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="h-8 rounded-lg border border-hairline bg-surface-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex h-8 items-center gap-1 rounded-lg border border-hairline bg-surface-2 px-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
            >
              <ChevronRightIcon className="size-3.5" />
            </button>
            <span className="ml-2 text-[15px] font-semibold text-ink">
              {view === "week"
                ? formatDateRange(weekStart)
                : MONTH_NAMES[monthCursor.getMonth()] + " " + monthCursor.getFullYear()}
            </span>
            <div className="ml-3 flex items-center rounded-lg border border-hairline bg-surface-2 p-0.5">
              <button
                type="button"
                onClick={() => setView("week")}
                className={`h-7 rounded-md px-3 text-[12px] font-medium transition-colors ${
                  view === "week" ? "bg-primary text-white" : "text-ink-muted hover:text-ink"
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setView("month")}
                className={`h-7 rounded-md px-3 text-[12px] font-medium transition-colors ${
                  view === "month" ? "bg-primary text-white" : "text-ink-muted hover:text-ink"
                }`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Week calendar */}
          <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-surface-2">
            {view === "month" ? (
              <MonthCalendar
                monthStart={monthCursor}
                shifts={myShifts}
                assignments={[]}
                people={people}
                onClickShift={(shift) => setSelectedShift(shift)}
                onDayClick={() => {}}
              />
            ) : (
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
                          className={`px-3 py-2.5 text-center ${isToday ? "bg-primary-weak" : ""}`}
                        >
                          <p className={`text-[11px] font-medium uppercase tracking-wide ${isToday ? "text-primary" : "text-ink-subtle"}`}>
                            {DAY_NAMES[day.getDay()]}
                          </p>
                          <span className={`mt-0.5 flex size-6 items-center justify-center rounded-full text-[15px] font-semibold ${isToday ? "bg-primary text-white" : "text-ink"}`}>
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
                        className={`border-b border-hairline/60 last:border-b-0 ${isToday ? "bg-primary-weak/30" : ""}`}
                      >
                        <td className="px-3 py-2 text-[11px] text-ink-subtle">
                          {DAY_NAMES[day.getDay()]}
                        </td>
                        <td colSpan={6} className="px-2 py-1.5">
                          {dayShifts.length === 0 ? (
                            <p className="py-2 text-center text-[11px] text-ink-faint">
                              No shifts
                            </p>
                          ) : (
                            <div className="space-y-1.5 py-1">
                              {dayShifts.map((shift) => {
                                const team = teamMap.get(shift.teamId);
                                const assignment = myAssignmentMap.get(shift.id);
                                const isPending = assignment?.status === "pending";
                                const isApproved = assignment?.status === "approved";
                                return (
                                  <div
                                    key={shift.id}
                                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-hairline bg-surface-1 px-3 py-2.5"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setSelectedShift(shift)}
                                      className="min-w-0 flex-1 text-left"
                                    >
                                      <div className="flex items-center gap-2">
                                        <p className="truncate text-[13px] font-medium text-ink">
                                          {shift.title}
                                        </p>
                                        {team && (
                                          <span className="shrink-0 rounded border border-hairline bg-surface-2 px-1.5 py-px text-[10px] text-ink-subtle">
                                            {team.name}
                                          </span>
                                        )}
                                        {isPending && (
                                          <span className="shrink-0 rounded bg-warning-weak px-1.5 py-px text-[10px] font-medium text-warning">
                                            Pending
                                          </span>
                                        )}
                                        {isApproved && (
                                          <span className="shrink-0 rounded bg-success-weak px-1.5 py-px text-[10px] font-medium text-success">
                                            Approved
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-0.5 text-[11px] text-ink-subtle">
                                        {shift.startTime} – {getEndTime(shift.startTime, shift.durationMinutes)}
                                        {" · "}
                                        {formatDuration(shift.durationMinutes)}
                                      </p>
                                    </button>
                                    {isPending && (
                                      <button
                                        type="button"
                                        onClick={() => setCancelConfirm(shift)}
                                        className="shrink-0 rounded p-1.5 text-ink-subtle transition-colors hover:bg-danger-weak hover:text-danger"
                                        title="Cancel request"
                                      >
                                        <TrashIcon className="size-3.5" />
                                      </button>
                                    )}
                                  </div>
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
            )}
          </div>

          {myShifts.length === 0 && (
            <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
              <CalendarIcon className="mx-auto size-11 text-ink-faint" />
              <h2 className="mt-3 text-[15px] font-semibold text-ink">No shifts this week</h2>
              <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
                You don&apos;t have any shifts assigned for this week. Check back later or contact your manager.
              </p>
            </div>
          )}
        </>
      )}

      <Modal
        open={!!selectedShift}
        title="Shift details"
        confirmLabel="Close"
        hideFooter
        onConfirm={() => setSelectedShift(null)}
        onClose={() => setSelectedShift(null)}
      >
        {selectedShift && (
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Title</p>
              <p className="mt-0.5 text-[13px] text-ink">{selectedShift.title}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Date</p>
              <p className="mt-0.5 text-[13px] text-ink">{selectedShift.date}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Time</p>
              <p className="mt-0.5 text-[13px] text-ink">
                {selectedShift.startTime} – {getEndTime(selectedShift.startTime, selectedShift.durationMinutes)}
                {" · "}
                {formatDuration(selectedShift.durationMinutes)}
              </p>
            </div>
            {selectedTeam && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Team</p>
                <p className="mt-0.5 text-[13px] text-ink">{selectedTeam.name}</p>
              </div>
            )}
            {selectedShift.description && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Notes</p>
                <p className="mt-0.5 text-[13px] text-ink">{selectedShift.description}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectedShift(null)}
              className="mt-2 h-8 w-full rounded-lg border border-hairline bg-surface-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-4"
            >
              Close
            </button>
          </div>
        )}
      </Modal>

      <Modal
        open={!!cancelConfirm}
        title="Cancel shift request?"
        description="Are you sure you want to cancel this shift request? This action cannot be undone."
        confirmLabel="Cancel request"
        tone="danger"
        onConfirm={() => {
          if (cancelConfirm) {
            const assignment = myAssignmentMap.get(cancelConfirm.id);
            if (assignment) {
              cancelSelfAssignment(assignment.id);
            }
          }
          setCancelConfirm(null);
        }}
        onClose={() => setCancelConfirm(null)}
      />
    </div>
  );
}
