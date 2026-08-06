"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useCompany } from "@/lib/company-data";
import type { Team } from "@/lib/company-data";
import { formatDate } from "@/lib/format";
import Modal from "@/components/admin/Modal";
import StatCard from "@/components/admin/StatCard";
import {
  ListIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/admin/icons";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

type TeamModalState =
  | { mode: "create" }
  | { mode: "edit"; team: Team }
  | null;

export default function TeamsPage() {
  const { teams, people, createTeam, updateTeam, deleteTeam } = useCompany();
  const [modal, setModal] = useState<TeamModalState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Team | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const memberCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of people) {
      if (!p.teamId) continue;
      counts.set(p.teamId, (counts.get(p.teamId) ?? 0) + 1);
    }
    return counts;
  }, [people]);

  const openCreate = () => {
    setName("");
    setDescription("");
    setError(null);
    setModal({ mode: "create" });
  };

  const openEdit = (team: Team) => {
    setName(team.name);
    setDescription(team.description ?? "");
    setError(null);
    setModal({ mode: "edit", team });
  };

  const close = () => setModal(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (modal?.mode === "edit") {
      if (!updateTeam(modal.team.id, { name, description: description || undefined })) {
        setError("Team names can't be empty or duplicate an existing team.");
        return;
      }
    } else {
      if (!createTeam(name, description)) {
        setError("Team name can't be empty or match an existing team.");
        return;
      }
    }

    setModal(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const affected = confirmDelete
    ? people.filter((p) => p.teamId === confirmDelete.id).length
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
            onClick={openCreate}
            className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <PlusIcon className="size-3.5" />
            New team
          </button>
        </div>
      </div>

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

      {teams.length === 0 ? (
        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <ListIcon className="size-5" />
          </span>
          <h2 className="mt-3 text-[15px] font-semibold text-ink">No teams yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Create your first team to start grouping people and building shift
            templates.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <PlusIcon className="size-3.5" />
            Create a team
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const members = memberCount.get(team.id) ?? 0;
            return (
              <div
                key={team.id}
                className="group flex flex-col rounded-xl border border-hairline bg-surface-2 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
                    <ListIcon className="size-4" />
                  </span>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(team)}
                      aria-label={`Edit ${team.name}`}
                      className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
                    >
                      <PencilIcon className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(team)}
                      aria-label={`Delete ${team.name}`}
                      className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-danger"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="mt-3 text-[15px] font-semibold tracking-tight text-ink">
                  {team.name}
                </h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                  {team.description || "No description yet."}
                </p>

                <div className="mt-4 flex items-center gap-3 border-t border-hairline pt-3 text-[11px] text-ink-subtle">
                  <span className="flex items-center gap-1.5">
                    <UsersIcon className="size-3.5" />
                    {members} {members === 1 ? "member" : "members"}
                  </span>
                  <span>·</span>
                  <span>Created {formatDate(team.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal
          open
          title={modal.mode === "edit" ? "Edit team" : "New team"}
          description={
            modal.mode === "edit"
              ? "Update the team name or description."
              : "Teams group people for scheduling, templates, and reports."
          }
          confirmLabel={modal.mode === "edit" ? "Save changes" : "Create team"}
          hideFooter
          onClose={close}
          onConfirm={() => {}}
        >
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="team-name"
                className="block text-xs font-medium text-ink-muted"
              >
                Team name
              </label>
              <input
                id="team-name"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Front of House"
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="team-desc"
                className="block text-xs font-medium text-ink-muted"
              >
                Description{" "}
                <span className="font-normal text-ink-subtle">(optional)</span>
              </label>
              <textarea
                id="team-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this team do?"
                rows={2}
                className="mt-1.5 w-full resize-none rounded-lg border border-hairline bg-surface-3 px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
              />
            </div>
            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={close}
                className="h-8 rounded-lg border border-hairline bg-surface-3 px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
              >
                {modal.mode === "edit" ? "Save changes" : "Create team"}
              </button>
            </div>
          </form>
        </Modal>
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
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2600);
          }}
        />
      )}
    </div>
  );
}