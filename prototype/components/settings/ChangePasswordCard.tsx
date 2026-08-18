"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { CheckIcon, EyeIcon, EyeOffIcon, ShieldIcon } from "@/components/ui/icons";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
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
          autoComplete={label === "Current password" ? "current-password" : "new-password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className={inputClass}
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

export default function ChangePasswordCard() {
  const router = useRouter();
  const { changePassword, signOut } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!current || !next || !confirm) {
      setError("Fill in every field.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next === current) {
      setError("New password must be different from the current one.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    const result = await changePassword(current, next);
    if (!result.ok) {
      setError(result.error ?? "Couldn't change password.");
      return;
    }
    setSaved(true);
    window.setTimeout(async () => {
      await signOut();
      router.replace("/login");
    }, 600);
  };

  return (
    <section className="rounded-xl border border-hairline bg-surface-2 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
            <ShieldIcon className="size-4" />
          </span>
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">
            Change password
          </h2>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 rounded-lg border border-success/25 bg-success-weak px-2.5 py-1.5 text-xs font-medium text-success">
            <CheckIcon className="size-3.5" />
            Password updated
          </span>
        )}
      </div>

      <form onSubmit={onSubmit}>
        <div className="mt-4 space-y-4">
          <PasswordField
            id="change-current"
            label="Current password"
            value={current}
            onChange={setCurrent}
            visible={showCurrent}
            onToggleVisible={setShowCurrent}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              id="change-new"
              label="New password"
              value={next}
              onChange={setNext}
              visible={showNext}
              onToggleVisible={setShowNext}
            />
            <PasswordField
              id="change-confirm"
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              visible={showConfirm}
              onToggleVisible={setShowConfirm}
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          <button
            type="submit"
            className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <ShieldIcon className="size-3.5" />
            Update password
          </button>
        </div>
      </form>
    </section>
  );
}
