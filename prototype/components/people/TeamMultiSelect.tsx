"use client";

import type { Team } from "@/lib/company-data";

interface TeamMultiSelectProps {
  teams: Team[];
  locationId: string | null;
  selectedTeamIds: string[];
  onChange: (teamIds: string[]) => void;
}

export default function TeamMultiSelect({
  teams,
  locationId,
  selectedTeamIds,
  onChange,
}: TeamMultiSelectProps) {
  if (!locationId) {
    return (
      <p className="mt-1.5 rounded-lg border border-hairline bg-surface-3 px-3 py-2.5 text-[13px] text-ink-subtle">
        Pick a location first to choose teams.
      </p>
    );
  }

  const eligible = teams.filter((t) => t.locationId === locationId);

  if (eligible.length === 0) {
    return (
      <p className="mt-1.5 rounded-lg border border-hairline bg-surface-3 px-3 py-2.5 text-[13px] text-ink-subtle">
        No teams at this location yet.
      </p>
    );
  }

  const toggle = (teamId: string) => {
    onChange(
      selectedTeamIds.includes(teamId)
        ? selectedTeamIds.filter((id) => id !== teamId)
        : [...selectedTeamIds, teamId],
    );
  };

  return (
    <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-hairline bg-surface-3 p-2">
      {eligible.map((t) => (
        <label
          key={t.id}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink transition-colors hover:bg-surface-4"
        >
          <input
            type="checkbox"
            checked={selectedTeamIds.includes(t.id)}
            onChange={() => toggle(t.id)}
            className="size-3.5 rounded border-hairline"
          />
          {t.name}
        </label>
      ))}
    </div>
  );
}
