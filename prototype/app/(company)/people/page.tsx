"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCompany } from "@/lib/company-data";
import type { Person } from "@/lib/company-data";
import Modal from "@/components/ui/Modal";
import { PlusIcon } from "@/components/ui/icons";
import PeopleList from "@/components/people/PeopleList";
import PeopleEmpty from "@/components/people/PeopleEmpty";
import PersonFormModal from "@/components/people/PersonFormModal";
import type { PersonFormInput } from "@/components/people/PersonFormModal";

export default function PeoplePage() {
  const { teams, people, locations, invitePerson, updatePerson, resendInvite, deletePerson } =
    useCompany();
  const { registerEmployee } = useAuth();
  const [editing, setEditing] = useState<Person | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Person | null>(null);
  const [saved, setSaved] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const flashSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const flashResendError = (message: string) => {
    setResendError(message);
    window.setTimeout(() => setResendError(null), 4000);
  };

  const handleResend = async (person: Person) => {
    const result = await resendInvite(person.id);
    if (!result.ok) {
      flashResendError(result.error ?? `Couldn't resend invite to ${person.name}.`);
    }
  };

  const openInvite = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (person: Person) => {
    setEditing(person);
    setFormOpen(true);
  };

  const handleSave = async (
    input: PersonFormInput,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (editing) {
      await updatePerson(editing.id, {
        name: input.name,
        phone: input.phone,
        role: input.role,
        teamIds: input.teamIds,
        locationId: input.locationId,
        timezone: input.timezone,
      });
    } else {
      const result = await invitePerson({
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        teamIds: input.teamIds,
        locationId: input.locationId,
        timezone: input.timezone,
      });
      if (!result.ok || !result.personId) {
        return { ok: false, error: result.error };
      }
      const account = await registerEmployee({
        email: input.email.trim().toLowerCase(),
        personId: result.personId,
        name: input.name.trim(),
        role: input.role,
      });
      if (!account.ok) {
        return { ok: false, error: account.error };
      }
    }
    setFormOpen(false);
    flashSaved();
    return { ok: true };
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

      {people.length === 0 ? (
        <PeopleEmpty onInvite={openInvite} />
      ) : (
        <PeopleList
          people={people}
          teams={teams}
          locations={locations}
          onInvite={openInvite}
          onEdit={openEdit}
          onDelete={setConfirmDelete}
          onResend={handleResend}
        />
      )}

      {formOpen && (
        <PersonFormModal
          key={editing?.id ?? "invite"}
          person={editing}
          teams={teams}
          locations={locations}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
        />
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
            flashSaved();
          }}
        />
      )}
    </div>
  );
}