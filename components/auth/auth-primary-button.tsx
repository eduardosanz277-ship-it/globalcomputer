"use client";

import { ButtonPending, type ButtonPendingProps } from "@/components/ui/button-pending";
import { cn } from "@/utils/cn";

type AuthPrimaryButtonProps = ButtonPendingProps;

/**
 * Botón principal de auth: misma altura que los campos (`AuthInput`, h-10).
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
        "h-10 w-full rounded-lg text-sm font-semibold",
        className,
      )}
      {...props}
    />
  );
}
