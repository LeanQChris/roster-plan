"use client";

import { useMemo, useState } from "react";
import { useCompany } from "@/lib/company-data";
import type { Team } from "@/lib/company-data";
import Modal from "@/components/ui/Modal";
import { PlusIcon } from "@/components/ui/icons";
import TeamStats from "@/components/teams/TeamStats";
import TeamsEmpty from "@/components/teams/TeamsEmpty";
import TeamTable from "@/components/teams/TeamTable";
import TeamFormModal from "@/components/teams/TeamFormModal";
import type { TeamFormInput } from "@/components/teams/TeamFormModal";

export default function TeamsPage() {
  const { teams, people, locations, createTeam, updateTeam, deleteTeam } =
    useCompany();
  const [modalTeam, setModalTeam] = useState<Team | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<Team | null>(null);
  const [saved, setSaved] = useState(false);

  const locationName = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of locations) map.set(l.id, l.name);
    return map;
  }, [locations]);

  const flashSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const handleSave = async (
    input: TeamFormInput,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (modalTeam) {
      const ok = await updateTeam(modalTeam.id, {
        name: input.name,
        description: input.description,
        locationId: input.locationId,
        managerId: input.managerId,
      });
      if (!ok) {
        return { ok: false, error: "Team names can't be empty or duplicate an existing team." };
      }
    } else {
      const team = await createTeam(
        input.name,
        input.description,
        input.locationId,
        input.managerId,
      );
      if (!team) {
        return { ok: false, error: "Team name can't be empty or match an existing team." };
      }
    }
    setModalTeam(undefined);
    flashSaved();
    return { ok: true };
  };

  const affected = confirmDelete
    ? people.filter((p) => p.teamIds.includes(confirmDelete.id)).length
    : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Teams</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Organize your people into teams for scheduling and reporting.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {saved && (
            <span className="rounded-lg border border-success/25 bg-success-weak px-2.5 py-1.5 text-xs font-medium text-success">
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={() => setModalTeam(null)}
            className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <PlusIcon className="size-3.5" />
            New team
          </button>
        </div>
      </div>

      <TeamStats teams={teams} people={people} />

      {teams.length === 0 ? (
        <TeamsEmpty onCreate={() => setModalTeam(null)} />
      ) : (
        <TeamTable
          teams={teams}
          people={people}
          locationName={locationName}
          onEdit={(team) => setModalTeam(team)}
          onDelete={setConfirmDelete}
        />
      )}

      {modalTeam !== undefined && (
        <TeamFormModal
          key={modalTeam?.id ?? "create"}
          team={modalTeam}
          locations={locations}
          people={people}
          onClose={() => setModalTeam(undefined)}
          onSave={handleSave}
        />
      )}

      {confirmDelete && (
        <Modal
          open
          title={`Delete ${confirmDelete.name}?`}
          description={
            affected > 0
              ? `${affected} ${affected === 1 ? "person is" : "people are"} on this team and will become unassigned. This can't be undone.`
              : "This team will be removed. This can't be undone."
          }
          tone="danger"
          confirmLabel="Delete team"
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteTeam(confirmDelete.id);
            setConfirmDelete(null);
            flashSaved();
          }}
        />
      )}
    </div>
  );
}