"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "./icons";

export interface MenuOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface MenuProps<T extends string> {
  value: T;
  options: MenuOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  className?: string;
  align?: "left" | "right";
}

export default function Menu<T extends string>({
  value,
  options,
  onChange,
  label,
  className = "",
  align = "left",
}: MenuProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-2.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
      >
        {label && <span className="text-ink-subtle">{label}</span>}
        <span>{current?.label}</span>
        <ChevronDownIcon
          className={`size-3.5 text-ink-subtle transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-30 mt-1.5 min-w-44 overflow-hidden rounded-lg border border-hairline bg-surface-2 p-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              role="menuitemradio"
              aria-checked={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
                opt.value === value
                  ? "bg-primary-weak text-ink"
                  : "text-ink-muted hover:bg-surface-3 hover:text-ink"
              }`}
            >
              <span>{opt.label}</span>
              {opt.hint && <span className="text-[11px] text-ink-subtle">{opt.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}