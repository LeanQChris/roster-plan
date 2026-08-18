"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { DEFAULT_BRANDING, getCompanySettings } from "@/lib/company";
import LogoMark from "@/components/ui/Logo";
import {
  ActivityIcon,
  BellIcon,
  CalendarIcon,
  CalendarOffIcon,
  ChevronDownIcon,
  ClockIcon,
  ListIcon,
  MapPinIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  UsersIcon,
} from "@/components/ui/icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: ActivityIcon, soon: false },
  { href: "/me/schedule", label: "My Schedule", icon: CalendarIcon, soon: false },
  { href: "/teams", label: "Teams", icon: ListIcon, soon: false },
  { href: "/people", label: "People", icon: UsersIcon, soon: false },
  { href: "/templates", label: "Shift Templates", icon: ClockIcon, soon: false },
  { href: "/time-tracking", label: "Time Tracking", icon: ClockIcon, soon: false },
  { href: "/shift-requests", label: "Shift Requests", icon: BellIcon, soon: false },
  { href: "/leave-requests", label: "Leave Requests", icon: CalendarOffIcon, soon: false },
  { href: "/locations", label: "Locations", icon: MapPinIcon, soon: false },
  { href: "/settings", label: "Settings", icon: SettingsIcon, soon: false },
];

export default function CompanyNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [brandingColor, setBrandingColor] = useState(DEFAULT_BRANDING);

  useEffect(() => {
    let cancelled = false;
    getCompanySettings().then((result) => {
      if (!cancelled && result) setBrandingColor(result.brandingColor);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", brandingColor);
    root.style.setProperty(
      "--primary-hover",
      `color-mix(in srgb, ${brandingColor} 82%, #ffffff)`,
    );
  }, [brandingColor]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.push("/");
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-hairline bg-surface-2">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-hairline px-5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="size-7 shrink-0" />
          <span className="truncate text-[15px] font-semibold tracking-tight text-ink">
            Roster
            <span className="text-ink-subtle">
              {" "}
              / {user?.company ?? "Company"}
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active = !item.soon && isActive(item.href);
          const classes = `relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
            active
              ? "bg-primary-weak text-primary"
              : "text-ink-muted hover:bg-surface-3 hover:text-ink"
          }`;

          if (item.soon) {
            return (
              <span
                key={item.label}
                title={`${item.label} — coming soon`}
                className={`${classes} cursor-not-allowed opacity-60`}
              >
                <item.icon className="size-4" />
                {item.label}
                <span className="ml-auto rounded border border-hairline bg-surface-1 px-1 py-px text-[9px] font-medium uppercase tracking-wide text-ink-subtle">
                  soon
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={classes}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="size-4" />
              {item.label}
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-hairline p-3">
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex w-full items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-surface-3"
          >
            <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[11px] font-semibold text-ink">
              {user?.name
                ? user.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "CA"}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13px] font-medium text-ink">
                {user?.name ?? "Company admin"}
              </span>
              <span className="block truncate text-[11px] text-ink-subtle">
                company admin
              </span>
            </span>
            <ChevronDownIcon className="size-3.5 shrink-0 text-ink-subtle" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute bottom-full left-0 z-50 mb-2 w-52 overflow-hidden rounded-lg border border-hairline bg-surface-2 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
            >
              <div className="px-3 py-2.5">
                <p className="truncate text-[13px] font-medium text-ink">
                  {user?.name ?? "Company admin"}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {user?.email ?? ""}
                </p>
                {user?.company && (
                  <p className="mt-0.5 truncate text-xs text-ink-subtle">
                    {user.company}
                  </p>
                )}
              </div>
              <div className="border-t border-hairline" />
              <div className="p-1">
                <button
                  role="menuitem"
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-ink transition-colors hover:bg-surface-3"
                >
                  {theme === "dark" ? (
                    <SunIcon className="size-4" />
                  ) : (
                    <MoonIcon className="size-4" />
                  )}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>
              </div>
              <div className="border-t border-hairline" />
              <div className="p-1">
                <button
                  role="menuitem"
                  onClick={handleSignOut}
                  className="w-full rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-danger transition-colors hover:bg-surface-3"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
