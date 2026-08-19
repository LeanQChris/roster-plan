"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAdmin } from "@/lib/store";
import { formatCount, formatDate } from "@/lib/format";
import { CompanyAvatar, StatusBadge } from "@/components/ui/badges";
import Menu from "@/components/ui/Menu";
import StatCard from "@/components/ui/StatCard";
import {
  ActivityIcon,
  BuildingIcon,
  ChevronRightIcon,
  ClockIcon,
  DownloadIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/ui/icons";

type StatusFilter = "all" | "active" | "suspended";
type SortKey = "name" | "created" | "members";

const STATUS_OPTIONS = [
  { value: "all" as const, label: "All" },
  { value: "active" as const, label: "Active" },
  { value: "suspended" as const, label: "Suspended" },
];

const SORT_OPTIONS = [
  { value: "name" as const, label: "Name" },
  { value: "created" as const, label: "Recently added", hint: "default" },
  { value: "members" as const, label: "Most members" },
];

export default function CompaniesPage() {
  const { companies, loading, pushToast } = useAdmin();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("created");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = companies.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
      );
    });
    rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "members") return b.members - a.members;
      return b.createdAt.localeCompare(a.createdAt);
    });
    return rows;
  }, [companies, query, status, sort]);

  const activeCount = companies.filter((c) => c.status === "active").length;
  const suspendedCount = companies.length - activeCount;
  const memberTotal = companies.reduce((sum, c) => sum + c.members, 0);

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-ink-muted">
        Loading companies…
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Companies
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage workspaces on the Roster platform. Actions are recorded to
            the audit log.
          </p>
        </div>
        <button
          onClick={() =>
            pushToast({
              tone: "neutral",
              message: "Export started",
              detail: "company-registry.csv will download shortly",
            })
          }
          className="flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
        >
          <DownloadIcon className="size-3.5" />
          Export
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total companies"
          value={formatCount(companies.length)}
          icon={<BuildingIcon className="size-4" />}
        />
        <StatCard
          label="Active"
          value={formatCount(activeCount)}
          tone="success"
          icon={<ActivityIcon className="size-4" />}
          sub={`${formatCount(suspendedCount)} suspended`}
        />
        <StatCard
          label="Total members"
          value={formatCount(memberTotal)}
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Shifts this week"
          value={formatCount(
            companies.reduce((sum, c) => sum + c.shifts, 0),
          )}
          icon={<ClockIcon className="size-4" />}
          sub="across published schedules"
        />
      </div>

      <div className="mt-8 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies…"
            className="h-8 w-full rounded-lg border border-hairline bg-surface-2 pl-8.5 pr-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
          />
        </div>
        <Menu<StatusFilter>
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={setStatus}
        />
        <Menu<SortKey>
          value={sort}
          options={SORT_OPTIONS}
          onChange={setSort}
        />
        <span className="ml-auto text-xs text-ink-subtle">
          {filtered.length} of {companies.length} companies
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-surface-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline">
                {[
                  "Company",
                  "Status",
                  "Members",
                  "Teams",
                  "Shifts / week",
                  "Plan",
                  "Added",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle"
                  >
                    {h}
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="group cursor-pointer border-b border-hairline/60 transition-colors last:border-b-0 hover:bg-surface-3/70"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/companies/${c.id}`}
                      className="flex items-center gap-3"
                    >
                      <CompanyAvatar name={c.name} color={c.color} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {c.name}
                        </span>
                        <span className="block truncate font-mono text-[11px] text-ink-subtle">
                          {c.slug}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink-muted tabular-nums">
                    {formatCount(c.members)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink-muted tabular-nums">
                    {formatCount(c.teams)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink-muted tabular-nums">
                    {formatCount(c.shifts)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] text-ink-muted capitalize">
                      {c.plan}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-ink-muted">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-2 py-3">
                    <Link
                      href={`/admin/companies/${c.id}`}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-ink-faint opacity-0 transition-all group-hover:text-ink-muted group-hover:opacity-100 hover:bg-surface-4 hover:text-ink"
                    >
                      <ChevronRightIcon className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <ShieldIcon className="size-8 text-ink-faint" />
            <p className="text-sm font-medium text-ink">No companies found</p>
            <p className="text-[13px] text-ink-muted">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}