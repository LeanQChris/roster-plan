"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCompany } from "@/lib/company-data";
import { useManager } from "@/lib/manager-team";
import StatCard from "@/components/ui/StatCard";
import {
  ActivityIcon,
  CalendarIcon,
  CalendarOffIcon,
  ClockIcon,
  MailIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { formatTime, localDateStr } from "@/lib/format";

export default function ManagerDashboardPage() {
  const { myPerson, selectedTeam } = useManager();
  const {
    people,
    shifts,
    shiftAssignments,
    shiftTemplates,
    auditLog,
    leaveRequests,
  } = useCompany();

  const teamPeople = useMemo(
    () => people.filter((p) => selectedTeam && p.teamIds.includes(selectedTeam.id)),
    [people, selectedTeam?.id],
  );

  const teamTemplates = useMemo(
    () => shiftTemplates.filter((t) => t.teamId === selectedTeam?.id),
    [shiftTemplates, selectedTeam?.id],
  );

  const teamAuditLog = useMemo(
    () => auditLog.filter((a) => a.teamId === selectedTeam?.id),
    [auditLog, selectedTeam?.id],
  );

  const pendingLeaveCount = useMemo(() => {
    const memberIds = new Set(teamPeople.map((p) => p.id));
    return leaveRequests.filter(
      (l) => memberIds.has(l.personId) && l.status === "pending",
    ).length;
  }, [leaveRequests, teamPeople]);

  const pendingShiftRequestCount = useMemo(() => {
    const memberIds = new Set(teamPeople.map((p) => p.id));
    return shiftAssignments.filter(
      (a) => memberIds.has(a.personId) && a.status === "pending",
    ).length;
  }, [shiftAssignments, teamPeople]);

  const today = localDateStr(new Date());
  const upcomingShifts = useMemo(
    () =>
      shifts
        .filter((s) => s.teamId === selectedTeam?.id && s.date >= today)
        .sort((a, b) =>
          a.date === b.date
            ? a.startTime.localeCompare(b.startTime)
            : a.date.localeCompare(b.date),
        )
        .slice(0, 5),
    [shifts, selectedTeam?.id, today],
  );

  if (!selectedTeam) {
    return (
      <div>
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <UsersIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              My teams
            </h1>
            <p className="mt-0.5 text-xs text-ink-subtle">Teams you manage</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <UsersIcon className="mx-auto size-11 text-ink-faint" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">
            {myPerson
              ? "No teams assigned to you yet"
              : "You're not assigned to a team yet"}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            {myPerson
              ? "Ask your company admin to assign you as the manager of a team."
              : "Ask your company admin to invite you with the manager role and assign a team."}
          </p>
        </div>
      </div>
    );
  }

  const activeCount = teamPeople.filter((p) => p.status === "active").length;
  const invitedCount = teamPeople.filter((p) => p.status === "invited").length;
  const teamShiftIds = new Set(
    shifts.filter((s) => s.teamId === selectedTeam.id).map((s) => s.id),
  );
  const assignedCount = shiftAssignments.filter((a) =>
    teamShiftIds.has(a.shiftId),
  ).length;

  const sections = [
    {
      href: `/manager/teams/${selectedTeam.id}`,
      label: "Members",
      description: "Manage team members and invites",
      icon: UsersIcon,
    },
    {
      href: `/manager/teams/${selectedTeam.id}/templates`,
      label: "Templates",
      description: "Recurring shift templates",
      icon: ClockIcon,
    },
    {
      href: `/manager/teams/${selectedTeam.id}/schedule`,
      label: "Schedule",
      description: "Shifts and assignments",
      icon: CalendarIcon,
    },
    {
      href: `/manager/teams/${selectedTeam.id}/audit`,
      label: "Audit",
      description: "Recent team activity",
      icon: ActivityIcon,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <UsersIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {selectedTeam.name}
            </h1>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {teamPeople.length} {teamPeople.length === 1 ? "member" : "members"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Members"
          value={teamPeople.length}
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Active"
          value={activeCount}
          tone="primary"
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Templates"
          value={teamTemplates.length}
          icon={<ClockIcon className="size-4" />}
        />
        <StatCard
          label="Activity"
          value={teamAuditLog.length}
          icon={<ActivityIcon className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <Link
            key={section.label}
            href={section.href}
            className="group rounded-xl border border-hairline bg-surface-2 p-4 transition-colors hover:bg-surface-3/70"
          >
            <span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
              <section.icon className="size-4" />
            </span>
            <p className="mt-3 text-[13px] font-medium text-ink">{section.label}</p>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {section.description}
            </p>
          </Link>
        ))}
      </div>

      <Link
        href={`/manager/teams/${selectedTeam.id}/leave-requests`}
        className={`mt-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors ${
          pendingLeaveCount > 0
            ? "border-primary/25 bg-primary-weak hover:bg-primary-weak/70"
            : "border-hairline bg-surface-2 hover:bg-surface-3/70"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
              pendingLeaveCount > 0
                ? "bg-primary text-white"
                : "bg-surface-3 text-ink-subtle"
            }`}
          >
            <CalendarOffIcon className="size-4" />
          </span>
          <div>
            <p className="text-[13px] font-medium text-ink">
              {pendingLeaveCount > 0
                ? `${pendingLeaveCount} pending leave request${pendingLeaveCount === 1 ? "" : "s"}`
                : "No pending leave requests"}
            </p>
            <p className="text-xs text-ink-subtle">
              {pendingLeaveCount > 0
                ? "Review and approve or deny"
                : "All team leave requests are reviewed"}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-medium text-primary">
          {pendingLeaveCount > 0 ? "Review →" : "View all"}
        </span>
      </Link>

      <Link
        href={`/manager/teams/${selectedTeam.id}/shift-requests`}
        className={`mt-4 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors ${
          pendingShiftRequestCount > 0
            ? "border-warning/25 bg-warning-weak hover:bg-warning-weak/70"
            : "border-hairline bg-surface-2 hover:bg-surface-3/70"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
              pendingShiftRequestCount > 0
                ? "bg-warning text-white"
                : "bg-surface-3 text-ink-subtle"
            }`}
          >
            <CalendarIcon className="size-4" />
          </span>
          <div>
            <p className="text-[13px] font-medium text-ink">
              {pendingShiftRequestCount > 0
                ? `${pendingShiftRequestCount} pending shift request${pendingShiftRequestCount === 1 ? "" : "s"}`
                : "No pending shift requests"}
            </p>
            <p className="text-xs text-ink-subtle">
              {pendingShiftRequestCount > 0
                ? "Review and approve or deny"
                : "All shift requests are reviewed"}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-medium text-primary">
          {pendingShiftRequestCount > 0 ? "Review →" : "View all"}
        </span>
      </Link>

      <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-surface-2">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
            Upcoming shifts
          </p>
          <Link
            href={`/manager/teams/${selectedTeam.id}/schedule`}
            className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Open schedule
          </Link>
        </div>
        {upcomingShifts.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-ink-muted">
            No shifts scheduled for this team yet — publish from Templates or
            build one in Schedule.
          </p>
        ) : (
          <ul className="divide-y divide-hairline/60">
            {upcomingShifts.map((shift) => (
              <li
                key={shift.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-3 text-ink-subtle">
                  <CalendarIcon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {shift.title}
                  </p>
                  <p className="truncate text-xs text-ink-subtle">
                    {shift.date} · {formatTime(`${shift.date}T${shift.startTime}`)}{" "}
                    · {shift.durationMinutes} min
                  </p>
                </div>
                <span className="shrink-0 text-xs text-ink-muted">
                  {shiftAssignments.filter((a) => a.shiftId === shift.id).length}
                  /{shift.requiredCount} assigned
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(invitedCount > 0 || assignedCount > 0) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {invitedCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary-weak px-3 py-2 text-[13px] text-primary">
              <MailIcon className="size-4" />
              {invitedCount} pending invite{invitedCount === 1 ? "" : "s"}
            </div>
          )}
          {assignedCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-[13px] text-ink-subtle">
              <CalendarIcon className="size-4" />
              {assignedCount} assignment{assignedCount === 1 ? "" : "s"} placed
            </div>
          )}
        </div>
      )}
    </div>
  );
}