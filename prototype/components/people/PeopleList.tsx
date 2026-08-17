"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Location, Person, Team } from "@/lib/company-data";
import { initials } from "@/lib/format";
import Pagination from "@/components/ui/Pagination";
import {
  ChevronDownIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { PersonRoleBadge, PersonStatusBadge } from "./PersonBadges";

const PAGE_SIZE = 10;

const selectClass =
  "appearance-none rounded-lg border border-hairline bg-surface-2 py-2 pl-3 pr-8 text-xs text-ink transition-colors focus:border-primary/60 focus:outline-none";

interface PeopleListProps {
  people: Person[];
  teams: Team[];
  locations: Location[];
  onInvite: () => void;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onResend: (person: Person) => void;
}

export default function PeopleList({
  people,
  teams,
  locations,
  onInvite,
  onEdit,
  onDelete,
  onResend,
}: PeopleListProps) {
  const [teamFilter, setTeamFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const teamName = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teams) map.set(t.id, t.name);
    return map;
  }, [teams]);

  const locationName = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of locations) map.set(l.id, l.name);
    return map;
  }, [locations]);

  const filtered = useMemo(() => {
    let list = people;
    if (teamFilter === "unassigned") list = list.filter((p) => p.teamIds.length === 0);
    else if (teamFilter !== "all")
      list = list.filter((p) => p.teamIds.includes(teamFilter));

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.phone ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [people, teamFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  return (
    <>
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {filtered.length} {filtered.length === 1 ? "person" : "people"}
          {teamFilter !== "all" && teamFilter !== "unassigned"
            ? ` in ${teamName.get(teamFilter) ?? "this team"}`
            : teamFilter === "unassigned"
              ? " unassigned"
              : " in the company"}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-subtle" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search people…"
              className="h-8 w-48 rounded-lg border border-hairline bg-surface-2 pl-8 pr-3 text-xs text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={teamFilter}
              onChange={(e) => {
                setTeamFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by team"
              className={selectClass}
            >
              <option value="all">All teams</option>
              <option value="unassigned">Unassigned</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-subtle" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <UsersIcon className="size-5" />
          </span>
          <h2 className="mt-3 text-[15px] font-semibold text-ink">
            No people here
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Nobody is in this group yet. Invite someone or adjust the filter.
          </p>
          <button
            type="button"
            onClick={onInvite}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <MailIcon className="size-3.5" />
            Invite people
          </button>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <ul className="divide-y divide-hairline">
            {paged.map((person) => (
              <li
                key={person.id}
                className="group flex items-center gap-3 px-4 py-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[11px] font-semibold text-ink">
                  {initials(person.name) || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/people/${person.id}`}
                      className="truncate text-[13px] font-medium text-ink hover:text-primary"
                    >
                      {person.name}
                    </Link>
                    <PersonRoleBadge role={person.role} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {person.email}
                    {person.phone ? ` · ${person.phone}` : ""}
                  </p>
                </div>
                <span className="hidden shrink-0 text-xs text-ink-subtle sm:block">
                  {person.teamIds.length > 0
                    ? person.teamIds.map((id) => teamName.get(id) ?? "—").join(", ")
                    : "Unassigned"}
                </span>
                {person.locationId && (
                  <span className="hidden shrink-0 items-center gap-1 text-xs text-ink-subtle lg:flex">
                    <MapPinIcon className="size-3.5" />
                    {locationName.get(person.locationId) ?? "—"}
                  </span>
                )}
                <span className="hidden shrink-0 text-xs text-ink-faint md:block">
                  {person.timezone.replace(/_/g, " ")}
                </span>
                <PersonStatusBadge status={person.status} />
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {person.status === "invited" && (
                    <button
                      type="button"
                      onClick={() => onResend(person)}
                      title="Resend invite"
                      aria-label={`Resend invite to ${person.name}`}
                      className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
                    >
                      <MailIcon className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEdit(person)}
                    title="Edit person"
                    aria-label={`Edit ${person.name}`}
                    className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(person)}
                    title="Remove person"
                    aria-label={`Remove ${person.name}`}
                    className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-danger"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </div>
      )}
    </>
  );
}