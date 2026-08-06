"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { ReactNode } from "react";
import { readCompanySetup } from "./company";

export type PersonRole = "employee" | "manager";
export type PersonStatus = "active" | "invited" | "inactive";

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: PersonRole;
  teamId: string | null;
  timezone: string;
  status: PersonStatus;
  createdAt: string;
  updatedAt: string;
}

interface CompanyState {
  teams: Team[];
  people: Person[];
}

type CompanyAction =
  | { type: "createTeam"; team: Team }
  | { type: "updateTeam"; id: string; patch: Partial<Team> }
  | { type: "deleteTeam"; id: string }
  | { type: "addPerson"; person: Person }
  | { type: "updatePerson"; id: string; patch: Partial<Person> }
  | { type: "deletePerson"; id: string };

const TEAMS_KEY = "roster.teams";
const PEOPLE_KEY = "roster.people";

let seq = 0;
export const nextId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${(seq += 1).toString(36)}`;

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — state stays in memory
  }
}

function initState(): CompanyState {
  const teams = readStored<Team[]>(TEAMS_KEY, []);
  const people = readStored<Person[]>(PEOPLE_KEY, []);

  if (teams.length === 0) {
    const setup = readCompanySetup();
    if (setup?.team) {
      const first: Team = {
        id: nextId("team"),
        name: setup.team,
        description: "Your first team",
        createdAt: new Date().toISOString(),
      };
      teams.push(first);
      writeStored(TEAMS_KEY, teams);
    }
  }
  return { teams, people };
}

const reducer = (state: CompanyState, action: CompanyAction): CompanyState => {
  switch (action.type) {
    case "createTeam":
      return { ...state, teams: [action.team, ...state.teams] };
    case "updateTeam":
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t,
        ),
      };
    case "deleteTeam":
      return {
        ...state,
        teams: state.teams.filter((t) => t.id !== action.id),
        people: state.people.map((p) =>
          p.teamId === action.id ? { ...p, teamId: null } : p,
        ),
      };
    case "addPerson":
      return { ...state, people: [action.person, ...state.people] };
    case "updatePerson":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.id ? { ...p, ...action.patch, updatedAt: new Date().toISOString() } : p,
        ),
      };
    case "deletePerson":
      return {
        ...state,
        people: state.people.filter((p) => p.id !== action.id),
      };
  }
};

interface InviteInput {
  name: string;
  email: string;
  phone?: string;
  role: PersonRole;
  teamId: string | null;
  timezone: string;
}

interface CompanyContextValue extends CompanyState {
  createTeam: (name: string, description?: string) => Team | null;
  updateTeam: (id: string, patch: Partial<Team>) => boolean;
  deleteTeam: (id: string) => void;
  invitePerson: (input: InviteInput) => { ok: boolean; error?: string };
  updatePerson: (id: string, patch: Partial<Person>) => boolean;
  resendInvite: (id: string) => void;
  deletePerson: (id: string) => void;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  useEffect(() => {
    writeStored(TEAMS_KEY, state.teams);
  }, [state.teams]);

  useEffect(() => {
    writeStored(PEOPLE_KEY, state.people);
  }, [state.people]);

  const createTeam = useCallback(
    (name: string, description?: string): Team | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      if (state.teams.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
        return null;
      }
      const team: Team = {
        id: nextId("team"),
        name: trimmed,
        description: description?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "createTeam", team });
      return team;
    },
    [state.teams],
  );

  const updateTeam = useCallback((id: string, patch: Partial<Team>) => {
    if (patch.name !== undefined && !patch.name.trim()) return false;
    dispatch({ type: "updateTeam", id, patch });
    return true;
  }, []);

  const deleteTeam = useCallback((id: string) => {
    dispatch({ type: "deleteTeam", id });
  }, []);

  const invitePerson = useCallback(
    (input: InviteInput): { ok: boolean; error?: string } => {
      const email = input.email.trim().toLowerCase();
      if (!input.name.trim() || !email) {
        return { ok: false, error: "Name and email are required." };
      }
      if (state.people.some((p) => p.email.toLowerCase() === email)) {
        return { ok: false, error: "Someone with that email is already in this company." };
      }
      dispatch({
        type: "addPerson",
        person: {
          id: nextId("person"),
          name: input.name.trim(),
          email,
          phone: input.phone?.trim() || undefined,
          role: input.role,
          teamId: input.teamId,
          timezone: input.timezone,
          status: "invited",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return { ok: true };
    },
    [state.people],
  );

  const updatePerson = useCallback((id: string, patch: Partial<Person>) => {
    dispatch({ type: "updatePerson", id, patch });
    return true;
  }, []);

  const resendInvite = useCallback((id: string) => {
    dispatch({ type: "updatePerson", id, patch: { status: "invited" } });
  }, []);

  const deletePerson = useCallback((id: string) => {
    dispatch({ type: "deletePerson", id });
  }, []);

  const value = useMemo<CompanyContextValue>(
    () => ({
      ...state,
      createTeam,
      updateTeam,
      deleteTeam,
      invitePerson,
      updatePerson,
      resendInvite,
      deletePerson,
    }),
    [state, createTeam, updateTeam, deleteTeam, invitePerson, updatePerson, resendInvite, deletePerson],
  );

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextValue {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within <CompanyProvider>");
  return ctx;
}
