"use client";

import { useMemo, useState } from "react";
import { RRule } from "rrule";
import Modal from "@/components/ui/Modal";
import type { ShiftTemplate } from "@/lib/company-data";
import { localDateStr } from "@/lib/format";
import { CalendarIcon } from "@/components/ui/icons";

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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateShort(date: Date): string {
  const day = DAY_NAMES[date.getDay()];
  const month = MONTH_NAMES[date.getMonth()];
  const dayNum = date.getDate();
  return `${day}, ${month} ${dayNum}`;
}

interface PreviewShiftsModalProps {
  template: ShiftTemplate;
  onClose: () => void;
}

export default function PreviewShiftsModal({
  template,
  onClose,
}: PreviewShiftsModalProps) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const [rangeStart, setRangeStart] = useState(localDateStr(weekStart));
  const [rangeEnd, setRangeEnd] = useState(localDateStr(weekEnd));

  const generatedShifts = useMemo(() => {
    if (!template.recurrenceRule || !rangeStart || !rangeEnd) return [];
    try {
      const rule = RRule.fromString(template.recurrenceRule);
      const start = new Date(rangeStart + "T00:00:00");
      const end = new Date(rangeEnd + "T23:59:59");
      const dates = rule.between(start, end, true);
      return dates;
    } catch {
      return [];
    }
  }, [template.recurrenceRule, rangeStart, rangeEnd]);

  const endMinutes =
    template.startTime.split(":").reduce((acc, v, i) => acc + Number(v) * (i === 0 ? 60 : 1), 0) +
    template.durationMinutes;
  const endTimeStr = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

  return (
    <Modal
      open
      title={`Preview: ${template.title}`}
      description="See which shifts would be generated for a date range."
      confirmLabel="Close"
      onClose={onClose}
      onConfirm={onClose}
    >
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              From
            </label>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              To
            </label>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-1 px-3 py-2 text-[12px] text-ink-muted">
          <span className="font-medium text-ink">{template.startTime} – {endTimeStr}</span>
          {" · "}
          {formatDuration(template.durationMinutes)}
          {" · "}
          {template.requiredCount} {template.requiredCount === 1 ? "person" : "people"} required
        </div>

        {generatedShifts.length === 0 ? (
          <div className="rounded-lg border border-hairline bg-surface-3 p-6 text-center">
            <CalendarIcon className="mx-auto size-5 text-ink-faint" />
            <p className="mt-2 text-[13px] font-medium text-ink">No shifts generated</p>
            <p className="mt-1 text-xs text-ink-muted">
              {!template.recurrenceRule
                ? "This template has no recurrence rule set."
                : "No occurrences fall within this date range."}
            </p>
          </div>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {generatedShifts.map((date, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-hairline bg-surface-1 px-3 py-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-4 text-[10px] font-semibold text-ink">
                    {date.getDate()}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-ink">
                      {formatDateShort(date)}
                    </p>
                    <p className="text-[11px] text-ink-subtle">
                      {template.startTime} – {endTimeStr}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-ink-subtle">
                  {template.requiredCount} {template.requiredCount === 1 ? "slot" : "slots"}
                </span>
              </div>
            ))}
          </div>
        )}

        {generatedShifts.length > 0 && (
          <p className="text-center text-[11px] text-ink-subtle">
            {generatedShifts.length} {generatedShifts.length === 1 ? "shift" : "shifts"} would be created
          </p>
        )}
      </div>
    </Modal>
  );
}
