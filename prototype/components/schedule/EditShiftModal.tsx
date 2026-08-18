"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Shift } from "@/lib/company-data";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface EditShiftModalProps {
  shift: Shift;
  onUpdate: (id: string, patch: Partial<Shift>) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export default function EditShiftModal({
  shift,
  onUpdate,
  onClose,
}: EditShiftModalProps) {
  const [title, setTitle] = useState(shift.title);
  const [date, setDate] = useState(shift.date);
  const [startTime, setStartTime] = useState(shift.startTime);
  const [durationHours, setDurationHours] = useState(String(Math.floor(shift.durationMinutes / 60)));
  const [durationMinutes, setDurationMinutes] = useState(String(shift.durationMinutes % 60));
  const [requiredCount, setRequiredCount] = useState(String(shift.requiredCount));
  const [error, setError] = useState<string | null>(null);

  const durationTotal =
    parseInt(durationHours || "0", 10) * 60 + parseInt(durationMinutes || "0", 10);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    if (durationTotal <= 0) {
      setError("Duration must be greater than 0.");
      return;
    }
    const count = parseInt(requiredCount, 10);
    if (isNaN(count) || count < 1) {
      setError("Staff required must be at least 1.");
      return;
    }

    const result = await onUpdate(shift.id, {
      title: title.trim(),
      date,
      startTime,
      durationMinutes: durationTotal,
      requiredCount: count,
    });

    if (!result.ok) {
      setError(result.error ?? "Failed to update shift.");
    }
  };

  const selectedDate = new Date(date + "T12:00:00");
  const dateLabel = `${DAY_NAMES[selectedDate.getDay()]}, ${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}`;

  return (
    <Modal
      open
      title="Edit shift"
      description={dateLabel}
      confirmLabel="Save changes"
      size="lg"
      onClose={onClose}
      onConfirm={handleSubmit}
    >
      <div className="mt-4 space-y-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] text-danger">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
            Shift title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(null); }}
            placeholder="e.g. Morning Shift"
            className="h-9 w-full rounded-lg border border-hairline bg-surface-1 px-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 w-full rounded-lg border border-hairline bg-surface-1 px-3 text-[13px] text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
              Start time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-9 w-full rounded-lg border border-hairline bg-surface-1 px-3 text-[13px] text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
              Duration
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="23"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="h-9 w-full rounded-lg border border-hairline bg-surface-1 px-3 text-[13px] text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-[12px] text-ink-subtle">h</span>
              <input
                type="number"
                min="0"
                max="59"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="h-9 w-full rounded-lg border border-hairline bg-surface-1 px-3 text-[13px] text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-[12px] text-ink-subtle">m</span>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
            Staff required
          </label>
          <input
            type="number"
            min="1"
            value={requiredCount}
            onChange={(e) => setRequiredCount(e.target.value)}
            className="h-9 w-full rounded-lg border border-hairline bg-surface-1 px-3 text-[13px] text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </Modal>
  );
}
