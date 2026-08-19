"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "@/lib/store";
import { formatDateTime, formatTime, timeAgo } from "@/lib/format";
import type { AuditTone } from "@/lib/data";
import Menu from "@/components/ui/Menu";
import { ListIcon, SearchIcon, ShieldIcon } from "@/components/ui/icons";

type ToneFilter = "all" | AuditTone;

const TONE_OPTIONS = [
  { value: "all" as const, label: "All events" },
  { value: "success" as const, label: "Success" },
  { value: "danger" as const, label: "Blocked / destructive" },
  { value: "warning" as const, label: "Warnings" },
  { value: "neutral" as const, label: "Neutral" },
];

const toneText: Record<AuditTone, string> = {
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  neutral: "text-ink-muted",
};

const toneDot: Record<AuditTone, string> = {
  success: "bg-success",
  danger: "bg-danger",
  warning: "bg-warning",
  neutral: "bg-ink-subtle",
};

const roleLabel: Record<string, string> = {
  super_admin: "super admin",
  company_admin: "company admin",
  system: "system",
};

export default function AuditLogView() {
  const searchParams = useSearchParams();
  const { audit, companies, loading } = useAdmin();

  const companyOptions = useMemo(
    () => [
      { value: "all" as const, label: "All companies" },
      ...companies
        .map((c) => ({ value: c.id, label: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      { value: "platform" as const, label: "Platform" },
    ],
    [companies],
  );

  const [query, setQuery] = useState("");
  const [company, setCompany] = useState<string>(() =>
    searchParams.get("company") ?? "all",
  );
  const [tone, setTone] = useState<ToneFilter>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return audit.filter((a) => {
      if (tone !== "all" && a.tone !== tone) return false;
      if (company === "platform") {
        if (a.companyId !== null) return false;
      } else if (company !== "all" && a.companyId !== company) {
        return false;
      }
      if (!q) return true;
      return [a.actor, a.action, a.resource, a.resourceId, a.company, a.ip]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [audit, query, company, tone]);

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-ink-muted">
        Loading audit log…
      </p>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Audit log
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Append-only record of platform events. Entries are chained and
          tamper-evident — deletions are not possible.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, actors, resources…"
            className="h-8 w-full rounded-lg border border-hairline bg-surface-2 pl-8.5 pr-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
          />
        </div>
        <Menu value={company} options={companyOptions} onChange={setCompany} />
        <Menu<ToneFilter>
          value={tone}
          options={TONE_OPTIONS}
          onChange={setTone}
        />
        <span className="ml-auto text-xs text-ink-subtle">
          {rows.length} events
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-surface-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline">
                {["Event", "Actor", "Resource", "Company", "IP"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-hairline/60 transition-colors last:border-b-0 hover:bg-surface-3/70"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`size-1.5 shrink-0 rounded-full ${toneDot[a.tone]}`} />
                      <div>
                        <p className="text-[13px] text-ink">{timeAgo(a.timestamp)}</p>
                        <p className="text-[11px] text-ink-subtle">
                          {formatTime(a.timestamp)} · {formatDateTime(a.timestamp).split(",")[0]}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="text-[13px] text-ink">{a.actor}</p>
                    <p className="text-[11px] text-ink-subtle">{roleLabel[a.actorRole]}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] text-ink">{a.resource}</p>
                    <p className={`font-mono text-[11px] ${toneText[a.tone]}`}>
                      {a.action} · {a.resourceId}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-ink-muted">
                    {a.company}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-ink-subtle">
                    {a.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <ListIcon className="size-8 text-ink-faint" />
            <p className="text-sm font-medium text-ink">No events match</p>
            <p className="text-[13px] text-ink-muted">
              Try a different search term or filter.
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-subtle">
        <ShieldIcon className="size-3.5" />
        HMAC-SHA256 chained · append-only via DB triggers
      </p>
    </div>
  );
}