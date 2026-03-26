import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  Package,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wrench,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { SiteFooter } from "@/components/marketing/SiteFooter";
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

const CATEGORIES = [
  {
    title: "Cámaras IP",
    desc: "Color nocturno, PoE y resolución 4K",
    href: "#destacados",
  },
  {
    title: "Grabadoras NVR/DVR",
    desc: "Desde 4 hasta 32 canales",
    href: "#destacados",
  },
  {
    title: "Kits completos",
    desc: "Todo lo necesario para empezar",
    href: "#destacados",
  },
  {
    title: "Accesorios",
    desc: "Cables, discos y montajes",
    href: "#destacados",
  },
];

const PLACEHOLDER_PRODUCTS = [
  { name: "Cámara IP 4MP ColorVu", price: "$94.99", badge: "Popular" },
  { name: "NVR PoE 8 canales 4K", price: "$379.99", badge: null },
  { name: "Kit 4 cámaras + NVR", price: "Desde $490", badge: "-10%" },
  { name: "Bullet 8MP Híbrida", price: "$229.99", badge: "Nuevo" },
];

const HERO_STATS = [
  { label: "Envío nacional", value: "Seguimiento" },
  { label: "Soporte", value: "Lun–Vie" },
  { label: "Garantía", value: "Equipos" },
];

