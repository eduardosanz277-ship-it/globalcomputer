import { cn } from "@/utils/cn";

/** Contenedor tipo tarjeta para formularios en SlideOver (alineado con `ServiceForm` / característica específica). */
export const adminSlideOverSectionClassName = cn(
  "space-y-4 rounded-xl border border-border/60 bg-white p-5 shadow-sm",
  "dark:bg-card",
);

/**
 * Scroll interno para listas largas dentro del SlideOver (p. ej. checkboxes de marcas).
 * Misma barra fina y contención de overscroll que el cuerpo del panel (`components/ui/slide-over`).
 */
export const adminSlideOverNestedScrollClassName = cn(
  "max-h-[280px] space-y-2 overflow-y-auto pr-1",
  "overscroll-y-contain [scrollbar-width:thin]",
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-track]:bg-transparent",
);

/** Misma apariencia que los `Input` del formulario de servicios (`ServiceForm`). */
export const adminServiceLikeInputClassName = cn(
  "h-11 rounded-lg border-border/80 bg-background/80 shadow-sm transition",
  "focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0",
  "placeholder:text-muted-foreground/70",
);
