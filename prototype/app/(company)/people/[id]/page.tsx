"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCompany } from "@/lib/company-data";
import type { Person, PersonRole } from "@/lib/company-data";
import { DEFAULT_TIMEZONE, TIMEZONES } from "@/lib/company";
import { formatDate, formatDateTime, initials, timeAgo } from "@/lib/format";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";
import TeamMultiSelect from "@/components/people/TeamMultiSelect";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ClockIcon,
  ListIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/ui/icons";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

const selectClass =
  "mt-1.5 h-9 w-full appearance-none rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none";

const statusStyles: Record<Person["status"], string> = {
  active: "border-success/25 bg-success-weak text-success",
  invited: "border-primary/25 bg-primary-weak text-primary",
  inactive: "border-hairline bg-surface-3 text-ink-subtle",
};

const statusLabel: Record<Person["status"], string> = {
  active: "Active",
  invited: "Invited",
  inactive: "Inactive",
};

interface EditForm {
  name: string;
  phone: string;
  role: PersonRole;
  teamIds: string[];
  locationId: string | null;
  timezone: string;
  notes: string;
}

const activityLabel: Record<string, string> = {
  invited: "Invited",
  updated: "Updated",
  resent: "Invite resent",
  notified: "Notification",
};

export default function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    teams,
    people,
    locations,
    activity,
    clockEntries,
    updatePerson,
    resendInvite,
    deletePerson,
  } = useCompany();

  const person = people.find((p) => p.id === params.id);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<EditForm>({
    name: "",
    phone: "",
    role: "employee",
    teamIds: [],
    locationId: null,
    timezone: DEFAULT_TIMEZONE,
    notes: "",
  });
  const [saved, setSaved] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const personActivity = useMemo(
    () => activity.filter((a) => a.personId === params.id),
    [activity, params.id],
  );

  const personClockLogs = useMemo(
    () =>
      clockEntries
        .filter((c) => c.personId === params.id)
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 5),
    [clockEntries, params.id],
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
          href="/people"
          className="mt-2 flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
        >
          <ArrowLeftIcon className="size-4" />
          Back to people
        </Link>
      </div>
    );
  }

  const personTeams = teams.filter((t) => person.teamIds.includes(t.id));
  const location = person.locationId
    ? locations.find((l) => l.id === person.locationId)
    : null;

  const openEdit = () => {
    setForm({
      name: person.name,
      phone: person.phone ?? "",
      role: person.role,
      teamIds: person.teamIds,
      locationId: person.locationId,
      timezone: person.timezone,
      notes: person.notes ?? "",
    });
    setEditing(true);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updatePerson(person.id, {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      role: form.role,
      teamIds: form.teamIds,
      locationId: form.locationId,
      timezone: form.timezone,
      notes: form.notes.trim() || undefined,
    });
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const handleResend = async () => {
    const result = await resendInvite(person.id);
    if (!result.ok) {
      setResendError(result.error ?? "Couldn't resend invite.");
      window.setTimeout(() => setResendError(null), 4000);
    }
  };

  return (
    <div>
      <Link
        href="/people"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeftIcon className="size-4" />
        People
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
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusStyles[person.status]}`}
              >
                {statusLabel[person.status]}
              </span>
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
          {saved && (
            <span className="rounded-lg border border-success/25 bg-success-weak px-2.5 py-1.5 text-xs font-medium text-success">
              Saved
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
            Remove
          </button>
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
                <p className="text-[13px] text-ink-subtle">
                  No notes yet. Add context about this person from the edit form.
                </p>
              )}
            </div>
          </div>

          <StatCard
            label="Teams"
            value={
              personTeams.length > 0
                ? personTeams.map((t) => t.name).join(", ")
                : "Unassigned"
            }
            icon={<ListIcon className="size-4" />}
            sub={
              personTeams.length > 0
                ? `${personTeams.length} team${personTeams.length === 1 ? "" : "s"}`
                : "no team yet"
            }
          />

          {personTeams.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2">
              <p className="border-b border-hairline px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                Teams
              </p>
              <div className="divide-y divide-hairline/60">
                {personTeams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-3/70"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
                      <ListIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {team.name}
                      </p>
                      <p className="truncate text-xs text-ink-subtle">
                        {team.description || "View team"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-hairline bg-surface-2 px-4 py-6 text-center text-[13px] text-ink-muted">
              Not assigned to a team yet.
            </div>
          )}

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
        <div className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
            Time clock logs
          </p>
          <Link
            href={`/time-tracking?person=${person.id}`}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
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

      {editing && (
        <Modal
          open
          title="Edit person"
          description="Update team, role, and contact details."
          confirmLabel="Save changes"
          hideFooter
          onClose={() => setEditing(false)}
          onConfirm={() => {}}
        >
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="person-name"
                className="block text-xs font-medium text-ink-muted"
              >
                Full name
              </label>
              <input
                id="person-name"
                type="text"
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="person-phone"
                  className="block text-xs font-medium text-ink-muted"
                >
                  Phone{" "}
                  <span className="font-normal text-ink-subtle">(optional)</span>
                </label>
                <input
                  id="person-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="person-role"
                  className="block text-xs font-medium text-ink-muted"
                >
                  Role
                </label>
                <div className="relative">
                  <select
                    id="person-role"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as PersonRole })
                    }
                    className={selectClass}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="person-location"
                className="block text-xs font-medium text-ink-muted"
              >
                Location
              </label>
              <div className="relative">
                <select
                  id="person-location"
                  value={form.locationId ?? ""}
                  onChange={(e) => {
                    const nextLoc = e.target.value || null;
                    setForm({
                      ...form,
                      locationId: nextLoc,
                      teamIds: form.teamIds.filter(
                        (id) => teams.find((t) => t.id === id)?.locationId === nextLoc,
                      ),
                    });
                  }}
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
              <label className="block text-xs font-medium text-ink-muted">
                Teams
              </label>
              <TeamMultiSelect
                teams={teams}
                locationId={form.locationId}
                selectedTeamIds={form.teamIds}
                onChange={(teamIds) => setForm({ ...form, teamIds })}
              />
            </div>

            <div>
              <label
                htmlFor="person-timezone"
                className="block text-xs font-medium text-ink-muted"
              >
                Timezone
              </label>
              <div className="relative">
                <select
                  id="person-timezone"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className={selectClass}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
              </div>
            </div>

            <div>
              <label
                htmlFor="person-notes"
                className="block text-xs font-medium text-ink-muted"
              >
                Notes{" "}
                <span className="font-normal text-ink-subtle">(optional)</span>
              </label>
              <textarea
                id="person-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Anything worth remembering about this person"
                rows={3}
                className="mt-1.5 w-full resize-none rounded-lg border border-hairline bg-surface-3 px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
              />
            </div>

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
        title={`Remove ${person.name}?`}
        description="This performs a GDPR-style erasure: their profile and personal data are removed from the company. This can't be undone."
        confirmLabel="Remove person"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deletePerson(person.id);
          router.push("/people");
        }}
      />
    </div>
  );
}
