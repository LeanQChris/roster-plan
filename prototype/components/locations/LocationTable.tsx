"use client";

import { useMemo, useState } from "react";
import type { Location } from "@/lib/company-data";
import Pagination from "@/components/ui/Pagination";
import {
  MapPinIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/ui/icons";

const PAGE_SIZE = 10;

function locationSummary(l: Location): string {
  return [l.city, l.state, l.country].filter(Boolean).join(", ");
}

interface LocationTableProps {
  locations: Location[];
  teamCount: Map<string, number>;
  peopleCount: Map<string, number>;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
}

export default function LocationTable({
  locations,
  teamCount,
  peopleCount,
  onEdit,
  onDelete,
}: LocationTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.description ?? "").toLowerCase().includes(q) ||
        locationSummary(l).toLowerCase().includes(q),
    );
  }, [locations, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  return (
    <div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {filtered.length} {filtered.length === 1 ? "location" : "locations"}
        </p>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-subtle" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search locations…"
            className="h-8 w-48 rounded-lg border border-hairline bg-surface-2 pl-8 pr-3 text-xs text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <p className="text-[13px] font-medium text-ink">No locations found</p>
          <p className="mt-1 text-xs text-ink-muted">Try a different search term.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {["Name", "Description", "Teams", "Peoples", "Address", "Status"].map(
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
                {paged.map((location) => (
                  <tr
                    key={location.id}
                    className="group border-b border-hairline/60 transition-colors last:border-b-0 hover:bg-surface-3/70"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
                          <MapPinIcon className="size-3.5" />
                        </span>
                        {location.name}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-ink-muted">
                      <span className="line-clamp-2">
                        {location.description || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {teamCount.get(location.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {peopleCount.get(location.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {locationSummary(location) || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                          location.active
                            ? "border-success/25 bg-success-weak text-success"
                            : "border-hairline bg-surface-3 text-ink-subtle"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${location.active ? "bg-success" : "bg-ink-subtle"}`}
                        />
                        {location.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onEdit(location)}
                          aria-label={`Edit ${location.name}`}
                          className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
                        >
                          <PencilIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(location)}
                          aria-label={`Delete ${location.name}`}
                          className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-danger"
                        >
                          <TrashIcon className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}