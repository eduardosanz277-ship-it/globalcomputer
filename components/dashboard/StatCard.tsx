"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  hint?: string;
  variant?: "default" | "warning";
  href?: string;
};

export function StatCard({ label, value, icon: Icon, hint, variant = "default", href }: StatCardProps) {
  const { locale } = useI18n();
  const numberLocale = locale === "en" ? "en-US" : "es-AR";

  const isWarning = variant === "warning" && value > 0;

  const cardContent = (
    <Card
      className={cn(
        "border-border/70 shadow-sm",
        isWarning && "border-amber-300 bg-amber-50/60",
        href && "transition-shadow hover:shadow-md",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p
              className={cn(
                "text-xs font-medium uppercase tracking-wide",
                isWarning ? "text-amber-700" : "text-muted-foreground",
              )}
            >
              {label}
            </p>
            <p
              className={cn(
                "text-2xl font-semibold",
                isWarning ? "text-amber-900" : "text-foreground",
              )}
            >
              {value.toLocaleString(numberLocale)}
            </p>
            {hint ? (
              <p
                className={cn(
                  "text-xs",
                  isWarning ? "text-amber-700" : "text-muted-foreground",
                )}
              >
                {hint}
              </p>
            ) : null}
          </div>

          <span
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              isWarning
                ? "border-amber-300 bg-amber-100 text-amber-700"
                : "border-primary/20 bg-primary/10 text-primary",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
