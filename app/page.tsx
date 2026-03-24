import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Headphones, Package, Shield, Truck } from "lucide-react";
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

export default async function HomePage() {
  const user = await getCurrentUserService();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <p className="text-sm font-medium uppercase tracking-wider text-white/70">
              Videovigilancia profesional
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Protege lo que más importa, con la tecnología que mereces
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/80">
              Cámaras, grabadoras y kits seleccionados. Envío rápido, garantía y
              equipo humano para ayudarte a elegir bien.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#destacados"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 bg-white text-slate-900 hover:bg-white/90",
                )}
              >
                Ver destacados
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20",
                )}
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-b border-border bg-muted/40">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
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
                className="flex gap-4 rounded-xl border border-border/60 bg-background p-4 shadow-sm"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t}</p>
                  <p className="text-sm text-muted-foreground">{s}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section id="categorias" className="scroll-mt-20 py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Compra por categoría
              </h2>
              <p className="mt-2 text-muted-foreground">
                Encuentra rápido lo que necesitas para tu instalación
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.title}
                  href={c.href}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/40 transition hover:border-primary/30 hover:shadow-md"
                >
                  <Package className="h-8 w-8 text-primary" aria-hidden />
                  <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">
                    Explorar
                    <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" />
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
