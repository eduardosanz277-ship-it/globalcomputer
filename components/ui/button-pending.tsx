"use client";

import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export type ButtonPendingProps = Omit<ButtonProps, "children"> & {
  pending: boolean;
  /** Contenido en estado normal (ej. «Guardar»). */
  children: React.ReactNode;
  /** Contenido mientras `pending` (ej. «Guardando»). */
  pendingLabel: React.ReactNode;
  /**
   * Si es true, no aplica `min-w-[7.5rem]` (útil con `w-full` u otros anchos).
   */
  skipMinWidth?: boolean;
};

export function ButtonPending({
  pending,
  children,
  pendingLabel,
  className,
  disabled,
  skipMinWidth,
  ...props
}: ButtonPendingProps) {
  return (
    <Button
      aria-busy={pending}
      disabled={disabled || pending}
      className={cn(!skipMinWidth && "min-w-[7.5rem]", className)}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
