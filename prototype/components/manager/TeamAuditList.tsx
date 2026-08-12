"use client";

import { useMemo, useState } from "react";
import type { AuditEntry, AuditTone } from "@/lib/company-data";
import { formatDateTime } from "@/lib/format";
import { ListIcon, SearchIcon } from "@/components/ui/icons";

type ToneFilter = "all" | AuditTone;

const TONE_OPTIONS: { value: ToneFilter; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warnings" },
  { value: "danger", label: "Blocked / destructive" },
  { value: "neutral", label: "Neutral" },
];

const toneDot: Record<AuditTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-ink-subtle",
};

interface TeamAuditListProps {
  entries: AuditEntry[];
}

export default function TeamAuditList({ entries }: TeamAuditListProps) {
  const [query, setQuery] = useState("");
  const [tone, setTone] = useState<ToneFilter>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (tone !== "all" && e.tone !== tone) return false;
      if (!q) return true;
      return [e.message, e.action, e.resource].join(" ").toLowerCase().includes(q);
    });
  }, [entries, query, tone]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activity…"
            className="h-8 w-full rounded-lg border border-hairline bg-surface-2 pl-8.5 pr-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
          />
        </div>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as ToneFilter)}
          className="h-8 rounded-lg border border-hairline bg-surface-2 px-2.5 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none"
        >
          {TONE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-ink-subtle">
          {rows.length} events
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-hairline bg-surface-2 px-6 py-16 text-center">
          <ListIcon className="size-8 text-ink-faint" />
          <p className="text-sm font-medium text-ink">No activity yet for this team.</p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-hairline/60 overflow-hidden rounded-xl border border-hairline bg-surface-2">
          {rows.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={`size-1.5 shrink-0 rounded-full ${toneDot[entry.tone]}`} />
                <p className="truncate text-[13px] text-ink">{entry.message}</p>
              </div>
              <span className="shrink-0 text-[11px] text-ink-subtle">
                {formatDateTime(entry.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
