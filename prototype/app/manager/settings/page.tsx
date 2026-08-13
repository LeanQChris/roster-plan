"use client";

import { useAuth } from "@/lib/auth";
import ChangePasswordCard from "@/components/settings/ChangePasswordCard";

export default function ManagerSettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
          {user?.name
            ? user.name
                .split(/\s+/)
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "TM"}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Settings
          </h1>
          <p className="mt-0.5 text-xs text-ink-subtle">
            Your account details and sign-in security
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-hairline bg-surface-2 p-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">
          Account
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="block text-xs font-medium text-ink-muted">Name</p>
            <p className="mt-1 text-[13px] font-medium text-ink">
              {user?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="block text-xs font-medium text-ink-muted">Email</p>
            <p className="mt-1 text-[13px] font-medium text-ink">
              {user?.email ?? "—"}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <p className="block text-xs font-medium text-ink-muted">Role</p>
          <p className="mt-1 text-[13px] font-medium text-ink">
            Manager
          </p>
        </div>
      </section>

      <div className="mt-4">
        <ChangePasswordCard />
      </div>
    </div>
  );
}
