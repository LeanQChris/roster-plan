"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Person, Shift, ShiftAssignment } from "@/lib/company-data";
import { AlertTriangleIcon, PlusIcon, TrashIcon, UsersIcon } from "@/components/ui/icons";

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

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface AssignShiftModalProps {
  shift: Shift;
  assignments: ShiftAssignment[];
  people: Person[];
  teamPeople: Person[];
  onAssign: (
    personId: string,
    override?: boolean,
  ) => Promise<{ ok: boolean; error?: string; conflict?: boolean }>;
  onRemove: (assignmentId: string) => void;
  onClose: () => void;
}

export default function AssignShiftModal({
  shift,
  assignments,
  people,
  teamPeople,
  onAssign,
  onRemove,
  onClose,
}: AssignShiftModalProps) {
  const [conflict, setConflict] = useState<{
    personId: string;
    personName: string;
    message: string;
  } | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const handleAssignClick = async (person: Person) => {
    setAssignError(null);
    const result = await onAssign(person.id);
    if (result.ok) return;
    if (result.conflict) {
      setConflict({
        personId: person.id,
        personName: person.name,
        message: result.error ?? "Scheduling conflict detected.",
      });
    } else {
      setAssignError(result.error ?? "Could not assign this person.");
    }
  };

  const handleOverride = async () => {
    if (!conflict) return;
    await onAssign(conflict.personId, true);
    setConflict(null);
  };

  const personMap = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of people) map.set(p.id, p);
    return map;
  }, [people]);

  const assignedPersonIds = useMemo(
    () => assignments.filter((a) => a.shiftId === shift.id).map((a) => a.personId),
    [assignments, shift.id],
  );

  const assignedSet = useMemo(() => new Set(assignedPersonIds), [assignedPersonIds]);

  const availablePeople = useMemo(
    () => teamPeople.filter((p) => !assignedSet.has(p.id) && (p.status === "active" || p.status === "invited")),
    [teamPeople, assignedSet],
  );

  const shiftDate = new Date(shift.date + "T12:00:00");

  return (
    <Modal
      open
      title={`Assign: ${shift.title}`}
      description={`${DAY_NAMES[shiftDate.getDay()]}, ${MONTH_NAMES[shiftDate.getMonth()]} ${shiftDate.getDate()} · ${shift.startTime} – ${getEndTime(shift.startTime, shift.durationMinutes)} · ${formatDuration(shift.durationMinutes)}`}
      confirmLabel="Close"
      onClose={onClose}
      onConfirm={onClose}
    >
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface-1 px-3 py-2">
          <div className="flex items-center gap-2">
            <UsersIcon className="size-4 text-ink-subtle" />
            <span className="text-[13px] text-ink-muted">
              {assignedPersonIds.length} / {shift.requiredCount} staff assigned
            </span>
          </div>
          {assignedPersonIds.length < shift.requiredCount && (
            <span className="rounded-md border border-warning/30 bg-warning-weak px-2 py-0.5 text-[11px] font-medium text-warning">
              Understaffed
            </span>
          )}
        </div>

        {assignError && (
          <div className="rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[12px] text-danger">
            {assignError}
          </div>
        )}

        {conflict && (
          <div className="space-y-2.5 rounded-lg border border-warning/30 bg-warning-weak p-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-[12px] leading-5 text-warning">
                <span className="font-medium">{conflict.personName}</span> has a scheduling
                conflict: {conflict.message}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConflict(null)}
                className="h-7 rounded-md border border-hairline bg-surface-2 px-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-surface-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOverride}
                className="h-7 rounded-md bg-warning px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-warning/85"
              >
                Override &amp; assign
              </button>
            </div>
          </div>
        )}

        {assignedPersonIds.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
              Assigned
            </p>
            <div className="space-y-1">
              {assignments
                .filter((a) => a.shiftId === shift.id)
                .map((assignment) => {
                  const person = personMap.get(assignment.personId);
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between rounded-lg border border-hairline bg-surface-1 px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[11px] font-semibold text-ink">
                          {person?.name
                            ?.split(/\s+/)
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase() ?? "?"}
                        </span>
                        <div>
                          <p className="text-[13px] font-medium text-ink">
                            {person?.name ?? "Unknown"}
                          </p>
                          <p className="text-[11px] text-ink-subtle">
                            {person?.email ?? ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(assignment.id)}
                        className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-danger"
                        title="Remove assignment"
                      >
                        <TrashIcon className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {availablePeople.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
              Available staff
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {availablePeople.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handleAssignClick(person)}
                  className="flex w-full items-center justify-between rounded-lg border border-hairline bg-surface-1 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-surface-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[11px] font-semibold text-ink">
                      {person.name
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div>
                      <p className="text-[13px] font-medium text-ink">
                        {person.name}
                      </p>
                      <p className="text-[11px] text-ink-subtle">
                        {person.email}
                      </p>
                    </div>
                  </div>
                  <PlusIcon className="size-3.5 text-ink-subtle" />
                </button>
              ))}
            </div>
          </div>
        )}

        {availablePeople.length === 0 && assignedPersonIds.length === 0 && (
          <div className="rounded-lg border border-hairline bg-surface-3 p-6 text-center">
            <UsersIcon className="mx-auto size-5 text-ink-faint" />
            <p className="mt-2 text-[13px] font-medium text-ink">No team members</p>
            <p className="mt-1 text-xs text-ink-muted">
              Add people to this team first.
            </p>
          </div>
        )}

        {availablePeople.length === 0 && assignedPersonIds.length > 0 && (
          <p className="text-center text-[12px] text-ink-subtle">
            All team members are assigned to this shift.
          </p>
        )}
      </div>
    </Modal>
  );
}
