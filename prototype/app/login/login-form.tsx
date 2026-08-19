"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { homeForRole, useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import LogoMark from "@/components/ui/Logo";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  MoonIcon,
  SunIcon,
} from "@/components/ui/icons";

export default function LoginForm() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace(homeForRole(user.role));
  }, [user, router]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const result = await signIn(email, password);
    if (result.ok) {
      router.replace(homeForRole(result.user?.role));
    } else {
      setError(result.error ?? "Unable to sign in.");
    }
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
        <div className="mt-6 flex flex-col items-center gap-3">
          <LogoMark className="size-11" />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Roster
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Sign in to the platform admin console
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-4 rounded-xl border border-hairline bg-surface-2 p-6"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-ink-muted"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-ink-muted"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 w-full rounded-lg border border-hairline bg-surface-3 pr-9 pl-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-subtle transition-colors hover:text-ink"
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-5 h-9 w-full rounded-lg bg-primary text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Sign in
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href="/register"
            className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            <ArrowLeftIcon className="size-3.5" />
            New to Roster? Create an account
          </Link>
          <Link
            href="/"
            className="shrink-0 text-xs text-ink-subtle transition-colors hover:text-ink-muted"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}