export default async function HomePage() {
  const user = await getCurrentUserService();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />

      <main className="overflow-x-hidden">
        {/* Hero */}
        <section className="relative border-b border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,hsl(217_91%_60%/0.35),transparent_55%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90 sm:text-sm">
                  Videovigilancia profesional
                </p>
                <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.1]">
                  Protege lo que más importa, con la tecnología que mereces
                </h1>
                <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/75 sm:text-lg">
                  Cámaras, grabadoras y kits seleccionados. Envío rápido, garantía y
                  equipo humano para ayudarte a elegir bien.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="#destacados"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "gap-2 bg-white text-slate-900 shadow-lg shadow-blue-950/40 hover:bg-white/90",
                    )}
                  >
                    Ver destacados
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/register"
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" }),
                      "border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/15",
                    )}
                  >
                    Crear cuenta
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/25 via-transparent to-blue-400/10 blur-2xl lg:-inset-6" />
                <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/50 backdrop-blur-md sm:p-8">
                  <p className="text-sm font-medium text-white/90">
                    Por qué comprar con nosotros
                  </p>
                  <ul className="mt-6 space-y-4">
                    {HERO_STATS.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0"
                      >
                        <span className="text-sm text-white/65">{row.label}</span>
                        <span className="text-sm font-semibold tabular-nums text-white">
                          {row.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="#categorias"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                      "mt-6 w-full gap-2 bg-white/95 text-slate-900 hover:bg-white",
                    )}
                  >
                    Explorar categorías
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="categorias" className="scroll-mt-20 bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeSectionHeading
              eyebrow="Catálogo"
              title="Compra por categoría"
              description="Encuentra rápido lo que necesitas para tu instalación."
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.title}
                  href={c.href}
                  className="group flex min-h-[180px] flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm ring-1 ring-border/30 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                    <Package className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-5 font-semibold leading-snug text-foreground group-hover:text-primary">
                    {c.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {c.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                    Explorar
                    <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured products */}
        <section
          id="destacados"
          className="scroll-mt-20 border-y border-border bg-slate-50/80 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <HomeSectionHeading
                align="left"
                eyebrow="Selección"
                title="Destacados de la semana"
                description="Ejemplos de maquetado — conecta aquí tu catálogo real."
                className="sm:max-w-xl"
              />
              <Link
                href="#categorias"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "shrink-0 border-primary/25 bg-background hover:bg-primary/5",
                )}
              >
                Ver todo el catálogo
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PLACEHOLDER_PRODUCTS.map((p) => (
                <article
                  key={p.name}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm ring-1 ring-border/30 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/80">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(217_91%_60%/0.12),transparent_50%)]" />
                    <div className="absolute bottom-3 left-3 right-3 flex h-14 items-end justify-between rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-500 shadow-sm backdrop-blur-sm">
                      <span>Vista previa</span>
                      <Package className="h-4 w-4 text-primary" aria-hidden />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    {p.badge ? (
                      <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {p.badge}
                      </span>
                    ) : (
                      <span className="h-5" aria-hidden />
                    )}
                    <h3 className="mt-2 font-semibold leading-snug text-foreground">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-lg font-bold tabular-nums text-foreground">
                      {p.price}
                    </p>
                    <Button
                      className="mt-5 w-full"
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
        <section className="border-b border-border bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeSectionHeading
              eyebrow="Tranquilidad"
              title="Beneficios que dan confianza"
              description="Envío, garantía y soporte para que tu instalación sea un éxito."
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
                  className="flex gap-4 rounded-2xl border border-border/80 bg-slate-50/60 p-5 shadow-sm ring-1 ring-border/25"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug text-foreground">{t}</p>
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
        <section className="bg-slate-50/80 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeSectionHeading
              eyebrow="Testimonios"
              title="Confianza real de clientes"
              description="Opiniones de quienes ya instalaron su sistema con nosotros."
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
                  className="flex flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm ring-1 ring-border/30"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-0.5 text-primary" aria-hidden>
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary/80" aria-hidden />
                  </div>
                  <blockquote className="mt-4 flex-1 border-l-2 border-primary/35 pl-4 text-sm italic leading-relaxed text-muted-foreground">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-5 text-sm font-semibold text-foreground">
                    {t.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Banner emocional */}
        <section className="border-y border-border bg-gradient-to-br from-primary/[0.08] via-background to-slate-50/90 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg ring-1 ring-border/40">
              <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                      Seguridad que se nota en cada día
                    </h2>
                    <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Productos seleccionados + servicios que reducen la fricción. Menos dudas,
                      más confianza, mejor resultado.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Link
                    href="#destacados"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "default" }),
                      "w-full sm:w-auto",
                    )}
                  >
                    Ver productos
                  </Link>
                  <Link
                    href="#ayuda"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "default" }),
                      "w-full border-primary/30 bg-background hover:bg-primary/5 sm:w-auto",
                    )}
                  >
                    Asesoría rápida
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Educativo */}
        <section className="bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeSectionHeading
              eyebrow="Proceso"
              title="Cómo funciona (en 3 pasos)"
              description="Todo pensado para que avances rápido y con claridad."
            />
            <ol className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: 1,
                  Icon: Package,
                  t: "Elige tu equipo",
                  s: "Encuentra cámaras y kits por categoría, con precios transparentes.",
                },
                {
                  step: 2,
                  Icon: Wrench,
                  t: "Añade servicios",
                  s: "Si quieres, gestionamos instalación, mantenimiento y soporte técnico.",
                },
                {
                  step: 3,
                  Icon: ShieldCheck,
                  t: "Instala y asegura",
                  s: "Queda listo con acompañamiento. Menos objeciones, más confianza.",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="relative rounded-2xl border border-border/80 bg-slate-50/50 p-6 pt-10 shadow-sm ring-1 ring-border/25"
                >
                  <span className="absolute left-6 top-0 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
                    {item.step}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{item.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Ofertas */}
        <section className="border-t border-border bg-slate-50/80 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeSectionHeading
              eyebrow="Promos"
              title="Ofertas destacadas"
              description="Promos puntuales para que mejores tu seguridad sin romper tu presupuesto."
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Pack instalación + kit",
                  desc: "Mejora tu seguridad con acompañamiento de principio a fin.",
                  badge: "Ahorra",
                },
                {
                  title: "Descuento en equipos seleccionados",
                  desc: "Promociones por tiempo limitado en cámaras y grabadoras.",
                  badge: "-10%",
                },
                {
                  title: "Soporte prioritario",
                  desc: "Respuestas rápidas para resolver dudas y mantener el sistema.",
                  badge: "Plus",
                },
              ].map((o) => (
                <div
                  key={o.title}
                  className="flex flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm ring-1 ring-border/30 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {o.badge}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-foreground">
                    {o.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {o.desc}
                  </p>
                  <Link
                    href="#destacados"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "mt-6 w-full border-primary/30 bg-background hover:bg-primary/5",
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
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-primary/10 via-background to-slate-50/80 p-8 shadow-md ring-1 ring-border/40 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
              <div className="max-w-xl">
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
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
                  "mt-8 shrink-0 lg:mt-0",
                )}
              >
                Contactar
              </Link>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="border-t border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-lg font-semibold">Newsletter</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ofertas y novedades. Sin spam.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Input
                type="email"
                placeholder="tu@email.com"
                className="h-11 sm:max-w-xs"
                aria-label="Correo para newsletter"
              />
              <Button type="button" className="h-11 sm:w-auto">
                Suscribirme
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
