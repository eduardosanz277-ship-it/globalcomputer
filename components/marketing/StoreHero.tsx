"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
// Slider de banners de servicios: comentado a favor del nuevo StoreHeroBanner.
// import { HeroServiceSlider } from "@/components/marketing/HeroServiceSlider";
import { StoreHeroBanner } from "@/components/marketing/StoreHeroBanner";
import type { StorefrontServiceHeroSlide } from "@/modules/catalog/storefront-services.service";
import type { StoreRatingSummary } from "@/modules/site/leave-review-data.service";
import { BadgeCheck, Headphones, ShieldCheck, Truck } from "lucide-react";

const TRUST_BAR_ITEMS = [
  {
    Icon: Truck,
    title: { es: "Envíos nacionales", en: "Nationwide Shipping" },
    desc: { es: "Enviamos a todo EE. UU.", en: "Shipping across the U.S." },
  },
  {
    Icon: ShieldCheck,
    title: { es: "Pagos seguros", en: "Secure Payments" },
    desc: { es: "Checkout protegido", en: "Protected checkout" },
  },
  {
    Icon: BadgeCheck,
    title: { es: "Garantía real", en: "Real Warranty" },
    desc: { es: "Compra con confianza", en: "Buy with confidence" },
  },
  {
    Icon: Headphones,
    title: { es: "Soporte experto", en: "Expert Support" },
    desc: { es: "Estamos para ayudarte", en: "We're here to help" },
  },
] as const;

export type HeroCategory = {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
};

export type HeroContact = {
  phoneTel: string;
  phoneDisplay: string;
};

export function StoreHero({
  categories,
  contact,
}: {
  categories: HeroCategory[];
  contact: HeroContact;
  ratingSummary: StoreRatingSummary;
  heroSlides: StorefrontServiceHeroSlide[];
}) {
  const { locale } = useI18n();
  const t = (es: string, en?: string | null) =>
    locale === "en" ? en?.trim() || es : es;

  return (
    <div className="relative">
      <StoreHeroBanner categories={categories} contact={contact} />

      {/*
      Hero oscuro anterior con slider de banners de servicios de fondo — deshabilitado
      a favor de StoreHeroBanner (nuevo diseño en fondo blanco). Se conserva por si se
      retoma más adelante.

      <section
        className={cn(
          "store-grain relative overflow-hidden rounded-b-[2rem] border-b border-white/10 pb-12 text-white sm:rounded-b-[2.75rem] sm:pb-16 lg:pb-20",
          "bg-gradient-to-br from-brand-hero-from via-[#1a2540] to-brand-hero-to",
        )}
      >
        <HeroServiceSlider slides={heroSlides} />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-hero-from/55 via-[#1a2540]/45 to-brand-hero-to/55"
          aria-hidden
        />

        <div
          className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-primary/35 blur-[100px] animate-blob"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-secondary/25 blur-[90px] animate-blob"
          style={{ animationDelay: "-7s" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16">
          <div className="grid items-center gap-8 md:gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-16">
            <div className="animate-fade-up text-center sm:text-left">
              <h1
                className={cn(
                  poppins.className,
                  "mt-5 text-[2.25rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.625rem] sm:leading-[1.08] lg:text-[2.725rem]",
                )}
              >
                {t("Tu seguridad", "Your security")},{" "}
                <span className="bg-gradient-to-r from-white via-white to-secondary/90 bg-clip-text text-transparent">
                  {t("simple y clara", "simple and clear")}
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-pretty text-[16px] font-normal leading-relaxed text-white sm:mx-0 sm:text-[18px]">
                {t(
                  "Cámaras, grabadoras y kits con precios visibles y equipo que te orienta. Así debería ser comprar tecnología.",
                  "Cameras, recorders, and kits with transparent pricing and a team that guides you. This is how buying technology should feel.",
                )}
              </p>

              <ul className="mt-7 flex flex-wrap justify-center gap-2 sm:justify-start sm:gap-2.5">
                {TRUST_PILLS.map(({ Icon, label, labelEn }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md sm:px-3.5 sm:py-2 sm:text-base"
                  >
                    <Icon
                      className="h-3.5 w-3.5 shrink-0 text-secondary sm:h-4 sm:w-4"
                      aria-hidden
                    />
                    {t(label, labelEn)}
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-wrap justify-center gap-3 sm:justify-start">
                <Link
                  href="/products"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-14 w-full gap-2 rounded-full bg-primary px-8 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/85 sm:w-auto",
                  )}
                >
                  <span className="text-base sm:text-[1.05rem]">
                    {t("Comprar ahora", "Shop now")}
                  </span>
                </Link>
                <Link
                  href={`tel:${contact.phoneTel}`}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "group h-14 w-full gap-2 rounded-full border-2 border-white/35 bg-white/5 px-5 font-semibold text-white backdrop-blur-md transition hover:scale-[1.02] hover:bg-white/15 sm:w-auto",
                  )}
                  aria-label={`${t("Llamar para ayuda al", "Call for help at")} ${contact.phoneDisplay}`}
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-[11px] font-medium text-white sm:text-xs">
                      {t("¿Necesitas ayuda?", "Need help?")}
                    </span>
                    <span className="text-sm font-semibold text-white sm:text-base">
                      {contact.phoneDisplay}
                    </span>
                  </span>
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg sm:mx-0 sm:max-w-none lg:max-w-none">
              <div className="relative hidden aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-white/20 bg-slate-900 shadow-2xl shadow-black/40 sm:rounded-[2rem] lg:invisible lg:block">
                <Image
                  src="/images/camaras_de_seguridad.webp"
                  alt="Cámaras de seguridad"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 480px"
                  quality={80}
                />
              </div>

              <div className="mt-6 text-center sm:text-left">
                <p className="text-sm font-semibold uppercase tracking-wider text-white sm:text-base">
                  {t("Explora por categoría", "Explore by category")}
                </p>
                <ul className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {categories.map((c) => (
                    <li key={c.id} className="max-w-full">
                      <Link
                        href={`/catalog/${c.slug}`}
                        prefetch={false}
                        aria-label={`${t("Ver productos en", "View products in")} ${t(c.name, c.nameEn)}`}
                        className={cn(
                          "group relative inline-flex w-max max-w-full items-start gap-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-left text-[13px] font-medium leading-snug text-white shadow-sm transition-all duration-300 ease-out sm:text-sm",
                          "hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.14] hover:shadow-lg hover:shadow-primary/25",
                          "active:translate-y-0 active:scale-[0.98]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2540]",
                        )}
                      >
                        <span
                          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.12] via-transparent to-primary/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          aria-hidden
                        />
                        <span className="relative z-[1] break-words">
                          {t(c.name, c.nameEn)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

      <section className="w-full border-y border-gray-200 bg-white min-[1101px]:relative min-[1101px]:z-10 min-[1101px]:-mt-7">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {TRUST_BAR_ITEMS.map((item) => (
              <div key={item.title.es} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8EEF5] text-primary">
                  <item.Icon
                    className="h-5 w-5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-[15px] font-semibold text-foreground">
                    {t(item.title.es, item.title.en)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(item.desc.es, item.desc.en)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
