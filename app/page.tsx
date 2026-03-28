import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Camera,
  Cable,
  CheckCircle2,
  HardDrive,
  Headphones,
  Heart,
  LayoutGrid,
  Package,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wrench,
} from "lucide-react";
import { StoreHero } from "@/components/marketing/StoreHero";
import { getNavigationData } from "@/modules/navigation/navigation.service";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { ServicesSection } from "@/components/marketing/ServicesSection";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";

export const metadata: Metadata = {
  title: "Global Computers USA | Cámaras de Seguridad, Software y Tecnología",
  description:
    "Tienda online de seguridad, cámaras IP, grabadoras y kits. Envíos, garantía y soporte.",
};

const CATEGORIES: Array<{
  title: string;
  desc: string;
  href: string;
  Icon: LucideIcon;
  chip: string;
  tint: string;
}> = [
  {
    title: "Cámaras IP",
    desc: "Color nocturno, PoE y 4K",
    href: "#destacados",
    Icon: Camera,
    chip: "Popular",
    tint: "from-primary/12 via-card to-primary/[0.02]",
  },
  {
    title: "Grabadoras NVR/DVR",
    desc: "Desde 4 hasta 32 canales",
    href: "#destacados",
    Icon: HardDrive,
    chip: "Pro",
    tint: "from-cyan-500/10 via-card to-card",
  },
  {
    title: "Kits completos",
    desc: "Todo para empezar ya",
    href: "#destacados",
    Icon: LayoutGrid,
    chip: "Pack",
    tint: "from-secondary/15 via-card to-card",
  },
  {
    title: "Accesorios",
    desc: "Cables, discos y más",
    href: "#destacados",
    Icon: Cable,
    chip: "Extra",
    tint: "from-violet-500/10 via-card to-card",
  },
];

const PLACEHOLDER_PRODUCTS = [
  { name: "Cámara IP 4MP ColorVu", price: "$94.99", badge: "Popular", rating: 5 },
  { name: "NVR PoE 8 canales 4K", price: "$379.99", badge: null, rating: 5 },
  { name: "Kit 4 cámaras + NVR", price: "Desde $490", badge: "-10%", rating: 5 },
  { name: "Bullet 8MP Híbrida", price: "$229.99", badge: "Nuevo", rating: 4 },
];

