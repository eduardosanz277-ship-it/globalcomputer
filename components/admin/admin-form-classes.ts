import { cn } from "@/utils/cn";

/** Contenedor tipo tarjeta para formularios en SlideOver (alineado con `ServiceForm` / característica específica). */
export const adminSlideOverSectionClassName = cn(
  "space-y-4 rounded-xl border border-border/60 bg-white p-5 shadow-sm",
  "dark:bg-card",
);

/**
 * Scroll interno para listas largas dentro del SlideOver (p. ej. checkboxes de marcas).
 * Barras: `app/globals.css` (tema); aquí solo altura máxima y overscroll.
 */
export const adminSlideOverNestedScrollClassName = cn(
  "max-h-[280px] space-y-2 overflow-y-auto pr-1",
  "overscroll-y-contain",
);

/** Misma altura que `react-select` en formularios (`appSelectStyles`, 40px). Fondo sólido como las tarjetas del panel admin. */
export const adminServiceLikeInputClassName = cn(
  "h-10 rounded-lg border-border/80 bg-white shadow-sm transition",
  "dark:bg-card",
  "focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0",
  "placeholder:text-muted-foreground/70",
);
