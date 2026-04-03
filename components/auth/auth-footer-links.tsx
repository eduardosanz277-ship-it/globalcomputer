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

/**
 * Texto + enlace: por debajo de 375px se apilan; desde 375px van en una línea.
 * Usar `<span>` para la pregunta y `<Link>` (u otro control) para la acción.
 */
export function AuthInlineLinkRow({ children }: AuthInlineLinkRowProps) {
  return (
    <p className="flex flex-col items-center gap-1 min-[375px]:flex-row min-[375px]:flex-wrap min-[375px]:justify-center min-[375px]:gap-1">
      {children}
    </p>
  );
}
