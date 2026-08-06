"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_BRANDING,
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  LOCALES,
  TIMEZONES,
  readCompanySetup,
  saveCompanySettings,
  slugify,
} from "@/lib/company";
import { COMPANY_COLORS } from "@/lib/data";
import {
  BuildingIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  PaletteIcon,
  SaveIcon,
} from "@/components/admin/icons";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none";

export default function SettingsForm() {
  const { user } = useAuth();
  const [setup] = useState(() => readCompanySetup());

  const [name, setName] = useState(setup?.company ?? user?.company ?? "");
  const [timezone, setTimezone] = useState(setup?.timezone ?? DEFAULT_TIMEZONE);
  const [locale, setLocale] = useState(setup?.locale ?? DEFAULT_LOCALE);
  const [branding, setBranding] = useState(
    setup?.brandingColor ?? DEFAULT_BRANDING,
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    name.trim() !== (setup?.company ?? "") ||
    timezone !== (setup?.timezone ?? DEFAULT_TIMEZONE) ||
    locale !== (setup?.locale ?? DEFAULT_LOCALE) ||
    branding !== (setup?.brandingColor ?? DEFAULT_BRANDING);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Company name can't be empty.");
      return;
    }

    const result = saveCompanySettings({
      company: name.trim(),
      timezone,
      locale,
      brandingColor: branding,
    });
    if (!result) {
      setError("Couldn't save — storage unavailable.");
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Company Settings
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Workspace identity, regional defaults, and branding for{" "}
            {setup?.company ?? "your company"}.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {saved && (
            <span className="flex items-center gap-1.5 rounded-lg border border-success/25 bg-success-weak px-2.5 py-1.5 text-xs font-medium text-success">
              <CheckIcon className="size-3.5" />
              Settings saved
            </span>
          )}
          <button
            type="submit"
            disabled={!dirty}
            className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SaveIcon className="size-3.5" />
            Save changes
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <section className="rounded-xl border border-hairline bg-surface-2 p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
              <BuildingIcon className="size-4" />
            </span>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              General
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="company"
                className="block text-xs font-medium text-ink-muted"
              >
                Company name
              </label>
              <input
                id="company"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="GreenLeaf Cafe"
                className={inputClass}
              />
              <p className="mt-1.5 font-mono text-[11px] text-ink-subtle">
                {slugify(name) || "your-slug"}·rosterapp.com
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Admin email
              </label>
              <input
                type="email"
                value={user?.email ?? ""}
                readOnly
                className={`${inputClass} cursor-not-allowed opacity-60`}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-hairline bg-surface-2 p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
              <ClockIcon className="size-4" />
            </span>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Regional
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                  className={selectClass}
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
                Schedules display in this timezone by default.
              </p>
            </div>

            <div>
              <label
                htmlFor="locale"
                className="block text-xs font-medium text-ink-muted"
              >
                Locale
              </label>
              <div className="relative mt-1.5">
                <select
                  id="locale"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className={selectClass}
                >
                  {LOCALES.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-hairline bg-surface-2 p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
              <PaletteIcon className="size-4" />
            </span>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Branding
            </h2>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-ink-muted">
              Primary color
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {COMPANY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use ${color}`}
                  onClick={() => setBranding(color)}
                  className={`size-7 rounded-full border-2 transition-transform ${
                    branding === color
                      ? "scale-110 border-white/80"
                      : "border-hairline hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <label className="flex h-7 items-center gap-2 rounded-full border border-hairline bg-surface-1 px-2.5 text-[11px] font-medium text-ink-muted">
                Custom
                <input
                  type="color"
                  value={branding}
                  onChange={(e) => setBranding(e.target.value)}
                  className="size-5 cursor-pointer border-0 bg-transparent p-0"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-lg border border-hairline bg-surface-1 px-3.5 py-3">
              <span
                className="flex h-7 w-16 items-center justify-center rounded-md text-xs font-medium text-white"
                style={{ backgroundColor: branding }}
              >
                Preview
              </span>
              <p className="text-[11px] text-ink-subtle">
                Applied across the console — buttons, links, and active states.
              </p>
            </div>
          </div>
        </section>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}

      <p className="mt-6 text-center text-[11px] text-ink-faint">
        Settings are stored in your browser for this prototype.
      </p>
    </form>
  );
}