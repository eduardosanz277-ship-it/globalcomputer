"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type AuthHeadingProps = {
  title: string;
  description?: React.ReactNode;
  className?: string;
};

/**
 * Título ~28px y descripción ~16px, centrados.
 */
export function AuthHeading({ title, description, className }: AuthHeadingProps) {
  return (
    <header className={cn("space-y-2 text-center", className)}>
      <h1 className="font-roboto text-[28px] font-semibold leading-tight tracking-tight text-[#040b1f]">
        {title}
      </h1>
      {description ? (
        <div className="text-base leading-relaxed text-muted-foreground">
          {description}
        </div>
      ) : null}
    </header>
  );
}
