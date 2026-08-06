"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { readCompanySetup } from "@/lib/company";
import StatCard from "@/components/admin/StatCard";
import {
  ArrowRightIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  ListIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/admin/icons";

const QUICK_LINKS = [
  { label: "Team People", hint: "Invite and manage staff", icon: UsersIcon, soon: true },
  { label: "Shift Templates", hint: "Reusable shifts with repeat rules", icon: ClockIcon, soon: true },
  { label: "Schedule", hint: "Plan and publish the week", icon: CalendarIcon, soon: true },
  { label: "Company Settings", hint: "Timezone, branding, defaults", icon: SettingsIcon, href: "/settings", soon: false },
];

function weekPhase(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [setup] = useState(() => readCompanySetup());

  if (!user) return null;

  const company = setup?.company ?? user.company ?? "Your company";
  const team = setup?.team ?? "General";
  const timezone = setup?.timezone ?? "—";
  const firstName = user.name.split(/\s+/)[0] ?? user.name;

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
              {team} has no members yet — invite people to get scheduling.
            </p>
          </div>
          <Link
            href=""
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Invite team
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Members"
          value="0"
          icon={<UsersIcon className="size-4" />}
          sub="invite people to get started"
        />
        <StatCard
          label="Teams"
          value="1"
          icon={<ListIcon className="size-4" />}
          sub={team}
        />
        <StatCard
          label="Shifts published"
          value="0"
          icon={<ClockIcon className="size-4" />}
          sub="this week"
        />
        <StatCard
          label="Clock entries"
          value="0"
          tone="primary"
          icon={<CheckIcon className="size-4" />}
          sub="across all teams"
        />
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

          <div className="mt-4 rounded-lg border border-hairline bg-surface-1 p-4">
            <p className="text-sm font-semibold text-ink">{team}</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              0 members · invite people to get started
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Link
                href="/people"
                className="rounded-md border border-hairline bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                People
              </Link>
              <Link
                href="/schedule"
                className="rounded-md border border-hairline bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                Schedule
              </Link>
              <Link
                href="/templates"
                className="rounded-md border border-hairline bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                Templates
              </Link>
            </div>
          </div>

          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-hairline py-2 text-xs font-medium text-ink-subtle transition-colors hover:border-primary/40 hover:text-ink-muted"
          >
            <UsersIcon className="size-3.5" />
            Add team
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-[11px] text-ink-faint">
        Static prototype · timezone {timezone.replace(/_/g, " ")} · data stored
        in your browser
      </p>
    </div>
  );
}