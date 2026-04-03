"use client";

import { ButtonPending, type ButtonPendingProps } from "@/components/ui/button-pending";
import { cn } from "@/utils/cn";

type AuthPrimaryButtonProps = ButtonPendingProps;

/**
 * Botón principal de auth: 48px, radio 10px, semibold, ancho completo.
 */
export function AuthPrimaryButton({
  className,
  skipMinWidth = true,
  ...props
}: AuthPrimaryButtonProps) {
  return (
    <ButtonPending
      skipMinWidth={skipMinWidth}
      className={cn(
        "h-12 w-full rounded-[10px] text-base font-semibold",
        className,
      )}
      {...props}
    />
  );
}
