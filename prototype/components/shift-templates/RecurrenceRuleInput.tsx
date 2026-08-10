"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RRule, Frequency } from "rrule";
import type { WeekdayStr } from "rrule";
import { ChevronDownIcon } from "@/components/ui/icons";

type EndType = "never" | "after" | "until";

const DAYS: { label: string; value: WeekdayStr; short: string }[] = [
  { label: "Monday", value: "MO", short: "Mon" },
  { label: "Tuesday", value: "TU", short: "Tue" },
  { label: "Wednesday", value: "WE", short: "Wed" },
  { label: "Thursday", value: "TH", short: "Thu" },
  { label: "Friday", value: "FR", short: "Fri" },
  { label: "Saturday", value: "SA", short: "Sat" },
  { label: "Sunday", value: "SU", short: "Sun" },
];

const FREQ_OPTIONS = [
  { value: "daily" as const, label: "Daily" },
  { value: "weekly" as const, label: "Weekly" },
  { value: "monthly" as const, label: "Monthly" },
  { value: "yearly" as const, label: "Yearly" },
];

const selectClass =
  "h-8 w-full appearance-none rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none";

const inputClass =
  "h-8 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

interface RecurrenceRuleInputProps {
  value: string;
  onChange: (rruleString: string) => void;
}

function parseExistingRule(rruleString: string): {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  weekdays: WeekdayStr[];
  endType: EndType;
  count: number;
  until: string;
} {
  try {
    const parsed = RRule.fromString(rruleString);
    const opts = parsed.options;
    let frequency: "daily" | "weekly" | "monthly" | "yearly" = "weekly";
    if (opts.freq === Frequency.DAILY) frequency = "daily";
    else if (opts.freq === Frequency.WEEKLY) frequency = "weekly";
    else if (opts.freq === Frequency.MONTHLY) frequency = "monthly";
    else if (opts.freq === Frequency.YEARLY) frequency = "yearly";

    const weekdays: WeekdayStr[] = (opts.byweekday as number[] | null)?.map(
      (d) => ["MO", "TU", "WE", "TH", "FR", "SA", "SU"][d] as WeekdayStr,
    ) ?? [];

    let endType: EndType = "never";
    let count = 10;
    let until = "";
    if (opts.count != null && opts.count > 0) {
      endType = "after";
      count = opts.count;
    } else if (opts.until != null) {
      endType = "until";
      until = opts.until.toISOString().slice(0, 10);
    }

    return {
      frequency,
      interval: opts.interval ?? 1,
      weekdays,
      endType,
      count,
      until,
    };
  } catch {
    return {
      frequency: "weekly",
      interval: 1,
      weekdays: ["MO", "TU", "WE", "TH", "FR"],
      endType: "never",
      count: 10,
      until: "",
    };
  }
}

export default function RecurrenceRuleInput({
  value,
  onChange,
}: RecurrenceRuleInputProps) {
  const existing = useMemo(() => parseExistingRule(value), [value]);

  const [frequency, setFrequency] = useState(existing.frequency);
  const [interval, setInterval] = useState(existing.interval);
  const [weekdays, setWeekdays] = useState<WeekdayStr[]>(existing.weekdays);
  const [endType, setEndType] = useState<EndType>(existing.endType);
  const [count, setCount] = useState(existing.count);
  const [until, setUntil] = useState(existing.until);

  const generateRRule = useCallback(() => {
    try {
      const freqMap = {
        daily: Frequency.DAILY,
        weekly: Frequency.WEEKLY,
        monthly: Frequency.MONTHLY,
        yearly: Frequency.YEARLY,
      };

      const options: Partial<RRule["options"]> = {
        freq: freqMap[frequency],
        interval: interval || 1,
        dtstart: new Date(),
      };

      if (frequency === "weekly" && weekdays.length > 0) {
        options.byweekday = weekdays.map((d) => RRule.fromString(`FREQ=WEEKLY;BYDAY=${d}`).options.byweekday).flat();
      }

      if (endType === "after") {
        options.count = count || 1;
      } else if (endType === "until" && until) {
        options.until = new Date(until + "T23:59:59");
      }

      const rule = new RRule(options as RRule["options"]);
      onChange(rule.toString());
    } catch {
      // invalid configuration — don't update
    }
  }, [frequency, interval, weekdays, endType, count, until, onChange]);

  useEffect(() => {
    generateRRule();
  }, [generateRRule]);

  const toggleDay = (day: WeekdayStr) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const description = useMemo(() => {
    try {
      if (!value) return "";
      return RRule.fromString(value).toText();
    } catch {
      return "";
    }
  }, [value]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Frequency
          </label>
          <div className="relative mt-1.5">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as typeof frequency)}
              className={selectClass}
            >
              {FREQ_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Every
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
              className={inputClass}
            />
            <span className="whitespace-nowrap text-[13px] text-ink-muted">
              {frequency === "daily"
                ? interval === 1
                  ? "day"
                  : "days"
                : frequency === "weekly"
                  ? interval === 1
                    ? "week"
                    : "weeks"
                  : frequency === "monthly"
                    ? interval === 1
                      ? "month"
                      : "months"
                    : interval === 1
                      ? "year"
                      : "years"}
            </span>
          </div>
        </div>
      </div>

      {frequency === "weekly" && (
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            On days
          </label>
          <div className="mt-1.5 flex gap-1.5">
            {DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg border text-[11px] font-medium transition-colors ${
                  weekdays.includes(day.value)
                    ? "border-primary/40 bg-primary-weak text-primary"
                    : "border-hairline bg-surface-3 text-ink-muted hover:bg-surface-4"
                }`}
                title={day.label}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Ends
          </label>
          <div className="relative mt-1.5">
            <select
              value={endType}
              onChange={(e) => setEndType(e.target.value as EndType)}
              className={selectClass}
            >
              <option value="never">Never</option>
              <option value="after">After occurrences</option>
              <option value="until">On date</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          </div>
        </div>
        {endType === "after" && (
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Occurrences
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-1.5 h-8 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none"
            />
          </div>
        )}
        {endType === "until" && (
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              End date
            </label>
            <input
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className="mt-1.5 h-8 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none"
            />
          </div>
        )}
      </div>

      {description && (
        <p className="rounded-lg border border-hairline bg-surface-1 px-3 py-2 text-[12px] text-ink-muted">
          {description}
        </p>
      )}
    </div>
  );
}
