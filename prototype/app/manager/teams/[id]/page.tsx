"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCompany } from "@/lib/company-data";
import type { ShiftTemplate } from "@/lib/company-data";
import type { PersonFormInput } from "@/components/people/PersonFormModal";
import type { ShiftTemplateFormInput } from "@/components/shift-templates/ShiftTemplateFormModal";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";
import PersonFormModal from "@/components/people/PersonFormModal";
import ShiftTemplateFormModal from "@/components/shift-templates/ShiftTemplateFormModal";
import ShiftTemplateTable from "@/components/shift-templates/ShiftTemplateTable";
import ShiftTemplatesEmpty from "@/components/shift-templates/ShiftTemplatesEmpty";
import PreviewShiftsModal from "@/components/shift-templates/PreviewShiftsModal";
import TeamScheduleView from "@/components/schedule/TeamScheduleView";
import TeamAuditList from "@/components/manager/TeamAuditList";
import { ClockIcon, ListIcon, PlusIcon, UsersIcon } from "@/components/ui/icons";
import { initials } from "@/lib/format";

type Tab = "members" | "templates" | "schedule" | "audit";

const TABS: { value: Tab; label: string }[] = [
  { value: "members", label: "Members" },
  { value: "templates", label: "Templates" },
  { value: "schedule", label: "Schedule" },
  { value: "audit", label: "Audit" },
];

const statusStyles: Record<string, string> = {
  active: "border-success/25 bg-success-weak text-success",
  invited: "border-primary/25 bg-primary-weak text-primary",
  inactive: "border-hairline bg-surface-3 text-ink-subtle",
};

export default function ManagerTeamPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const {
    teams,
    people,
    locations,
    shiftTemplates,
    auditLog,
    invitePerson,
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate,
  } = useCompany();

  const myPerson = useMemo(
    () =>
      people.find(
        (p) => p.role === "manager" && p.email.toLowerCase() === user?.email.toLowerCase(),
      ),
    [people, user?.email],
  );

  useEffect(() => {
    if (myPerson && params.id !== myPerson.teamId) {
      router.replace("/manager/dashboard");
    }
  }, [myPerson, params.id, router]);

  const team = teams.find((t) => t.id === params.id);

  const [tab, setTab] = useState<Tab>("members");

  const teamPeople = useMemo(
    () => people.filter((p) => p.teamId === params.id),
    [people, params.id],
  );

  const teamTemplates = useMemo(
    () => shiftTemplates.filter((t) => t.teamId === params.id),
    [shiftTemplates, params.id],
  );

  const teamAuditLog = useMemo(
    () => auditLog.filter((a) => a.teamId === params.id),
    [auditLog, params.id],
  );

  // Members tab
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleInvite = (input: PersonFormInput): { ok: boolean; error?: string } => {
    if (!team) return { ok: false, error: "Team not found." };
    const result = invitePerson({ ...input, teamId: team.id });
    if (result.ok) setInviteOpen(false);
    return result;
  };

  // Templates tab
  const [modalTemplate, setModalTemplate] = useState<ShiftTemplate | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<ShiftTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ShiftTemplate | null>(null);

  const handleSaveTemplate = (input: ShiftTemplateFormInput): { ok: boolean; error?: string } => {
    if (!team) return { ok: false, error: "Team not found." };
    if (modalTemplate) {
      if (!updateShiftTemplate(modalTemplate.id, input)) {
        return { ok: false, error: "Couldn't save changes." };
      }
    } else {
      const result = createShiftTemplate({ ...input, teamId: team.id });
      if (!result.ok) return { ok: false, error: result.error };
    }
    setModalTemplate(undefined);
    return { ok: true };
  };

  if (!team) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <ListIcon className="size-10 text-ink-faint" />
        <p className="text-sm font-medium text-ink">Team not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <ListIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {team.name}
            </h1>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {teamPeople.length} {teamPeople.length === 1 ? "member" : "members"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Members"
          value={teamPeople.length}
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Active"
          value={teamPeople.filter((p) => p.status === "active").length}
          tone="primary"
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Templates"
          value={teamTemplates.length}
          icon={<ClockIcon className="size-4" />}
        />
        <StatCard
          label="Activity"
          value={teamAuditLog.length}
          icon={<ListIcon className="size-4" />}
        />
      </div>

      <div className="mt-6 flex items-center gap-1 border-b border-hairline">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`relative px-3 py-2 text-[13px] font-medium transition-colors ${
              tab === t.value
                ? "text-ink"
                : "text-ink-subtle hover:text-ink"
            }`}
          >
            {t.label}
            {tab === t.value && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "members" && (
          <div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
              >
                <PlusIcon className="size-3.5" />
                Invite employee
              </button>
            </div>

            {teamPeople.length === 0 ? (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-hairline bg-surface-2 px-6 py-16 text-center">
                <UsersIcon className="size-8 text-ink-faint" />
                <p className="text-sm font-medium text-ink">Nobody is on this team yet.</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-hairline/60 overflow-hidden rounded-xl border border-hairline bg-surface-2">
                {teamPeople.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[11px] font-semibold text-ink">
                      {initials(person.name) || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {person.name}
                      </p>
                      <p className="truncate text-xs text-ink-subtle">
                        {person.email}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusStyles[person.status]}`}
                    >
                      {person.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {inviteOpen && (
              <PersonFormModal
                person={null}
                teams={[team]}
                locations={locations}
                onClose={() => setInviteOpen(false)}
                onSave={handleInvite}
              />
            )}
          </div>
        )}

        {tab === "templates" && (
          <div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setModalTemplate(null)}
                className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
              >
                <PlusIcon className="size-3.5" />
                New template
              </button>
            </div>

            {teamTemplates.length === 0 ? (
              <ShiftTemplatesEmpty onCreate={() => setModalTemplate(null)} />
            ) : (
              <ShiftTemplateTable
                templates={teamTemplates}
                showTeam={false}
                onEdit={(t) => setModalTemplate(t)}
                onDelete={setConfirmDelete}
                onPreview={setPreviewTemplate}
              />
            )}

            {modalTemplate !== undefined && (
              <ShiftTemplateFormModal
                key={modalTemplate?.id ?? "create"}
                template={modalTemplate}
                defaultTeamId={team.id}
                onClose={() => setModalTemplate(undefined)}
                onSave={handleSaveTemplate}
              />
            )}

            {confirmDelete && (
              <Modal
                open
                title={`Delete "${confirmDelete.title}"?`}
                description="This template will be permanently removed. This can't be undone."
                tone="danger"
                confirmLabel="Delete template"
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => {
                  deleteShiftTemplate(confirmDelete.id);
                  setConfirmDelete(null);
                }}
              />
            )}

            {previewTemplate && (
              <PreviewShiftsModal
                template={previewTemplate}
                onClose={() => setPreviewTemplate(null)}
              />
            )}
          </div>
        )}

        {tab === "schedule" && <TeamScheduleView team={team} showHeader={false} />}

        {tab === "audit" && <TeamAuditList entries={teamAuditLog} />}
      </div>
    </div>
  );
}
