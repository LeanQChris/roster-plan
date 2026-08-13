"use client";

import { useMemo, useState } from "react";
import { useCompany } from "@/lib/company-data";
import { useManager } from "@/lib/manager-team";
import type { LeaveRequest } from "@/lib/company-data";
import Modal from "@/components/ui/Modal";
import LeaveStatusBadge from "@/components/leave/LeaveStatusBadge";
import { LEAVE_TYPES } from "@/components/leave/RequestLeaveModal";
import { useTeamDetail } from "../team-detail-context";

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function typeLabel(type: string): string {
  return LEAVE_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default function ManagerTeamLeaveRequestsPage() {
  const { team, teamPeople } = useTeamDetail();
  const { leaveRequests, approveLeave, denyLeave } = useCompany();
  const { myPerson } = useManager();
  const [denyTarget, setDenyTarget] = useState<LeaveRequest | null>(null);
  const [denyComment, setDenyComment] = useState("");

  const teamLeave = useMemo(() => {
    const memberIds = new Set(teamPeople.map((p) => p.id));
    return leaveRequests
      .filter((l) => memberIds.has(l.personId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [leaveRequests, teamPeople]);

  const personById = useMemo(
    () => new Map(teamPeople.map((p) => [p.id, p])),
    [teamPeople],
  );

  const pendingCount = teamLeave.filter((l) => l.status === "pending").length;

  const handleApprove = (request: LeaveRequest) => {
    approveLeave(request.id, myPerson?.name ?? "Manager");
  };

  const handleDeny = () => {
    if (!denyTarget) return;
    denyLeave(denyTarget.id, myPerson?.name ?? "Manager", denyComment);
    setDenyTarget(null);
    setDenyComment("");
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-muted">
          {pendingCount > 0
            ? `${pendingCount} pending request${pendingCount === 1 ? "" : "s"} for ${team.name}`
            : "No pending requests"}
        </p>
      </div>

      {teamLeave.length === 0 ? (
        <div className="mt-6 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <p className="text-sm font-medium text-ink">No leave requests yet</p>
          <p className="mt-1 text-xs text-ink-muted">
            When team members request leave, it will show up here.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-hairline text-[11px] uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-2.5 font-medium">Person</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Dates</th>
                <th className="px-4 py-2.5 font-medium">Reason</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamLeave.map((l) => {
                const person = personById.get(l.personId);
                return (
                  <tr
                    key={l.id}
                    className="border-b border-hairline last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-ink">
                      {person?.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-ink-subtle">
                      {typeLabel(l.type)}
                    </td>
                    <td className="px-4 py-3 text-ink-subtle">
                      {formatShortDate(l.startDate)} –{" "}
                      {formatShortDate(l.endDate)}
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
                    <td className="px-4 py-3">
                      {l.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(l)}
                            className="rounded-md border border-success/25 bg-success-weak px-2.5 py-1 text-[11px] font-medium text-success transition-colors hover:bg-success/15"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDenyTarget(l);
                              setDenyComment("");
                            }}
                            className="rounded-md border border-danger/25 bg-danger-weak px-2.5 py-1 text-[11px] font-medium text-danger transition-colors hover:bg-danger/15"
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <p className="text-right text-[11px] text-ink-faint">
                          {l.reviewedBy ? `by ${l.reviewedBy}` : ""}
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

      <Modal
        open={!!denyTarget}
        title="Deny leave request"
        description={
          denyTarget
            ? `${personById.get(denyTarget.personId)?.name ?? "This person"} — ${typeLabel(denyTarget.type)}, ${formatShortDate(denyTarget.startDate)} – ${formatShortDate(denyTarget.endDate)}`
            : undefined
        }
        tone="danger"
        confirmLabel="Deny request"
        onConfirm={handleDeny}
        onClose={() => setDenyTarget(null)}
      >
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-ink-subtle">
            Comment <span className="text-ink-faint">(optional)</span>
          </label>
          <textarea
            value={denyComment}
            onChange={(e) => setDenyComment(e.target.value)}
            rows={3}
            placeholder="e.g. Insufficient coverage that day"
            className="w-full resize-none rounded-lg border border-hairline bg-surface-3 px-2.5 py-2 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-primary"
          />
        </div>
      </Modal>
    </div>
  );
}
