"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
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
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const { t } = useI18n();

    if (!isPassword) {
      return (
        <input
          type={type}
          className={cn(authInputClassName, className)}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className={cn(authInputClassName, "pr-10", className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label={
            showPassword ? t("common.hidePassword") : t("common.showPassword")
          }
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    );
  },
);
AuthInput.displayName = "AuthInput";
