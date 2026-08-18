"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { localDateStr } from "@/lib/format";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(start + "T00:00:00");
  const stop = new Date(end + "T00:00:00");
  while (cursor <= stop) {
    dates.push(localDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

interface BulkCreateShiftModalProps {
  defaultStartDate?: string;
  onCreate: (input: {
    title: string;
    startTime: string;
    durationMinutes: number;
    requiredCount: number;
    dates: string[];
  }) => Promise<{ ok: boolean; error?: string; count: number }>;
  onClose: () => void;
}

export default function BulkCreateShiftModal({
  defaultStartDate,
  onCreate,
  onClose,
}: BulkCreateShiftModalProps) {
  const today = localDateStr(new Date());
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [durationHours, setDurationHours] = useState("8");
  const [durationMinutes, setDurationMinutes] = useState("0");
  const [requiredCount, setRequiredCount] = useState("1");
  const [start, setStart] = useState(defaultStartDate ?? today);
  const [end, setEnd] = useState(defaultStartDate ?? today);
  const [weekdays, setWeekdays] = useState<boolean[]>([true, true, true, true, true, false, false]);
  const [error, setError] = useState<string | null>(null);

  const durationTotal =
    parseInt(durationHours || "0", 10) * 60 + parseInt(durationMinutes || "0", 10);

  const dates = useMemo(() => {
    if (!start || !end || start > end) return [];
    return enumerateDates(start, end).filter((d) => {
      const dayIdx = new Date(d + "T00:00:00").getDay();
      const mon = (dayIdx + 6) % 7;
      return weekdays[mon];
    });
  }, [start, end, weekdays]);

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!start || !end || start > end) {
      setError("Pick a valid date range.");
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
    if (dates.length === 0) {
      setError("No dates match — check weekdays or widen the range.");
      return;
    }
    const result = await onCreate({
      title: title.trim(),
      startTime,
      durationMinutes: durationTotal,
      requiredCount: count,
      dates,
    });
    if (!result.ok) {
      setError(result.error ?? "Failed to create shifts.");
    }
  };

  return (
    <Modal
      open
      title="Bulk add shifts"
      description="Create the same shift across many dates at once."
      confirmLabel={`Create ${dates.length > 0 ? dates.length : ""} shift${dates.length === 1 ? "" : "s"}`}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
              From
            </label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-9 w-full rounded-lg border border-hairline bg-surface-1 px-3 text-[13px] text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
              To
            </label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-9 w-full rounded-lg border border-hairline bg-surface-1 px-3 text-[13px] text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
            Repeat on
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_NAMES.map((day, i) => {
              const active = weekdays[i];
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setWeekdays((w) => w.map((v, j) => (j === i ? !v : v)))
                  }
                  className={`h-8 rounded-lg border px-3 text-[12px] font-medium transition-colors ${
                    active
                      ? "border-primary/40 bg-primary-weak text-primary"
                      : "border-hairline bg-surface-1 text-ink-muted hover:bg-surface-3"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-1 px-3 py-2">
          <p className="text-[13px] text-ink-muted">
            {dates.length > 0 ? (
              <>
                <span className="font-semibold text-ink">{dates.length}</span>{" "}
                {dates.length === 1 ? "shift" : "shifts"} will be created.
              </>
            ) : (
              "No dates selected yet."
            )}
          </p>
          {dates.length > 0 && (
            <p className="mt-1 text-[11px] text-ink-subtle">
              {dates.length <= 12
                ? dates.join(" · ")
                : dates.slice(0, 8).join(" · ") + ` · +${dates.length - 8} more`}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}