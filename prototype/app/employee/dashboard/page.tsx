"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useCompany } from "@/lib/company-data";
import { useEmployeeTeam } from "@/lib/employee-team";
import { localDateStr } from "@/lib/format";
import RequestLeaveModal from "@/components/leave/RequestLeaveModal";
import LeaveStatusBadge from "@/components/leave/LeaveStatusBadge";
import { LEAVE_TYPES } from "@/components/leave/RequestLeaveModal";
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  CalendarOffIcon,
  ClockIcon,
  UsersIcon,
} from "@/components/ui/icons";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dTime = new Date(dateStr + "T00:00:00").getTime();
  if (dTime === today.getTime()) return "Today";
  if (dTime === tomorrow.getTime()) return "Tomorrow";
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

const QUICK_LINKS = [
  { label: "Schedule", hint: "View your assigned shifts", icon: CalendarIcon, href: "/employee/schedule" },
  { label: "Clock In", hint: "Start or end your shift", icon: ClockIcon, href: "/employee/clock" },
  { label: "Profile", hint: "Timezone and phone", icon: UsersIcon, href: "/employee/profile" },
  { label: "Notifications", hint: "Updates from your manager", icon: BellIcon, href: "/employee/notifications" },
];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function typeLabel(type: string): string {
  return LEAVE_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const { shifts, shiftAssignments, clockEntries, leaveRequests, cancelLeaveRequest } = useCompany();
  const { myPerson, myTeams } = useEmployeeTeam();
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const today = localDateStr(new Date());

  const nextShift = useMemo(() => {
    if (!myPerson) return null;
    const myShiftIds = new Set(
      shiftAssignments.filter((a) => a.personId === myPerson.id).map((a) => a.shiftId),
    );
    return (
      shifts
        .filter((s) => myShiftIds.has(s.id) && s.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0] ?? null
    );
  }, [shifts, shiftAssignments, myPerson, today]);

  const latestClockEntry = useMemo(() => {
    if (!myPerson) return null;
    return (
      clockEntries
        .filter((c) => c.personId === myPerson.id)
        .sort((a, b) => b.at.localeCompare(a.at))[0] ?? null
    );
  }, [clockEntries, myPerson]);

  const myLeaveRequests = useMemo(() => {
    if (!myPerson) return [];
    return leaveRequests
      .filter((l) => l.personId === myPerson.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [leaveRequests, myPerson]);

  const isClockedIn = latestClockEntry?.action === "in";

  if (!user) return null;

  const firstName = user.name.split(/\s+/)[0] ?? user.name;

  return (
    <div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-subtle">
          Welcome back
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {firstName}
        </h1>
      </div>

      {!myPerson ? (
        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <UsersIcon className="mx-auto size-11 text-ink-faint" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">
            You&apos;re not linked to a team member record yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Ask your manager to invite you with the employee role, then accept
            the invite from that email.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                isClockedIn
                  ? "border-success/30 bg-success-weak text-success"
                  : "border-hairline bg-surface-2 text-ink-muted"
              }`}
            >
              <ClockIcon className="size-3.5" />
              {isClockedIn ? "Currently clocked in" : "Not clocked in"}
            </span>
            {myTeams.length > 0 && (
              <span className="rounded-lg border border-hairline bg-surface-2 px-3 py-1.5 text-xs text-ink-muted">
                {myTeams.map((t) => t.name).join(", ")}
              </span>
            )}
          </div>

          {/* Next shift widget */}
          <div className="mt-6 rounded-xl border border-hairline bg-surface-2 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                Next shift
              </h2>
              <Link
                href="/employee/schedule"
                className="text-[12px] font-medium text-primary transition-colors hover:text-primary-hover"
              >
                View schedule
              </Link>
            </div>

            {!nextShift ? (
              <div className="mt-4 rounded-lg border border-hairline bg-surface-3 p-6 text-center">
                <CalendarIcon className="mx-auto size-5 text-ink-faint" />
                <p className="mt-2 text-[13px] font-medium text-ink">No upcoming shifts</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Check back later or contact your manager.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-hairline bg-surface-1 px-3 py-2.5">
                <p className="text-[13px] font-medium text-ink">{nextShift.title}</p>
                <p className="mt-0.5 text-[11px] text-ink-subtle">
                  {formatDayLabel(nextShift.date)} · {nextShift.startTime} –{" "}
                  {getEndTime(nextShift.startTime, nextShift.durationMinutes)} ·{" "}
                  {formatDuration(nextShift.durationMinutes)}
                </p>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="mt-6 rounded-xl border border-hairline bg-surface-2 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                Quick links
              </h2>
              <button
                type="button"
                onClick={() => setLeaveModalOpen(true)}
                className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
              >
                <CalendarOffIcon className="size-3.5" />
                Request leave
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {QUICK_LINKS.map((q) => (
                <Link
                  key={q.label}
                  href={q.href}
                  className="group flex items-start gap-3 rounded-lg border border-hairline bg-surface-1 p-3.5 transition-colors hover:bg-surface-3"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
                    <q.icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink">
                      {q.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-ink-muted">
                      {q.hint}
                    </span>
                  </span>
                  <ArrowRightIcon className="ml-auto mt-1 size-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-ink-muted" />
                </Link>
              ))}
            </div>
          </div>

          {/* My leave requests */}
          <div className="mt-6 rounded-xl border border-hairline bg-surface-2 p-5">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              My leave requests
            </h2>
            {myLeaveRequests.length === 0 ? (
              <div className="mt-4 rounded-lg border border-hairline bg-surface-3 p-6 text-center">
                <CalendarOffIcon className="mx-auto size-5 text-ink-faint" />
                <p className="mt-2 text-[13px] font-medium text-ink">
                  No leave requests yet
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Request time off and your manager will review it.
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {myLeaveRequests.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-lg border border-hairline bg-surface-1 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink">
                          {typeLabel(l.type)}
                          <span className="text-ink-subtle">
                            {" "}· {formatShortDate(l.startDate)} –{" "}
                            {formatShortDate(l.endDate)}
                          </span>
                        </p>
                        {l.reason && (
                          <p className="mt-0.5 truncate text-[11px] text-ink-muted">
                            {l.reason}
                          </p>
                        )}
                        {l.status === "denied" && l.reviewerComment && (
                          <p className="mt-0.5 text-[11px] text-danger">
                            Manager: {l.reviewerComment}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <LeaveStatusBadge status={l.status} />
                        {l.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => cancelLeaveRequest(l.id)}
                            className="rounded-md border border-hairline bg-surface-3 px-2 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:bg-surface-4 hover:text-ink"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <RequestLeaveModal
        open={leaveModalOpen}
        personId={myPerson?.id ?? ""}
        onClose={() => setLeaveModalOpen(false)}
      />
    </div>
  );
}
