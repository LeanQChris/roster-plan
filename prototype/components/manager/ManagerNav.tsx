"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCompany } from "@/lib/company-data";
import { useTheme } from "@/lib/theme";
import LogoMark from "@/components/ui/Logo";
import { ChevronDownIcon, MoonIcon, SunIcon } from "@/components/ui/icons";

export default function ManagerNav() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { teams, people } = useCompany();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const myTeam = useMemo(() => {
    const myPerson = people.find(
      (p) => p.role === "manager" && p.email.toLowerCase() === user?.email.toLowerCase(),
    );
    return teams.find((t) => t.id === myPerson?.teamId) ?? null;
  }, [people, teams, user?.email]);

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
        <Link href="/manager/dashboard" className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="size-7 shrink-0" />
          <span className="truncate text-[15px] font-semibold tracking-tight text-ink">
            Roster
            <span className="text-ink-subtle"> / {myTeam?.name ?? "My Team"}</span>
          </span>
        </Link>
      </div>

      <div className="flex-1" />

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
