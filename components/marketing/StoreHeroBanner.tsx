"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { HeroAjaxPulseVisual } from "@/components/marketing/HeroAjaxPulseVisual";
import type { HeroCategory, HeroContact } from "@/components/marketing/StoreHero";
import { buttonVariants } from "@/components/ui/button-variants";
import { inter } from "@/lib/fonts/inter";
import { cn } from "@/utils/cn";
import { Headphones, Phone, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

const TRUST_PILLS = [
  { Icon: Truck, label: "Envíos a EE.UU", labelEn: "Shipping to the U.S." },
  { Icon: ShieldCheck, label: "Garantía real", labelEn: "Real warranty" },
  { Icon: Headphones, label: "Te ayudamos", labelEn: "We help you" },
] as const;

export function StoreHeroBanner({
  categories,
  contact,
}: {
  categories: HeroCategory[];
  contact: HeroContact;
}) {
  const { locale } = useI18n();
  const t = (es: string, en?: string | null) =>
    locale === "en" ? en?.trim() || es : es;

  return (
    <section
      className={cn(
        inter.className,
        "relative flex flex-col justify-center overflow-hidden bg-white lg:h-[500px]",
      )}
    >
      <div className="relative z-20 mx-auto w-full max-w-7xl bg-transparent py-6 sm:py-8 md:px-8 md:py-6">
        <div className="grid items-center gap-10">
          <div className="text-center md:max-w-[65%] md:text-left lg:max-w-[60%] xl:max-w-[56%]">
            <div className="px-4 sm:px-6 md:px-0">
              <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-foreground sm:text-[2.5rem] md:text-[28px] lg:text-[52px]">
                {t("Tu seguridad, simple y clara", "Your security, simple and clear")}
              </h1>
              <p className="mx-auto mt-4 text-pretty text-[14px] font-medium text-muted-foreground sm:text-[15px] md:mx-0 md:text-[14px] lg:text-[17px]">
                {t(
                  "Cámaras, grabadoras y kits con precios claros, y equipos que te orientan.",
                  "Cameras, recorders, and kits with clear prices, and teams that guide you.",
                )}
                <br />
                {t(
                  "Así debería ser comprar tecnología.",
                  "This is how buying technology should feel.",
                )}
              </p>

              <ul className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
                {TRUST_PILLS.map(({ Icon, label, labelEn }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-2 text-[12.8px] font-medium text-foreground"
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    {t(label, labelEn)}
                  </li>
                ))}
              </ul>
            </div>

            {/*
              Imagen solo para mobile: va encima de los botones, sin el padding horizontal
              del resto del contenido, para que quede pegada al borde derecho real. Desde
              md (tablet) en adelante se usa el layout de dos columnas con la imagen a la
              derecha ocupando todo el alto (ver bloque absoluto más abajo).
            */}
            <div className="relative ml-auto mr-0 mt-6 w-full max-w-md md:hidden">
              <img
                src="/images/hero/hero_sm.svg"
                alt=""
                aria-hidden
                className="h-auto w-full"
              />
            </div>

            <div className="px-4 sm:px-6 md:px-0">
              <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center md:justify-start">
                <Link
                  href="/products"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-10 w-full gap-2 rounded-full bg-primary px-8 font-semibold text-primary-foreground transition hover:scale-[1.02] hover:bg-primary sm:h-11 sm:w-auto",
                  )}
                >
                  {t("Comprar ahora", "Shop now")}
                </Link>
                <Link
                  href={`tel:${contact.phoneTel}`}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-10 w-full gap-2 rounded-full border-border bg-white px-5 font-semibold text-foreground transition hover:bg-muted/60 sm:h-11 sm:w-auto",
                  )}
                  aria-label={`${t("Llamar al", "Call")} ${contact.phoneDisplay}`}
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {contact.phoneDisplay}
                </Link>
              </div>

              <div className="mt-9 md:pr-8 lg:pr-20 xl:pr-28">
                <p className="text-[16px] font-bold uppercase tracking-wider text-foreground">
                  {t("Explorar por categorías", "Browse by category")}
                </p>
                <ul className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                  {categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/catalog/${c.slug}`}
                        prefetch={false}
                        aria-label={`${t("Ver productos en", "View products in")} ${t(c.name, c.nameEn)}`}
                        className="inline-flex items-center rounded-full border border-border bg-white px-4 py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        {t(c.name, c.nameEn)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*
        Imagen para tablet (md): se sale del contenedor centrado para ocupar todo el alto
        del hero y quedar pegada al borde derecho real de la ventana.
      */}
      <div
        className="pointer-events-none absolute inset-0 z-0 hidden bg-[url('/images/hero/hero_md.svg')] bg-right bg-no-repeat bg-[length:auto_88%] md:block lg:hidden"
        aria-hidden
      />

      {/*
        Visual animado para desktop (lg): círculos que "respiran" (se achican y bajan cada
        5s, 1.2s de transición) igual que el prototipo de Figma "Desktop Ajax" ⇄
        "Desktop Camara" (node-id 323:1185 / 323:1723). Alto fijo, centrado verticalmente,
        pegado al borde derecho.
      */}
      <div className="pointer-events-none absolute right-0 top-1/2 z-0 hidden h-[500px] w-full -translate-y-1/2 lg:flex lg:justify-end">
        <HeroAjaxPulseVisual />
      </div>
    </section>
  );
}
