"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useCompany } from "@/lib/company-data";
import { formatDateTime } from "@/lib/format";
import { BellIcon, CheckIcon, UsersIcon } from "@/components/ui/icons";

export default function EmployeeNotificationsPage() {
  const { user } = useAuth();
  const { people, activity, markActivityRead, markAllActivityRead } = useCompany();

  const myPerson = useMemo(
    () =>
      people.find(
        (p) => p.role === "employee" && p.email.toLowerCase() === user?.email.toLowerCase(),
      ) ?? null,
    [people, user?.email],
  );

  const myActivity = useMemo(() => {
    if (!myPerson) return [];
    return activity.filter((a) => a.personId === myPerson.id);
  }, [activity, myPerson]);

  const unreadCount = myActivity.filter((a) => !a.read).length;

  if (!myPerson) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Notifications</h1>
        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <UsersIcon className="mx-auto size-11 text-ink-faint" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">
            You&apos;re not linked to a team member record yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Ask your manager to invite you with the employee role.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <BellIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Notifications</h1>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={unreadCount === 0}
          onClick={() => markAllActivityRead(myPerson.id)}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckIcon className="size-3.5" />
          Mark all read
        </button>
      </div>

      {myActivity.length === 0 ? (
        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <BellIcon className="mx-auto size-11 text-ink-faint" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">No notifications yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Updates about your shifts and account will show up here.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <ul className="divide-y divide-hairline/60">
            {myActivity.map((a) => (
              <li
                key={a.id}
                className={`flex items-center justify-between gap-4 px-4 py-3 ${
                  !a.read ? "bg-primary-weak/30" : ""
                }`}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                      a.read ? "bg-transparent" : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className={`text-[13px] ${a.read ? "text-ink-muted" : "font-medium text-ink"}`}>
                      {a.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-subtle">
                      {formatDateTime(a.timestamp)}
                    </p>
                  </div>
                </div>
                {!a.read && (
                  <button
                    type="button"
                    onClick={() => markActivityRead(a.id)}
                    className="shrink-0 rounded-md border border-hairline bg-surface-3 px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:text-ink"
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
