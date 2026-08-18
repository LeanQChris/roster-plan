"use client";

import { useMemo, useState } from "react";
import { useCompany } from "@/lib/company-data";
import type { ShiftTemplate } from "@/lib/company-data";
import type { ShiftTemplateFormInput } from "@/components/shift-templates/ShiftTemplateFormModal";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";
import ShiftTemplateFormModal from "@/components/shift-templates/ShiftTemplateFormModal";
import ShiftTemplateTable from "@/components/shift-templates/ShiftTemplateTable";
import ShiftTemplatesEmpty from "@/components/shift-templates/ShiftTemplatesEmpty";
import PreviewShiftsModal from "@/components/shift-templates/PreviewShiftsModal";
import { ClockIcon, PlusIcon } from "@/components/ui/icons";

export default function ShiftTemplatesPage() {
  const {
    teams,
    shiftTemplates,
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate,
    applyTemplateToShifts,
  } = useCompany();

  const allTemplates = useMemo(() => shiftTemplates ?? [], [shiftTemplates]);
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const templates = useMemo(
    () => (teamFilter === "all" ? allTemplates : allTemplates.filter((t) => t.teamId === teamFilter)),
    [allTemplates, teamFilter],
  );

  const teamNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of teams) map[t.id] = t.name;
    return map;
  }, [teams]);

  const [modalTemplate, setModalTemplate] = useState<ShiftTemplate | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<ShiftTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ShiftTemplate | null>(null);
  const [saved, setSaved] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  const flashSaved = (applied = 0) => {
    setAppliedCount(applied > 0 ? applied : null);
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      setAppliedCount(null);
    }, 2600);
  };

  const handleSave = async (
    input: ShiftTemplateFormInput,
  ): Promise<{ ok: boolean; error?: string }> => {
    let applied = 0;
    if (modalTemplate) {
      const ok = await updateShiftTemplate(modalTemplate.id, input);
      if (!ok) return { ok: false, error: "Couldn't save changes." };
      if (input.applyToExisting) {
        applied = await applyTemplateToShifts(
          modalTemplate.id,
          {
            title: input.title,
            startTime: input.startTime,
            durationMinutes: input.durationMinutes,
            requiredCount: input.requiredCount,
          },
          input.applyStart || undefined,
          input.applyEnd || undefined,
        );
      }
    } else {
      if (!input.teamId) return { ok: false, error: "Please select a team." };
      const result = await createShiftTemplate({ ...input, teamId: input.teamId });
      if (!result.ok) return { ok: false, error: result.error };
    }
    setModalTemplate(undefined);
    flashSaved(applied);
    return { ok: true };
  };

  const activeCount = templates.filter((t) => t.isActive).length;
  const inactiveCount = templates.filter((t) => !t.isActive).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <ClockIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Shift Templates
            </h1>
            <p className="mt-0.5 text-xs text-ink-subtle">
              Reusable shifts with recurrence rules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {saved && (
            <span className="rounded-lg border border-success/25 bg-success-weak px-2.5 py-1.5 text-xs font-medium text-success">
              {appliedCount
                ? `Saved · ${appliedCount} published ${appliedCount === 1 ? "shift" : "shifts"} updated`
                : "Saved"}
            </span>
          )}
          <button
            type="button"
            onClick={() => setModalTemplate(null)}
            className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <PlusIcon className="size-3.5" />
            New template
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard
          label="Total templates"
          value={templates.length}
          icon={<ClockIcon className="size-4" />}
        />
        <StatCard
          label="Active"
          value={activeCount}
          tone="primary"
          icon={<ClockIcon className="size-4" />}
        />
        <StatCard
          label="Inactive"
          value={inactiveCount}
          icon={<ClockIcon className="size-4" />}
        />
      </div>

      {teams.length > 1 && (
        <div className="mt-4 flex items-center gap-2">
          <label htmlFor="team-filter" className="text-xs font-medium text-ink-muted">
            Filter by team:
          </label>
          <select
            id="team-filter"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="h-8 rounded-lg border border-hairline bg-surface-2 px-2.5 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none"
          >
            <option value="all">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {allTemplates.length === 0 ? (
        <ShiftTemplatesEmpty onCreate={() => setModalTemplate(null)} />
      ) : (
        <ShiftTemplateTable
          templates={templates}
          showTeam={teamFilter === "all" && teams.length > 1}
          teamNameMap={teamNameMap}
          onEdit={(t) => setModalTemplate(t)}
          onDelete={setConfirmDelete}
          onPreview={setPreviewTemplate}
        />
      )}

      {modalTemplate !== undefined && (
        <ShiftTemplateFormModal
          key={modalTemplate?.id ?? "create"}
          template={modalTemplate}
          teams={teams}
          defaultTeamId={teamFilter !== "all" ? teamFilter : undefined}
          onClose={() => setModalTemplate(undefined)}
          onSave={handleSave}
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
            flashSaved();
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
  );
}
