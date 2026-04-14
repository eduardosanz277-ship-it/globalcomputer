"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ProductDescriptionViewer } from "@/components/ProductDescriptionViewer";
import { cn } from "@/utils/cn";

type Props = {
  description: string | null;
};

export function ServiceDescriptionCollapsible({ description }: Props) {
  const [open, setOpen] = useState(false);
  const hasDescription = Boolean(description?.trim());

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Contraer descripción" : "Expandir descripción"}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-card/80"
      >
        <span className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
          Descripción
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden border-t border-border/70 px-4 py-2">
          {hasDescription ? (
            <ProductDescriptionViewer descripcion={description ?? ""} />
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No hay descripción disponible en este momento.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
