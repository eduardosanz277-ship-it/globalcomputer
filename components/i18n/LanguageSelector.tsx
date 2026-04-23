"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";

export type LanguageSelectorProps = {
  className?: string;
  buttonClassName?: string;
  "aria-label"?: string;
};

/** Mismo control circular que el header público / home (next locale en un clic). */
export function LanguageSelector({
  className,
  buttonClassName,
  "aria-label": ariaLabel,
}: LanguageSelectorProps) {
  const { locale, setLocale, supportedLocales } = useI18n();
  const nextLocale =
    supportedLocales[
      (supportedLocales.indexOf(locale) + 1) % supportedLocales.length
    ];

  return (
    <div className={cn("flex items-center", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/20 bg-transparent p-0 text-center text-[10px] font-bold uppercase leading-[1] text-black transition hover:border-black hover:text-foreground",
          buttonClassName,
        )}
        onClick={() => setLocale(nextLocale)}
        aria-label={ariaLabel}
      >
        {locale.toUpperCase()}
      </button>
    </div>
  );
}
