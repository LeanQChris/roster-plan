"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useCompany } from "@/lib/company-data";
import type { Team } from "@/lib/company-data";
import { formatDate } from "@/lib/format";
import Modal from "@/components/admin/Modal";
import Pagination from "@/components/admin/Pagination";
import StatCard from "@/components/admin/StatCard";
import {
  ChevronDownIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/admin/icons";

const PAGE_SIZE = 10;

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

const selectClass =
  "mt-1.5 h-9 w-full appearance-none rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none";

type TeamModalState =
  | { mode: "create" }
  | { mode: "edit"; team: Team }
  | null;

export default function TeamsPage() {
  const { teams, people, locations, createTeam, updateTeam, deleteTeam } =
    useCompany();
  const [modal, setModal] = useState<TeamModalState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Team | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locationId, setLocationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const locationName = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of locations) map.set(l.id, l.name);
    return map;
  }, [locations]);

  const memberCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of people) {
      if (!p.teamId) continue;
      counts.set(p.teamId, (counts.get(p.teamId) ?? 0) + 1);
    }
    return counts;
  }, [people]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }, [teams, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const openCreate = () => {
    setName("");
    setDescription("");
    setLocationId(null);
    setError(null);
    setModal({ mode: "create" });
  };

  const openEdit = (team: Team) => {
    setName(team.name);
    setDescription(team.description ?? "");
    setLocationId(team.locationId);
    setError(null);
    setModal({ mode: "edit", team });
  };

  const close = () => setModal(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (modal?.mode === "edit") {
      if (
        !updateTeam(modal.team.id, {
          name,
          description: description || undefined,
          locationId,
        })
      ) {
        setError("Team names can't be empty or duplicate an existing team.");
        return;
      }
    } else {
      if (!createTeam(name, description, locationId)) {
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
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              {filtered.length} {filtered.length === 1 ? "team" : "teams"}
            </p>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-subtle" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search teams…"
                className="h-8 w-48 rounded-lg border border-hairline bg-surface-2 pl-8 pr-3 text-xs text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <p className="text-[13px] font-medium text-ink">No teams found</p>
          <p className="mt-1 text-xs text-ink-muted">
            Try a different search term.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {["Name", "Description", "Members", "Location", "Created"].map(
                    (h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle"
                      >
                        {h}
                      </th>
                    ),
                  )}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {paged.map((team) => {
                  const members = memberCount.get(team.id) ?? 0;
                  return (
                    <tr
                      key={team.id}
                      className="group border-b border-hairline/60 transition-colors last:border-b-0 hover:bg-surface-3/70"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/teams/${team.id}`}
                          className="flex items-center gap-2 text-[13px] font-medium text-ink hover:text-primary"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
                            <ListIcon className="size-3.5" />
                          </span>
                          {team.name}
                        </Link>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-xs text-ink-muted">
                        <span className="line-clamp-2">
                          {team.description || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted">
                        {members}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted">
                        {team.locationId
                          ? locationName.get(team.locationId) ?? "—"
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-subtle">
                        {formatDate(team.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </div>
      )}
        </>
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
            <div>
              <label
                htmlFor="team-location"
                className="block text-xs font-medium text-ink-muted"
              >
                Location
              </label>
              <div className="relative">
                <select
                  id="team-location"
                  value={locationId ?? ""}
                  onChange={(e) => setLocationId(e.target.value || null)}
                  className={selectClass}
                >
                  <option value="">Unassigned</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
              </div>
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