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
import {
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/components/ui/icons";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

const selectClass =
  "mt-1.5 h-9 w-full appearance-none rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none";

export interface PersonFormInput {
  name: string;
  email: string;
  phone?: string;
  role: PersonRole;
  teamId: string | null;
  locationId: string | null;
  timezone: string;
  password?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: (visible: boolean) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-ink-muted">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="At least 8 characters"
          className={`${inputClass} pr-9`}
        />
        <button
          type="button"
          onClick={() => onToggleVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-subtle transition-colors hover:text-ink"
        >
          {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      </div>
    </div>
  );
}

interface PersonFormModalProps {
  person: Person | null;
  teams: Team[];
  locations: Location[];
  onClose: () => void;
  onSave: (input: PersonFormInput) => { ok: boolean; error?: string };
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
  const [teamId, setTeamId] = useState<string | null>(person?.teamId ?? null);
  const [locationId, setLocationId] = useState<string | null>(
    person?.locationId ?? null,
  );
  const [timezone, setTimezone] = useState(
    person?.timezone ?? DEFAULT_TIMEZONE,
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isEdit) {
      if (password && password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
    }

    const result = onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
      teamId,
      locationId,
      timezone,
      password: password || undefined,
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
          : "Set a password so they can sign in right away — or leave it blank to send an invite email instead."
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
                value={teamId ?? ""}
                onChange={(e) => {
                  const nextTeamId = e.target.value || null;
                  const team = teams.find((t) => t.id === nextTeamId);
                  setTeamId(nextTeamId);
                  setLocationId(team?.locationId ?? null);
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
                value={locationId ?? ""}
                onChange={(e) => setLocationId(e.target.value || null)}
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

        {!isEdit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              id="person-password"
              label="Password"
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggleVisible={setShowPassword}
            />
            <PasswordField
              id="person-confirm"
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              visible={showConfirm}
              onToggleVisible={setShowConfirm}
            />
          </div>
        )}

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