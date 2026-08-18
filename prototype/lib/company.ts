"use client";

import { createClient } from "@/lib/supabase/client";

export interface BreakPolicy {
  enabled: boolean;
  mealBreakThresholdMinutes: number;
  mealBreakMinMinutes: number;
  restBreakThresholdMinutes: number;
  restBreakMinMinutes: number;
  maxMealBreaksPerShift: number;
  maxRestBreaksPerShift: number;
}

export const DEFAULT_BREAK_POLICY: BreakPolicy = {
  enabled: true,
  mealBreakThresholdMinutes: 5 * 60,
  mealBreakMinMinutes: 30,
  restBreakThresholdMinutes: 4 * 60,
  restBreakMinMinutes: 10,
  maxMealBreaksPerShift: 1,
  maxRestBreaksPerShift: 3,
};

export const DEFAULT_TIMEZONE = "America/New_York";
export const DEFAULT_LOCALE = "en-US";
export const DEFAULT_BRANDING = "#5e6ad2";

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export const LOCALES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "de-DE", label: "Deutsch (Deutschland)" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "hi-IN", label: "हिन्दी (भारत)" },
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface CompanySettings {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  locale: string;
  brandingColor: string;
  logoUrl: string | null;
  breakPolicy: BreakPolicy;
  completedSetupAt: string | null;
}

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  locale: string;
  branding_color: string | null;
  logo_url: string | null;
  break_policy: BreakPolicy;
  completed_setup_at: string | null;
}

const COMPANY_COLUMNS =
  "id, name, slug, timezone, locale, branding_color, logo_url, break_policy, completed_setup_at";

function fromRow(row: CompanyRow): CompanySettings {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    timezone: row.timezone,
    locale: row.locale,
    brandingColor: row.branding_color ?? DEFAULT_BRANDING,
    logoUrl: row.logo_url,
    breakPolicy: row.break_policy ?? DEFAULT_BREAK_POLICY,
    completedSetupAt: row.completed_setup_at,
  };
}

/** Reads the signed-in user's company row. RLS scopes this to their own company. */
export async function getCompanySettings(): Promise<CompanySettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .maybeSingle();
  if (error || !data) return null;
  return fromRow(data as CompanyRow);
}

export interface CompanySettingsPatch {
  name?: string;
  timezone?: string;
  locale?: string;
  brandingColor?: string;
  logoUrl?: string | null;
  breakPolicy?: BreakPolicy;
}

/**
 * Updates the signed-in admin's company row. RLS (companies_update policy)
 * scopes this to their own company and requires the company_admin role.
 */
export async function saveCompanySettings(
  patch: CompanySettingsPatch,
): Promise<CompanySettings | null> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.timezone !== undefined) update.timezone = patch.timezone;
  if (patch.locale !== undefined) update.locale = patch.locale;
  if (patch.brandingColor !== undefined) update.branding_color = patch.brandingColor;
  if (patch.logoUrl !== undefined) update.logo_url = patch.logoUrl;
  if (patch.breakPolicy !== undefined) update.break_policy = patch.breakPolicy;

  const { data, error } = await supabase
    .from("companies")
    .update(update)
    .select(COMPANY_COLUMNS)
    .single();
  if (error || !data) return null;
  return fromRow(data as CompanyRow);
}

/** Reads the signed-in user's company break policy, falling back to defaults. */
export async function getBreakPolicy(): Promise<BreakPolicy> {
  const settings = await getCompanySettings();
  return settings?.breakPolicy ?? DEFAULT_BREAK_POLICY;
}

/** Marks the company setup wizard complete and records the chosen timezone. */
export async function completeCompanySetup(
  timezone: string,
): Promise<CompanySettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .update({ timezone, completed_setup_at: new Date().toISOString() })
    .select(COMPANY_COLUMNS)
    .single();
  if (error || !data) return null;
  return fromRow(data as CompanyRow);
}
