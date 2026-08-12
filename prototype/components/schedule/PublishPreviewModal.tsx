"use client";

import Modal from "@/components/ui/Modal";
import type { Shift } from "@/lib/company-data";
import { AlertTriangleIcon, CalendarIcon } from "@/components/ui/icons";

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
  const day = DAY_NAMES[d.getDay()];
  const month = MONTH_NAMES[d.getMonth()];
  return `${day}, ${month} ${d.getDate()}`;
}

interface PublishPreviewModalProps {
  planned: Shift[];
  skippedCount: number;
  conflictIds: string[];
  excludedIds: Set<string>;
  onToggleExclude: (id: string) => void;
  dateRange: string;
  onPublish: () => void;
  onClose: () => void;
}

export default function PublishPreviewModal({
  planned,
  skippedCount,
  conflictIds,
  excludedIds,
  onToggleExclude,
  dateRange,
  onPublish,
  onClose,
}: PublishPreviewModalProps) {
  const grouped = planned.reduce<Record<string, Shift[]>>((acc, shift) => {
    const key = shift.templateId ?? "__adhoc";
    (acc[key] ??= []).push(shift);
    return acc;
  }, {});

  const conflictSet = new Set(conflictIds);
  const publishCount = planned.filter((s) => !excludedIds.has(s.id)).length;

  return (
    <Modal
      open
      title="Preview shifts to publish"
      description={
        planned.length > 0
          ? `${publishCount} new shift${publishCount === 1 ? "" : "s"} will be created for ${dateRange}.`
          : `No new shifts to create for ${dateRange}.`
      }
      confirmLabel={publishCount > 0 ? "Publish" : "OK"}
      size="lg"
      onClose={onClose}
      onConfirm={publishCount > 0 ? onPublish : onClose}
    >
      <div className="mt-4 space-y-3">
        {conflictSet.size > 0 && (
          <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning-weak px-3 py-2.5">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-[12px] leading-5 text-warning">
              {conflictSet.size} shift{conflictSet.size === 1 ? "" : "s"} conflict with existing or
              other planned shifts (overlapping time). Review below and exclude any you don&apos;t
              want to publish.
            </p>
          </div>
        )}

        {planned.length === 0 && skippedCount === 0 && (
          <div className="rounded-lg border border-hairline bg-surface-3 p-6 text-center">
            <CalendarIcon className="mx-auto size-5 text-ink-faint" />
            <p className="mt-2 text-[13px] font-medium text-ink">Nothing to publish</p>
            <p className="mt-1 text-xs text-ink-muted">
              No active templates with recurrence rules found for this team.
            </p>
          </div>
        )}

        {planned.length === 0 && skippedCount > 0 && (
          <div className="rounded-lg border border-hairline bg-surface-3 p-6 text-center">
            <CalendarIcon className="mx-auto size-5 text-ink-faint" />
            <p className="mt-2 text-[13px] font-medium text-ink">All shifts already exist</p>
            <p className="mt-1 text-xs text-ink-muted">
              {skippedCount} {skippedCount === 1 ? "slot" : "slots"} already have shifts — nothing new to add.
            </p>
          </div>
        )}

        {planned.length > 0 && (
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {Object.entries(grouped).map(([templateId, shifts]) => {
              const template = shifts[0];
              return (
                <div key={templateId}>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
                    {template.title} · {formatDuration(template.durationMinutes)} · {template.startTime}
                  </p>
                  <div className="space-y-1">
                    {shifts.map((shift) => {
                      const conflicted = conflictSet.has(shift.id);
                      const excluded = excludedIds.has(shift.id);
                      return (
                        <div
                          key={shift.id}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                            conflicted
                              ? "border-warning/30 bg-warning-weak"
                              : "border-hairline bg-surface-1"
                          } ${excluded ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-4 text-[10px] font-semibold text-ink">
                              {new Date(shift.date + "T00:00:00").getDate()}
                            </span>
                            <div>
                              <p className="text-[13px] font-medium text-ink">
                                {formatDateShort(shift.date)}
                                {excluded && (
                                  <span className="ml-1.5 text-[11px] font-normal text-ink-subtle">
                                    (excluded)
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-ink-subtle">
                                {formatTime(shift.startTime, shift.durationMinutes)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-ink-subtle">
                              {shift.requiredCount} {shift.requiredCount === 1 ? "slot" : "slots"}
                            </span>
                            {conflicted && (
                              <button
                                type="button"
                                onClick={() => onToggleExclude(shift.id)}
                                className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                                  excluded
                                    ? "border-hairline bg-surface-2 text-ink-muted hover:bg-surface-3"
                                    : "border-warning/40 bg-warning text-white hover:bg-warning/85"
                                }`}
                              >
                                {excluded ? "Include" : "Exclude"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {skippedCount > 0 && (
          <p className="text-center text-[11px] text-ink-subtle">
            {skippedCount} existing {skippedCount === 1 ? "shift" : "shifts"} will be skipped
          </p>
        )}
      </div>
    </Modal>
  );
}
