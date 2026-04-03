"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type AuthLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Contenedor de página: centrado, responsive, fondo tipo lienzo SaaS.
 */
export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <main
      className={cn(
        "flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 sm:px-6",
        className,
      )}
    >
      <div className="w-full max-w-[440px]">{children}</div>
    </main>
  );
}
