"use client";

import { Star } from "lucide-react";
import { cn } from "@/utils/cn";

/** Fila de 5 estrellas para tarjetas móviles de reseñas en admin. */
export function AdminMobileReviewRatingStars({ rating }: { rating: number }) {
  const n = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${n} / 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4 shrink-0",
            i < n
              ? "fill-amber-400 text-amber-500"
              : "text-muted-foreground/30",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}
