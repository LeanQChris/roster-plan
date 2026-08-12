"use client";

import { createContext, useContext } from "react";
import type { Team, Person, ShiftTemplate, AuditEntry } from "@/lib/company-data";

interface TeamDetailValue {
  team: Team;
  teamPeople: Person[];
  teamTemplates: ShiftTemplate[];
  teamAuditLog: AuditEntry[];
}

const TeamDetailContext = createContext<TeamDetailValue | null>(null);

export function TeamDetailProvider({
  value,
  children,
}: {
  value: TeamDetailValue;
  children: React.ReactNode;
}) {
  return (
    <TeamDetailContext.Provider value={value}>
      {children}
    </TeamDetailContext.Provider>
  );
}

export function useTeamDetail(): TeamDetailValue {
  const ctx = useContext(TeamDetailContext);
  if (!ctx) throw new Error("useTeamDetail must be used within TeamDetailProvider");
  return ctx;
}
