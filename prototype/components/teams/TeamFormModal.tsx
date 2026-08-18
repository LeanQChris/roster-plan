"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import type { Location, Person, Team } from "@/lib/company-data";
import { ChevronDownIcon } from "@/components/ui/icons";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

const selectClass =
  "mt-1.5 h-9 w-full appearance-none rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none";

export interface TeamFormInput {
  name: string;
  description?: string;
  locationId: string | null;
  managerId: string | null;
}

interface TeamFormModalProps {
  team: Team | null;
  locations: Location[];
  people: Person[];
  onClose: () => void;
  onSave: (input: TeamFormInput) => Promise<{ ok: boolean; error?: string }>;
}

export default function TeamFormModal({
  team,
  locations,
  people,
  onClose,
  onSave,
}: TeamFormModalProps) {
  const isEdit = team !== null;
  const managers = people.filter((p) => p.role === "manager");
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [locationId, setLocationId] = useState<string | null>(
    team?.locationId ?? null,
  );
  const [managerId, setManagerId] = useState<string | null>(
    team?.managerId ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const result = await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      locationId,
      managerId,
    });
    if (!result.ok) {
      setError(result.error ?? "Couldn't save — try again.");
    }
  };

  return (
    <Modal
      open
      title={isEdit ? "Edit team" : "New team"}
      description={
        isEdit
          ? "Update the team name or description."
          : "Teams group people for scheduling, templates, and reports."
      }
      confirmLabel={isEdit ? "Save changes" : "Create team"}
      hideFooter
      onClose={onClose}
      onConfirm={() => {}}
    >
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="team-name"
            className="block text-xs font-medium text-ink-muted"
          >
            Team name
          </label>
          <input
            id="team-name"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Front of House"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="team-desc"
            className="block text-xs font-medium text-ink-muted"
          >
            Description{" "}
            <span className="font-normal text-ink-subtle">(optional)</span>
          </label>
          <textarea
            id="team-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this team do?"
            rows={2}
            className="mt-1.5 w-full resize-none rounded-lg border border-hairline bg-surface-3 px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="team-location"
            className="block text-xs font-medium text-ink-muted"
          >
            Location
          </label>
          <div className="relative">
            <select
              id="team-location"
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

        <div>
          <label
            htmlFor="team-manager"
            className="block text-xs font-medium text-ink-muted"
          >
            Team manager
          </label>
          <div className="relative">
            <select
              id="team-manager"
              value={managerId ?? ""}
              onChange={(e) => setManagerId(e.target.value || null)}
              className={selectClass}
            >
              <option value="">Unassigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          </div>
          {managers.length === 0 && (
            <p className="mt-1 text-[11px] text-ink-subtle">
              No people with the manager role yet — invite one from People.
            </p>
          )}
          <p className="mt-1 text-[11px] text-ink-subtle">
            One manager can lead multiple teams.
          </p>
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
            {isEdit ? "Save changes" : "Create team"}
          </button>
        </div>
      </form>
    </Modal>
  );
}