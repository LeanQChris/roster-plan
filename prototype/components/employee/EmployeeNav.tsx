"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCompany } from "@/lib/company-data";
import { useTheme } from "@/lib/theme";
import LogoMark from "@/components/ui/Logo";
import {
  BellIcon,
  CalendarIcon,
  CalendarOffIcon,
  ChevronDownIcon,
  ClockIcon,
  ListIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  UsersIcon,
} from "@/components/ui/icons";

export default function EmployeeNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { people, activity } = useCompany();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const myPerson = useMemo(
    () =>
      people.find(
        (p) => p.role === "employee" && p.email.toLowerCase() === user?.email.toLowerCase(),
      ) ?? null,
    [people, user?.email],
  );

  const unreadCount = useMemo(() => {
    if (!myPerson) return 0;
    return activity.filter((a) => a.personId === myPerson.id && !a.read).length;
  }, [activity, myPerson]);

  const navItems = [
    { href: "/employee/dashboard", label: "Dashboard", icon: ListIcon },
    { href: "/employee/schedule", label: "Schedule", icon: CalendarIcon },
    { href: "/employee/available-shifts", label: "Available Shifts", icon: CalendarIcon },
    { href: "/employee/clock", label: "Clock In/Out", icon: ClockIcon },
    { href: "/employee/leave-requests", label: "Leave Requests", icon: CalendarOffIcon },
    { href: "/employee/settings", label: "Settings", icon: SettingsIcon },
    { href: "/employee/profile", label: "Profile", icon: UsersIcon },
    { href: "/employee/notifications", label: "Notifications", icon: BellIcon, badge: unreadCount },
  ];

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

  const handleSignOut = () => {
    setMenuOpen(false);
    signOut();
    router.push("/");
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-hairline bg-surface-2">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-hairline px-5">
        <Link href="/employee/dashboard" className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="size-7 shrink-0" />
          <span className="truncate text-[15px] font-semibold tracking-tight text-ink">
            Roster
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-primary-weak text-primary"
                  : "text-ink-muted hover:bg-surface-3 hover:text-ink"
              }`}
            >
              <item.icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {!!item.badge && (
                <span className="flex min-w-4.5 shrink-0 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
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
                : "EM"}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13px] font-medium text-ink">
                {user?.name ?? "Employee"}
              </span>
              <span className="block truncate text-[11px] text-ink-subtle">
                employee
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
                  {user?.name ?? "Employee"}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {user?.email ?? ""}
                </p>
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
