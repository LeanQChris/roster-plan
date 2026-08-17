"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCompany } from "@/lib/company-data";
import { useManager } from "@/lib/manager-team";
import StatCard from "@/components/ui/StatCard";
import { ClockIcon, ListIcon, UsersIcon } from "@/components/ui/icons";
import { TeamDetailProvider } from "./team-detail-context";

export default function ManagerTeamDetailLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { managedTeams, selectTeam } = useManager();
  const { people, shiftTemplates, auditLog } = useCompany();

  useEffect(() => {
    if (params.id && !managedTeams.some((t) => t.id === params.id)) {
      router.replace("/manager/dashboard");
      return;
    }
    selectTeam(params.id);
  }, [managedTeams, params.id, router, selectTeam]);

  const team = managedTeams.find((t) => t.id === params.id);

  const teamPeople = useMemo(
    () => people.filter((p) => params.id && p.teamIds.includes(params.id)),
    [people, params.id],
  );

  const teamTemplates = useMemo(
    () => shiftTemplates.filter((t) => t.teamId === params.id),
    [shiftTemplates, params.id],
  );

  const teamAuditLog = useMemo(
    () => auditLog.filter((a) => a.teamId === params.id),
    [auditLog, params.id],
  );

  if (!team) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <ListIcon className="size-10 text-ink-faint" />
        <p className="text-sm font-medium text-ink">Team not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {team.name}
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
          value={teamPeople.filter((p) => p.status === "active").length}
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
          icon={<ListIcon className="size-4" />}
        />
      </div>

      <div className="mt-6">
        <TeamDetailProvider value={{ team, teamPeople, teamTemplates, teamAuditLog }}>
          {children}
        </TeamDetailProvider>
      </div>
    </div>
  );
}
