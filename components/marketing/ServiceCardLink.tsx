"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { plainTextFromHtml } from "@/lib/plainTextFromHtml";
import { clampText } from "@/components/marketing/service-card-shared";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

type ServiceCardLinkProps = {
  name: string;
  nameEn?: string | null;
  /** Puede incluir HTML; se muestra como texto plano recortado. */
  description: string | null | undefined;
  descriptionEn?: string | null;
  imageUrl: string | null;
  href: string;
};

export function ServiceCardLink({
  name,
  nameEn,
  description,
  descriptionEn,
  imageUrl,
  href,
}: ServiceCardLinkProps) {
  const { locale } = useI18n();
  const t = (es: string, en: string) => (locale === "en" ? en : es);
  const displayName = locale === "en" ? nameEn?.trim() || name : name;
  const rawDescription =
    locale === "en" ? descriptionEn?.trim() || description || "" : description || "";
  const excerpt = clampText(plainTextFromHtml(rawDescription), 130);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg">
      <Link
        href={href}
        className="relative block aspect-[16/10] shrink-0 overflow-hidden border-b border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-inset"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-card to-muted/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
      </Link>

      <div className="flex min-h-0 flex-1 flex-col p-5">
        <Link
          href={href}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
        >
          <h3
            className={cn(
              poppins.className,
              "text-lg font-semibold leading-snug text-foreground transition group-hover:text-primary",
            )}
          >
            {displayName}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {excerpt}
        </p>

        <div className="mt-auto flex shrink-0 flex-col gap-2 pt-5 sm:flex-row sm:flex-wrap">
          <Link
            href={href}
            className="inline-flex h-10 min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 sm:flex-initial sm:justify-start"
          >
            {t("Ver servicio", "View service")}
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-10 min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-border/70 bg-background/90 px-4 text-sm font-semibold text-foreground/90 backdrop-blur-sm transition hover:border-primary/30 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 sm:flex-initial sm:justify-start"
          >
            {t("Hablar con asesor", "Talk to advisor")}
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent opacity-0 transition group-hover:opacity-100" />
    </article>
  );
}
