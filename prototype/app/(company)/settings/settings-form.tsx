"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_BRANDING,
  DEFAULT_BREAK_POLICY,
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  LOCALES,
  TIMEZONES,
  getCompanySettings,
  saveCompanySettings,
  slugify,
} from "@/lib/company";
import type { BreakPolicy, CompanySettings } from "@/lib/company";
import { COMPANY_COLORS } from "@/lib/data";
import ChangePasswordCard from "@/components/settings/ChangePasswordCard";
import {
  BuildingIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  ImageIcon,
  PaletteIcon,
  PauseIcon,
  SaveIcon,
  TrashIcon,
} from "@/components/ui/icons";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-hairline bg-surface-3 px-3 pr-9 text-[13px] text-ink transition-colors focus:border-primary/60 focus:outline-none";

const LOGO_MAX_BYTES = 1024 * 1024; // 1MB
const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

export default function SettingsForm() {
  const { user } = useAuth();
  const [setup, setSetup] = useState<CompanySettings | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState(user?.company ?? "");
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [logoUrl, setLogoUrl] = useState("");
  const [breakPolicy, setBreakPolicy] = useState<BreakPolicy>(DEFAULT_BREAK_POLICY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    getCompanySettings().then((result) => {
      if (cancelled) return;
      setSetup(result);
      setLoaded(true);
      if (result) {
        setName(result.name);
        setTimezone(result.timezone);
        setLocale(result.locale);
        setBranding(result.brandingColor);
        setLogoUrl(result.logoUrl ?? "");
        setBreakPolicy(result.breakPolicy);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty =
    loaded &&
    (name.trim() !== (setup?.name ?? "") ||
      timezone !== (setup?.timezone ?? DEFAULT_TIMEZONE) ||
      locale !== (setup?.locale ?? DEFAULT_LOCALE) ||
      branding !== (setup?.brandingColor ?? DEFAULT_BRANDING) ||
      logoUrl !== (setup?.logoUrl ?? "") ||
      JSON.stringify(breakPolicy) !==
        JSON.stringify(setup?.breakPolicy ?? DEFAULT_BREAK_POLICY));

  const onLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    if (!LOGO_TYPES.includes(file.type)) {
      setError("Logo must be PNG, JPG, WEBP, or SVG.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError("Logo must be under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Company name can't be empty.");
      return;
    }

    const result = await saveCompanySettings({
      name: name.trim(),
      timezone,
      locale,
      brandingColor: branding,
      logoUrl: logoUrl || null,
      breakPolicy,
    });
    if (!result) {
      setError("Couldn't save changes.");
      return;
    }
    setSetup(result);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Company Settings
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Workspace identity, regional defaults, and branding for{" "}
            {setup?.name ?? "your company"}.
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

          <div className="mt-4">
            <p className="block text-xs font-medium text-ink-muted">Logo</p>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-surface-3">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Company logo"
                    className="size-full object-contain"
                  />
                ) : (
                  <ImageIcon className="size-5 text-ink-subtle" />
                )}
              </span>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-4"
                  >
                    <ImageIcon className="size-3.5" />
                    {logoUrl ? "Replace logo" : "Upload logo"}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      aria-label="Remove logo"
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] font-medium text-danger transition-colors hover:bg-danger-weak"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-ink-subtle">
                  PNG, JPG, WEBP, or SVG. Up to 1MB.
                </p>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept={LOGO_TYPES.join(",")}
                onChange={onLogoChange}
                className="hidden"
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

        <section className="rounded-xl border border-hairline bg-surface-2 p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
              <PauseIcon className="size-4" />
            </span>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Break Policy
            </h2>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              id="break-enabled"
              type="checkbox"
              checked={breakPolicy.enabled}
              onChange={(e) =>
                setBreakPolicy((p) => ({ ...p, enabled: e.target.checked }))
              }
              className="size-4 rounded border-hairline bg-surface-3 text-primary focus:ring-primary/30"
            />
            <label htmlFor="break-enabled" className="text-[13px] text-ink-muted">
              Enable break tracking
            </label>
          </div>

          <div
            className={`mt-4 grid gap-4 sm:grid-cols-2 ${
              breakPolicy.enabled ? "" : "cursor-not-allowed opacity-60"
            }`}
          >
            <div className="space-y-3">
              <p className="text-xs font-semibold text-ink-muted">Meal breaks</p>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Trigger after (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={!breakPolicy.enabled}
                  value={breakPolicy.mealBreakThresholdMinutes}
                  onChange={(e) =>
                    setBreakPolicy((p) => ({
                      ...p,
                      mealBreakThresholdMinutes: Number(e.target.value) || 0,
                    }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Minimum duration (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={!breakPolicy.enabled}
                  value={breakPolicy.mealBreakMinMinutes}
                  onChange={(e) =>
                    setBreakPolicy((p) => ({
                      ...p,
                      mealBreakMinMinutes: Number(e.target.value) || 0,
                    }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Max meal breaks / shift
                </label>
                <input
                  type="number"
                  min={1}
                  disabled={!breakPolicy.enabled}
                  value={breakPolicy.maxMealBreaksPerShift}
                  onChange={(e) =>
                    setBreakPolicy((p) => ({
                      ...p,
                      maxMealBreaksPerShift: Number(e.target.value) || 1,
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-ink-muted">Rest breaks</p>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Trigger after (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={!breakPolicy.enabled}
                  value={breakPolicy.restBreakThresholdMinutes}
                  onChange={(e) =>
                    setBreakPolicy((p) => ({
                      ...p,
                      restBreakThresholdMinutes: Number(e.target.value) || 0,
                    }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Minimum duration (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={!breakPolicy.enabled}
                  value={breakPolicy.restBreakMinMinutes}
                  onChange={(e) =>
                    setBreakPolicy((p) => ({
                      ...p,
                      restBreakMinMinutes: Number(e.target.value) || 0,
                    }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Max rest breaks / shift
                </label>
                <input
                  type="number"
                  min={1}
                  disabled={!breakPolicy.enabled}
                  value={breakPolicy.maxRestBreaksPerShift}
                  onChange={(e) =>
                    setBreakPolicy((p) => ({
                      ...p,
                      maxRestBreaksPerShift: Number(e.target.value) || 1,
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </form>

    <div className="mt-4">
      <ChangePasswordCard />
    </div>
  </div>
  );
}