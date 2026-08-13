"use client";

import type { LeaveStatus } from "@/lib/company-data";

const STYLES: Record<LeaveStatus, string> = {
  pending: "border-hairline bg-surface-3 text-ink-subtle",
  approved: "border-success/25 bg-success-weak text-success",
  denied: "border-danger/25 bg-danger-weak text-danger",
  cancelled: "border-hairline bg-surface-1 text-ink-faint",
};

const DOTS: Record<LeaveStatus, string> = {
  pending: "bg-ink-subtle",
  approved: "bg-success",
  denied: "bg-danger",
  cancelled: "bg-ink-faint",
};

export default function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      <span className={`size-1.5 rounded-full ${DOTS[status]}`} />
      {status}
    </span>
  );
}
