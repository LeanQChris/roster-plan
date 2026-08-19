"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAdmin } from "@/lib/store";
import { formatCount, formatDate, formatDateTime, timeAgo } from "@/lib/format";
import { CompanyAvatar, StatusBadge } from "@/components/ui/badges";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  BuildingIcon,
  ClockIcon,
  PauseIcon,
  PlayIcon,
  ShieldIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/ui/icons";

const actionTone: Record<string, string> = {
  "company.suspended": "danger",
  "company.activated": "success",
  "company.deleted": "danger",
  "company.registration": "neutral",
  "shift.published": "success",
  "person.erased": "danger",
  "team.deleted": "danger",
  "shift.deleted": "danger",
  "shift.assigned": "neutral",
  "person.invited": "neutral",
  "clock.import": "success",
};

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const { companies, audit, setCompanyStatus, deleteCompany, pushToast } = useAdmin();

  const company = companies.find((c) => c.id === params.id);
  const [confirm, setConfirm] = useState<null | "suspend" | "activate" | "delete">(null);

  if (!company) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <BuildingIcon className="size-10 text-ink-faint" />
        <p className="text-sm font-medium text-ink">Company not found</p>
        <p className="text-[13px] text-ink-muted">
          It may have been deleted, or the link is incorrect.
        </p>
        <Link
          href="/admin"
          className="mt-2 flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
        >
          <ArrowLeftIcon className="size-4" />
          Back to companies
        </Link>
      </div>
    );
  }

  const suspended = company.status === "suspended";
  const companyAudit = audit
    .filter((a) => a.companyId === company.id)
    .slice(0, 6);

  const run = async (action: "suspend" | "activate") => {
    const status = action === "suspend" ? "suspended" : "active";
    const result = await setCompanyStatus(company.id, status);
    if (!result.ok) {
      pushToast({ tone: "danger", message: "Failed", detail: result.error });
      return;
    }
    pushToast({
      tone: action === "suspend" ? "danger" : "success",
      message:
        action === "suspend"
          ? `${company.name} suspended`
          : `${company.name} activated`,
      detail:
        action === "suspend"
          ? "All users lose access until reactivated"
          : "Users can sign in again",
    });
    setConfirm(null);
  };

  const runDelete = async () => {
    const result = await deleteCompany(company.id);
    if (!result.ok) {
      pushToast({ tone: "danger", message: "Failed", detail: result.error });
      return;
    }
    pushToast({
      tone: "danger",
      message: `${company.name} deleted`,
      detail: "Record preserved in audit log",
    });
    setConfirm(null);
  };

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeftIcon className="size-4" />
        Companies
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <CompanyAvatar name={company.name} color={company.color} size="lg" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                {company.name}
              </h1>
              <StatusBadge status={company.status} />
            </div>
            <p className="mt-0.5 font-mono text-xs text-ink-subtle">
              {company.slug} · {company.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {suspended ? (
            <button
              onClick={() => setConfirm("activate")}
              className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <PlayIcon className="size-3.5" />
              Activate
            </button>
          ) : (
            <button
              onClick={() => setConfirm("suspend")}
              className="flex h-8 items-center gap-2 rounded-lg border border-danger/30 bg-danger-weak px-3.5 text-[13px] font-medium text-danger transition-colors hover:bg-danger hover:text-white"
            >
              <PauseIcon className="size-3.5" />
              Suspend
            </button>
          )}
          <button
            onClick={() => setConfirm("delete")}
            className="flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3.5 text-[13px] font-medium text-ink-muted transition-colors hover:border-danger/40 hover:text-danger"
          >
            <TrashIcon className="size-3.5" />
            Delete
          </button>
        </div>
      </div>

      {suspended && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-weak px-4 py-3">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
          <div>
            <p className="text-[13px] font-medium text-ink">
              This company is suspended
            </p>
            <p className="mt-0.5 text-[13px] leading-5 text-ink-muted">
              All members are locked out. Activate to restore access — or
              delete to permanently remove the workspace.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Members"
          value={formatCount(company.members)}
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Teams"
          value={formatCount(company.teams)}
          icon={<BuildingIcon className="size-4" />}
        />
        <StatCard
          label="Managers"
          value={formatCount(company.managers)}
          icon={<ShieldIcon className="size-4" />}
        />
        <StatCard
          label="Shifts / week"
          value={formatCount(company.shifts)}
          tone={company.shifts === 0 ? "danger" : "default"}
          icon={<ClockIcon className="size-4" />}
          sub={company.shifts === 0 ? "nothing published" : "published"}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="h-fit rounded-xl border border-hairline bg-surface-2">
          <p className="border-b border-hairline px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
            Workspace details
          </p>
          <dl className="divide-y divide-hairline/60 px-4">
            {[
              ["Plan", company.plan],
              ["Contact email", company.contactEmail ?? "—"],
              ["Slug", company.slug],
              ["Company ID", company.id],
              ["Created", formatDate(company.createdAt)],
              ["Last activity", timeAgo(company.updatedAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-xs text-ink-subtle">{k}</dt>
                <dd
                  className={`text-[13px] capitalize text-ink-muted ${
                    k === "Slug" || k === "Company ID"
                      ? "font-mono text-[11px] normal-case"
                      : ""
                  }`}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
              Recent activity
            </p>
            <Link
              href={`/admin/audit-log?company=${company.id}`}
              className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
            >
              View audit log
            </Link>
          </div>
          {companyAudit.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-ink-muted">
              No events recorded for this company yet.
            </p>
          ) : (
            <ul className="divide-y divide-hairline/60">
              {companyAudit.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={`mt-0.5 size-1.5 shrink-0 rounded-full ${
                      actionTone[a.action] === "danger"
                        ? "bg-danger"
                        : actionTone[a.action] === "success"
                          ? "bg-success"
                          : "bg-ink-subtle"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink">
                      <span className="font-medium">{a.resource}</span>
                    </p>
                    <p className="truncate font-mono text-[11px] text-ink-subtle">
                      {a.action} · {a.resourceId}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-ink-muted">
                      {formatDateTime(a.timestamp)}
                    </p>
                    <p className="text-[11px] text-ink-subtle">
                      {a.actorRole} · {a.ip}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={confirm === "suspend"}
        tone="danger"
        title={`Suspend ${company.name}?`}
        description="All members will immediately lose access to schedules, shifts, and the clock. You can reactivate the company at any time."
        confirmLabel="Suspend company"
        onConfirm={() => run("suspend")}
        onClose={() => setConfirm(null)}
      />
      <Modal
        open={confirm === "activate"}
        tone="primary"
        title={`Activate ${company.name}?`}
        description="Members will be able to sign in and use the platform again. No data is lost during a suspension."
        confirmLabel="Activate company"
        onConfirm={() => run("activate")}
        onClose={() => setConfirm(null)}
      />
      <Modal
        open={confirm === "delete"}
        tone="danger"
        title={`Delete ${company.name}?`}
        description="This permanently deletes the workspace and all its data. This can't be undone."
        confirmLabel="Delete company"
        onConfirm={runDelete}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}