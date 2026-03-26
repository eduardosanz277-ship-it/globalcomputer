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
          className="scroll-mt-20 border-y border-border bg-muted/25 py-14 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Destacados de la semana
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Ejemplos de maquetado — conecta aquí tu catálogo real
                </p>
              </div>
              <Link
                href="#categorias"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Ver todo el catálogo
              </Link>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PLACEHOLDER_PRODUCTS.map((p) => (
                <article
                  key={p.name}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-border/40 transition hover:shadow-md"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/60" />
                  <div className="p-4">
                    {p.badge && (
                      <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {p.badge}
                      </span>
                    )}
                    <h3 className="mt-2 font-semibold leading-snug text-foreground">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
                      {p.price}
                    </p>
                    <Button
                      className="mt-4 w-full"
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

        {/* CTA */}
        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-muted/50 p-8 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-8">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">
                  ¿Proyecto grande o instalación en Miami?
                </h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Cuéntanos qué necesitas y te respondemos con una propuesta
                  clara.
                </p>
              </div>
              <Link
                href="#ayuda"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-6 shrink-0 lg:mt-0",
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
