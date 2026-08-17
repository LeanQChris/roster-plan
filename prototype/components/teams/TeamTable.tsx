"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Person, Team } from "@/lib/company-data";
import { formatDate } from "@/lib/format";
import Pagination from "@/components/ui/Pagination";
import {
  ListIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/ui/icons";

const PAGE_SIZE = 10;

interface TeamTableProps {
  teams: Team[];
  people: Person[];
  locationName: Map<string, string>;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export default function TeamTable({
  teams,
  people,
  locationName,
  onEdit,
  onDelete,
}: TeamTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const memberCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of people) {
      for (const teamId of p.teamIds) {
        counts.set(teamId, (counts.get(teamId) ?? 0) + 1);
      }
    }
    return counts;
  }, [people]);

  const managerName = useMemo(() => {
    const names = new Map<string, string>();
    for (const p of people) names.set(p.id, p.name);
    return names;
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

  return (
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
          <p className="mt-1 text-xs text-ink-muted">Try a different search term.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {["Name", "Description", "Manager", "Members", "Location", "Created"].map(
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
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-ink">
                        {team.managerId ? managerName.get(team.managerId) ?? "—" : "—"}
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
                            onClick={() => onEdit(team)}
                            aria-label={`Edit ${team.name}`}
                            className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
                          >
                            <PencilIcon className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(team)}
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
  );
}