export interface CompanySetup {
  company: string;
  email: string;
  timezone: string;
  team: string;
  completeAt: string;
  locale?: string;
  brandingColor?: string;
  logoUrl?: string;
  breakPolicy?: BreakPolicy;
}

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

export function getBreakPolicy(): BreakPolicy {
  return readCompanySetup()?.breakPolicy ?? DEFAULT_BREAK_POLICY;
}

export const SETUP_KEY = "roster.setup";

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

export function readCompanySetup(): CompanySetup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SETUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompanySetup;
    return parsed?.company && parsed?.team ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCompanySettings(
  patch: Partial<CompanySetup>,
): CompanySetup | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = readCompanySetup();
    const next: CompanySetup = {
      company: patch.company ?? existing?.company ?? "",
      email: patch.email ?? existing?.email ?? "",
      timezone: patch.timezone ?? existing?.timezone ?? DEFAULT_TIMEZONE,
      team: patch.team ?? existing?.team ?? "General",
      completeAt: existing?.completeAt ?? new Date().toISOString(),
      locale: patch.locale ?? existing?.locale ?? DEFAULT_LOCALE,
      brandingColor:
        patch.brandingColor ?? existing?.brandingColor ?? DEFAULT_BRANDING,
      logoUrl: patch.logoUrl ?? existing?.logoUrl,
      breakPolicy: patch.breakPolicy ?? existing?.breakPolicy ?? DEFAULT_BREAK_POLICY,
    };
    window.localStorage.setItem(SETUP_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}