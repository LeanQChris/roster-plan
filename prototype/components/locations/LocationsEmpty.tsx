import { MapPinIcon, PlusIcon } from "@/components/ui/icons";

export default function LocationsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
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
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
      >
        <PlusIcon className="size-3.5" />
        Add a location
      </button>
    </div>
  );
}