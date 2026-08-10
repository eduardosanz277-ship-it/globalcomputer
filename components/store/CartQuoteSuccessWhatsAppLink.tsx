"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { buttonVariants } from "@/components/ui/button-variants";
import { GC_MANUAL_QUOTE_WHATSAPP_KEY } from "@/lib/manual-quote-success";
import { cn } from "@/utils/cn";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

/** Enlace de respaldo si el navegador bloqueó la ventana de WhatsApp. */
export function CartQuoteSuccessWhatsAppLink() {
  const { t } = useI18n();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(GC_MANUAL_QUOTE_WHATSAPP_KEY);
      if (stored) {
        setUrl(stored);
        sessionStorage.removeItem(GC_MANUAL_QUOTE_WHATSAPP_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: "default" }),
        "inline-flex items-center justify-center gap-2 rounded-xl",
        "border-transparent bg-[#1ebe57] text-white hover:bg-[#25D366]",
        "focus-visible:ring-[#25D366]/40",
      )}
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
      {t("storefront.quoteSuccess.openWhatsApp")}
    </a>
  );
}
