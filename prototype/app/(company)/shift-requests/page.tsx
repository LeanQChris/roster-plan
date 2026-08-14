"use client";

import { useMemo, useState } from "react";
import { useCompany } from "@/lib/company-data";
import type { AssignmentStatus } from "@/lib/company-data";
import { CalendarIcon } from "@/components/ui/icons";

const STATUS_FILTERS: { value: AssignmentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function CompanyShiftRequestsPage() {
  const { shiftAssignments, shifts, people, teams, approveShiftRequest, denyShiftRequest } = useCompany();
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "all">("pending");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const shiftMap = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);

  const filtered = useMemo(() => {
    return shiftAssignments
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .filter((a) => {
        if (teamFilter === "all") return true;
        const shift = shiftMap.get(a.shiftId);
        return shift?.teamId === teamFilter;
      })
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }, [shiftAssignments, statusFilter, teamFilter, shiftMap]);

  const pendingCount = shiftAssignments.filter((a) => a.status === "pending").length;

  const handleApprove = (assignmentId: string) => {
    approveShiftRequest(assignmentId, "Company Admin");
  };

  const handleDeny = (assignmentId: string) => {
    denyShiftRequest(assignmentId, "Company Admin");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Shift Requests
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
          <CalendarIcon className="mx-auto size-10 text-ink-faint" />
          <p className="mt-3 text-sm font-medium text-ink">
            No shift requests found
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
                <th className="px-4 py-2.5 font-medium">Shift</th>
                <th className="px-4 py-2.5 font-medium">Date & Time</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((assignment) => {
                const person = personById.get(assignment.personId);
                const shift = shiftMap.get(assignment.shiftId);
                if (!shift) return null;
                const team = teamById.get(shift.teamId);
                return (
                  <tr
                    key={assignment.id}
                    className="border-b border-hairline last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-ink">
                      {person?.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-ink-subtle">
                      {team?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-subtle">
                      {shift.title}
                    </td>
                    <td className="px-4 py-3 text-ink-subtle">
                      {shift.date} · {formatTime(shift.startTime)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          assignment.status === "pending"
                            ? "bg-warning-weak text-warning"
                            : assignment.status === "approved"
                              ? "bg-success-weak text-success"
                              : "bg-danger-weak text-danger"
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {assignment.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(assignment.id)}
                            className="rounded-md border border-success/25 bg-success-weak px-2.5 py-1 text-[11px] font-medium text-success transition-colors hover:bg-success/15"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeny(assignment.id)}
                            className="rounded-md border border-danger/25 bg-danger-weak px-2.5 py-1 text-[11px] font-medium text-danger transition-colors hover:bg-danger/15"
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <p className="text-right text-[11px] text-ink-faint">
                          {assignment.approvedBy ?? "—"}
                        </p>
                      )}
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
