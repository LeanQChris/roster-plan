"use client";

import { useMemo, useState } from "react";
import { useCompany } from "@/lib/company-data";
import type { LeaveStatus } from "@/lib/company-data";
import LeaveStatusBadge from "@/components/leave/LeaveStatusBadge";
import { LEAVE_TYPES } from "@/components/leave/RequestLeaveModal";
import { CalendarOffIcon } from "@/components/ui/icons";

const STATUS_FILTERS: { value: LeaveStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "cancelled", label: "Cancelled" },
];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function typeLabel(type: string): string {
  return LEAVE_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default function CompanyLeaveRequestsPage() {
  const { leaveRequests, people, teams } = useCompany();
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const filtered = useMemo(() => {
    return leaveRequests
      .filter((l) => statusFilter === "all" || l.status === statusFilter)
      .filter((l) => {
        if (teamFilter === "all") return true;
        const person = personById.get(l.personId);
        return person?.teamIds.includes(teamFilter) ?? false;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [leaveRequests, statusFilter, teamFilter, personById]);

  const pendingCount = leaveRequests.filter((l) => l.status === "pending").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Leave Requests
          </h1>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {pendingCount} pending across the company
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="h-8 rounded-lg border border-hairline bg-surface-3 px-2.5 text-[13px] text-ink outline-none focus:border-primary"
          >
            <option value="all">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 rounded-lg border border-hairline bg-surface-3 p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-primary text-white"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <CalendarOffIcon className="mx-auto size-10 text-ink-faint" />
          <p className="mt-3 text-sm font-medium text-ink">
            No leave requests found
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Adjust the filters, or requests will appear here once employees
            submit them.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-hairline text-[11px] uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-2.5 font-medium">Person</th>
                <th className="px-4 py-2.5 font-medium">Team</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Dates</th>
                <th className="px-4 py-2.5 font-medium">Reason</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Reviewed by</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const person = personById.get(l.personId);
                const personTeams = person
                  ? person.teamIds
                      .map((id) => teamById.get(id)?.name)
                      .filter(Boolean)
                  : [];
                return (
                  <tr
                    key={l.id}
                    className="border-b border-hairline last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-ink">
                      {person?.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-ink-subtle">
                      {personTeams.length > 0 ? personTeams.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-subtle">
                      {typeLabel(l.type)}
                    </td>
                    <td className="px-4 py-3 text-ink-subtle">
                      {formatShortDate(l.startDate)} – {formatShortDate(l.endDate)}
                    </td>
                    <td className="max-w-48 px-4 py-3">
                      <p className="truncate text-ink-muted">{l.reason ?? "—"}</p>
                      {l.status === "denied" && l.reviewerComment && (
                        <p className="mt-0.5 text-[11px] text-danger">
                          Comment: {l.reviewerComment}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <LeaveStatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {l.reviewedBy ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
