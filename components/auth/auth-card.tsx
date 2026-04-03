"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type AuthCardProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Tarjeta blanca con sombra suave y radio 12px (estilo Stripe / SaaS).
 */
export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-6 rounded-xl border border-border/70 bg-white p-8 text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
