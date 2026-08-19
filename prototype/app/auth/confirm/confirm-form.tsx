"use client";

import { useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import LogoMark from "@/components/ui/Logo";
import { MoonIcon, SunIcon } from "@/components/ui/icons";

// Deliberately requires an explicit button click before calling verifyOtp().
// If we auto-verified on page load (GET), email security scanners that
// prefetch links in incoming mail would burn the single-use token before
// the invitee ever opens it — scanners follow redirects but don't click
// buttons or submit forms.
export default function ConfirmInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = !!tokenHash && !!type;

  const onConfirm = async () => {
    if (!tokenHash || !type) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    setSubmitting(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    router.replace(next);
  };

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
              Confirm your invite
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {valid
                ? "Click below to confirm and set your password."
                : "This invite link is missing or malformed."}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-hairline bg-surface-2 p-6">
          {(error || !valid) && (
            <p className="mb-4 rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
              {error ?? "Ask your admin to resend the invite, then open the new link."}
            </p>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={!valid || submitting}
            className="h-9 w-full rounded-lg bg-primary text-[13px] font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Confirming…" : "Confirm invite"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <Link
            href="/login"
            className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
