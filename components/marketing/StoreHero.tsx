import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { getNavigationData } from "@/modules/navigation/navigation.service";
import {
  ChevronRight,
  Headphones,
  Phone,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";
import { getPublicSiteContact } from "@/lib/site-contact.server";

const TRUST_PILLS = [
  { Icon: Truck, label: "Envío a EE. UU." },
  { Icon: ShieldCheck, label: "Garantía real" },
  { Icon: Headphones, label: "Te ayudamos" },
] as const;

const HERO_STATS = [
  { label: "Envío", value: "Seguimiento" },
  { label: "Soporte", value: "Lun–Vie" },
  { label: "Garantía", value: "Equipos" },
];

const TRUST_BAR = [
  { Icon: Star, text: "4,9 valoración media", sub: "compras verificadas" },
  { Icon: Truck, text: "Envío nacional", sub: "EE. UU." },
  { Icon: ShieldCheck, text: "Pago seguro", sub: "datos protegidos" },
] as const;

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

export async function StoreHero() {
  const [nav, contact] = await Promise.all([
    getNavigationData(),
    getPublicSiteContact(),
  ]);
  const categories = nav?.catalogCategories ?? [];

  return (
    <div className="relative">
      <section
        className={cn(
          "store-grain relative overflow-hidden rounded-b-[2rem] border-b border-white/10 pb-12 text-white sm:rounded-b-[2.75rem] sm:pb-16 lg:pb-20",
          "bg-gradient-to-br from-brand-hero-from via-[#1a2540] to-brand-hero-to",
        )}
      >
        {/* Malla luminosa tipo e-commerce actual */}
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
            <div className="animate-fade-up">
              {/* <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary/95 backdrop-blur-md sm:text-xs">
                Tienda de confianza
              </p> */}
              <h1
                className={cn(
                  poppins.className,
                  "mt-5 text-[2.25rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.625rem] sm:leading-[1.08] lg:text-[2.725rem]",
                )}
              >
                Tu seguridad,{" "}
                <span className="bg-gradient-to-r from-white via-white to-secondary/90 bg-clip-text text-transparent">
                  simple y clara
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-[16px] font-normal leading-relaxed text-white/85 sm:text-[18px]">
                Cámaras, grabadoras y kits con precios visibles y equipo que te
                orienta. Así debería ser comprar tecnología.
              </p>

              <ul className="mt-7 flex flex-wrap gap-2 sm:gap-2.5">
                {TRUST_PILLS.map(({ Icon, label }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-sm font-medium text-white/92 backdrop-blur-md sm:px-3.5 sm:py-2 sm:text-base"
                  >
                    <Icon
                      className="h-3.5 w-3.5 shrink-0 text-secondary sm:h-4 sm:w-4"
                      aria-hidden
                    />
                    {label}
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/productos"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-14 w-full gap-2 rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-xl shadow-black/25 transition hover:scale-[1.02] hover:bg-primary/90 sm:w-auto",
                  )}
                >
                  <span className="text-base sm:text-[1.05rem]">
                    Comprar ahora
                  </span>
                </Link>
                <Link
                  href={`tel:${contact.phoneTel}`}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "group h-14 w-full gap-2 rounded-full border-2 border-white/35 bg-white/5 px-5 font-semibold text-white backdrop-blur-md hover:bg-white/15 sm:w-auto",
                  )}
                  aria-label={`Llamar para ayuda al ${contact.phoneDisplay}`}
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-[11px] font-medium text-white/80 sm:text-xs">
                      ¿Necesitas ayuda?
                    </span>
                    <span className="text-sm font-semibold text-white sm:text-base">
                      {contact.phoneDisplay}
                    </span>
                  </span>
                </Link>
              </div>
            </div>

            {/* Escaparate visual */}
            <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-white/20 bg-slate-900 shadow-2xl shadow-black/40 sm:rounded-[2rem]">
                <Image
                  src="/images/camaras_de_seguridad.webp"
                  alt="Cámaras de seguridad"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 480px"
                  quality={80}
                />
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-white/75 sm:text-base">
                  Explora por categoría
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <li key={c.id} className="max-w-full">
                      <Link
                        href={`/catalogo/${c.id}`}
                        prefetch={false}
                        aria-label={`Ver productos en ${c.name}`}
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
                          {c.name}
                        </span>
                        {/* <ChevronRight
                          className="relative z-[1] mt-0.5 hidden h-4 w-4 shrink-0 text-secondary/90 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1 lg:block"
                          aria-hidden
                        /> */}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tira de confianza que “flota” sobre el fondo gris — típico e-commerce actual */}
      <div className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 sm:-mt-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft-lg sm:flex sm:items-stretch sm:justify-between sm:gap-0 sm:p-0 sm:py-1">
          {TRUST_BAR.map(({ Icon, text, sub }, i) => (
            <div
              key={text}
              className={cn(
                "flex flex-1 items-center gap-3 px-4 py-3 sm:justify-center sm:py-4 sm:px-6",
                i > 0 && "border-t border-border/60 sm:border-l sm:border-t-0",
              )}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {text}
                </p>
                <p className="text-sm text-muted-foreground sm:text-base">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
