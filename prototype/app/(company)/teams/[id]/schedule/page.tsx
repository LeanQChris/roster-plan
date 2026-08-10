"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCompany } from "@/lib/company-data";
import type { Shift } from "@/lib/company-data";
import Modal from "@/components/ui/Modal";
import ShiftCalendar from "@/components/schedule/ShiftCalendar";
import AssignShiftModal from "@/components/schedule/AssignShiftModal";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  PlusIcon,
} from "@/components/ui/icons";

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
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

export default function SchedulePage() {
  const params = useParams<{ id: string }>();
  const {
    teams,
    people,
    shifts,
    shiftAssignments,
    shiftTemplates,
    publishShifts,
    deleteShift,
    assignPerson,
    removeAssignment,
  } = useCompany();

  const team = teams.find((t) => t.id === params.id);
  const teamPeople = useMemo(
    () => people.filter((p) => p.teamId === params.id),
    [people, params.id],
  );
  const teamShifts = useMemo(
    () => shifts.filter((s) => s.teamId === params.id),
    [shifts, params.id],
  );

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [publishResult, setPublishResult] = useState<{ count: number } | null>(null);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return end;
  }, [weekStart]);

  const weekKey = `${weekStart.toISOString().slice(0, 10)}|${weekEnd.toISOString().slice(0, 10)}`;

  const visibleShifts = useMemo(() => {
    const startStr = weekStart.toISOString().slice(0, 10);
    const endStr = weekEnd.toISOString().slice(0, 10);
    return teamShifts.filter((s) => s.date >= startStr && s.date <= endStr);
  }, [teamShifts, weekStart, weekEnd]);

  const visibleAssignments = useMemo(() => {
    const shiftIds = new Set(visibleShifts.map((s) => s.id));
    return shiftAssignments.filter((a) => shiftIds.has(a.shiftId));
  }, [shiftAssignments, visibleShifts]);

  const activeTemplates = useMemo(
    () => shiftTemplates.filter((t) => t.teamId === params.id && t.isActive && t.recurrenceRule),
    [shiftTemplates, params.id],
  );

  const goPrev = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };

  const goNext = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };

  const goToday = () => setWeekStart(getMonday(new Date()));

  const handlePublish = () => {
    const rangeStart = weekStart.toISOString().slice(0, 10);
    const rangeEnd = weekEnd.toISOString().slice(0, 10);
    const newShifts = publishShifts(params.id, rangeStart, rangeEnd);
    setPublishResult({ count: newShifts.length });
    setPublishConfirm(false);
  };

  const handleAssign = (personId: string) => {
    if (!selectedShift) return { ok: false, error: "No shift selected." };
    return assignPerson(selectedShift.id, personId);
  };

  if (!team) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <CalendarIcon className="size-10 text-ink-faint" />
        <p className="text-sm font-medium text-ink">Team not found</p>
        <p className="text-[13px] text-ink-muted">
          It may have been deleted, or the link is incorrect.
        </p>
        <Link
          href="/teams"
          className="mt-2 flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
        >
          <ArrowLeftIcon className="size-4" />
          Back to teams
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/teams/${team.id}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeftIcon className="size-4" />
        {team.name}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <CalendarIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Schedule
            </h1>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {team.name}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
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
            {formatDateRange(weekStart)}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTemplates.length > 0 && (
            <button
              type="button"
              onClick={() => setPublishConfirm(true)}
              className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <PlusIcon className="size-3.5" />
              Publish shifts
            </button>
          )}
        </div>
      </div>

      {activeTemplates.length === 0 && visibleShifts.length === 0 && (
        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <ClockIcon className="mx-auto size-11 text-ink-faint" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">No shifts this week</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Create shift templates with recurrence rules, then publish them to generate concrete shifts.
          </p>
          <Link
            href={`/teams/${team.id}/templates`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <ClockIcon className="size-3.5" />
            Manage templates
          </Link>
        </div>
      )}

      {(activeTemplates.length > 0 || visibleShifts.length > 0) && (
        <div className="mt-4">
          <ShiftCalendar
            key={weekKey}
            weekStart={weekStart}
            shifts={visibleShifts}
            assignments={visibleAssignments}
            people={people}
            onClickShift={setSelectedShift}
          />
        </div>
      )}

      {selectedShift && (
        <AssignShiftModal
          shift={selectedShift}
          assignments={shiftAssignments}
          people={people}
          teamPeople={teamPeople}
          onAssign={handleAssign}
          onRemove={removeAssignment}
          onClose={() => setSelectedShift(null)}
        />
      )}

      {publishConfirm && (
        <Modal
          open
          title="Publish shifts?"
          description={`This will expand ${activeTemplates.length} active template${activeTemplates.length === 1 ? "" : "s"} into concrete shifts for ${formatDateRange(weekStart)}. Shifts that already exist for the same date and time will be skipped.`}
          confirmLabel="Publish"
          onClose={() => setPublishConfirm(false)}
          onConfirm={handlePublish}
        />
      )}

      {publishResult && (
        <Modal
          open
          title="Shifts published"
          description={
            publishResult.count > 0
              ? `${publishResult.count} new shift${publishResult.count === 1 ? "" : "s"} created for this week.`
              : "No new shifts were created — all time slots already have shifts."
          }
          confirmLabel="OK"
          onClose={() => setPublishResult(null)}
          onConfirm={() => setPublishResult(null)}
        />
      )}
    </div>
  );
}
