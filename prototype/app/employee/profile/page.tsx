"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCompany } from "@/lib/company-data";
import { useEmployeeTeam } from "@/lib/employee-team";
import { TIMEZONES } from "@/lib/company";
import { CheckIcon, PencilIcon, UsersIcon } from "@/components/ui/icons";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

export default function EmployeeProfilePage() {
  const { user } = useAuth();
  const { locations, updatePerson } = useCompany();
  const { myPerson, myTeams } = useEmployeeTeam();
  const [editing, setEditing] = useState(false);
  const [timezone, setTimezone] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  const myLocation = useMemo(
    () => locations.find((l) => l.id === myPerson?.locationId) ?? null,
    [locations, myPerson?.locationId],
  );

  if (!myPerson) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Profile</h1>
        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <UsersIcon className="mx-auto size-11 text-ink-faint" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">
            You&apos;re not linked to a team member record yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Ask your manager to invite you with the employee role.
          </p>
        </div>
      </div>
    );
  }

  const startEdit = () => {
    setTimezone(myPerson.timezone);
    setPhone(myPerson.phone ?? "");
    setSaved(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const save = () => {
    updatePerson(myPerson.id, { timezone, phone: phone.trim() || undefined });
    setEditing(false);
    setSaved(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <UsersIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Profile</h1>
            <p className="mt-0.5 text-xs text-ink-subtle">{myPerson.name}</p>
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
          >
            <PencilIcon className="size-3.5" />
            Edit
          </button>
        )}
      </div>

      {saved && !editing && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-success/30 bg-success-weak px-4 py-3">
          <CheckIcon className="size-4 text-success" />
          <p className="text-[13px] font-medium text-success">Profile updated</p>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-hairline bg-surface-2 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Name</p>
            <p className="mt-0.5 text-[13px] text-ink">{myPerson.name}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Email</p>
            <p className="mt-0.5 text-[13px] text-ink">{myPerson.email}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Role</p>
            <p className="mt-0.5 text-[13px] capitalize text-ink">{myPerson.role}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Teams</p>
            <p className="mt-0.5 text-[13px] text-ink">
              {myTeams.length > 0 ? myTeams.map((t) => t.name).join(", ") : "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Location</p>
            <p className="mt-0.5 text-[13px] text-ink">{myLocation?.name ?? "—"}</p>
          </div>

          {!editing ? (
            <>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Timezone</p>
                <p className="mt-0.5 text-[13px] text-ink">{myPerson.timezone.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Phone</p>
                <p className="mt-0.5 text-[13px] text-ink">{myPerson.phone ?? "—"}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="timezone" className="block text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={inputClass}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="phone" className="block text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className={inputClass}
                />
              </div>
            </>
          )}
        </div>

        {editing && (
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="h-8 rounded-lg border border-hairline bg-surface-3 px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-4"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="h-8 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
