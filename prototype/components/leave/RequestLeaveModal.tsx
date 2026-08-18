"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useCompany } from "@/lib/company-data";
import type { LeaveType } from "@/lib/company-data";

export const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "vacation", label: "Vacation" },
  { value: "sick", label: "Sick" },
  { value: "personal", label: "Personal" },
  { value: "bereavement", label: "Bereavement" },
  { value: "other", label: "Other" },
];

interface RequestLeaveModalProps {
  open: boolean;
  personId: string;
  onClose: () => void;
}

export default function RequestLeaveModal({
  open,
  personId,
  onClose,
}: RequestLeaveModalProps) {
  const { requestLeave } = useCompany();
  const [type, setType] = useState<LeaveType>("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const result = await requestLeave(personId, { type, startDate, endDate, reason });
    if (!result.ok) {
      setError(result.error ?? "Couldn't submit the request.");
      return;
    }
    setType("vacation");
    setStartDate("");
    setEndDate("");
    setReason("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Request leave"
      description="Submit a leave request for approval by your manager."
      confirmLabel="Submit request"
      onConfirm={handleSubmit}
      onClose={onClose}
    >
      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-subtle">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LeaveType)}
            className="h-8 w-full rounded-lg border border-hairline bg-surface-3 px-2.5 text-[13px] text-ink outline-none focus:border-primary"
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-subtle">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-full rounded-lg border border-hairline bg-surface-3 px-2.5 text-[13px] text-ink outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-subtle">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 w-full rounded-lg border border-hairline bg-surface-3 px-2.5 text-[13px] text-ink outline-none focus:border-primary"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-subtle">
            Reason <span className="text-ink-faint">(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Tell your manager why you need this time off"
            className="w-full resize-none rounded-lg border border-hairline bg-surface-3 px-2.5 py-2 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-primary"
          />
        </div>
        {error && (
          <p className="rounded-lg border border-danger/25 bg-danger-weak px-3 py-2 text-xs font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
