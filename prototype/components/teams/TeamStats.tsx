import type { Person, Team } from "@/lib/company-data";
import StatCard from "@/components/ui/StatCard";
import { ListIcon, UsersIcon } from "@/components/ui/icons";

interface TeamStatsProps {
  teams: Team[];
  people: Person[];
}

export default function TeamStats({ teams, people }: TeamStatsProps) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Teams"
        value={teams.length}
        icon={<ListIcon className="size-4" />}
        sub="across the company"
      />
      <StatCard
        label="People"
        value={people.length}
        tone="primary"
        icon={<UsersIcon className="size-4" />}
        sub="in all teams"
      />
      <StatCard
        label="Active"
        value={people.filter((p) => p.status === "active").length}
        icon={<UsersIcon className="size-4" />}
        sub="people currently active"
      />
      <StatCard
        label="Invites pending"
        value={people.filter((p) => p.status === "invited").length}
        icon={<UsersIcon className="size-4" />}
        sub="awaiting acceptance"
      />
    </div>
  );
}