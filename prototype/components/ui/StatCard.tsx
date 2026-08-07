import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "success" | "danger" | "primary";
}

const toneText: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-ink",
  success: "text-success",
  danger: "text-danger",
  primary: "text-primary",
};

export default function StatCard({ label, value, sub, icon, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
          {label}
        </span>
        {icon && <span className="text-ink-subtle">{icon}</span>}
      </div>
      <div className={`mt-2 text-[26px] font-semibold leading-7 tracking-tight ${toneText[tone]}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}