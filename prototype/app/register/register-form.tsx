"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import LogoMark from "@/components/admin/Logo";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
} from "@/components/admin/icons";

const CODE_LENGTH = 6;

function generateCode(): string {
  return Math.floor(Math.random() * 900000 + 100000).toString();
}

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

interface PendingSignup {
  email: string;
  password: string;
  company: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const { registerAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [pending, setPending] = useState<PendingSignup | null>(null);
  const [code, setCode] = useState(generateCode());

  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const submitStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAccountError(null);

    if (!email.trim() || !company.trim() || !password) {
      setAccountError("Please fill out every field.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setAccountError("Enter a valid work email (e.g. you@company.com).");
      return;
    }
    if (password.length < 8) {
      setAccountError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setAccountError("Passwords do not match.");
      return;
    }

    // Static prototype — no 6-digit code is actually emailed; it's shown in the demo box.
    setPending({
      email: email.trim().toLowerCase(),
      password,
      company: company.trim(),
    });
    setCode(generateCode());
    setCodeInput("");
    setCodeError(null);
    setResent(false);
  };

  const verifyCode = (value: string) => {
    if (value !== code) {
      setCodeError("That code doesn't match. Double-check or resend.");
      setCodeInput("");
      return;
    }

    if (!pending) return;
    const result = registerAdmin({
      email: pending.email,
      password: pending.password,
      company: pending.company,
    });
    if (!result.ok) {
      setCodeError(result.error ?? "Unable to create the account.");
      return;
    }
    router.replace("/company/setup");
  };

  const resend = () => {
    const next = generateCode();
    setCode(next);
    setCodeError(null);
    setCodeInput("");
    setResent(true);
  };

  if (pending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-3">
            <LogoMark className="size-11" />
            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight text-ink">
                Check your email
              </h1>
              <p className="mt-1 text-sm text-ink-muted">
                We sent a {CODE_LENGTH}-digit code to{" "}
                <span className="font-medium text-ink">{pending.email}</span>
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyCode(codeInput);
            }}
            className="mt-6 rounded-xl border border-hairline bg-surface-2 p-6"
          >
            <label
              htmlFor="code"
              className="block text-xs font-medium text-ink-muted"
            >
              Verification code
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoFocus
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={codeInput}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, CODE_LENGTH);
                setCodeInput(value);
                if (value.length === CODE_LENGTH) verifyCode(value);
              }}
              placeholder="······"
              className="mt-1.5 h-12 w-full rounded-lg border border-hairline bg-surface-3 text-center text-lg font-semibold tracking-[0.35em] text-ink placeholder:text-ink-faint transition-colors focus:border-primary/60 focus:outline-none"
            />

            {codeError && (
              <p className="mt-4 rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
                {codeError}
              </p>
            )}

            <button
              type="submit"
              disabled={codeInput.length !== CODE_LENGTH}
              className="mt-5 h-9 w-full rounded-lg bg-primary text-[13px] font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Verify &amp; continue
            </button>
          </form>

          <div className="mt-4 rounded-lg border border-hairline bg-surface-2 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
              <ShieldIcon className="size-3.5" />
              Static prototype — no email is actually sent
            </p>
            <p className="mt-2 text-[11px] text-ink-muted">
              Your code is
              <span className="ml-1.5 font-mono text-[15px] font-semibold tracking-[0.3em] text-ink">
                {code}
              </span>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPending(null)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
            >
              <ArrowLeftIcon className="size-3.5" />
              Change email address
            </button>
            <button
              type="button"
              onClick={resend}
              className="shrink-0 text-xs text-ink-subtle transition-colors hover:text-ink-muted"
            >
              Resend code
            </button>
          </div>

          <p
            className={`mt-3 text-center text-[11px] font-medium transition-opacity ${resent ? "text-success opacity-100" : "opacity-0"}`}
            aria-hidden={!resent}
          >
            A new code has been sent.
          </p>
        </div>
      </div>
    );
  }

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
              Create your company
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Register the admin account for your workspace
            </p>
          </div>
        </div>

        <form
          onSubmit={submitStep}
          className="mt-6 rounded-xl border border-hairline bg-surface-2 p-6"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="company" className="block text-xs font-medium text-ink-muted">
                Company name
              </label>
              <input
                id="company"
                type="text"
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="GreenLeaf Cafe"
                className="mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-ink-muted">
                Your email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@greenleaf.io"
                className="mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
              />
            </div>

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

          {accountError && (
            <p className="mt-4 rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
              {accountError}
            </p>
          )}

          <button
            type="submit"
            className="mt-5 h-9 w-full rounded-lg bg-primary text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Create Account
          </button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-subtle">
            A verification code will be sent to your email to confirm the
            account.
          </p>
        </form>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            <ArrowLeftIcon className="size-3.5" />
            Already have an account? Sign in
          </Link>
          <Link
            href="/"
            className="shrink-0 text-xs text-ink-subtle transition-colors hover:text-ink-muted"
          >
            Back to home
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-faint">
          Static prototype — the account is stored only in your browser.
        </p>
      </div>
    </div>
  );
}