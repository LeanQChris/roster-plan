"use client";

import { useMemo, useState } from "react";
import { RRule } from "rrule";
import type { ShiftTemplate } from "@/lib/company-data";
import Pagination from "@/components/ui/Pagination";
import {
  ClockIcon,
  EyeIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/ui/icons";

const PAGE_SIZE = 10;

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function describeRecurrence(rruleString: string): string {
  try {
    return RRule.fromString(rruleString).toText();
  } catch {
    return "—";
  }
}

const activeStyles: Record<string, string> = {
  true: "border-success/25 bg-success-weak text-success",
  false: "border-hairline bg-surface-3 text-ink-subtle",
};

interface ShiftTemplateTableProps {
  templates: ShiftTemplate[];
  showTeam?: boolean;
  teamNameMap?: Record<string, string>;
  onEdit: (template: ShiftTemplate) => void;
  onDelete: (template: ShiftTemplate) => void;
  onPreview: (template: ShiftTemplate) => void;
}

export default function ShiftTemplateTable({
  templates,
  showTeam,
  teamNameMap,
  onEdit,
  onDelete,
  onPreview,
}: ShiftTemplateTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }, [templates, search]);

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
          {filtered.length} {filtered.length === 1 ? "template" : "templates"}
        </p>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-subtle" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search templates…"
            className="h-8 w-48 rounded-lg border border-hairline bg-surface-2 pl-8 pr-3 text-xs text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <p className="text-[13px] font-medium text-ink">No templates found</p>
          <p className="mt-1 text-xs text-ink-muted">
            {search ? "Try a different search term." : "Create your first shift template to get started."}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {(showTeam ? ["Title", "Team", "Time", "Duration", "Staff", "Recurrence", "Active"] : ["Title", "Time", "Duration", "Staff", "Recurrence", "Active"]).map(
                    (h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle"
                      >
                        {h}
                      </th>
                    ),
                  )}
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {paged.map((template) => (
                  <tr
                    key={template.id}
                    className="group border-b border-hairline/60 transition-colors last:border-b-0 hover:bg-surface-3/70"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
                          <ClockIcon className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-ink">
                            {template.title}
                          </p>
                          {template.description && (
                            <p className="truncate text-[11px] text-ink-subtle">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {showTeam && (
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                        {teamNameMap?.[template.teamId] ?? "—"}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                      {template.startTime}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {formatDuration(template.durationMinutes)}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {template.requiredCount}
                      {template.maxCount ? ` / ${template.maxCount}` : ""}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-xs text-ink-muted">
                      <span className="line-clamp-1">
                        {template.recurrenceRule
                          ? describeRecurrence(template.recurrenceRule)
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${activeStyles[String(template.isActive)]}`}
                      >
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onPreview(template)}
                          aria-label={`Preview ${template.title}`}
                          title="Preview shifts"
                          className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
                        >
                          <EyeIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(template)}
                          aria-label={`Edit ${template.title}`}
                          className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
                        >
                          <PencilIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(template)}
                          aria-label={`Delete ${template.title}`}
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
    </>
  );
}
