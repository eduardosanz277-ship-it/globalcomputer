"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./button";
import { isGcSelectMenuEvent } from "@/components/ui/form-fields";

export type SlideOverProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Pie con acciones (p. ej. Cancelar + Guardar). Usa `SlideOverFooter` para el layout estándar. */
  footer?: React.ReactNode;
  /** Clases extra para el panel (contenedor principal) */
  panelClassName?: string;
  /** aria-label del área con scroll (p. ej. formulario vs. solo lectura) */
  contentAriaLabel?: string;
  /** `right` (por defecto, panel admin) o `left` (p. ej. filtros en tienda). */
  side?: "left" | "right";
  /** Clases extra para el cuerpo con scroll (debajo del encabezado). */
  contentClassName?: string;
  /** Ref al div scrolleable (útil para resetear scroll desde fuera). */
  contentRef?: React.RefObject<HTMLDivElement | null>;
};

const SlideOverOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-40 bg-black/45",
      "data-[state=open]:animate-fade-in",
      className,
    )}
    {...props}
  />
));
SlideOverOverlay.displayName = "SlideOverOverlay";

/**
 * Panel lateral (derecha por defecto, estilo admin; `side="left"` para filtros u otros).
 * Bloquea scroll del documento, cierra con overlay, ESC y botón (icono X).
 */
export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  panelClassName,
  contentAriaLabel,
  side = "right",
  contentClassName,
  contentRef,
}: SlideOverProps) {
  const hasDescription =
    typeof description === "string"
      ? Boolean(description.trim())
      : description != null;
  const fromLeft = side === "left";

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      modal
    >
      <DialogPrimitive.Portal>
        <SlideOverOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 z-50 flex h-full w-full flex-col outline-none",
            fromLeft
              ? "left-0 border-r border-border/70 data-[state=open]:animate-slide-over-left-in data-[state=closed]:animate-slide-over-left-out"
              : "right-0 border-l border-border/70 data-[state=open]:animate-slide-over-in data-[state=closed]:animate-slide-over-out",
            "bg-background shadow-[0_25px_50px_-12px_rgba(15,23,42,0.18)]",
            "rounded-none",
            "md:w-[min(52vw,28rem)] lg:w-[30vw]",
            "focus:outline-none",
            panelClassName,
          )}
          onPointerDownOutside={(event) => {
            if (isGcSelectMenuEvent(event)) event.preventDefault();
          }}
          onFocusOutside={(event) => {
            if (isGcSelectMenuEvent(event)) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (isGcSelectMenuEvent(event)) event.preventDefault();
          }}
        >
          <header className="relative shrink-0 border-b border-border/70 bg-background px-4 py-4">
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 z-10 h-9 w-9 text-muted-foreground hover:text-foreground"
                aria-label="Cerrar panel"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </DialogPrimitive.Close>
            <div className="min-w-0 space-y-1 pr-11">
              <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description
                className={cn(
                  "text-sm leading-relaxed text-muted-foreground",
                  !hasDescription && "sr-only",
                )}
              >
                {hasDescription ? description : "Formulario de edición."}
              </DialogPrimitive.Description>
            </div>
          </header>

          <div
            ref={contentRef as React.RefObject<HTMLDivElement>}
            className={cn(
              "relative z-0 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4",
              "overscroll-y-contain",
              contentClassName,
            )}
            role="region"
            aria-label={contentAriaLabel ?? "Contenido del panel"}
          >
            {children}
          </div>

          {footer ? (
            <div className="relative z-10 shrink-0 border-t border-border/70 bg-muted/5">
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Pie de acciones alineado a la derecha (Cancelar + Guardar). */
export function SlideOverFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <footer
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 px-6 py-4",
        className,
      )}
    >
      {children}
    </footer>
  );
}
