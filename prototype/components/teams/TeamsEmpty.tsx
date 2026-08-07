import { ListIcon, PlusIcon } from "@/components/ui/icons";

export default function TeamsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
        <ListIcon className="size-5" />
      </span>
      <h2 className="mt-3 text-[15px] font-semibold text-ink">No teams yet</h2>
      <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
        Create your first team to start grouping people and building shift
        templates.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
      >
        <PlusIcon className="size-3.5" />
        Create a team
      </button>
    </div>
  );
}