"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import type { ShiftTemplate } from "@/lib/company-data";
import RecurrenceRuleInput from "./RecurrenceRuleInput";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

export interface ShiftTemplateFormInput {
  teamId?: string;
  title: string;
  description?: string;
  durationMinutes: number;
  startTime: string;
  requiredCount: number;
  maxCount?: number;
  isActive: boolean;
  recurrenceRule?: string;
}

interface ShiftTemplateFormModalProps {
  template: ShiftTemplate | null;
  teams?: { id: string; name: string }[];
  defaultTeamId?: string;
  onClose: () => void;
  onSave: (input: ShiftTemplateFormInput) => { ok: boolean; error?: string };
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function ShiftTemplateFormModal({
  template,
  teams,
  defaultTeamId,
  onClose,
  onSave,
}: ShiftTemplateFormModalProps) {
  const isEdit = template !== null;
  const [teamId, setTeamId] = useState(template?.teamId ?? defaultTeamId ?? "");
  const [title, setTitle] = useState(template?.title ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [startTime, setStartTime] = useState(template?.startTime ?? "08:00");
  const [durationMinutes, setDurationMinutes] = useState(template?.durationMinutes ?? 480);
  const [requiredCount, setRequiredCount] = useState(template?.requiredCount ?? 1);
  const [maxCount, setMaxCount] = useState(template?.maxCount?.toString() ?? "");
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [recurrenceRule, setRecurrenceRule] = useState(template?.recurrenceRule ?? "");
  const [error, setError] = useState<string | null>(null);

  const computedEndTime = (() => {
    const [h, m] = startTime.split(":").map(Number);
    const totalMin = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  })();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const result = onSave({
      teamId: teamId || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      durationMinutes,
      startTime,
      requiredCount,
      maxCount: maxCount ? parseInt(maxCount) : undefined,
      isActive,
      recurrenceRule: recurrenceRule || undefined,
    });
    if (!result.ok) {
      setError(result.error ?? "Couldn't save — try again.");
    }
  };

  return (
    <Modal
      open
      size="xl"
      title={isEdit ? "Edit template" : "New shift template"}
      description={
        isEdit
          ? "Update the shift template details."
          : "Create a reusable shift with recurrence rules."
      }
      confirmLabel={isEdit ? "Save changes" : "Create template"}
      hideFooter
      onClose={onClose}
      onConfirm={() => {}}
    >
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {teams && teams.length > 0 && (
          <div>
            <label
              htmlFor="template-team"
              className="block text-xs font-medium text-ink-muted"
            >
              Team
            </label>
            <select
              id="template-team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              required
              className="mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none"
            >
              <option value="">Select a team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label
            htmlFor="template-title"
            className="block text-xs font-medium text-ink-muted"
          >
            Title
          </label>
          <input
            id="template-title"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Morning Shift"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="template-desc"
            className="block text-xs font-medium text-ink-muted"
          >
            Description{" "}
            <span className="font-normal text-ink-subtle">(optional)</span>
          </label>
          <textarea
            id="template-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this shift covers"
            rows={2}
            className="mt-1.5 w-full resize-none rounded-lg border border-hairline bg-surface-3 px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="template-start"
              className="block text-xs font-medium text-ink-muted"
            >
              Start time
            </label>
            <input
              id="template-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="template-duration"
              className="block text-xs font-medium text-ink-muted"
            >
              Duration
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="template-duration"
                type="number"
                min={15}
                max={1440}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(15, parseInt(e.target.value) || 15))}
                className={inputClass}
              />
              <span className="whitespace-nowrap text-[12px] text-ink-subtle">
                {formatDuration(durationMinutes)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-muted">
            End time
          </label>
          <div className="mt-1.5 h-9 w-full rounded-lg border border-hairline/60 bg-surface-2 px-3 text-[13px] text-ink-muted">
            <span className="leading-[36px]">{computedEndTime}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="template-required"
              className="block text-xs font-medium text-ink-muted"
            >
              Staff required
            </label>
            <input
              id="template-required"
              type="number"
              min={1}
              max={999}
              value={requiredCount}
              onChange={(e) => setRequiredCount(Math.max(1, parseInt(e.target.value) || 1))}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="template-max"
              className="block text-xs font-medium text-ink-muted"
            >
              Max staff{" "}
              <span className="font-normal text-ink-subtle">(optional)</span>
            </label>
            <input
              id="template-max"
              type="number"
              min={1}
              max={999}
              value={maxCount}
              onChange={(e) => setMaxCount(e.target.value)}
              placeholder="—"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="template-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 rounded border-hairline bg-surface-3 text-primary focus:ring-primary/30"
          />
          <label htmlFor="template-active" className="text-[13px] text-ink-muted">
            Active
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Recurrence rule
          </label>
          <div className="mt-1.5 rounded-lg border border-hairline bg-surface-1 p-3">
            <RecurrenceRuleInput value={recurrenceRule} onChange={setRecurrenceRule} />
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
            {isEdit ? "Save changes" : "Create template"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
