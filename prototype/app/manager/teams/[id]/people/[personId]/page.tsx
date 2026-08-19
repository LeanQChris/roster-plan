"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCompany } from "@/lib/company-data";
import { formatDate, formatDateTime, initials, timeAgo } from "@/lib/format";
import { PersonStatusBadge } from "@/components/people/PersonBadges";
import {
  ArrowLeftIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { useTeamDetail } from "../../team-detail-context";

const activityLabel: Record<string, string> = {
  invited: "Invited",
  updated: "Updated",
  resent: "Invite resent",
  notified: "Notification",
};

export default function ManagerTeamMemberDetailPage() {
  const params = useParams<{ id: string; personId: string }>();
  const { locations, activity, clockEntries, resendInvite } = useCompany();
  const { team, teamPeople } = useTeamDetail();
  const [resendError, setResendError] = useState<string | null>(null);

  const person = teamPeople.find((p) => p.id === params.personId);

  const handleResend = async () => {
    if (!person) return;
    const result = await resendInvite(person.id);
    if (!result.ok) {
      setResendError(result.error ?? "Couldn't resend invite.");
      window.setTimeout(() => setResendError(null), 4000);
    }
  };

  const personActivity = useMemo(
    () => activity.filter((a) => a.personId === params.personId),
    [activity, params.personId],
  );

  const personClockLogs = useMemo(
    () =>
      clockEntries
        .filter((c) => c.personId === params.personId)
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 5),
    [clockEntries, params.personId],
  );

  if (!person) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <UsersIcon className="size-10 text-ink-faint" />
        <p className="text-sm font-medium text-ink">Person not found</p>
        <p className="text-[13px] text-ink-muted">
          They may have been removed, or the link is incorrect.
        </p>
        <Link
          href={`/manager/teams/${team.id}`}
          className="mt-2 flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
        >
          <ArrowLeftIcon className="size-4" />
          Back to team
        </Link>
      </div>
    );
  }

  const location = person.locationId
    ? locations.find((l) => l.id === person.locationId)
    : null;

  return (
    <div>
      <Link
        href={`/manager/teams/${team.id}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeftIcon className="size-4" />
        Members
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[13px] font-semibold text-ink">
            {initials(person.name) || "?"}
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                {person.name}
              </h1>
              <PersonStatusBadge status={person.status} />
            </div>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {person.email} · {person.role === "manager" ? "Manager" : "Employee"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {resendError && (
            <span className="rounded-lg border border-danger/30 bg-danger-weak px-2.5 py-1.5 text-xs font-medium text-danger">
              {resendError}
            </span>
          )}
          {person.status === "invited" && (
            <button
              onClick={handleResend}
              className="flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
            >
              <MailIcon className="size-3.5" />
              Resend invite
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="h-fit rounded-xl border border-hairline bg-surface-2">
          <p className="border-b border-hairline px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
            Contact details
          </p>
          <dl className="divide-y divide-hairline/60 px-4">
            {[
              ["Email", person.email],
              ["Phone", person.phone || "—"],
              ["Timezone", person.timezone.replace(/_/g, " ")],
              ["Tenure", timeAgo(person.createdAt)],
              ["Created", formatDate(person.createdAt)],
              ["Updated", formatDate(person.updatedAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-xs text-ink-subtle">{k}</dt>
                <dd className="truncate text-[13px] text-ink-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2">
            <p className="border-b border-hairline px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
              Notes
            </p>
            <div className="px-4 py-3">
              {person.notes ? (
                <p className="whitespace-pre-wrap text-[13px] text-ink-muted">
                  {person.notes}
                </p>
              ) : (
                <p className="text-[13px] text-ink-subtle">No notes yet.</p>
              )}
            </div>
          </div>

          {location ? (
            <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2">
              <p className="border-b border-hairline px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                Location
              </p>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
                  <MapPinIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {location.name}
                  </p>
                  <p className="truncate text-xs text-ink-subtle">
                    {[location.city, location.state, location.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2">
            <p className="border-b border-hairline px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
              Activity
            </p>
            {personActivity.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-ink-muted">
                No activity recorded yet.
              </p>
            ) : (
              <ul className="divide-y divide-hairline/60">
                {personActivity.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-4 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {activityLabel[a.action] ?? a.action}
                      </p>
                      <p className="truncate text-xs text-ink-subtle">
                        {a.message}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-subtle">
                      {formatDateTime(a.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-surface-2">
        <p className="border-b border-hairline px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
          Time clock logs
        </p>
        {personClockLogs.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-ink-muted">
            No clock entries recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-hairline/60">
            {personClockLogs.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 px-4 py-2.5"
              >
                <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                  <ClockIcon className="size-3.5 text-ink-subtle" />
                  {c.action === "in" ? "Clocked in" : "Clocked out"}
                </span>
                <span className="text-xs text-ink-subtle">
                  {formatDateTime(c.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
