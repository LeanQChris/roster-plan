"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useCompany } from "@/lib/company-data";
import type { Person, PersonRole } from "@/lib/company-data";
import { DEFAULT_TIMEZONE, TIMEZONES } from "@/lib/company";
import { initials } from "@/lib/format";
import Modal from "@/components/admin/Modal";
import {
  ChevronDownIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/admin/icons";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

const selectClass =
  "mt-1.5 h-9 w-full appearance-none rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none";

function StatusBadge({ status }: { status: Person["status"] }) {
  const styles: Record<Person["status"], string> = {
    active: "border-success/25 bg-success-weak text-success",
    invited: "border-primary/25 bg-primary-weak text-primary",
    inactive: "border-hairline bg-surface-3 text-ink-subtle",
  };
  const label: Record<Person["status"], string> = {
    active: "Active",
    invited: "Invited",
    inactive: "Inactive",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "active"
            ? "bg-success"
            : status === "invited"
              ? "bg-primary"
              : "bg-ink-subtle"
        }`}
      />
      {label[status]}
    </span>
  );
}

function RoleBadge({ role }: { role: PersonRole }) {
  return (
    <span className="rounded-md border border-hairline bg-surface-3 px-2 py-0.5 text-[11px] font-medium text-ink-muted">
      {role === "manager" ? "Manager" : "Employee"}
    </span>
  );
}

interface PersonFormState {
  editing: Person | null;
  name: string;
  email: string;
  phone: string;
  role: PersonRole;
  teamId: string | null;
  locationId: string | null;
  timezone: string;
}

const EMPTY_FORM: PersonFormState = {
  editing: null,
  name: "",
  email: "",
  phone: "",
  role: "employee",
  teamId: null,
  locationId: null,
  timezone: DEFAULT_TIMEZONE,
};

export default function PeoplePage() {
  const {
    teams,
    people,
    locations,
    invitePerson,
    updatePerson,
    resendInvite,
    deletePerson,
  } = useCompany();
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PersonFormState>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<Person | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
    if (teamFilter === "all") return people;
    if (teamFilter === "unassigned") return people.filter((p) => !p.teamId);
    return people.filter((p) => p.teamId === teamFilter);
  }, [people, teamFilter]);

  const openInvite = () => {
    setForm({ ...EMPTY_FORM });
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (person: Person) => {
    setForm({
      editing: person,
      name: person.name,
      email: person.email,
      phone: person.phone ?? "",
      role: person.role,
      teamId: person.teamId,
      locationId: person.locationId,
      timezone: person.timezone,
    });
    setError(null);
    setFormOpen(true);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (form.editing) {
      updatePerson(form.editing.id, {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        teamId: form.teamId,
        locationId: form.locationId,
        timezone: form.timezone,
      });
    } else {
      const result = invitePerson({
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        teamId: form.teamId,
        locationId: form.locationId,
        timezone: form.timezone,
      });
      if (!result.ok) {
        setError(result.error ?? "Couldn't invite — try again.");
        return;
      }
    }

    setFormOpen(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">People</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Invite staff, assign them to teams, and manage their status.
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
            onClick={openInvite}
            className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <PlusIcon className="size-3.5" />
            Invite people
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {filtered.length} {filtered.length === 1 ? "person" : "people"}
          {teamFilter !== "all" && teamFilter !== "unassigned"
            ? ` in ${teamName.get(teamFilter) ?? "this team"}`
            : teamFilter === "unassigned"
              ? " unassigned"
              : " in the company"}
        </p>
        <div className="relative">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            aria-label="Filter by team"
            className={`${selectClass} !mt-0 h-8 w-auto pr-8 text-xs`}
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

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <UsersIcon className="size-5" />
          </span>
          <h2 className="mt-3 text-[15px] font-semibold text-ink">
            {people.length === 0 ? "Your team is ready to grow" : "No people here"}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            {people.length === 0
              ? "Invite people by email — they'll get an invite link and can start clocking in once they accept."
              : "Nobody is in this group yet. Invite someone or adjust the filter."}
          </p>
          <button
            type="button"
            onClick={openInvite}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <MailIcon className="size-3.5" />
            Invite people
          </button>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <ul className="divide-y divide-hairline">
            {filtered.map((person) => (
              <li key={person.id} className="group flex items-center gap-3 px-4 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[11px] font-semibold text-ink">
                  {initials(person.name) || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {person.name}
                    </p>
                    <RoleBadge role={person.role} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {person.email}
                    {person.phone ? ` · ${person.phone}` : ""}
                  </p>
                </div>
                <span className="hidden shrink-0 text-xs text-ink-subtle sm:block">
                  {person.teamId ? teamName.get(person.teamId) ?? "—" : "Unassigned"}
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
                <StatusBadge status={person.status} />
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {person.status === "invited" && (
                    <button
                      type="button"
                      onClick={() => resendInvite(person.id)}
                      title="Resend invite"
                      aria-label={`Resend invite to ${person.name}`}
                      className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
                    >
                      <MailIcon className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(person)}
                    title="Edit person"
                    aria-label={`Edit ${person.name}`}
                    className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(person)}
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
        </div>
      )}

      {formOpen && (
        <Modal
          open
          title={form.editing ? "Edit person" : "Invite people"}
          description={
            form.editing
              ? "Update team, role, and contact details."
              : "An invite email will be sent — they can set a password and join the company."
          }
          confirmLabel={form.editing ? "Save changes" : "Send invite"}
          hideFooter
          onClose={() => setFormOpen(false)}
          onConfirm={() => {}}
        >
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                  placeholder="Priya Shah"
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="person-email"
                  className="block text-xs font-medium text-ink-muted"
                >
                  Email
                </label>
                <input
                  id="person-email"
                  type="email"
                  readOnly={!!form.editing}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="priya@example.com"
                  className={`${inputClass} ${form.editing ? "cursor-not-allowed opacity-60" : ""}`}
                />
              </div>
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
                  placeholder="+1 555 123 4567"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="person-team"
                  className="block text-xs font-medium text-ink-muted"
                >
                  Team
                </label>
                <div className="relative">
                  <select
                    id="person-team"
                    value={form.teamId ?? ""}
                    onChange={(e) => {
                      const teamId = e.target.value || null;
                      const team = teams.find((t) => t.id === teamId);
                      setForm({
                        ...form,
                        teamId,
                        locationId: team?.locationId ?? null,
                      });
                    }}
                    className={selectClass}
                  >
                    <option value="">Unassigned</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
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
                    onChange={(e) =>
                      setForm({ ...form, locationId: e.target.value || null })
                    }
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
            </div>


            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="h-8 rounded-lg border border-hairline bg-surface-3 px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
              >
                {form.editing ? "Save changes" : "Send invite"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          open
          title={`Remove ${confirmDelete.name}?`}
          description="This performs a GDPR-style erasure: their profile and personal data are removed from the company. This can't be undone."
          tone="danger"
          confirmLabel="Remove person"
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => {
            deletePerson(confirmDelete.id);
            setConfirmDelete(null);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2600);
          }}
        />
      )}
    </div>
  );
}