"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { AlertTriangleIcon, XIcon } from "./icons";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  tone?: "danger" | "primary" | "neutral";
  confirmLabel: string;
  size?: "md" | "lg" | "xl";
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
  hideFooter?: boolean;
}

const sizeClasses: Record<string, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export default function Modal({
  open,
  title,
  description,
  tone = "primary",
  confirmLabel,
  size = "md",
  onConfirm,
  onClose,
  children,
  hideFooter = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const danger = tone === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[85vh] w-full flex-col ${sizeClasses[size]} rounded-xl border border-hairline bg-surface-2 shadow-[0_24px_64px_rgba(0,0,0,0.5)]`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="flex items-start gap-3">
            {danger && (
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-danger/30 bg-danger-weak text-danger">
                <AlertTriangleIcon className="size-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                {title}
              </h2>
              {description && (
                <p className="mt-1.5 text-[13px] leading-5 text-ink-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          {children}
        </div>

        {!hideFooter && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-hairline p-4">
            <button
              onClick={onClose}
              className="h-8 rounded-lg border border-hairline bg-surface-3 px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-4"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`h-8 rounded-lg px-3.5 text-[13px] font-medium text-white transition-colors ${
                danger
                  ? "bg-danger hover:bg-danger-hover"
                  : "bg-primary hover:bg-primary-hover"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}