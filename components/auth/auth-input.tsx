"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Misma altura y tipografía que `components/ui/input` en formularios del panel admin
 * (h-10, text-sm, leading-10).
 */
export const authInputClassName =
  "h-10 w-full rounded-lg border border-input/90 bg-white px-3 py-0 text-sm leading-10 text-foreground shadow-sm transition-[box-shadow,border-color] placeholder:text-[#aeaeae] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(authInputClassName, className)}
        ref={ref}
        {...props}
      />
    );
  },
);
AuthInput.displayName = "AuthInput";
