"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type AuthFooterLinksProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthFooterLinks({ children, className }: AuthFooterLinksProps) {
  return (
    <div
      className={cn(
        "space-y-3 text-center text-sm leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

type AuthInlineLinkRowProps = {
  children: React.ReactNode;
};

/** Una línea de texto con enlace (p. ej. «¿Ya tienes cuenta? …»). */
export function AuthInlineLinkRow({ children }: AuthInlineLinkRowProps) {
  return <p>{children}</p>;
}
