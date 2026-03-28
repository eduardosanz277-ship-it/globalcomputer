import Link from "next/link";
import { getNavigationData } from "@/modules/navigation/navigation.service";
import {
  ArrowRight,
  Camera,
  Headphones,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";

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

export async function StoreHero() {
  const nav = await getNavigationData();
  const brands = nav?.brands ?? [];

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
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-16">
            <div className="animate-fade-up">
              <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary/95 backdrop-blur-md sm:text-xs">
                Tienda de confianza
              </p>
              <h1 className="mt-5 font-display text-[1.85rem] font-bold leading-[1.1] tracking-tight sm:text-4xl sm:leading-[1.08] lg:text-[2.85rem]">
                Tu seguridad,{" "}
                <span className="bg-gradient-to-r from-white via-white to-secondary/90 bg-clip-text text-transparent">
                  simple y clara
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-white/85 sm:text-lg">
                Cámaras, grabadoras y kits con precios visibles y equipo que te orienta. Así
                debería ser comprar tecnología.
              </p>

              <ul className="mt-7 flex flex-wrap gap-2 sm:gap-2.5">
                {TRUST_PILLS.map(({ Icon, label }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/92 backdrop-blur-md sm:px-3.5 sm:py-2 sm:text-sm"
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
                  href="#destacados"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "gap-2 rounded-2xl bg-white px-8 font-semibold text-foreground shadow-xl shadow-black/25 transition hover:scale-[1.02] hover:bg-white",
                  )}
                >
                  Ver ofertas
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "rounded-2xl border-2 border-white/35 bg-white/5 font-semibold text-white backdrop-blur-md hover:bg-white/15",
                  )}
                >
                  Crear cuenta gratis
                </Link>
              </div>
            </div>

            {/* Escaparate visual */}
            <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/30 via-transparent to-secondary/20 blur-2xl lg:-inset-10" />
              <div className="relative">
                <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/[0.09] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:rounded-[2rem] sm:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary-foreground shadow-md">
                      Top ventas
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-300" aria-hidden>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="relative mt-5 aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-primary/40 via-slate-800/80 to-slate-950">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(53,127,210,0.45),transparent_55%)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="h-20 w-20 text-white/90 drop-shadow-lg sm:h-24 sm:w-24" aria-hidden />
                    </div>
                    <span className="absolute bottom-3 left-3 rounded-lg bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/95 backdrop-blur-sm">
                      Vista tienda
                    </span>
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/10 pt-5">
                    <div>
                      <p className="text-sm font-medium text-white/90">Kit 4 cámaras + NVR</p>
                      <p className="mt-0.5 text-2xl font-bold tabular-nums text-white">
                        Desde $490
                      </p>
                    </div>
                    <Link
                      href="#destacados"
                      className={cn(
                        buttonVariants({ size: "sm", variant: "secondary" }),
                        "shrink-0 rounded-xl font-semibold shadow-lg",
                      )}
                    >
                      Ver
                    </Link>
                  </div>
                </div>

                <div className="absolute -right-2 top-8 hidden w-[9.5rem] rounded-2xl border border-white/15 bg-white/[0.1] p-4 shadow-xl backdrop-blur-md md:block lg:-right-4 lg:top-12">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/60">
                    Clientes
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-white">+2,5k</p>
                  <p className="mt-0.5 text-[11px] text-white/65">compras felices</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
                  Explora por marca
                </p>
                <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {brands.map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/brands/${b.id}`}
                        className="block rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
                      >
                        {b.name}
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
                <p className="text-sm font-semibold text-foreground">{text}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
