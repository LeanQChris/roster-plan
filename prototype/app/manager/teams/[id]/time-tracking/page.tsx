"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCompany } from "@/lib/company-data";
import type { BreakEntry, ComplianceViolation } from "@/lib/company-data";
import { formatDateTime, initials, localDateStr } from "@/lib/format";
import { ClockIcon, SearchIcon, UsersIcon } from "@/components/ui/icons";
import BreakTypeBadge from "@/components/breaks/BreakTypeBadge";
import ComplianceViolationBadge from "@/components/breaks/ComplianceViolationBadge";
import { useTeamDetail } from "../team-detail-context";

const inputClass =
  "h-9 rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

function todayStr(): string {
  return localDateStr(new Date());
}

function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localDateStr(d);
}

function ManagerTeamTimeTrackingContent() {
  const searchParams = useSearchParams();
  const { teamPeople } = useTeamDetail();
  const { clockEntries, breakEntries, complianceViolations } = useCompany();

  const [personId, setPersonId] = useState<string>(searchParams.get("person") ?? "");
  const [query, setQuery] = useState("");
  const [rangeStart, setRangeStart] = useState(() => daysAgoStr(7));
  const [rangeEnd, setRangeEnd] = useState(() => todayStr());
  const [loaded, setLoaded] = useState(false);

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teamPeople;
    return teamPeople.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
    );
  }, [teamPeople, query]);

  const selectedPerson = teamPeople.find((p) => p.id === personId) ?? null;

  const breaksByClockEntry = useMemo(() => {
    const map = new Map<string, BreakEntry[]>();
    for (const b of breakEntries) {
      const list = map.get(b.clockEntryId);
      if (list) list.push(b);
      else map.set(b.clockEntryId, [b]);
    }
    return map;
  }, [breakEntries]);

  const violationsByClockEntry = useMemo(() => {
    const map = new Map<string, ComplianceViolation[]>();
    for (const v of complianceViolations) {
      const list = map.get(v.clockEntryId);
      if (list) list.push(v);
      else map.set(v.clockEntryId, [v]);
    }
    return map;
  }, [complianceViolations]);

  const records = useMemo(() => {
    if (!selectedPerson || !loaded) return [];
    return clockEntries
      .filter((c) => c.personId === selectedPerson.id)
      .filter((c) => {
        const d = c.at.slice(0, 10);
        return d >= rangeStart && d <= rangeEnd;
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [clockEntries, selectedPerson, rangeStart, rangeEnd, loaded]);

  const handleSelectPerson = (id: string) => {
    setPersonId(id);
    setLoaded(false);
  };

  const handleLoad = () => setLoaded(true);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Time Tracking</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Open a team member, choose a date range, and load their clock entries.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-fit rounded-xl border border-hairline bg-surface-2">
          <div className="border-b border-hairline p-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-subtle" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people"
                className={`${inputClass} w-full pl-8`}
              />
            </div>
          </div>
          <div className="max-h-[28rem] overflow-y-auto p-1.5">
            {filteredPeople.length === 0 && (
              <p className="px-3 py-6 text-center text-[13px] text-ink-muted">
                No people found.
              </p>
            )}
            {filteredPeople.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPerson(p.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  p.id === personId
                    ? "bg-primary-weak text-primary"
                    : "text-ink hover:bg-surface-3"
                }`}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[11px] font-semibold text-ink">
                  {initials(p.name) || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{p.name}</p>
                  <p className="truncate text-[11px] text-ink-subtle">{p.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {!selectedPerson ? (
            <div className="rounded-xl border border-hairline bg-surface-2 px-4 py-16 text-center">
              <UsersIcon className="mx-auto size-8 text-ink-faint" />
              <p className="mt-3 text-[13px] font-medium text-ink">Select a team member</p>
              <p className="mt-1 text-xs text-ink-muted">
                Choose someone from the list to view their clock entries.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-2 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[12px] font-semibold text-ink">
                    {initials(selectedPerson.name) || "?"}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-ink">{selectedPerson.name}</p>
                    <p className="text-[11px] text-ink-subtle">{selectedPerson.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3 rounded-xl border border-hairline bg-surface-2 px-4 py-3">
                <div>
                  <label className="block text-xs font-medium text-ink-muted">From</label>
                  <input
                    type="date"
                    value={rangeStart}
                    max={rangeEnd}
                    onChange={(e) => {
                      setRangeStart(e.target.value);
                      setLoaded(false);
                    }}
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted">To</label>
                  <input
                    type="date"
                    value={rangeEnd}
                    min={rangeStart}
                    max={todayStr()}
                    onChange={(e) => {
                      setRangeEnd(e.target.value);
                      setLoaded(false);
                    }}
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLoad}
                  className="h-9 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  Load records
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2">
                <p className="border-b border-hairline px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                  Clock entries
                </p>
                {!loaded ? (
                  <p className="px-4 py-10 text-center text-[13px] text-ink-muted">
                    Choose a date range and click &quot;Load records&quot;.
                  </p>
                ) : records.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <ClockIcon className="mx-auto size-8 text-ink-faint" />
                    <p className="mt-2 text-[13px] font-medium text-ink">No clock entries</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Nothing recorded for this date range.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-hairline/60">
                    {records.map((c) => {
                      const breaks = c.action === "in" ? breaksByClockEntry.get(c.id) ?? [] : [];
                      const violations =
                        c.action === "in" ? violationsByClockEntry.get(c.id) ?? [] : [];
                      return (
                        <li key={c.id} className="px-4 py-2.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                              <ClockIcon className="size-3.5 text-ink-subtle" />
                              {c.action === "in" ? "Clocked in" : "Clocked out"}
                            </span>
                            <span className="text-xs text-ink-subtle">
                              {formatDateTime(c.at)}
                            </span>
                          </div>
                          {(breaks.length > 0 || violations.length > 0) && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
                              {breaks.map((b) => (
                                <span key={b.id} className="inline-flex items-center gap-1">
                                  <BreakTypeBadge type={b.type} />
                                  <span className="text-[11px] text-ink-subtle">
                                    {b.durationMinutes !== undefined
                                      ? `${b.durationMinutes}m`
                                      : "in progress"}
                                  </span>
                                </span>
                              ))}
                              {violations.map((v) => (
                                <ComplianceViolationBadge key={v.id} type={v.type} />
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ManagerTeamTimeTrackingPage() {
  return (
    <Suspense fallback={null}>
      <ManagerTeamTimeTrackingContent />
    </Suspense>
  );
}
