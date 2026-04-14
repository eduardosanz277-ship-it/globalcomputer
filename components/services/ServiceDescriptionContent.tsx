"use client";

import { ProductDescriptionViewer } from "@/components/ProductDescriptionViewer";

type Props = {
  description: string | null;
  className?: string;
};

export function ServiceDescriptionContent({ description, className }: Props) {
  const hasDescription = Boolean(description?.trim());

  return (
    <section
      className={`rounded-2xl border border-border/60 bg-white px-5 py-3 shadow-sm ${className ?? ""}`}
    >
      <div>
        {hasDescription ? (
          <ProductDescriptionViewer descripcion={description ?? ""} />
        ) : (
          <p className="text-sm italic text-muted-foreground">
            No hay descripción disponible en este momento.
          </p>
        )}
      </div>
    </section>
  );
}
