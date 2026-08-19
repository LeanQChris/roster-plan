"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCompany } from "@/lib/company-data";
import type { BreakType } from "@/lib/company-data";
import { DEFAULT_BREAK_POLICY } from "@/lib/company";
import { formatDateTime, localDateStr } from "@/lib/format";
import { AlertTriangleIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";
import BreakTypeBadge from "@/components/breaks/BreakTypeBadge";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface CompletedEntry {
  durationMs: number;
  note?: string;
}

export default function EmployeeClockPage() {
  const { user } = useAuth();
  const {
    people,
    shifts,
    shiftAssignments,
    clockEntries,
    addClockEntry,
    breakEntries,
    startBreak,
    endBreak,
    getBreakPolicyForPerson,
  } = useCompany();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [completed, setCompleted] = useState<CompletedEntry | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [breakError, setBreakError] = useState<string | null>(null);

  const myPerson = useMemo(
    () =>
      people.find(
        (p) => p.role === "employee" && p.email.toLowerCase() === user?.email.toLowerCase(),
      ) ?? null,
    [people, user?.email],
  );

  const myEntries = useMemo(() => {
    if (!myPerson) return [];
    return clockEntries
      .filter((c) => c.personId === myPerson.id)
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [clockEntries, myPerson]);

  const latestEntry = myEntries[0] ?? null;
  const isWorking = latestEntry?.action === "in";

  useEffect(() => {
    if (!isWorking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isWorking]);

  const today = localDateStr(new Date());

  const hasShiftToday = useMemo(() => {
    if (!myPerson) return false;
    const myShiftIds = new Set(
      shiftAssignments.filter((a) => a.personId === myPerson.id).map((a) => a.shiftId),
    );
    return shifts.some((s) => myShiftIds.has(s.id) && s.date === today);
  }, [shifts, shiftAssignments, myPerson, today]);

  const sessionBreaks = useMemo(() => {
    if (!latestEntry || latestEntry.action !== "in") return [];
    return breakEntries
      .filter((b) => b.clockEntryId === latestEntry.id)
      .sort((a, b) => b.breakInAt.localeCompare(a.breakInAt));
  }, [breakEntries, latestEntry]);

  const activeBreak = useMemo(
    () => sessionBreaks.find((b) => !b.breakOutAt) ?? null,
    [sessionBreaks],
  );

  const [policy, setPolicy] = useState(DEFAULT_BREAK_POLICY);

  useEffect(() => {
    if (!myPerson) {
      setPolicy(DEFAULT_BREAK_POLICY);
      return;
    }
    let cancelled = false;
    getBreakPolicyForPerson(myPerson.id).then((p) => {
      if (!cancelled) setPolicy(p);
    });
    return () => {
      cancelled = true;
    };
  }, [myPerson, getBreakPolicyForPerson]);

  const mealCount = sessionBreaks.filter((b) => b.type === "meal").length;
  const restCount = sessionBreaks.filter((b) => b.type === "rest").length;
  const mealCapped = mealCount >= policy.maxMealBreaksPerShift;
  const restCapped = restCount >= policy.maxRestBreaksPerShift;

  const handleClockIn = async () => {
    if (!myPerson) return;
    setError(null);
    setCompleted(null);
    if (!hasShiftToday) {
      setError("No shift assigned today — contact your manager.");
      return;
    }
    await addClockEntry(myPerson.id, "in");
  };

  const handleClockOut = async () => {
    if (!myPerson || !latestEntry) return;
    const durationMs = Date.now() - new Date(latestEntry.at).getTime();
    await addClockEntry(myPerson.id, "out", note || undefined);
    setCompleted({ durationMs, note: note || undefined });
    setNote("");
    setShowNote(false);
  };

  const handleStartBreak = async (type: BreakType) => {
    if (!myPerson) return;
    setBreakError(null);
    const result = await startBreak(myPerson.id, type);
    if (!result.ok) setBreakError(result.error ?? "Could not start break.");
  };

  const handleEndBreak = async () => {
    if (!activeBreak) return;
    setBreakError(null);
    const result = await endBreak(activeBreak.id);
    if (!result.ok) setBreakError(result.error ?? "Could not end break.");
  };

  if (!myPerson) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Clock In/Out</h1>
        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <UsersIcon className="mx-auto size-11 text-ink-faint" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">
            You&apos;re not linked to a team member record yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Ask your manager to invite you with the employee role.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
          <ClockIcon className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Clock In/Out</h1>
          <p className="mt-0.5 text-xs text-ink-subtle">{myPerson.name}</p>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-weak px-4 py-3.5">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-danger" />
          <p className="text-[13px] font-medium text-danger">{error}</p>
        </div>
      )}

      {completed && !isWorking && (
        <div className="mt-6 rounded-xl border border-success/30 bg-success-weak px-4 py-3.5">
          <p className="text-[13px] font-medium text-success">Entry completed</p>
          <p className="mt-1 text-xs text-ink-muted">
            Worked {formatElapsed(completed.durationMs)}
            {completed.note && ` · "${completed.note}"`}
          </p>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-hairline bg-surface-2 p-6 text-center">
        {isWorking ? (
          <>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-subtle">
              Working
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold text-ink">
              {latestEntry && formatElapsed(now - new Date(latestEntry.at).getTime())}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Clocked in at {latestEntry && formatDateTime(latestEntry.at)}
            </p>

            {policy.enabled && (
            <div className="mx-auto mt-5 max-w-sm rounded-lg border border-hairline bg-surface-3 p-4 text-left">
              {activeBreak ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-subtle">
                    On {activeBreak.type} break
                  </p>
                  <p className="mt-1.5 font-mono text-xl font-semibold text-ink">
                    {formatElapsed(now - new Date(activeBreak.breakInAt).getTime())}
                  </p>
                  <button
                    type="button"
                    onClick={handleEndBreak}
                    className="mt-3 h-8 w-full rounded-lg border border-hairline bg-surface-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface-4"
                  >
                    End break
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-subtle">
                    Breaks
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartBreak("meal")}
                      disabled={mealCapped}
                      className="flex min-h-8 flex-1 items-center justify-center rounded-lg border border-hairline bg-surface-2 px-2 py-1.5 text-center text-[13px] font-medium leading-tight text-ink transition-colors hover:bg-surface-4 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Start meal break{mealCapped ? " (limit reached)" : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartBreak("rest")}
                      disabled={restCapped}
                      className="flex min-h-8 flex-1 items-center justify-center rounded-lg border border-hairline bg-surface-2 px-2 py-1.5 text-center text-[13px] font-medium leading-tight text-ink transition-colors hover:bg-surface-4 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Start rest break{restCapped ? " (limit reached)" : ""}
                    </button>
                  </div>
                </>
              )}

              {breakError && (
                <p className="mt-2 text-xs font-medium text-danger">{breakError}</p>
              )}

              {sessionBreaks.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-hairline pt-3">
                  {sessionBreaks.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 text-xs">
                      <BreakTypeBadge type={b.type} />
                      <span className="text-ink-subtle">
                        {b.durationMinutes !== undefined
                          ? `${b.durationMinutes}m`
                          : "in progress"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            )}

            {showNote ? (
              <div className="mx-auto mt-5 max-w-sm text-left">
                <label className="block text-xs font-medium text-ink-muted">
                  Notes (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Anything worth noting about this shift..."
                  className="mt-1.5 w-full rounded-lg border border-hairline bg-surface-3 px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleClockOut}
                  className="mt-3 h-9 w-full rounded-lg bg-danger text-[13px] font-medium text-white transition-colors hover:bg-danger-hover"
                >
                  Save entry
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                className="mt-5 h-9 rounded-lg bg-danger px-5 text-[13px] font-medium text-white transition-colors hover:bg-danger-hover"
              >
                Clock out
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-subtle">
              Not working
            </p>
            <p className="mt-2 text-[13px] text-ink-muted">
              {hasShiftToday
                ? "You have a shift scheduled today."
                : "No shift assigned today."}
            </p>
            <button
              type="button"
              onClick={handleClockIn}
              className="mt-5 h-9 rounded-lg bg-primary px-5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Clock in
            </button>
          </>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-surface-2">
        <p className="border-b border-hairline px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
          Recent activity
        </p>
        {myEntries.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <ClockIcon className="mx-auto size-8 text-ink-faint" />
            <p className="mt-2 text-[13px] font-medium text-ink">No clock entries yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-hairline/60">
            {myEntries.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                  <ClockIcon className="size-3.5 text-ink-subtle" />
                  {c.action === "in" ? "Clocked in" : "Clocked out"}
                  {c.note && (
                    <span className="text-[11px] font-normal text-ink-subtle">
                      &middot; {c.note}
                    </span>
                  )}
                </span>
                <span className="text-xs text-ink-subtle">{formatDateTime(c.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
