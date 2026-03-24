import { cn } from "@/utils/cn";

/** Contenedor tipo tarjeta para formularios en SlideOver (alineado con `ServiceForm` / característica específica). */
export const adminSlideOverSectionClassName = cn(
  "space-y-4 rounded-xl border border-border/60 bg-white p-5 shadow-sm",
  "dark:bg-card",
);

/** Misma apariencia que los `Input` del formulario de servicios (`ServiceForm`). */
export const adminServiceLikeInputClassName = cn(
  "h-11 rounded-lg border-border/80 bg-background/80 shadow-sm transition",
  "focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0",
  "placeholder:text-muted-foreground/70",
);
