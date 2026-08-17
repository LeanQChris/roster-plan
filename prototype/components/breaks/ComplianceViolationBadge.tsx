"use client";

import type { ComplianceViolationType } from "@/lib/company-data";
import { AlertTriangleIcon } from "@/components/ui/icons";

const STYLES: Record<ComplianceViolationType, string> = {
  meal_break_missing: "border-danger/25 bg-danger-weak text-danger",
  rest_break_missing: "border-danger/25 bg-danger-weak text-danger",
  meal_break_too_short: "border-warning/25 bg-warning-weak text-warning",
  rest_break_too_short: "border-warning/25 bg-warning-weak text-warning",
};

const LABELS: Record<ComplianceViolationType, string> = {
  meal_break_missing: "Meal break missing",
  rest_break_missing: "Rest break missing",
  meal_break_too_short: "Meal break too short",
  rest_break_too_short: "Rest break too short",
};

export default function ComplianceViolationBadge({
  type,
}: {
  type: ComplianceViolationType;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${STYLES[type]}`}
    >
      <AlertTriangleIcon className="size-3" />
      {LABELS[type]}
    </span>
  );
}
