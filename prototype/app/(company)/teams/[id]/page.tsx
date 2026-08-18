"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCompany } from "@/lib/company-data";
import { formatDate, initials } from "@/lib/format";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronDownIcon,
  ListIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/ui/icons";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

const selectClass =
  "mt-1.5 h-9 w-full appearance-none rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none";

const statusStyles: Record<string, string> = {
  active: "border-success/25 bg-success-weak text-success",
  invited: "border-primary/25 bg-primary-weak text-primary",
  inactive: "border-hairline bg-surface-3 text-ink-subtle",
};

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { teams, people, locations, updateTeam, deleteTeam } = useCompany();

  const team = teams.find((t) => t.id === params.id);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locationId, setLocationId] = useState<string | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const locationName = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of locations) map.set(l.id, l.name);
    return map;
  }, [locations]);

  const managerName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of people) map.set(p.id, p.name);
    return map;
  }, [people]);

  const managers = useMemo(
    () => people.filter((p) => p.role === "manager"),
    [people],
  );

  const members = useMemo(
    () => people.filter((p) => team && p.teamIds.includes(team.id)),
    [people, team?.id],
  );

  if (!team) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <ListIcon className="size-10 text-ink-faint" />
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

  const openEdit = () => {
    setName(team.name);
    setDescription(team.description ?? "");
    setLocationId(team.locationId);
    setManagerId(team.managerId);
    setError(null);
    setEditing(true);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const ok = await updateTeam(team.id, {
      name,
      description: description || undefined,
      locationId,
      managerId,
    });
    if (!ok) {
      setError("Team names can't be empty or duplicate an existing team.");
      return;
    }
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div>
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeftIcon className="size-4" />
        Teams
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <ListIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {team.name}
            </h1>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {team.locationId
                ? (locationName.get(team.locationId) ?? "Unassigned location")
                : "No location assigned"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="rounded-lg border border-success/25 bg-success-weak px-2.5 py-1.5 text-xs font-medium text-success">
              Saved
            </span>
          )}
          <Link
            href={`/teams/${team.id}/schedule`}
            className="flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
          >
            <CalendarIcon className="size-3.5" />
            Schedule
          </Link>
          <button
            onClick={openEdit}
            className="flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
          >
            <PencilIcon className="size-3.5" />
            Edit
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3.5 text-[13px] font-medium text-ink-muted transition-colors hover:border-danger/40 hover:text-danger"
          >
            <TrashIcon className="size-3.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Members"
          value={members.length}
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Active"
          value={members.filter((p) => p.status === "active").length}
          tone="primary"
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Invited"
          value={members.filter((p) => p.status === "invited").length}
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Inactive"
          value={members.filter((p) => p.status === "inactive").length}
          icon={<UsersIcon className="size-4" />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="h-fit rounded-xl border border-hairline bg-surface-2">
          <p className="border-b border-hairline px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
            Team details
          </p>
          <dl className="divide-y divide-hairline/60 px-4">
            {[
              ["Description", team.description || "—"],
              [
                "Manager",
                team.managerId
                  ? (managerName.get(team.managerId) ?? "—")
                  : "Unassigned",
              ],
              [
                "Location",
                team.locationId
                  ? (locationName.get(team.locationId) ?? "—")
                  : "Unassigned",
              ],
              ["Created", formatDate(team.createdAt)],
              ["Team ID", team.id],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-xs text-ink-subtle">{k}</dt>
                <dd
                  className={`text-[13px] text-ink-muted ${
                    k === "Team ID" ? "font-mono text-[11px]" : ""
                  }`}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <p className="border-b border-hairline px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
            Members
          </p>
          {members.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-ink-muted">
              Nobody is on this team yet.
            </p>
          ) : (
            <ul className="divide-y divide-hairline/60">
              {members.map((person) => (
                <li key={person.id}>
                  <Link
                    href={`/people/${person.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-3/70"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[11px] font-semibold text-ink">
                      {initials(person.name) || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {person.name}
                      </p>
                      <p className="truncate text-xs text-ink-subtle">
                        {person.email}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusStyles[person.status]}`}
                    >
                      {person.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editing && (
        <Modal
          open
          title="Edit team"
          description="Update the team name or description."
          confirmLabel="Save changes"
          hideFooter
          onClose={() => setEditing(false)}
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
            <div>
              <label
                htmlFor="team-manager"
                className="block text-xs font-medium text-ink-muted"
              >
                Team manager
              </label>
              <div className="relative">
                <select
                  id="team-manager"
                  value={managerId ?? ""}
                  onChange={(e) => setManagerId(e.target.value || null)}
                  className={selectClass}
                >
                  <option value="">Unassigned</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
              </div>
              {managers.length === 0 && (
                <p className="mt-1 text-[11px] text-ink-subtle">
                  No people with the manager role yet — invite one from People.
                </p>
              )}
            </div>
            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-8 rounded-lg border border-hairline bg-surface-3 px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Save changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      <Modal
        open={confirmDelete}
        tone="danger"
        title={`Delete ${team.name}?`}
        description={
          members.length > 0
            ? `${members.length} ${members.length === 1 ? "person" : "people"} on this team will become unassigned. This can't be undone.`
            : "This team will be removed. This can't be undone."
        }
        confirmLabel="Delete team"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteTeam(team.id);
          router.push("/teams");
        }}
      />
    </div>
  );
}
