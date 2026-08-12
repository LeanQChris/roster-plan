"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useCompany } from "@/lib/company-data";
import { ArrowRightIcon, ListIcon, UsersIcon } from "@/components/ui/icons";

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const { teams, people } = useCompany();

  const myPerson = useMemo(
    () =>
      people.find(
        (p) => p.role === "manager" && p.email.toLowerCase() === user?.email.toLowerCase(),
      ),
    [people, user?.email],
  );

  const myTeam = useMemo(
    () => teams.find((t) => t.id === myPerson?.teamId) ?? null,
    [teams, myPerson?.teamId],
  );

  const memberCount = useMemo(
    () => (myTeam ? people.filter((p) => p.teamId === myTeam.id).length : 0),
    [people, myTeam],
  );

  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
          <ListIcon className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            My teams
          </h1>
          <p className="mt-0.5 text-xs text-ink-subtle">
            Teams you manage
          </p>
        </div>
      </div>

      {!myTeam ? (
        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <UsersIcon className="mx-auto size-11 text-ink-faint" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">
            You&apos;re not assigned to a team yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Ask your company admin to invite you with the manager role and
            assign a team.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <Link
            href={`/manager/teams/${myTeam.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface-2 p-4 transition-colors hover:bg-surface-3/70"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
                <UsersIcon className="size-4" />
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink">{myTeam.name}</p>
                <p className="text-xs text-ink-subtle">
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </p>
              </div>
            </div>
            <ArrowRightIcon className="size-4 text-ink-subtle" />
          </Link>
        </div>
      )}
    </div>
  );
}
