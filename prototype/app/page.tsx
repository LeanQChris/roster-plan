"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme";
import LogoMark from "@/components/ui/Logo";
import {
  ActivityIcon,
  ArrowRightIcon,
  BuildingIcon,
  ClockIcon,
  DownloadIcon,
  FingerprintIcon,
  ListIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
  UsersIcon,
} from "@/components/ui/icons";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

const FEATURES = [
  {
    icon: UsersIcon,
    title: "Teams & people",
    body: "Organize your staff into teams, invite people by email, and keep one accurate directory of who works where.",
  },
  {
    icon: ClockIcon,
    title: "Shift templates",
    body: "Build shifts once with repeat rules, then let the week unfold automatically — no more copy-pasting Monday.",
  },
  {
    icon: DownloadIcon,
    title: "One-click publish",
    body: "Expand templates into a concrete schedule and publish it in a single action. Everyone sees the same truth.",
  },
  {
    icon: FingerprintIcon,
    title: "Clock in / out",
    body: "Simple, append-only clock entries. Perfect attendance data for payroll and compliance — recorded as it happens.",
  },
  {
    icon: ShieldIcon,
    title: "Role-based access",
    body: "Four clean roles — admin, manager, employee, super admin — enforced at every layer, from database to screen.",
  },
  {
    icon: ListIcon,
    title: "Audit-ready by design",
    body: "Every admin action lands in a tamper-evident, HMAC-chained audit log. Built for SOC 2 and GDPR from day one.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create your workspace",
    body: "Register the admin account for your company in under a minute. Your workspace is ready to fill.",
  },
  {
    step: "02",
    title: "Build the week",
    body: "Add teams, set up shift templates with repeat rules, assign your people, and publish the schedule.",
  },
  {
    step: "03",
    title: "Run the operation",
    body: "Your team clocks in and out, you watch coverage at a glance, and every change stays on record.",
  },
];

const WEEK = [
  { day: "Mon", label: "Mon 6", shifts: [{ t: "9a – 5p", tone: "primary", h: "flex-1" }] },
  {
    day: "Tue",
    label: "Tue 7",
    shifts: [
      { t: "7a – 3p", tone: "primary", h: "flex-1" },
      { t: "3p – 11p", tone: "success", h: "flex-1" },
    ],
  },
  { day: "Wed", label: "Wed 8", shifts: [{ t: "12p – 8p", tone: "primary", h: "flex-1" }] },
  { day: "Thu", label: "Thu 9", shifts: [] },
  { day: "Fri", label: "Fri 10", shifts: [{ t: "9a – 5p", tone: "primary", h: "flex-1" }] },
  {
    day: "Sat",
    label: "Sat 11",
    shifts: [
      { t: "8a – 2p", tone: "success", h: "flex-1" },
      { t: "2p – 10p", tone: "primary", h: "flex-1" },
    ],
  },
  { day: "Sun", label: "Sun 12", shifts: [{ t: "10a – 6p", tone: "success", h: "flex-1" }] },
];

const toneClasses: Record<string, { chip: string; dot: string }> = {
  primary: { chip: "border-primary/30 bg-primary-weak text-primary", dot: "bg-primary" },
  success: { chip: "border-success/30 bg-success-weak text-success", dot: "bg-success" },
};

function SchedulePreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl sm:mt-20">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_40%,rgba(94,106,210,0.22),transparent_70%)] blur-2xl"
      />
      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-[0_32px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-2 border-b border-hairline bg-surface-2 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-danger/70" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
          <span className="ml-3 rounded-md border border-hairline bg-surface-1 px-2 py-0.5 font-mono text-[10px] text-ink-subtle">
            roster.app / week-of-jul-06
          </span>
          <span className="ml-auto hidden items-center gap-1.5 rounded-md border border-primary/30 bg-primary-weak px-2 py-0.5 text-[10px] font-medium text-primary sm:flex">
            <span className="size-1 rounded-full bg-primary" />
            Published
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEK.map((col) => (
              <div key={col.day} className="flex min-w-0 flex-col">
                <div className="mb-2 text-center">
                  <p className="text-[11px] font-semibold text-ink">{col.day}</p>
                  <p className="font-mono text-[10px] text-ink-subtle">{col.label}</p>
                </div>
                <div className="flex h-32 flex-col gap-1.5 rounded-lg border border-hairline/60 bg-canvas/60 p-1.5">
                  {col.shifts.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                      <span className="text-[10px] text-ink-faint">—</span>
                    </div>
                  ) : (
                    col.shifts.map((s, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 rounded-md border px-1.5 ${toneClasses[s.tone].chip} ${s.h}`}
                      >
                        <span className={`size-1 shrink-0 rounded-full ${toneClasses[s.tone].dot}`} />
                        <span className="truncate text-[10px] font-medium">{s.t}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-hairline/60 pt-3 text-[11px] text-ink-subtle">
            <span>
              <span className="font-semibold text-ink">14 shifts</span> published
              <span className="mx-2 text-ink-faint">·</span>
              <span className="font-semibold text-ink">8 of 12</span> people assigned
            </span>
            <span className="hidden items-center gap-1 font-medium text-primary sm:flex">
              <ActivityIcon className="size-3" />
              Live coverage
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="text-[15px] font-semibold tracking-tight text-ink">Roster</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {theme === "dark" ? (
                <SunIcon className="size-4" />
              ) : (
                <MoonIcon className="size-4" />
              )}
            </button>
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Get started
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(50%_50%_at_50%_0%,rgba(94,106,210,0.16),transparent_70%)]"
          />
          <div className="mx-auto max-w-6xl px-6 pb-16 pt-16 text-center sm:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-weak px-3 py-1 text-xs font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Workforce scheduling, reinvented
            </span>

            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Plan the week.
              <br />
              Publish in one click.
              <br />
              <span className="text-ink-subtle">Run the floor.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:text-base">
              Roster turns shift templates into a real weekly schedule your
              team can see, clock into, and rely on — with audit-grade records
              of every change.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-hover sm:w-auto"
              >
                Get started — it&apos;s free
                <ArrowRightIcon className="size-4" />
              </Link>
              <Link
                href="/login"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-hairline bg-surface-2 px-5 text-sm font-medium text-ink transition-colors hover:bg-surface-3 sm:w-auto"
              >
                <BuildingIcon className="size-4 text-ink-subtle" />
                Sign in to admin
              </Link>
            </div>

            <p className="mt-5 text-xs text-ink-subtle">
              Prototype preview · no signup cost · all data stays in your browser
            </p>
          </div>

          <div className="px-6 pb-24 sm:pb-28">
            <SchedulePreview />
          </div>
        </section>

        <section id="features" className="border-t border-hairline/60">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">
                Features
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Everything a scheduling team needs, nothing it doesn&apos;t
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Built for the MVP that ships: scheduling that goes from blank
                canvas to published week in minutes, with trust baked into the
                data layer.
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-hairline bg-surface-2 p-5 transition-colors hover:bg-surface-3"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
                    <f.icon className="size-4" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-hairline/60">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">
                How it works
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                From signup to published schedule in three steps
              </h2>
            </div>

            <div className="mt-10 grid gap-3 lg:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.step}
                  className="rounded-xl border border-hairline bg-surface-2 p-5"
                >
                  <span className="font-mono text-xs font-medium text-primary">{s.step}</span>
                  <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-hairline/60">
          <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Frequently asked
            </h2>
            <div className="mt-8 space-y-3">
              {[
                {
                  q: "Is this a real product yet?",
                  a: "Not yet — this is a static prototype. Registration, login, and the admin console run entirely in your browser, so you can walk the full flow without a backend.",
                },
                {
                  q: "Who is the admin account for?",
                  a: "The company admin. You create the account on the signup form, then sign in with the same credentials to enter the admin console and manage the workspace.",
                },
                {
                  q: "What happens to my data?",
                  a: "Nothing leaves your browser. Accounts and sessions are stored in localStorage so you can try everything offline and reset by clearing site data.",
                },
              ].map((item) => (
                <div key={item.q} className="rounded-xl border border-hairline bg-surface-2 p-5">
                  <h3 className="text-sm font-semibold tracking-tight text-ink">{item.q}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-hairline/60">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface-2 px-6 py-14 text-center">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(94,106,210,0.18),transparent_70%)]"
              />
              <div className="relative">
                <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  Ready to build your first week?
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
                  Create the admin account for your company and step into the
                  admin console. Takes less than a minute.
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-hover sm:w-auto"
                  >
                    Create admin account
                    <ArrowRightIcon className="size-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="flex h-10 w-full items-center justify-center rounded-lg border border-hairline bg-surface-1 px-5 text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:w-auto"
                  >
                    Already have an account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-10 md:flex-row md:items-start">
            <div className="max-w-xs">
              <Link href="/" className="flex items-center gap-2.5">
                <LogoMark className="size-7" />
                <span className="text-[15px] font-semibold tracking-tight text-ink">Roster</span>
              </Link>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-subtle">
                Workforce scheduling for teams that take their weeks seriously.
              </p>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
              {[
                {
                  heading: "Product",
                  links: [
                    { label: "Features", href: "#features" },
                    { label: "How it works", href: "#how-it-works" },
                    { label: "FAQ", href: "#faq" },
                  ],
                },
                {
                  heading: "Get started",
                  links: [
                    { label: "Create admin account", href: "/register" },
                    { label: "Sign in", href: "/login" },
                  ],
                },
                {
                  heading: "Console",
                  links: [{ label: "Admin console", href: "/login" }],
                },
              ].map((col) => (
                <div key={col.heading}>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                    {col.heading}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          className="text-[13px] text-ink-muted transition-colors hover:text-ink"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-2 border-t border-hairline/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-subtle">
              © 2026 Roster. Static prototype — no data leaves your browser.
            </p>
            <p className="font-mono text-[11px] text-ink-faint">
              roster-plan / prototype
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
