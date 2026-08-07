import { MailIcon, UsersIcon } from "@/components/ui/icons";

export default function PeopleEmpty({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="mt-8 rounded-xl border border-hairline bg-surface-2 p-10 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary-weak text-primary">
        <UsersIcon className="size-5" />
      </span>
      <h2 className="mt-3 text-[15px] font-semibold text-ink">
        Your team is ready to grow
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
        Invite people by email — they&apos;ll get an invite link and can start
        clocking in once they accept.
      </p>
      <button
        type="button"
        onClick={onInvite}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
      >
        <MailIcon className="size-3.5" />
        Invite people
      </button>
    </div>
  );
}