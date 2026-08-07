import type { Person, PersonRole } from "@/lib/company-data";

const statusStyles: Record<Person["status"], string> = {
  active: "border-success/25 bg-success-weak text-success",
  invited: "border-primary/25 bg-primary-weak text-primary",
  inactive: "border-hairline bg-surface-3 text-ink-subtle",
};

const statusLabel: Record<Person["status"], string> = {
  active: "Active",
  invited: "Invited",
  inactive: "Inactive",
};

export function PersonStatusBadge({ status }: { status: Person["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusStyles[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "active"
            ? "bg-success"
            : status === "invited"
              ? "bg-primary"
              : "bg-ink-subtle"
        }`}
      />
      {statusLabel[status]}
    </span>
  );
}

export function PersonRoleBadge({ role }: { role: PersonRole }) {
  return (
    <span className="rounded-md border border-hairline bg-surface-3 px-2 py-0.5 text-[11px] font-medium text-ink-muted">
      {role === "manager" ? "Manager" : "Employee"}
    </span>
  );
}