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
import { RRule } from "rrule";

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

export interface ShiftTemplate {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  startTime: string;
  requiredCount: number;
  maxCount?: number;
  isActive: boolean;
  recurrenceRule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  teamId: string;
  templateId?: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  requiredCount: number;
  createdAt: string;
}

export interface ShiftAssignment {
  id: string;
  shiftId: string;
  personId: string;
  createdAt: string;
}

interface CompanyState {
  teams: Team[];
  people: Person[];
  locations: Location[];
  activity: ActivityEntry[];
  clockEntries: ClockEntry[];
  shiftTemplates: ShiftTemplate[];
  shifts: Shift[];
  shiftAssignments: ShiftAssignment[];
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
  | { type: "addClockEntry"; entry: ClockEntry }
  | { type: "createShiftTemplate"; template: ShiftTemplate }
  | { type: "updateShiftTemplate"; id: string; patch: Partial<ShiftTemplate> }
  | { type: "deleteShiftTemplate"; id: string }
  | { type: "addShifts"; shifts: Shift[] }
  | { type: "createShift"; shift: Shift }
  | { type: "updateShift"; id: string; patch: Partial<Shift> }
  | { type: "deleteShift"; id: string }
  | { type: "addAssignment"; assignment: ShiftAssignment }
  | { type: "removeAssignment"; id: string };

const TEAMS_KEY = "roster.teams";
const PEOPLE_KEY = "roster.people";
const LOCATIONS_KEY = "roster.locations";
const ACTIVITY_KEY = "roster.activity";
const CLOCK_KEY = "roster.clock";
const TEMPLATES_KEY = "roster.shiftTemplates";
const SHIFTS_KEY = "roster.shifts";
const ASSIGNMENTS_KEY = "roster.shiftAssignments";

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
  const shiftTemplates = readStored<ShiftTemplate[]>(TEMPLATES_KEY, []);
  const shifts = readStored<Shift[]>(SHIFTS_KEY, []);
  const shiftAssignments = readStored<ShiftAssignment[]>(ASSIGNMENTS_KEY, []);

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
  return { teams, people, locations, activity, clockEntries, shiftTemplates, shifts, shiftAssignments };
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
    case "createShiftTemplate":
      return {
        ...state,
        shiftTemplates: [action.template, ...state.shiftTemplates],
      };
    case "updateShiftTemplate":
      return {
        ...state,
        shiftTemplates: state.shiftTemplates.map((t) =>
          t.id === action.id ? { ...t, ...action.patch, updatedAt: new Date().toISOString() } : t,
        ),
      };
    case "deleteShiftTemplate":
      return {
        ...state,
        shiftTemplates: state.shiftTemplates.filter((t) => t.id !== action.id),
      };
    case "addShifts":
      return { ...state, shifts: [...action.shifts, ...state.shifts] };
    case "createShift":
      return { ...state, shifts: [action.shift, ...state.shifts] };
    case "updateShift":
      return {
        ...state,
        shifts: state.shifts.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s,
        ),
      };
    case "deleteShift":
      return {
        ...state,
        shifts: state.shifts.filter((s) => s.id !== action.id),
        shiftAssignments: state.shiftAssignments.filter((a) => a.shiftId !== action.id),
      };
    case "addAssignment":
      return {
        ...state,
        shiftAssignments: [action.assignment, ...state.shiftAssignments],
      };
    case "removeAssignment":
      return {
        ...state,
        shiftAssignments: state.shiftAssignments.filter((a) => a.id !== action.id),
      };
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

export interface LocationInput {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  active: boolean;
}

export interface ShiftTemplateInput {
  teamId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  startTime: string;
  requiredCount: number;
  maxCount?: number;
  isActive: boolean;
  recurrenceRule?: string;
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
  createShiftTemplate: (input: ShiftTemplateInput) => { ok: boolean; error?: string; template?: ShiftTemplate };
  updateShiftTemplate: (id: string, patch: Partial<ShiftTemplate>) => boolean;
  deleteShiftTemplate: (id: string) => void;
  getShiftTemplatesByTeam: (teamId: string) => ShiftTemplate[];
  publishShifts: (teamId: string, rangeStart: string, rangeEnd: string) => Shift[];
  createShift: (input: {
    teamId: string;
    title: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    requiredCount: number;
  }) => { ok: boolean; error?: string; shift?: Shift };
  updateShift: (id: string, patch: Partial<Shift>) => { ok: boolean; error?: string };
  deleteShift: (id: string) => void;
  assignPerson: (shiftId: string, personId: string) => { ok: boolean; error?: string };
  removeAssignment: (id: string) => void;
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

  useEffect(() => {
    writeStored(TEMPLATES_KEY, state.shiftTemplates);
  }, [state.shiftTemplates]);

  useEffect(() => {
    writeStored(SHIFTS_KEY, state.shifts);
  }, [state.shifts]);

  useEffect(() => {
    writeStored(ASSIGNMENTS_KEY, state.shiftAssignments);
  }, [state.shiftAssignments]);

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

