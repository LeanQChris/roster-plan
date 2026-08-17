"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth";
import { useCompany } from "./company-data";
import type { Person, Team } from "./company-data";

const EMPLOYEE_TEAM_KEY = "roster.employeeSelectedTeam";

function readSelectedTeamId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(EMPLOYEE_TEAM_KEY);
  } catch {
    return null;
  }
}

function persistSelectedTeamId(id: string | null) {
  try {
    if (id) window.localStorage.setItem(EMPLOYEE_TEAM_KEY, id);
    else window.localStorage.removeItem(EMPLOYEE_TEAM_KEY);
  } catch {
    // storage unavailable — selection stays in memory
  }
}

export function useEmployeeTeam() {
  const { user } = useAuth();
  const { teams, people } = useCompany();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    readSelectedTeamId,
  );

  const myPerson = useMemo<Person | null>(
    () =>
      people.find(
        (p) => p.email.toLowerCase() === user?.email.toLowerCase(),
      ) ?? null,
    [people, user?.email],
  );

  const myTeams = useMemo<Team[]>(
    () =>
      myPerson
        ? teams.filter((t) => myPerson.teamIds.includes(t.id))
        : [],
    [teams, myPerson],
  );

  const effectiveTeamId = useMemo(() => {
    if (myTeams.length === 0) return null;
    if (selectedTeamId && myTeams.some((t) => t.id === selectedTeamId)) {
      return selectedTeamId;
    }
    return myTeams[0].id;
  }, [myTeams, selectedTeamId]);

  useEffect(() => {
    persistSelectedTeamId(effectiveTeamId);
  }, [effectiveTeamId]);

  const selectTeam = useCallback((id: string) => {
    setSelectedTeamId(id);
  }, []);

  const selectedTeam = useMemo(
    () => myTeams.find((t) => t.id === effectiveTeamId) ?? null,
    [myTeams, effectiveTeamId],
  );

  return { myPerson, myTeams, selectedTeam, selectTeam };
}
