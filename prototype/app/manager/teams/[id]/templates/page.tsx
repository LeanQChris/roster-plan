"use client";

import { useState } from "react";
import { useCompany } from "@/lib/company-data";
import type { ShiftTemplate } from "@/lib/company-data";
import type { ShiftTemplateFormInput } from "@/components/shift-templates/ShiftTemplateFormModal";
import Modal from "@/components/ui/Modal";
import ShiftTemplateFormModal from "@/components/shift-templates/ShiftTemplateFormModal";
import ShiftTemplateTable from "@/components/shift-templates/ShiftTemplateTable";
import ShiftTemplatesEmpty from "@/components/shift-templates/ShiftTemplatesEmpty";
import PreviewShiftsModal from "@/components/shift-templates/PreviewShiftsModal";
import { PlusIcon } from "@/components/ui/icons";
import { useTeamDetail } from "../team-detail-context";

export default function ManagerTeamTemplatesPage() {
  const { createShiftTemplate, updateShiftTemplate, deleteShiftTemplate } = useCompany();
  const { team, teamTemplates } = useTeamDetail();

  const [modalTemplate, setModalTemplate] = useState<ShiftTemplate | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<ShiftTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ShiftTemplate | null>(null);

  const handleSaveTemplate = async (
    input: ShiftTemplateFormInput,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (modalTemplate) {
      const ok = await updateShiftTemplate(modalTemplate.id, input);
      if (!ok) return { ok: false, error: "Couldn't save changes." };
    } else {
      const result = await createShiftTemplate({ ...input, teamId: team.id });
      if (!result.ok) return { ok: false, error: result.error };
    }
    setModalTemplate(undefined);
    return { ok: true };
  };

  return (
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
  );
}
