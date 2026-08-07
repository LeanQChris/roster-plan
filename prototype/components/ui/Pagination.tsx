"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-2.5">
      <p className="text-xs text-ink-subtle">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-7 items-center gap-1 rounded-lg border border-hairline bg-surface-3 px-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface-4 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeftIcon className="size-3.5" />
          Prev
        </button>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="flex h-7 items-center gap-1 rounded-lg border border-hairline bg-surface-3 px-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface-4 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ArrowRightIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
