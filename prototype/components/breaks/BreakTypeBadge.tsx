"use client";

import type { BreakType } from "@/lib/company-data";

const STYLES: Record<BreakType, string> = {
  meal: "border-primary/25 bg-primary-weak text-primary",
  rest: "border-hairline bg-surface-3 text-ink-subtle",
};

const LABELS: Record<BreakType, string> = {
  meal: "Meal break",
  rest: "Rest break",
};

export default function BreakTypeBadge({ type }: { type: BreakType }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${STYLES[type]}`}
    >
      {LABELS[type]}
    </span>
  );
}
