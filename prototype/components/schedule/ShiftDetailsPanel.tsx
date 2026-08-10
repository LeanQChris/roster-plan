"use client";

import { useMemo } from "react";
import type { Person, Shift, ShiftAssignment } from "@/lib/company-data";
import Modal from "@/components/ui/Modal";
import { ClockIcon, UsersIcon } from "@/components/ui/icons";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h + "h";
  return h + "h " + m + "m";
}

function getEndTime(startTime: string, durationMinutes: number): string {
  const parts = startTime.split(":").map(Number);
  const h = parts[0];
  const m = parts[1];
  const total = h * 60 + m + durationMinutes;
  const endH = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const endM = String(total % 60).padStart(2, "0");
  return endH + ":" + endM;
}

interface ShiftDetailsPanelProps {
  shift: Shift;
  assignments: ShiftAssignment[];
  people: Person[];
  onClose: () => void;
}

export default function ShiftDetailsPanel({
  shift,
  assignments,
  people,
  onClose,
}: ShiftDetailsPanelProps) {
  const personMap = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of people) map.set(p.id, p);
    return map;
  }, [people]);

  const assignedPeople = useMemo(
    () =>
      assignments
        .filter((a) => a.shiftId === shift.id)
        .map((a) => personMap.get(a.personId))
        .filter(Boolean) as Person[],
    [assignments, shift.id, personMap],
  );

  const shiftDate = new Date(shift.date + "T12:00:00");
  const dateLabel =
    DAY_NAMES[shiftDate.getDay()] +
    ", " +
    MONTH_NAMES[shiftDate.getMonth()] +
    " " +
    shiftDate.getDate() +
    ", " +
    shiftDate.getFullYear();
  const timeLabel = shift.startTime + " \u2013 " + getEndTime(shift.startTime, shift.durationMinutes);

  return (
    <Modal
      open
      title={shift.title}
      confirmLabel="Close"
      size="lg"
      onClose={onClose}
      onConfirm={onClose}
      hideFooter
    >
      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-4 rounded-lg border border-hairline bg-surface-1 px-4 py-3">
          <div className="flex items-center gap-2">
            <ClockIcon className="size-4 text-ink-subtle" />
            <div>
              <p className="text-[13px] font-medium text-ink">{dateLabel}</p>
              <p className="text-[12px] text-ink-subtle">
                {timeLabel} {" \u00b7 "} {formatDuration(shift.durationMinutes)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UsersIcon className="size-4 text-ink-subtle" />
          <span className="text-[13px] text-ink-muted">
            {assignedPeople.length} / {shift.requiredCount} staff assigned
          </span>
          {assignedPeople.length < shift.requiredCount && (
            <span className="rounded-md border border-warning/30 bg-warning-weak px-2 py-0.5 text-[11px] font-medium text-warning">
              Understaffed
            </span>
          )}
        </div>

        {assignedPeople.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
              Assigned team members
            </p>
            <div className="space-y-1.5">
              {assignedPeople.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface-1 px-3 py-2"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[11px] font-semibold text-ink">
                    {person.name
                      .split(/\s+/)
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {person.name}
                    </p>
                    <p className="truncate text-[11px] text-ink-subtle">
                      {person.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {assignedPeople.length === 0 && (
          <div className="rounded-lg border border-hairline bg-surface-3 p-6 text-center">
            <UsersIcon className="mx-auto size-5 text-ink-faint" />
            <p className="mt-2 text-[13px] font-medium text-ink">No one assigned</p>
            <p className="mt-1 text-xs text-ink-muted">
              Click this shift in the calendar to assign team members.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
