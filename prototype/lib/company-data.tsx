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
  locationId: string | null;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  active: boolean;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: PersonRole;
  teamId: string | null;
  locationId: string | null;
  timezone: string;
  status: PersonStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityAction = "invited" | "updated" | "resent";

export interface ActivityEntry {
  id: string;
  personId: string;
  action: ActivityAction;
  message: string;
  timestamp: string;
}

export type ClockAction = "in" | "out";

export interface ClockEntry {
  id: string;
  personId: string;
  action: ClockAction;
  at: string;
}

interface CompanyState {
  teams: Team[];
  people: Person[];
  locations: Location[];
  activity: ActivityEntry[];
  clockEntries: ClockEntry[];
}

type CompanyAction =
  | { type: "createTeam"; team: Team }
  | { type: "updateTeam"; id: string; patch: Partial<Team> }
  | { type: "deleteTeam"; id: string }
  | { type: "addPerson"; person: Person }
  | { type: "updatePerson"; id: string; patch: Partial<Person> }
  | { type: "resendInvite"; id: string }
  | { type: "deletePerson"; id: string }
  | { type: "createLocation"; location: Location }
  | { type: "updateLocation"; id: string; patch: Partial<Location> }
  | { type: "deleteLocation"; id: string }
  | { type: "addClockEntry"; entry: ClockEntry };

const TEAMS_KEY = "roster.teams";
const PEOPLE_KEY = "roster.people";
const LOCATIONS_KEY = "roster.locations";
const ACTIVITY_KEY = "roster.activity";
const CLOCK_KEY = "roster.clock";

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
  const locations = readStored<Location[]>(LOCATIONS_KEY, []);
  const activity = readStored<ActivityEntry[]>(ACTIVITY_KEY, []);
  const clockEntries = readStored<ClockEntry[]>(CLOCK_KEY, []);

  if (teams.length === 0) {
    const setup = readCompanySetup();
    if (setup?.team) {
      const first: Team = {
        id: nextId("team"),
        name: setup.team,
        description: "Your first team",
        locationId: null,
        createdAt: new Date().toISOString(),
      };
      teams.push(first);
      writeStored(TEAMS_KEY, teams);
    }
  }
  return { teams, people, locations, activity, clockEntries };
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
      return {
        ...state,
        people: [action.person, ...state.people],
        activity: [
          {
            id: nextId("activity"),
            personId: action.person.id,
            action: "invited",
            message: "Invited to the company",
            timestamp: new Date().toISOString(),
          },
          ...state.activity,
        ],
      };
    case "updatePerson":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.id ? { ...p, ...action.patch, updatedAt: new Date().toISOString() } : p,
        ),
        activity: [
          {
            id: nextId("activity"),
            personId: action.id,
            action: "updated",
            message: "Profile updated",
            timestamp: new Date().toISOString(),
          },
          ...state.activity,
        ],
      };
    case "resendInvite":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.id
            ? { ...p, status: "invited", updatedAt: new Date().toISOString() }
            : p,
        ),
        activity: [
          {
            id: nextId("activity"),
            personId: action.id,
            action: "resent",
            message: "Invite resent",
            timestamp: new Date().toISOString(),
          },
          ...state.activity,
        ],
      };
    case "deletePerson":
      return {
        ...state,
        people: state.people.filter((p) => p.id !== action.id),
        clockEntries: state.clockEntries.filter((c) => c.personId !== action.id),
      };
    case "createLocation":
      return { ...state, locations: [action.location, ...state.locations] };
    case "updateLocation":
      return {
        ...state,
        locations: state.locations.map((l) =>
          l.id === action.id ? { ...l, ...action.patch } : l,
        ),
      };
    case "deleteLocation":
      return {
        ...state,
        locations: state.locations.filter((l) => l.id !== action.id),
        teams: state.teams.map((t) =>
          t.locationId === action.id ? { ...t, locationId: null } : t,
        ),
        people: state.people.map((p) =>
          p.locationId === action.id ? { ...p, locationId: null } : p,
        ),
      };
    case "addClockEntry":
      return { ...state, clockEntries: [action.entry, ...state.clockEntries] };
  }
};

interface InviteInput {
  name: string;
  email: string;
  phone?: string;
  role: PersonRole;
  teamId: string | null;
  locationId: string | null;
  timezone: string;
}

interface LocationInput {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  active: boolean;
}

interface CompanyContextValue extends CompanyState {
  createTeam: (
    name: string,
    description?: string,
    locationId?: string | null,
  ) => Team | null;
  updateTeam: (id: string, patch: Partial<Team>) => boolean;
  deleteTeam: (id: string) => void;
  invitePerson: (input: InviteInput) => { ok: boolean; error?: string };
  updatePerson: (id: string, patch: Partial<Person>) => boolean;
  resendInvite: (id: string) => void;
  deletePerson: (id: string) => void;
  createLocation: (input: LocationInput) => Location | null;
  updateLocation: (id: string, patch: Partial<Location>) => boolean;
  deleteLocation: (id: string) => void;
  addClockEntry: (personId: string, action: ClockAction) => void;
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

  useEffect(() => {
    writeStored(LOCATIONS_KEY, state.locations);
  }, [state.locations]);

  useEffect(() => {
    writeStored(ACTIVITY_KEY, state.activity);
  }, [state.activity]);

  useEffect(() => {
    writeStored(CLOCK_KEY, state.clockEntries);
  }, [state.clockEntries]);

  const createTeam = useCallback(
    (name: string, description?: string, locationId?: string | null): Team | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      if (state.teams.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
        return null;
      }
      const team: Team = {
        id: nextId("team"),
        name: trimmed,
        description: description?.trim() || undefined,
        locationId: locationId ?? null,
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
          locationId: input.locationId,
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
    dispatch({ type: "resendInvite", id });
  }, []);

  const deletePerson = useCallback((id: string) => {
    dispatch({ type: "deletePerson", id });
  }, []);

  const createLocation = useCallback(
    (input: LocationInput): Location | null => {
      const trimmed = input.name.trim();
      if (!trimmed) return null;
      if (
        state.locations.some((l) => l.name.toLowerCase() === trimmed.toLowerCase())
      ) {
        return null;
      }
      const location: Location = {
        id: nextId("location"),
        name: trimmed,
        description: input.description?.trim() || undefined,
        address: input.address?.trim() || undefined,
        city: input.city?.trim() || undefined,
        state: input.state?.trim() || undefined,
        country: input.country?.trim() || undefined,
        active: input.active,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "createLocation", location });
      return location;
    },
    [state.locations],
  );

  const updateLocation = useCallback((id: string, patch: Partial<Location>) => {
    if (patch.name !== undefined && !patch.name.trim()) return false;
    dispatch({ type: "updateLocation", id, patch });
    return true;
  }, []);

  const deleteLocation = useCallback((id: string) => {
    dispatch({ type: "deleteLocation", id });
  }, []);

  const addClockEntry = useCallback((personId: string, action: ClockAction) => {
    dispatch({
      type: "addClockEntry",
      entry: {
        id: nextId("clock"),
        personId,
        action,
        at: new Date().toISOString(),
      },
    });
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
      createLocation,
      updateLocation,
      deleteLocation,
      addClockEntry,
    }),
    [
      state,
      createTeam,
      updateTeam,
      deleteTeam,
      invitePerson,
      updatePerson,
      resendInvite,
      deletePerson,
      createLocation,
      updateLocation,
      deleteLocation,
      addClockEntry,
    ],
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
