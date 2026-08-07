"use client";

import { CheckIcon, XIcon } from "./icons";
import { useAdmin } from "@/lib/store";

export default function Toasts() {
  const { toasts, dismissToast } = useAdmin();

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-lg border border-hairline bg-surface-3 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
        >
          {toast.tone === "success" && (
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-weak text-success">
              <CheckIcon className="size-3" />
            </span>
          )}
          {toast.tone === "danger" && (
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-danger-weak text-danger">
              <XIcon className="size-3" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-ink">{toast.message}</p>
            {toast.detail && (
              <p className="mt-0.5 truncate text-xs text-ink-muted">
                {toast.detail}
              </p>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="rounded p-0.5 text-ink-subtle transition-colors hover:text-ink"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}