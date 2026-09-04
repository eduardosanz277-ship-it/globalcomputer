"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { Locale } from "@/components/i18n/translations";
import { cn } from "@/utils/cn";

const STORE_LOCALES: Locale[] = ["en", "es"];

export type StoreLanguageSwitchProps = {
  className?: string;
  "aria-label"?: string;
};

export function StoreLanguageSwitch({
  className,
  "aria-label": ariaLabel,
}: StoreLanguageSwitchProps) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-grid grid-cols-2 rounded-full border border-black/20 bg-muted/80 p-0.5 shadow-sm",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0.5 w-[calc(50%-2px)] rounded-full border border-black/20 bg-white transition-[left] duration-200 ease-out",
          locale === "en" ? "left-0.5" : "left-[calc(50%+1px)]",
        )}
      />
      {STORE_LOCALES.map((loc) => {
        const active = locale === loc;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            aria-pressed={active}
            className={cn(
              "relative z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full p-0 text-center text-[10px] font-bold uppercase leading-none transition-colors",
              active
                ? "text-black"
                : "text-black/45 hover:border-black hover:text-black/70",
            )}
          >
            {loc}
          </button>
        );
      })}
    </div>
  );
}
