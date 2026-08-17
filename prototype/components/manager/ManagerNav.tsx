"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useManager } from "@/lib/manager-team";
import { useTheme } from "@/lib/theme";
import LogoMark from "@/components/ui/Logo";
import {
  ActivityIcon,
  BellIcon,
  CalendarIcon,
  CalendarOffIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  UsersIcon,
} from "@/components/ui/icons";

export default function ManagerNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const { user, signOut } = useAuth();
  const { managedTeams, selectedTeam, selectTeam } = useManager();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const teamMenuRef = useRef<HTMLDivElement>(null);

  const inTeamDetail = pathname.startsWith("/manager/teams/") && !!params.id;
  const teamTabs = selectedTeam
    ? [
        { href: `/manager/teams/${selectedTeam.id}`, label: "Members", icon: UsersIcon },
        { href: `/manager/teams/${selectedTeam.id}/templates`, label: "Templates", icon: ClockIcon },
        { href: `/manager/teams/${selectedTeam.id}/schedule`, label: "Schedule", icon: CalendarIcon },
        { href: `/manager/teams/${selectedTeam.id}/time-tracking`, label: "Time Tracking", icon: ClockIcon },
        { href: `/manager/teams/${selectedTeam.id}/shift-requests`, label: "Shift Requests", icon: BellIcon },
        { href: `/manager/teams/${selectedTeam.id}/leave-requests`, label: "Leave Requests", icon: CalendarOffIcon },
        { href: `/manager/teams/${selectedTeam.id}/audit`, label: "Audit", icon: ActivityIcon },
      ]
    : [];

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

  useEffect(() => {
    if (!teamMenuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (teamMenuRef.current && !teamMenuRef.current.contains(e.target as Node)) {
        setTeamMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTeamMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [teamMenuOpen]);

  useEffect(() => {
    if (inTeamDetail && params.id) selectTeam(params.id);
  }, [inTeamDetail, params.id, selectTeam]);

  const switchTeam = (id: string) => {
    selectTeam(id);
    setTeamMenuOpen(false);
    router.push("/manager/dashboard");
  };

  const handleSignOut = () => {
    setMenuOpen(false);
    signOut();
    router.push("/");
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-hairline bg-surface-2">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-hairline px-5">
        <Link href="/manager/dashboard" className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="size-7 shrink-0" />
          <span className="truncate text-[15px] font-semibold tracking-tight text-ink">
            Roster
          </span>
        </Link>
      </div>

      <div className="border-b border-hairline p-3">
        <p className="px-1 pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
          Team
        </p>
        <div ref={teamMenuRef} className="relative">
          <button
            onClick={() => setTeamMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={teamMenuOpen}
            className="flex w-full items-center gap-2.5 rounded-lg border border-hairline bg-surface-3 px-2.5 py-2 transition-colors hover:bg-surface-4"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-weak text-primary">
              <UsersIcon className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13px] font-medium text-ink">
                {selectedTeam?.name ?? "No team"}
              </span>
              <span className="block truncate text-[11px] text-ink-subtle">
                {managedTeams.length} {managedTeams.length === 1 ? "team" : "teams"}
              </span>
            </span>
            <ChevronDownIcon className="size-3.5 shrink-0 text-ink-subtle" />
          </button>

          {teamMenuOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-hairline bg-surface-2 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
            >
              <div className="max-h-64 overflow-y-auto p-1">
                {managedTeams.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-ink-muted">
                    No teams assigned yet
                  </p>
                ) : (
                  managedTeams.map((team) => {
                    const active = team.id === selectedTeam?.id;
                    return (
                      <button
                        key={team.id}
                        role="menuitem"
                        onClick={() => switchTeam(team.id)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-surface-3 ${
                          active ? "text-primary" : "text-ink"
                        }`}
                      >
                        <UsersIcon className="size-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          {team.name}
                        </span>
                        {active && <CheckIcon className="size-4 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {teamTabs.length > 0 ? (
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {teamTabs.map((item) => {
            const active =
              item.label === "Members"
                ? pathname === item.href || pathname.startsWith(`${item.href}/people/`)
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-primary-weak text-primary"
                    : "text-ink-muted hover:bg-surface-3 hover:text-ink"
                }`}
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
      ) : (
        <div className="flex-1" />
      )}

      <nav className="border-t border-hairline p-3">
        <Link
          href="/manager/settings"
          aria-current={pathname.startsWith("/manager/settings") ? "page" : undefined}
          className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
            pathname.startsWith("/manager/settings")
              ? "bg-primary-weak text-primary"
              : "text-ink-muted hover:bg-surface-3 hover:text-ink"
          }`}
        >
          <SettingsIcon className="size-4" />
          Settings
          {pathname.startsWith("/manager/settings") && (
            <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
          )}
        </Link>
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
                : "TM"}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13px] font-medium text-ink">
                {user?.name ?? "Team manager"}
              </span>
              <span className="block truncate text-[11px] text-ink-subtle">
                team manager
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
                  {user?.name ?? "Team manager"}
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