  const createShiftTemplate = useCallback(
    (input: ShiftTemplateInput): { ok: boolean; error?: string; template?: ShiftTemplate } => {
      const trimmed = input.title.trim();
      if (!trimmed) return { ok: false, error: "Title is required." };
      if (input.durationMinutes <= 0) return { ok: false, error: "Duration must be greater than 0." };
      if (input.requiredCount < 1) return { ok: false, error: "Staff required must be at least 1." };
      if (input.maxCount !== undefined && input.maxCount < input.requiredCount) {
        return { ok: false, error: "Max count must be greater than or equal to staff required." };
      }
      const now = new Date().toISOString();
      const template: ShiftTemplate = {
        id: nextId("template"),
        teamId: input.teamId,
        title: trimmed,
        description: input.description?.trim() || undefined,
        durationMinutes: input.durationMinutes,
        startTime: input.startTime,
        requiredCount: input.requiredCount,
        maxCount: input.maxCount,
        isActive: input.isActive,
        recurrenceRule: input.recurrenceRule?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: "createShiftTemplate", template });
      return { ok: true, template };
    },
    [],
  );

  const updateShiftTemplate = useCallback((id: string, patch: Partial<ShiftTemplate>) => {
    if (patch.title !== undefined && !patch.title.trim()) return false;
    dispatch({ type: "updateShiftTemplate", id, patch });
    return true;
  }, []);

  const deleteShiftTemplate = useCallback((id: string) => {
    dispatch({ type: "deleteShiftTemplate", id });
  }, []);

  const getShiftTemplatesByTeam = useCallback(
    (teamId: string) => state.shiftTemplates.filter((t) => t.teamId === teamId),
    [state.shiftTemplates],
  );

  const publishShifts = useCallback(
    (teamId: string, rangeStart: string, rangeEnd: string): Shift[] => {
      const templates = state.shiftTemplates.filter(
        (t) => t.teamId === teamId && t.isActive && t.recurrenceRule,
      );
      const start = new Date(rangeStart + "T00:00:00");
      const end = new Date(rangeEnd + "T23:59:59");
      const newShifts: Shift[] = [];
      const existingDates = new Set(
        state.shifts
          .filter((s) => s.teamId === teamId)
          .map((s) => `${s.date}|${s.startTime}`),
      );
      for (const template of templates) {
        try {
          const rule = RRule.fromString(template.recurrenceRule!);
          const dates = rule.between(start, end, true);
          for (const date of dates) {
            const dateStr = date.toISOString().slice(0, 10);
            const key = `${dateStr}|${template.startTime}`;
            if (existingDates.has(key)) continue;
            existingDates.add(key);
            newShifts.push({
              id: nextId("shift"),
              teamId,
              templateId: template.id,
              title: template.title,
              description: template.description,
              date: dateStr,
              startTime: template.startTime,
              durationMinutes: template.durationMinutes,
              requiredCount: template.requiredCount,
              createdAt: new Date().toISOString(),
            });
          }
        } catch {
          // invalid RRULE — skip this template
        }
      }
      if (newShifts.length > 0) {
        dispatch({ type: "addShifts", shifts: newShifts });
      }
      return newShifts;
    },
    [state.shiftTemplates, state.shifts],
  );

  const createShift = useCallback(
    (input: {
      teamId: string;
      title: string;
      date: string;
      startTime: string;
      durationMinutes: number;
      requiredCount: number;
    }): { ok: boolean; error?: string; shift?: Shift } => {
      const trimmed = input.title.trim();
      if (!trimmed) return { ok: false, error: "Title is required." };
      if (!input.date) return { ok: false, error: "Date is required." };
      if (input.durationMinutes <= 0) return { ok: false, error: "Duration must be greater than 0." };
      if (input.requiredCount < 1) return { ok: false, error: "Staff required must be at least 1." };

      const shift: Shift = {
        id: nextId("shift"),
        teamId: input.teamId,
        title: trimmed,
        date: input.date,
        startTime: input.startTime,
        durationMinutes: input.durationMinutes,
        requiredCount: input.requiredCount,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "createShift", shift });
      return { ok: true, shift };
    },
    [],
  );

  const deleteShift = useCallback((id: string) => {
    dispatch({ type: "deleteShift", id });
  }, []);

  const updateShift = useCallback(
    (id: string, patch: Partial<Shift>): { ok: boolean; error?: string } => {
      if (patch.title !== undefined && !patch.title.trim()) {
        return { ok: false, error: "Title is required." };
      }
      if (patch.durationMinutes !== undefined && patch.durationMinutes <= 0) {
        return { ok: false, error: "Duration must be greater than 0." };
      }
      if (patch.requiredCount !== undefined && patch.requiredCount < 1) {
        return { ok: false, error: "Staff required must be at least 1." };
      }
      dispatch({ type: "updateShift", id, patch });
      return { ok: true };
    },
    [],
  );

  const assignPerson = useCallback(
    (shiftId: string, personId: string): { ok: boolean; error?: string } => {
      const already = state.shiftAssignments.some(
        (a) => a.shiftId === shiftId && a.personId === personId,
      );
      if (already) return { ok: false, error: "This person is already assigned to this shift." };
      const assignment: ShiftAssignment = {
        id: nextId("assignment"),
        shiftId,
        personId,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "addAssignment", assignment });
      return { ok: true };
    },
    [state.shiftAssignments],
  );

  const removeAssignment = useCallback((id: string) => {
    dispatch({ type: "removeAssignment", id });
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
      createShiftTemplate,
      updateShiftTemplate,
      deleteShiftTemplate,
      getShiftTemplatesByTeam,
      publishShifts,
      createShift,
      updateShift,
      deleteShift,
      assignPerson,
      removeAssignment,
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
      createShiftTemplate,
      updateShiftTemplate,
      deleteShiftTemplate,
      getShiftTemplatesByTeam,
      publishShifts,
      createShift,
      updateShift,
      deleteShift,
      assignPerson,
      removeAssignment,
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
