import type { Location } from "@/lib/company-data";
import StatCard from "@/components/ui/StatCard";
import { MapPinIcon } from "@/components/ui/icons";

export default function LocationStats({ locations }: { locations: Location[] }) {
  const activeCount = locations.filter((l) => l.active).length;

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Locations"
        value={locations.length}
        icon={<MapPinIcon className="size-4" />}
        sub="across the company"
      />
      <StatCard
        label="Active"
        value={activeCount}
        tone="primary"
        icon={<MapPinIcon className="size-4" />}
        sub="currently in use"
      />
      <StatCard
        label="Inactive"
        value={locations.length - activeCount}
        icon={<MapPinIcon className="size-4" />}
        sub="not in use"
      />
    </div>
  );
}