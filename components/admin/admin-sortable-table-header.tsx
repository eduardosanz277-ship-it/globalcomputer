"use client";

import type { Column } from "@tanstack/react-table";
import { cn } from "@/utils/cn";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

export function SortableHeader<TData>({
  column,
  label,
  ariaLabelIdle,
  ariaLabelAsc,
  ariaLabelDesc,
}: {
  column: Column<TData, unknown>;
  label: string;
  ariaLabelIdle: string;
  ariaLabelAsc: string;
  ariaLabelDesc: string;
}) {
  const sorted = column.getIsSorted();
  const ariaLabel =
    sorted === "asc"
      ? ariaLabelAsc
      : sorted === "desc"
        ? ariaLabelDesc
        : ariaLabelIdle;
  return (
    <>
      <span className="md:hidden">{label}</span>
      <button
        type="button"
        className={cn(
          "hidden max-w-full items-center justify-start gap-1.5 rounded-md px-0.5 py-0.5 -mx-0.5 md:inline-flex",
          "text-xs font-medium uppercase tracking-wide text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        )}
        onClick={() => column.toggleSorting()}
        aria-label={ariaLabel}
        aria-sort={
          sorted === "asc"
            ? "ascending"
            : sorted === "desc"
              ? "descending"
              : "none"
        }
      >
        {label}
        <span
          className="inline-flex h-4 w-4 shrink-0 text-muted-foreground/80"
          aria-hidden
        >
          {sorted === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : sorted === "desc" ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-70" />
          )}
        </span>
      </button>
    </>
  );
}
