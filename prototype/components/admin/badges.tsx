import type { CompanyStatus } from "@/lib/data";
import { initials } from "@/lib/format";

export function StatusBadge({ status }: { status: CompanyStatus }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${
        active
          ? "border-success/25 bg-success-weak text-success"
          : "border-danger/25 bg-danger-weak text-danger"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${active ? "bg-success" : "bg-danger"}`}
      />
      {status}
    </span>
  );
}

export function CompanyAvatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg" ? "size-12 text-base" : size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg font-semibold tracking-tight ${dims}`}
      style={{
        backgroundColor: `${color}24`,
        color,
        border: `1px solid ${color}3d`,
      }}
    >
      {initials(name)}
    </span>
  );
}