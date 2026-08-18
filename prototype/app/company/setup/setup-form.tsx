"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { DEFAULT_TIMEZONE, TIMEZONES, completeCompanySetup } from "@/lib/company";
import LogoMark from "@/components/ui/Logo";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  MoonIcon,
  SunIcon,
} from "@/components/ui/icons";

export default function SetupForm() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!timezone) {
      setError("Choose a timezone.");
      return;
    }

    setSubmitting(true);
    const result = await completeCompanySetup(timezone);
    setSubmitting(false);
    if (!result) {
      setError("Couldn't save setup — try again.");
      return;
    }
    router.replace("/dashboard");
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="fixed right-4 top-4 rounded-lg border border-hairline bg-surface-2 p-2 text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
      >
        {theme === "dark" ? (
          <SunIcon className="size-4" />
        ) : (
          <MoonIcon className="size-4" />
        )}
      </button>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="size-11" />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Set up your company
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {user.company ? `${user.company} — ` : ""}almost ready
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-xl border border-hairline bg-surface-2 p-6"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="timezone"
                className="block text-xs font-medium text-ink-muted"
              >
                Timezone
              </label>
              <div className="relative mt-1.5">
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="h-9 w-full appearance-none rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
              </div>
              <p className="mt-1.5 text-[11px] text-ink-subtle">
                Schedules display in this company timezone by default.
              </p>
            </div>

          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 h-9 w-full rounded-lg bg-primary text-[13px] font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Saving…" : "Continue to Dashboard"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            <ArrowLeftIcon className="size-3.5" />
            Sign in with another account
          </button>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="shrink-0 text-xs text-ink-subtle transition-colors hover:text-ink-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}