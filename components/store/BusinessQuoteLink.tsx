"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { SITE_CONTACT_PHONE_TEL } from "@/lib/site";
import { buildWhatsAppUrl } from "@/modules/shipping/shipping.calculator";
import { cn } from "@/utils/cn";
import { MessageCircle } from "lucide-react";

/**
 * Aviso para cuentas de compañía en productos «solo público»
 * (sin precio business de tabla): en vez de precio y botón de compra,
 * un enlace de cotización por WhatsApp al número del negocio.
 * El patrón de URL es el del sitio (`buildWhatsAppUrl` → wa.me).
 */
export function BusinessQuoteLink({
  productName,
  variant = "inline",
  className,
}: {
  productName: string;
  /** inline: texto en la zona de precio · pill: botón compacto (tarjeta) · cta: botón grande (ficha). */
  variant?: "inline" | "pill" | "cta";
  className?: string;
}) {
  const { t } = useI18n();
  const message = t("storefront.businessQuote.whatsAppMessage").replace(
    "{product}",
    productName,
  );
  const href = buildWhatsAppUrl(SITE_CONTACT_PHONE_TEL, message) ?? "#";
  const label =
    variant === "pill"
      ? t("storefront.businessQuote.shortLabel")
      : variant === "cta"
        ? t("storefront.businessQuote.ctaLabel")
        : t("storefront.businessQuote.label");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold text-primary transition hover:text-primary/80",
        variant === "inline" && "text-sm leading-snug sm:text-[15px]",
        variant === "pill" &&
          "h-9 rounded-full bg-primary/90 px-3.5 text-[11px] font-medium leading-none tracking-wide text-primary-foreground shadow-md hover:bg-primary hover:text-primary-foreground lg:h-9 lg:px-4 lg:text-[13px] lg:font-semibold",
        variant === "cta" &&
          "h-12 w-full justify-center rounded-xl bg-primary px-4 text-base shadow-sm hover:bg-primary/90 hover:text-primary-foreground sm:flex-1",
        className,
      )}
    >
      <MessageCircle
        className={cn("shrink-0", variant === "cta" ? "h-5 w-5" : "h-4 w-4")}
        aria-hidden
      />
      <span>{label}</span>
    </a>
  );
}
