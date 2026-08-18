"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { Location, LocationInput } from "@/lib/company-data";
import Modal from "@/components/ui/Modal";
import { useGeocode } from "./use-geocode";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-hairline bg-surface-3 px-3 text-[13px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary/60 focus:outline-none";

interface LocationFormModalProps {
  mode: "create" | "edit";
  location?: Location;
  onClose: () => void;
  onSave: (input: LocationInput) => Promise<{ ok: boolean; error?: string }>;
}

export default function LocationFormModal({
  mode,
  location,
  onClose,
  onSave,
}: LocationFormModalProps) {
  const [name, setName] = useState(location?.name ?? "");
  const [description, setDescription] = useState(location?.description ?? "");
  const [active, setActive] = useState(location?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const geocode = useGeocode(location ?? null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const input: LocationInput = {
      name,
      description: description || undefined,
      address: geocode.address || undefined,
      city: geocode.city || undefined,
      state: geocode.state || undefined,
      country: geocode.country || undefined,
      active,
    };

    const result = await onSave(input);
    if (!result.ok) setError(result.error ?? "Something went wrong.");
  };

  return (
    <Modal
      open
      title={mode === "edit" ? "Edit location" : "New location"}
      description={
        mode === "edit"
          ? "Update this location's details."
          : "Locations are the physical sites people work from."
      }
      confirmLabel={mode === "edit" ? "Save changes" : "Create location"}
      hideFooter
      onClose={onClose}
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
            Description <span className="font-normal text-ink-subtle">(optional)</span>
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
            value={geocode.address}
            onChange={(e) => geocode.setAddress(e.target.value)}
            onFocus={() => geocode.suggestionsOpen && geocode.setSuggestionsOpen(true)}
            onBlur={geocode.onSuggestionsClose}
            autoComplete="off"
            placeholder="123 Main St, Austin, TX"
            className={inputClass}
          />
          {geocode.geocoding && (
            <p className="mt-1 text-[11px] text-ink-subtle">
              Looking up suggestions…
            </p>
          )}
          {geocode.suggestionsOpen && geocode.suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-hairline bg-surface-2 py-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
              {geocode.suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => geocode.onSelectSuggestion(s)}
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
              value={geocode.city}
              onChange={(e) => geocode.setCity(e.target.value)}
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
              value={geocode.state}
              onChange={(e) => geocode.setState(e.target.value)}
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
              value={geocode.country}
              onChange={(e) => geocode.setCountry(e.target.value)}
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
            onClick={onClose}
            className="h-8 rounded-lg border border-hairline bg-surface-3 px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-8 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            {mode === "edit" ? "Save changes" : "Create location"}
          </button>
        </div>
      </form>
    </Modal>
  );
}