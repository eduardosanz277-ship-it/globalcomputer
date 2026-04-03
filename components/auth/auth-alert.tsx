"use client";

import { cn } from "@/utils/cn";

type AuthAlertProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthAlert({ children, className }: AuthAlertProps) {
  return (
    <p
      className={cn(
        "rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className,
      )}
      role="alert"
    >
      {children}
    </p>
  );
}
