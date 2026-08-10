"use client";

import Modal from "@/components/ui/Modal";
import type { Shift } from "@/lib/company-data";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

interface DeleteShiftDialogProps {
  shift: Shift;
  assignmentCount: number;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function DeleteShiftDialog({
  shift,
  assignmentCount,
  onDelete,
  onClose,
}: DeleteShiftDialogProps) {
  const shiftDate = new Date(shift.date + "T12:00:00");
  const dateLabel = `${DAY_NAMES[shiftDate.getDay()]}, ${MONTH_NAMES[shiftDate.getMonth()]} ${shiftDate.getDate()}`;
  const timeLabel = `${shift.startTime} – ${getEndTime(shift.startTime, shift.durationMinutes)}`;

  const handleConfirm = () => {
    onDelete(shift.id);
    onClose();
  };

  return (
    <Modal
      open
      title="Delete shift?"
      description={`This will permanently remove "${shift.title}" on ${dateLabel} at ${timeLabel}.`}
      tone="danger"
      confirmLabel="Delete"
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <div className="mt-4">
        {assignmentCount > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning-weak px-3 py-2 text-[13px] text-warning">
            This shift has {assignmentCount} assigned team member{assignmentCount === 1 ? "" : "s"}. They will be unassigned.
          </div>
        )}
      </div>
    </Modal>
  );
}
