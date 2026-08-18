"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getCompanySettings } from "@/lib/company";
import type { CompanySettings } from "@/lib/company";
import { useCompany } from "@/lib/company-data";
import type { Shift } from "@/lib/company-data";
import { localDateStr } from "@/lib/format";
import StatCard from "@/components/ui/StatCard";
import {
  ArrowRightIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  ListIcon,
  MoreIcon,
  PlusIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/ui/icons";

const QUICK_LINKS = [
  { label: "My Schedule", hint: "View your shifts", icon: CalendarIcon, href: "/me/schedule", soon: false },
  { label: "Team People", hint: "Invite and manage staff", icon: UsersIcon, href: "/people", soon: false },
  { label: "Shift Templates", hint: "Reusable shifts with repeat rules", icon: ClockIcon, href: "/templates", soon: false },
  { label: "Schedule", hint: "Plan and publish the week", icon: CalendarIcon, href: "/teams", soon: false },
  { label: "Company Settings", hint: "Timezone, branding, defaults", icon: SettingsIcon, href: "/settings", soon: false },
];

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

function weekPhase(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { teams, people, shifts, shiftAssignments, clockEntries } = useCompany();
  const [setup, setSetup] = useState<CompanySettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCompanySettings().then((result) => {
      if (!cancelled) setSetup(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const company = setup?.name ?? user.company ?? "Your company";
  const timezone = setup?.timezone ?? "—";
  const firstName = user.name.split(/\s+/)[0] ?? user.name;
  const activeMembers = people.filter((p) => p.status === "active").length;
  const pendingInvites = people.filter((p) => p.status === "invited").length;

  const today = localDateStr(new Date());
  const weekStart = getMonday(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = localDateStr(weekStart);
  const weekEndStr = localDateStr(weekEnd);

  const shiftsThisWeek = useMemo(
    () => shifts.filter((s) => s.date >= weekStartStr && s.date <= weekEndStr),
    [shifts, weekStartStr, weekEndStr],
  );

  const totalClockEntries = clockEntries.length;

  const personMap = useMemo(() => {
    const map = new Map<string, typeof people[0]>();
    for (const p of people) map.set(p.id, p);
    return map;
  }, [people]);

  const teamMap = useMemo(() => {
    const map = new Map<string, typeof teams[0]>();
    for (const t of teams) map.set(t.id, t);
    return map;
  }, [teams]);

  const assignmentCountByShift = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of shiftAssignments) {
      map.set(a.shiftId, (map.get(a.shiftId) ?? 0) + 1);
    }
    return map;
  }, [shiftAssignments]);

  const assignedPersonIdsByShift = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of shiftAssignments) {
      const list = map.get(a.shiftId) ?? [];
      list.push(a.personId);
      map.set(a.shiftId, list);
    }
    return map;
  }, [shiftAssignments]);

  const upcomingShifts = useMemo(() => {
    return shifts
      .filter((s) => s.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [shifts, today]);

  const shownTeams = teams.slice(0, 3);
  const restTeams = teams.slice(3);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-subtle">
            Good {weekPhase()}, {firstName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {company}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
            {timezone.replace(/_/g, " ")}
          </span>
          <span className="rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
            This week
          </span>
        </div>
      </div>

      {people.length === 0 && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary-weak px-4 py-3.5">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-white">
            <UsersIcon className="size-3.5" />
          </span>
          <div className="flex flex-1 items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-ink">
                Your team is ready to grow
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Invite people by email — they&apos;ll accept and start scheduling.
              </p>
            </div>
            <Link
              href="/people"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Invite team
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Members"
          value={people.length}
          icon={<UsersIcon className="size-4" />}
          sub={activeMembers === 0 && people.length === 0 ? "invite people to get started" : `${activeMembers} active · ${pendingInvites} pending`}
        />
        <StatCard
          label="Teams"
          value={teams.length}
          icon={<ListIcon className="size-4" />}
          sub={
            teams.length > 0 ? (
              <span className="flex min-w-0 items-center gap-1">
                <span className="truncate">
                  {shownTeams.map((t) => t.name).join(", ")}
                </span>
                {restTeams.length > 0 && (
                  <span className="group/tip relative shrink-0">
                    <span className="flex items-center rounded border border-hairline bg-surface-3 px-1 py-0.5 text-ink-subtle transition-colors group-hover/tip:text-ink">
                      <MoreIcon className="size-3" />
                    </span>
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden w-max max-w-[180px] -translate-x-1/2 rounded-md border border-hairline bg-surface-1 px-2 py-1.5 text-[11px] leading-snug text-ink shadow-md group-hover/tip:block">
                      {restTeams.map((t) => t.name).join(", ")}
                    </span>
                  </span>
                )}
              </span>
            ) : (
              "create your first team"
            )
          }
        />
        <StatCard
          label="Shifts this week"
          value={shiftsThisWeek.length}
          icon={<ClockIcon className="size-4" />}
          sub={shiftsThisWeek.length === 0 ? "no shifts yet" : "published shifts"}
        />
        <StatCard
          label="Clock entries"
          value={totalClockEntries}
          tone="primary"
          icon={<CheckIcon className="size-4" />}
          sub="total recorded"
        />
      </div>

      {/* Upcoming shifts widget */}
      <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">
            Upcoming shifts
          </h2>
          <Link
            href="/me/schedule"
            className="text-[12px] font-medium text-primary transition-colors hover:text-primary-hover"
          >
            View all
          </Link>
        </div>

        {upcomingShifts.length === 0 ? (
          <div className="mt-4 rounded-lg border border-hairline bg-surface-3 p-6 text-center">
            <CalendarIcon className="mx-auto size-5 text-ink-faint" />
            <p className="mt-2 text-[13px] font-medium text-ink">No upcoming shifts</p>
            <p className="mt-1 text-xs text-ink-muted">
              Publish shift templates to see them here.
            </p>
            <Link
              href="/teams"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Go to schedule
            </Link>
          </div>
        ) : (
          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
            {upcomingShifts.map((shift) => {
              const count = assignmentCountByShift.get(shift.id) ?? 0;
              const assignedIds = assignedPersonIdsByShift.get(shift.id) ?? [];
              const assignedNames = assignedIds
                .map((id) => personMap.get(id)?.name)
                .filter(Boolean)
                .slice(0, 3);
              const overflow = assignedIds.length - 3;
              const team = teamMap.get(shift.teamId);
              const isUnderstaffed = count < shift.requiredCount;

              return (
                <div
                  key={shift.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                    isUnderstaffed
                      ? "border-warning/60 bg-warning-weak/50"
                      : "border-hairline bg-surface-1"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {shift.title}
                      </p>
                      {team && (
                        <span className="shrink-0 rounded border border-hairline bg-surface-2 px-1.5 py-px text-[10px] text-ink-subtle">
                          {team.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-subtle">
                      {formatDayLabel(shift.date)} · {shift.startTime} – {getEndTime(shift.startTime, shift.durationMinutes)} · {formatDuration(shift.durationMinutes)}
                    </p>
                    {assignedNames.length > 0 && (
                      <p className="mt-1 text-[11px] text-ink-muted">
                        {assignedNames.join(", ")}
                        {overflow > 0 && ` +${overflow}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                      isUnderstaffed
                        ? "border-warning/30 bg-surface-2 text-warning"
                        : "border-hairline bg-surface-2 text-ink-muted"
                    }`}>
                      {count}/{shift.requiredCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-hairline bg-surface-2 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Quick links
            </h2>
            <span className="text-[11px] text-ink-subtle">setup shortcuts</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.label}
                href={q.href ?? "/dashboard"}
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
                  {q.soon && (
                    <span className="mt-1.5 inline-block rounded border border-hairline bg-surface-2 px-1 py-px text-[9px] font-medium uppercase tracking-wide text-ink-subtle">
                      soon
                    </span>
                  )}
                </span>
                <ArrowRightIcon className="ml-auto mt-1 size-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-ink-muted" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-surface-2 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Your teams
            </h2>
            <BuildingIcon className="size-4 text-ink-subtle" />
          </div>

          {teams.length === 0 ? (
            <p className="mt-4 text-xs text-ink-muted">
              No teams yet — create your first team to group people.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {teams.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-1 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {t.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {people.filter((p) => p.teamIds.includes(t.id)).length} members
                    </p>
                  </div>
                  <Link
                    href="/people"
                    className="shrink-0 rounded-md border border-hairline bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:text-ink"
                  >
                    People
                  </Link>
                </div>
              ))}
              {teams.length > 3 && (
                <p className="pt-1 text-[11px] text-ink-subtle">
                  +{teams.length - 3} more in{" "}
                  <Link href="/teams" className="text-primary hover:text-primary-hover">
                    Teams
                  </Link>
                </p>
              )}
            </div>
          )}

          <Link
            href="/teams"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-hairline py-2 text-xs font-medium text-ink-subtle transition-colors hover:border-primary/40 hover:text-ink-muted"
          >
            <PlusIcon className="size-3.5" />
            Add team
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-[11px] text-ink-faint">
        Static prototype · timezone {timezone.replace(/_/g, " ")} · data stored
        in your browser
      </p>
    </div>
  );
}
