"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { CompanyProvider, useCompany } from "@/lib/company-data";
import type { Person } from "@/lib/company-data";
import { useTheme } from "@/lib/theme";
import LogoMark from "@/components/ui/Logo";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  MoonIcon,
  SunIcon,
} from "@/components/ui/icons";

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  visible,
  onToggleVisible,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  visible: boolean;
  onToggleVisible: (visible: boolean) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-ink-muted">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          className="h-9 w-full rounded-lg border border-hairline bg-surface-3 pr-9 pl-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onToggleVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-subtle transition-colors hover:text-ink"
        >
          {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function AcceptInviteContent() {
  const router = useRouter();
  const { registerEmployee } = useAuth();
  const { people, updatePerson } = useCompany();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [person, setPerson] = useState<Person | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const submitEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError(null);
    const normalized = email.trim().toLowerCase();
    const match = people.find(
      (p) =>
        p.email.toLowerCase() === normalized &&
        p.role === "employee" &&
        p.status === "invited",
    );
    if (!match) {
      setEmailError("No pending invite found for this email.");
      return;
    }
    setPerson(match);
  };

  const submitPassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    if (!person) return;

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setPasswordError("Passwords do not match.");
      return;
    }

    updatePerson(person.id, { status: "active" });
    const result = registerEmployee({
      email: person.email,
      password,
      personId: person.id,
      name: person.name,
    });
    if (!result.ok) {
      setPasswordError(result.error ?? "Unable to activate your account.");
      return;
    }
    router.replace("/employee/dashboard");
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
              {person ? "Create your password" : "Accept your invite"}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {person
                ? `Set a password for ${person.email}`
                : "Enter the email your invite was sent to"}
            </p>
          </div>
        </div>

        {!person ? (
          <form
            onSubmit={submitEmail}
            className="mt-6 rounded-xl border border-hairline bg-surface-2 p-6"
          >
            <label htmlFor="email" className="block text-xs font-medium text-ink-muted">
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

            {emailError && (
              <p className="mt-4 rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
                {emailError}
              </p>
            )}

            <button
              type="submit"
              className="mt-5 h-9 w-full rounded-lg bg-primary text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Continue
            </button>
          </form>
        ) : (
          <form
            onSubmit={submitPassword}
            className="mt-6 rounded-xl border border-hairline bg-surface-2 p-6"
          >
            <div className="space-y-4">
              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                visible={showPassword}
                onToggleVisible={setShowPassword}
              />
              <PasswordField
                id="confirm"
                label="Confirm"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                visible={showConfirm}
                onToggleVisible={setShowConfirm}
              />
            </div>

            {passwordError && (
              <p className="mt-4 rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              className="mt-5 h-9 w-full rounded-lg bg-primary text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Activate account
            </button>

            <button
              type="button"
              onClick={() => setPerson(null)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
            >
              <ArrowLeftIcon className="size-3.5" />
              Use a different email
            </button>
          </form>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to sign in
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

export default function AcceptInviteForm() {
  return (
    <CompanyProvider>
      <AcceptInviteContent />
    </CompanyProvider>
  );
}