export default async function HomePage() {
  const nav = await getNavigationData();
  const brands = nav?.brands ?? [];

  return (
    <main className="overflow-x-hidden">
        <StoreHero />

        {/* Categories */}
        <section id="categorias" className="scroll-mt-32 bg-background pt-24 sm:scroll-mt-36 sm:pt-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeSectionHeading
              eyebrow="Catálogo"
              title="Explora por marca"
              description="Elige una marca para ver sus productos destacados."
              titleClassName="text-3xl sm:text-4xl"
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  href={`/brands/${b.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-muted/30 p-6 shadow-soft transition hover:-translate-y-1.5 hover:shadow-soft-lg"
                >
                  <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-primary shadow-lg shadow-primary/10 ring-1 ring-border/40 transition group-hover:scale-105 group-hover:ring-primary/25">
                    <span className="text-sm font-semibold text-foreground">{b.name[0]}</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold leading-snug text-foreground group-hover:text-primary">
                    {b.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Ver productos de {b.name}
                  </p>
                  <span className="mt-4 inline-flex items-center text-sm font-semibold text-primary">
                    Ver productos
                    <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured products */}
        <section
          id="destacados"
          className="scroll-mt-32 border-y border-border/60 bg-gradient-to-b from-muted/50 to-background py-20 sm:scroll-mt-36 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <HomeSectionHeading
                align="left"
                eyebrow="Selección"
                title="Destacados de la semana"
                description="Los favoritos de quienes ya instalaron con nosotros. Conecta tu catálogo real cuando quieras."
                className="sm:max-w-xl"
                titleClassName="text-3xl sm:text-4xl"
              />
              <Link
                href="#categorias"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "shrink-0 rounded-2xl border-primary/30 bg-card px-5 font-semibold hover:bg-primary/5",
                )}
              >
                Ver catálogo
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PLACEHOLDER_PRODUCTS.map((p) => (
                <article
                  key={p.name}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-card shadow-soft transition hover:-translate-y-1.5 hover:shadow-soft-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted via-background to-primary/[0.08]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#357fd228,transparent_55%)] transition-transform duration-500 group-hover:scale-105" />
                    <button
                      type="button"
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/95 text-muted-foreground shadow-sm backdrop-blur-sm transition hover:bg-primary/10 hover:text-primary"
                      aria-label="Guardar en favoritos"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-3 right-3 flex h-12 items-center justify-between rounded-xl border border-white/70 bg-white/90 px-3 text-[10px] font-bold uppercase tracking-wider text-brand-gray shadow-sm backdrop-blur-sm">
                      <span>Vista rápida</span>
                      <Package className="h-4 w-4 text-primary" aria-hidden />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-1 text-amber-500" aria-hidden>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < p.rating ? "fill-current" : "fill-muted text-muted",
                          )}
                        />
                      ))}
                      <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                        ({p.rating}.0)
                      </span>
                    </div>
                    {p.badge ? (
                      <span className="mt-2 inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {p.badge}
                      </span>
                    ) : (
                      <span className="mt-2 h-5" aria-hidden />
                    )}
                    <h3 className="mt-1 font-display text-base font-bold leading-snug text-foreground">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-foreground">
                      {p.price}
                    </p>
                    <Button
                      className="mt-5 w-full rounded-xl font-semibold"
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Añadir al carrito
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section className="border-b border-border/60 bg-background py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeSectionHeading
              eyebrow="Tranquilidad"
              title="Comprar aquí, sin sorpresas"
              description="Envío, garantía y soporte para que tu instalación salga bien a la primera."
              titleClassName="text-3xl sm:text-4xl"
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {[
                {
                  icon: Truck,
                  t: "Envío a todo el país",
                  s: "Seguimiento en tiempo real",
                },
                {
                  icon: Shield,
                  t: "Garantía en equipos",
                  s: "Marcas líderes del sector",
                },
                {
                  icon: Headphones,
                  t: "Soporte especializado",
                  s: "Lun–Vie horario extendido",
                },
              ].map(({ icon: Icon, t, s }) => (
                <div
                  key={t}
                  className="flex gap-4 rounded-3xl border border-border/50 bg-gradient-to-br from-card to-muted/50 p-6 shadow-soft"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-semibold leading-snug text-foreground">
                      {t}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {s}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <ServicesSection />

        {/* Social proof */}
        <section className="bg-muted/70 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeSectionHeading
              eyebrow="Testimonios"
              title="Historias reales"
              description="Personas como tú que ya confiaron en nosotros."
              titleClassName="text-3xl sm:text-4xl"
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  quote:
                    "Llegó rápido y la configuración fue muy sencilla. El soporte respondió en el mismo día.",
                  name: "María R.",
                  stars: 5,
                },
                {
                  quote:
                    "Excelente garantía y asesoría. Me recomendaron el equipo justo para mi local.",
                  name: "Carlos G.",
                  stars: 5,
                },
                {
                  quote:
                    "Montaje profesional. Se nota la experiencia cuando todo queda bien desde el primer momento.",
                  name: "Laura P.",
                  stars: 5,
                },
              ].map((t) => (
                <figure
                  key={t.name}
                  className="flex flex-col rounded-3xl border border-border/50 bg-card p-5 shadow-soft sm:p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-0.5 text-amber-500" aria-hidden>
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  </div>
                  <blockquote className="mt-4 flex-1 border-l-2 border-primary/40 pl-4 text-sm italic leading-relaxed text-muted-foreground">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-5 text-sm font-bold text-foreground">
                    {t.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Banner emocional */}
        <section className="border-y border-border/60 bg-gradient-to-br from-primary/[0.09] via-background to-secondary/[0.06] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-soft-lg">
              <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30">
                    <Sparkles className="h-7 w-7" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                      Seguridad que se nota cada día
                    </h2>
                    <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Productos seleccionados y servicios que te quitan fricción. Menos dudas,
                      más confianza.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Link
                    href="#destacados"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "default" }),
                      "w-full rounded-2xl font-semibold sm:w-auto",
                    )}
                  >
                    Ver productos
                  </Link>
                  <Link
                    href="#ayuda"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "default" }),
                      "w-full rounded-2xl border-primary/30 bg-background font-semibold hover:bg-primary/5 sm:w-auto",
                    )}
                  >
                    Hablar con asesor
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Educativo */}
        <section className="bg-background py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeSectionHeading
              eyebrow="Proceso"
              title="Cómo funciona"
              description="Tres pasos. Sin complicarte."
              titleClassName="text-3xl sm:text-4xl"
            />
            <ol className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: 1,
                  Icon: Package,
                  t: "Elige tu equipo",
                  s: "Categorías claras y precios visibles.",
                },
                {
                  step: 2,
                  Icon: Wrench,
                  t: "Añade servicios",
                  s: "Instalación, mantenimiento y soporte si lo necesitas.",
                },
                {
                  step: 3,
                  Icon: ShieldCheck,
                  t: "Instala y listo",
                  s: "Te acompañamos para que quede perfecto.",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="relative rounded-3xl border border-border/50 bg-muted/40 p-6 pt-10 shadow-soft"
                >
                  <span className="absolute left-6 top-0 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30">
                    {item.step}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                    {item.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Ofertas */}
        <section className="border-t border-border/60 bg-muted/60 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeSectionHeading
              eyebrow="Promos"
              title="Ofertas que suman"
              description="Promociones puntuales para mejorar tu seguridad."
              titleClassName="text-3xl sm:text-4xl"
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Pack instalación + kit",
                  desc: "Acompañamiento de principio a fin.",
                  badge: "Ahorra",
                },
                {
                  title: "Equipos en oferta",
                  desc: "Cámaras y grabadoras con descuento por tiempo limitado.",
                  badge: "-10%",
                },
                {
                  title: "Soporte prioritario",
                  desc: "Respuestas rápidas para resolver dudas.",
                  badge: "Plus",
                },
              ].map((o) => (
                <div
                  key={o.title}
                  className="flex flex-col rounded-3xl border border-border/50 bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg"
                >
                  <span className="inline-flex w-fit rounded-full bg-secondary/15 px-3 py-1 text-xs font-bold text-secondary">
                    {o.badge}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold leading-snug text-foreground">
                    {o.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {o.desc}
                  </p>
                  <Link
                    href="#destacados"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "mt-6 w-full rounded-xl border-primary/30 font-semibold hover:bg-primary/5",
                    )}
                  >
                    Ver destacados
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 shadow-soft-lg sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
              <div className="max-w-xl">
                <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                  ¿Proyecto grande o instalación en Miami?
                </h2>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Cuéntanos qué necesitas y te respondemos con una propuesta clara.
                </p>
              </div>
              <Link
                href="#ayuda"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-8 shrink-0 rounded-2xl px-8 font-semibold lg:mt-0",
                )}
              >
                Contactar
              </Link>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="border-t border-border/60 bg-muted/50 py-16 sm:py-20">
          <div className="mx-auto max-w-lg px-4 sm:px-6">
            <div className="rounded-3xl border border-border/50 bg-card p-8 text-center shadow-soft sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Newsletter
              </p>
              <h2 className="mt-2 font-display text-xl font-bold sm:text-2xl">
                Ofertas y novedades
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sin spam. Cancela cuando quieras.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-2">
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  className="h-11 rounded-xl border-border/80 bg-background sm:max-w-xs"
                  aria-label="Correo para newsletter"
                />
                <Button type="button" className="h-11 rounded-xl font-semibold sm:w-auto">
                  Suscribirme
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}
