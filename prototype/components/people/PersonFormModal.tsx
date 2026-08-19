"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import type {
  Location,
  Person,
  PersonRole,
  Team,
} from "@/lib/company-data";
import { DEFAULT_TIMEZONE, TIMEZONES } from "@/lib/company";
import { ChevronDownIcon } from "@/components/ui/icons";
import TeamMultiSelect from "./TeamMultiSelect";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

const selectClass =
  "mt-1.5 h-9 w-full appearance-none rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none";

export interface PersonFormInput {
  name: string;
  email: string;
  phone?: string;
  role: PersonRole;
  teamIds: string[];
  locationId: string | null;
  timezone: string;
}

interface PersonFormModalProps {
  person: Person | null;
  teams: Team[];
  locations: Location[];
  onClose: () => void;
  onSave: (input: PersonFormInput) => Promise<{ ok: boolean; error?: string }>;
}

export default function PersonFormModal({
  person,
  teams,
  locations,
  onClose,
  onSave,
}: PersonFormModalProps) {
  const isEdit = person !== null;
  const [name, setName] = useState(person?.name ?? "");
  const [email, setEmail] = useState(person?.email ?? "");
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [role, setRole] = useState<PersonRole>(person?.role ?? "employee");
  const [teamIds, setTeamIds] = useState<string[]>(person?.teamIds ?? []);
  const [locationId, setLocationId] = useState<string | null>(
    person?.locationId ?? null,
  );
  const [timezone, setTimezone] = useState(
    person?.timezone ?? DEFAULT_TIMEZONE,
  );
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const result = await onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
      teamIds,
      locationId,
      timezone,
    });
    if (!result.ok) {
      setError(result.error ?? "Couldn't save — try again.");
    }
  };

  return (
    <Modal
      open
      title={isEdit ? "Edit person" : "Invite people"}
      description={
        isEdit
          ? "Update team, role, and contact details."
          : "They'll get an email to set their own password and accept the invite."
      }
      confirmLabel={isEdit ? "Save changes" : "Send invite"}
      hideFooter
      onClose={onClose}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              readOnly={isEdit}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@example.com"
              className={`${inputClass} ${isEdit ? "cursor-not-allowed opacity-60" : ""}`}
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
                value={role}
                onChange={(e) => setRole(e.target.value as PersonRole)}
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
              value={locationId ?? ""}
              onChange={(e) => {
                const nextLoc = e.target.value || null;
                setLocationId(nextLoc);
                setTeamIds((prev) =>
                  prev.filter(
                    (id) => teams.find((t) => t.id === id)?.locationId === nextLoc,
                  ),
                );
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
            locationId={locationId}
            selectedTeamIds={teamIds}
            onChange={setTeamIds}
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
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
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

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-lg border border-hairline bg-surface-3 px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-8 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            {isEdit ? "Save changes" : "Send invite"}
          </button>
        </div>
      </form>
    </Modal>
  );
}