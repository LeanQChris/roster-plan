"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useCompany } from "@/lib/company-data";
import type { Location } from "@/lib/company-data";
import Modal from "@/components/admin/Modal";
import StatCard from "@/components/admin/StatCard";
import {
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/admin/icons";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

const GEOCODE_DEBOUNCE_MS = 700;
const GEOCODE_MIN_LENGTH = 5;

interface GeocodeResult {
  id: string;
  label: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

async function geocodeAddress(
  query: string,
  signal: AbortSignal,
): Promise<GeocodeResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const results = (await res.json()) as Array<{
    place_id?: number;
    display_name?: string;
    address?: Record<string, string>;
  }>;
  return results
    .filter((r) => r.address)
    .map((r) => {
      const addr = r.address!;
      const houseAndRoad = [addr.house_number, addr.road].filter(Boolean).join(" ");
      return {
        id: String(r.place_id ?? r.display_name),
        label: r.display_name ?? "",
        address: houseAndRoad || undefined,
        city: addr.city ?? addr.town ?? addr.village ?? addr.county,
        state: addr.state,
        country: addr.country,
      };
    });
}

type LocationModalState =
  | { mode: "create" }
  | { mode: "edit"; location: Location }
  | null;

function locationSummary(l: Location): string {
  return [l.city, l.state, l.country].filter(Boolean).join(", ");
}

export default function LocationsPage() {
  const { locations, teams, people, createLocation, updateLocation, deleteLocation } =
    useCompany();
  const [modal, setModal] = useState<LocationModalState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Location | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeAbort = useRef<AbortController | null>(null);

  const runGeocode = useCallback((query: string) => {
    geocodeAbort.current?.abort();
    const controller = new AbortController();
    geocodeAbort.current = controller;
    setGeocoding(true);
    geocodeAddress(query, controller.signal)
      .then((results) => {
        setSuggestions(results);
        setSuggestionsOpen(results.length > 0);
      })
      .catch(() => {})
      .finally(() => setGeocoding(false));
  }, []);

  const onAddressChange = (value: string) => {
    setAddress(value);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    if (!value.trim()) {
      geocodeAbort.current?.abort();
      setGeocoding(false);
      setSuggestions([]);
      setSuggestionsOpen(false);
      setCity("");
      setState("");
      setCountry("");
      return;
    }
    if (value.trim().length < GEOCODE_MIN_LENGTH) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    geocodeTimer.current = setTimeout(() => runGeocode(value.trim()), GEOCODE_DEBOUNCE_MS);
  };

  const onSelectSuggestion = (result: GeocodeResult) => {
    setAddress(result.address || result.label);
    setCity(result.city ?? "");
    setState(result.state ?? "");
    setCountry(result.country ?? "");
    setSuggestions([]);
    setSuggestionsOpen(false);
    geocodeAbort.current?.abort();
    setGeocoding(false);
  };

  useEffect(() => {
    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      geocodeAbort.current?.abort();
    };
  }, []);

  const openCreate = () => {
    setName("");
    setDescription("");
    setAddress("");
    setCity("");
    setState("");
    setCountry("");
    setActive(true);
    setError(null);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setModal({ mode: "create" });
  };

  const openEdit = (location: Location) => {
    setName(location.name);
    setDescription(location.description ?? "");
    setAddress(location.address ?? "");
    setCity(location.city ?? "");
    setState(location.state ?? "");
    setCountry(location.country ?? "");
    setActive(location.active);
    setError(null);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setModal({ mode: "edit", location });
  };

  const teamCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of teams) {
      if (!t.locationId) continue;
      counts.set(t.locationId, (counts.get(t.locationId) ?? 0) + 1);
    }
    return counts;
  }, [teams]);

  const peopleCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of people) {
      if (!p.locationId) continue;
      counts.set(p.locationId, (counts.get(p.locationId) ?? 0) + 1);
    }
    return counts;
  }, [people]);

  const close = () => setModal(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const patch = {
      name,
      description: description || undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
      active,
    };

    if (modal?.mode === "edit") {
      if (!updateLocation(modal.location.id, patch)) {
        setError("Location name can't be empty.");
        return;
      }
    } else {
      if (!createLocation(patch)) {
        setError("Location name can't be empty or match an existing location.");
        return;
      }
    }

    setModal(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Locations</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage the physical sites people are scheduled to work from.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {saved && (
            <span className="rounded-lg border border-success/25 bg-success-weak px-2.5 py-1.5 text-xs font-medium text-success">
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <PlusIcon className="size-3.5" />
            New location
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Locations"
          value={locations.length}
          icon={<MapPinIcon className="size-4" />}
          sub="across the company"
        />
        <StatCard
          label="Active"
          value={locations.filter((l) => l.active).length}
          tone="primary"
          icon={<MapPinIcon className="size-4" />}
          sub="currently in use"
        />
        <StatCard
          label="Inactive"
          value={locations.filter((l) => !l.active).length}
          icon={<MapPinIcon className="size-4" />}
          sub="not in use"
        />
      </div>

      {locations.length === 0 ? (
        <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
            <MapPinIcon className="size-5" />
          </span>
          <h2 className="mt-3 text-[15px] font-semibold text-ink">No locations yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Add your first location to start assigning shifts to a site.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <PlusIcon className="size-3.5" />
            Add a location
          </button>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-surface-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {["Name", "Description", "Teams", "Peoples", "Address", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle"
                      >
                        {h}
                      </th>
                    ),
                  )}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {locations.map((location) => (
                  <tr
                    key={location.id}
                    className="group border-b border-hairline/60 transition-colors last:border-b-0 hover:bg-surface-3/70"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary-weak text-primary">
                          <MapPinIcon className="size-3.5" />
                        </span>
                        {location.name}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-ink-muted">
                      <span className="line-clamp-2">
                        {location.description || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {teamCount.get(location.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {peopleCount.get(location.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {locationSummary(location) || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                          location.active
                            ? "border-success/25 bg-success-weak text-success"
                            : "border-hairline bg-surface-3 text-ink-subtle"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${location.active ? "bg-success" : "bg-ink-subtle"}`}
                        />
                        {location.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openEdit(location)}
                          aria-label={`Edit ${location.name}`}
                          className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
                        >
                          <PencilIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(location)}
                          aria-label={`Delete ${location.name}`}
                          className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-danger"
                        >
                          <TrashIcon className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <Modal
          open
          title={modal.mode === "edit" ? "Edit location" : "New location"}
          description={
            modal.mode === "edit"
              ? "Update this location's details."
              : "Locations are the physical sites people work from."
          }
          confirmLabel={modal.mode === "edit" ? "Save changes" : "Create location"}
          hideFooter
          onClose={close}
          onConfirm={() => {}}
        >
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="location-name"
                className="block text-xs font-medium text-ink-muted"
              >
                Name
              </label>
              <input
                id="location-name"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Downtown Branch"
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="location-desc"
                className="block text-xs font-medium text-ink-muted"
              >
                Description{" "}
                <span className="font-normal text-ink-subtle">(optional)</span>
              </label>
              <textarea
                id="location-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happens at this location?"
                rows={2}
                className="mt-1.5 w-full resize-none rounded-lg border border-hairline bg-surface-3 px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none"
              />
            </div>
            <div className="relative">
              <label
                htmlFor="location-address"
                className="block text-xs font-medium text-ink-muted"
              >
                Address
              </label>
              <input
                id="location-address"
                type="text"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
                onBlur={() =>
                  window.setTimeout(() => setSuggestionsOpen(false), 150)
                }
                autoComplete="off"
                placeholder="123 Main St, Austin, TX"
                className={inputClass}
              />
              {geocoding && (
                <p className="mt-1 text-[11px] text-ink-subtle">
                  Looking up suggestions…
                </p>
              )}
              {suggestionsOpen && suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-hairline bg-surface-2 py-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onSelectSuggestion(s)}
                        className="block w-full truncate px-3 py-1.5 text-left text-[12.5px] text-ink transition-colors hover:bg-surface-3"
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="location-city"
                  className="block text-xs font-medium text-ink-muted"
                >
                  City
                </label>
                <input
                  id="location-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Austin"
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="location-state"
                  className="block text-xs font-medium text-ink-muted"
                >
                  State
                </label>
                <input
                  id="location-state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="TX"
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="location-country"
                  className="block text-xs font-medium text-ink-muted"
                >
                  Country
                </label>
                <input
                  id="location-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="USA"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex items-center justify-start gap-3 rounded-lg py-2.5">
              <div>
                <p className="text-[13px] font-medium text-ink">
                  {active ? "Active" : "Inactive"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-label="Toggle active"
                onClick={() => setActive((v) => !v)}
                className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
                  active ? "bg-primary" : "bg-surface-4"
                }`}
              >
                <span
                  className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
                    active ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={close}
                className="h-8 rounded-lg border border-hairline bg-surface-3 px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
              >
                {modal.mode === "edit" ? "Save changes" : "Create location"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          open
          title={`Delete ${confirmDelete.name}?`}
          description="This location will be removed. This can't be undone."
          tone="danger"
          confirmLabel="Delete location"
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteLocation(confirmDelete.id);
            setConfirmDelete(null);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2600);
          }}
        />
      )}
    </div>
  );
}
