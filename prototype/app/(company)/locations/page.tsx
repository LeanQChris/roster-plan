"use client";

import { useMemo, useState } from "react";
import { useCompany } from "@/lib/company-data";
import type { Location, LocationInput } from "@/lib/company-data";
import Modal from "@/components/ui/Modal";
import { MapPinIcon, PlusIcon } from "@/components/ui/icons";
import LocationStats from "@/components/locations/LocationStats";
import LocationsEmpty from "@/components/locations/LocationsEmpty";
import LocationTable from "@/components/locations/LocationTable";
import LocationFormModal from "@/components/locations/LocationFormModal";

type LocationModalState =
  | { mode: "create" }
  | { mode: "edit"; location: Location }
  | null;

export default function LocationsPage() {
  const { locations, teams, people, createLocation, updateLocation, deleteLocation } =
    useCompany();
  const [modal, setModal] = useState<LocationModalState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Location | null>(null);
  const [saved, setSaved] = useState(false);

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

  const flashSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const handleSave = async (
    input: LocationInput,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (modal?.mode === "edit") {
      const ok = await updateLocation(modal.location.id, input);
      if (!ok) {
        return { ok: false, error: "Location name can't be empty." };
      }
    } else {
      const location = await createLocation(input);
      if (!location) {
        return {
          ok: false,
          error: "Location name can't be empty or match an existing location.",
        };
      }
    }
    setModal(null);
    flashSaved();
    return { ok: true };
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
            onClick={() => setModal({ mode: "create" })}
            className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <PlusIcon className="size-3.5" />
            New location
          </button>
        </div>
      </div>

      <LocationStats locations={locations} />

      {locations.length === 0 ? (
        <LocationsEmpty onCreate={() => setModal({ mode: "create" })} />
      ) : (
        <LocationTable
          locations={locations}
          teamCount={teamCount}
          peopleCount={peopleCount}
          onEdit={(location) => setModal({ mode: "edit", location })}
          onDelete={setConfirmDelete}
        />
      )}

      {modal && (
        <LocationFormModal
          key={modal.mode === "edit" ? modal.location.id : "create"}
          mode={modal.mode}
          location={modal.mode === "edit" ? modal.location : undefined}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
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
            flashSaved();
          }}
        />
      )}
    </div>
  );
}