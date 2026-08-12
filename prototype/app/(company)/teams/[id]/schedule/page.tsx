"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCompany } from "@/lib/company-data";
import TeamScheduleView from "@/components/schedule/TeamScheduleView";
import { ArrowLeftIcon, CalendarIcon } from "@/components/ui/icons";

export default function SchedulePage() {
  const params = useParams<{ id: string }>();
  const { teams } = useCompany();
  const team = teams.find((t) => t.id === params.id);

  if (!team) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <CalendarIcon className="size-10 text-ink-faint" />
        <p className="text-sm font-medium text-ink">Team not found</p>
        <p className="text-[13px] text-ink-muted">
          It may have been deleted, or the link is incorrect.
        </p>
        <Link
          href="/teams"
          className="mt-2 flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
        >
          <ArrowLeftIcon className="size-4" />
          Back to teams
        </Link>
      </div>
    );
  }

  return (
    <TeamScheduleView
      team={team}
      backHref={"/teams/" + team.id}
      templatesHref={"/teams/" + team.id + "/templates"}
    />
  );
}
