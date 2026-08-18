"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type {
  BulkAssignInput,
  BulkAssignResult,
  Person,
  Shift,
  ShiftTemplate,
} from "@/lib/company-data";
import { CalendarIcon, UsersIcon } from "@/components/ui/icons";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTime(time: string, durationMinutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const endMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(endMinutes / 60) % 24;
  const endM = endMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} – ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultRange(teamShifts: Shift[]): { start: string; end: string } {
  const dates = teamShifts.map((s) => s.date).filter(Boolean).sort();
  if (dates.length > 0) {
    return { start: dates[0], end: dates[dates.length - 1] };
  }
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 6);
  return { start: toDateStr(today), end: toDateStr(end) };
}

const labelClass =
  "mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-subtle";
const inputClass =
  "h-9 w-full rounded-lg border border-hairline bg-surface-1 px-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none";

interface BulkAssignModalProps {
  teamId: string;
  teamPeople: Person[];
  teamShifts: Shift[];
  templates: ShiftTemplate[];
  onBulkAssign: (input: BulkAssignInput) => Promise<BulkAssignResult>;
  onClose: () => void;
}

export default function BulkAssignModal({
  teamId,
  teamPeople,
  teamShifts,
  templates,
  onBulkAssign,
  onClose,
}: BulkAssignModalProps) {
  const [personId, setPersonId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [range, setRange] = useState(() => defaultRange(teamShifts));
  const [force, setForce] = useState(false);
  const [result, setResult] = useState<BulkAssignResult | null>(null);

  const people = useMemo(
    () =>
      teamPeople.filter((p) => p.status === "active" || p.status === "invited"),
    [teamPeople],
  );

  const eligible = useMemo(
    () =>
      teamShifts.filter(
        (s) =>
          s.date >= range.start &&
          s.date <= range.end &&
          (!templateId || s.templateId === templateId),
      ),
    [teamShifts, range.start, range.end, templateId],
  );

  const grouped = useMemo(() => {
    const g = eligible.reduce<Record<string, Shift[]>>((acc, shift) => {
      const key = shift.templateId ?? "__adhoc";
      (acc[key] ??= []).push(shift);
      return acc;
    }, {});
    return Object.entries(g).sort(([, a], [, b]) =>
      a[0].date.localeCompare(b[0].date),
    );
  }, [eligible]);

  const valid =
    !!personId && range.start !== "" && range.end !== "" && range.start <= range.end;

  const handleConfirm = async () => {
    if (!valid || !personId) return;
    const res = await onBulkAssign({
      teamId,
      personId,
      templateId: templateId || undefined,
      start: range.start,
      end: range.end,
      force,
    });
    setResult(res);
  };

  const person = people.find((p) => p.id === personId);
  const conflictCount = result
    ? result.skipped.filter((s) => s.reason !== "already assigned").length
    : 0;
  const alreadyCount = result
    ? result.skipped.length - conflictCount
    : 0;

  const templateShiftCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of teamShifts) {
      if (s.templateId) counts.set(s.templateId, (counts.get(s.templateId) ?? 0) + 1);
    }
    return counts;
  }, [teamShifts]);

  return (
    <Modal
      open
      title={result ? "Bulk assign complete" : "Bulk assign"}
      description={
        result
          ? `${result.assigned.length} assigned`
            + (result.skipped.length > 0
              ? ` · ${result.skipped.length} skipped (${alreadyCount} already assigned, ${conflictCount} conflict${conflictCount === 1 ? "" : "s"})`
              : "")
            + ` — ${person?.name ?? "this person"}`
          : "Assign one person to every eligible shift in a date range."
      }
      confirmLabel={result ? "Done" : "Assign"}
      size="lg"
      onClose={onClose}
      onConfirm={result ? onClose : handleConfirm}
    >
      {!result ? (
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Person</label>
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a team member…</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
            {people.length === 0 && (
              <p className="mt-1.5 text-[12px] text-ink-subtle">
                No team members yet — add people to this team first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Start date</label>
              <input
                type="date"
                value={range.start}
                onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>End date</label>
              <input
                type="date"
                value={range.end}
                onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Template (optional)</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className={inputClass}
            >
              <option value="">All templates & ad-hoc shifts</option>
              {templates.map((t) => {
                const count = templateShiftCounts.get(t.id) ?? 0;
                return (
                  <option key={t.id} value={t.id}>
                    {t.title} · {t.startTime} · {formatDuration(t.durationMinutes)}
                    {count > 0 ? ` · ${count} shift${count === 1 ? "" : "s"}` : " · no shifts yet"}
                  </option>
                );
              })}
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span className="text-[13px] leading-5 text-ink-muted">
              Bypass conflict detection (allow overlapping shifts)
            </span>
          </label>

          {range.start !== "" && range.end !== "" && range.start > range.end && (
            <p className="text-[12px] text-danger">Start date must be before end date.</p>
          )}

          <div className="rounded-lg border border-hairline bg-surface-1 px-3 py-2">
            <p className="text-[13px] text-ink-muted">
              <span className="font-semibold text-ink">{eligible.length}</span>{" "}
              {eligible.length === 1 ? "shift" : "shifts"} match this range
              {templateId ? " and template" : ""}. Already-assigned or conflicting
              shifts are skipped automatically.
            </p>
          </div>

          {grouped.length > 0 && (
            <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
              {grouped.map(([key, shifts]) => {
                const first = shifts[0];
                const template = templates.find((t) => t.id === key);
                return (
                  <div key={key}>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
                      {template?.title ?? "Ad-hoc"} · {first.startTime} ·{" "}
                      {formatDuration(first.durationMinutes)}
                    </p>
                    <div className="space-y-1">
                      {shifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between rounded-lg border border-hairline bg-surface-1 px-3 py-1.5"
                        >
                          <span className="text-[12px] text-ink">
                            {formatDateShort(shift.date)}
                          </span>
                          <span className="text-[11px] text-ink-subtle">
                            {formatTime(shift.startTime, shift.durationMinutes)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {eligible.length === 0 && (
            <div className="rounded-lg border border-hairline bg-surface-3 p-6 text-center">
              <CalendarIcon className="mx-auto size-5 text-ink-faint" />
              <p className="mt-2 text-[13px] font-medium text-ink">
                No shifts in this range
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Publish shifts first, then bulk assign people to them.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface-1 px-3 py-2">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-4 text-ink-subtle" />
              <span className="text-[13px] font-medium text-ink">
                {result.assigned.length} assigned
              </span>
            </div>
            {conflictCount === 0 && result.skipped.length === 0 && (
              <CheckBadge />
            )}
          </div>

          {result.assigned.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {result.assigned.map((a) => {
                const shift = teamShifts.find((s) => s.id === a.shiftId);
                if (!shift) return null;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-hairline bg-surface-1 px-3 py-1.5"
                  >
                    <span className="text-[12px] text-ink">
                      {formatDateShort(shift.date)}
                    </span>
                    <span className="text-[11px] text-ink-subtle">
                      {shift.title} · {shift.startTime}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {result.skipped.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
                Skipped ({result.skipped.length})
              </p>
              <div className="space-y-1">
                {result.skipped.map((s) => {
                  const shift = teamShifts.find((sh) => sh.id === s.shiftId);
                  if (!shift) return null;
                  return (
                    <div
                      key={s.shiftId}
                      className="flex items-center justify-between rounded-lg border border-hairline bg-surface-1 px-3 py-1.5"
                    >
                      <span className="text-[12px] text-ink">
                        {formatDateShort(shift.date)}
                      </span>
                      <span className="text-[11px] text-ink-subtle">
                        {s.reason}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.assigned.length === 0 && result.skipped.length === 0 && (
            <div className="rounded-lg border border-hairline bg-surface-3 p-6 text-center">
              <UsersIcon className="mx-auto size-5 text-ink-faint" />
              <p className="mt-2 text-[13px] font-medium text-ink">
                Nothing assigned
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                No shifts exist in the selected range{templateId ? " for this template" : ""}.
                Widen the date range, or publish shifts first.
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function CheckBadge() {
  return (
    <span className="rounded-md border border-success/30 bg-success-weak px-2 py-0.5 text-[11px] font-medium text-success">
      ✓ No conflicts
    </span>
  );
}
