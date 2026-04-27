import { FAQSection } from "@/components/marketing/FAQSection";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import {
  ServicesSection,
  type ServiceWithI18n,
} from "@/components/marketing/ServicesSection";
import { StoreHero } from "@/components/marketing/StoreHero";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { SimilarProducts } from "@/components/SimilarProducts";
import { StorefrontProductGrid } from "@/components/store/StorefrontProductGrid";
import { buttonVariants } from "@/components/ui/button-variants";
import { getPublicSiteContact } from "@/lib/site-contact.server";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { storefrontPrimaryImageUrl } from "@/modules/catalog/storefront-product.shared";
import {
  listAllActiveStorefrontProducts,
  listFeaturedStorefrontProducts,
} from "@/modules/catalog/storefront-products.service";
import { getNavigationData } from "@/modules/navigation/navigation.service";
import { listActiveSiteFaqs } from "@/modules/site/faqs.service";
import {
  getStoreRatingSummary,
  listProductReviewsForLeaveReviewPage,
} from "@/modules/site/leave-review-data.service";
import { cn } from "@/utils/cn";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Cable,
  Camera,
  CheckCircle2,
  HardDrive,
  LayoutGrid,
  Star,
  UserRound
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

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

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const [
    { data: servicesData },
    products,
    featuredProducts,
    user,
    nav,
    productReviews,
    siteFaqs,
    contact,
    storeRatingSummary,
  ] = await Promise.all([
    supabase
      .from("services")
      .select(
        "id, name, name_en, slug, description, description_en, service_images(id, url, is_primary, sort_order)",
      )
      .limit(6),
    listAllActiveStorefrontProducts(),
    listFeaturedStorefrontProducts(8),
    getCurrentUserService(),
    getNavigationData(),
    listProductReviewsForLeaveReviewPage(),
    listActiveSiteFaqs(),
    getPublicSiteContact(),
    getStoreRatingSummary(),
  ]);
  const priceTier = resolveStorefrontPriceTier(user?.role);
  const discountedProducts = products.filter(
    (p) => p.discount_client > 0 || p.discount_business_pct > 0,
  );
  const offerProducts = discountedProducts.slice(0, 4);
  const brands = nav?.brands ?? [];
  const brandIdsWithProducts = new Set(
    products.filter((p) => p.brand_id).map((p) => p.brand_id),
  );
  const brandImageById = new Map(
    products
      .filter((p) => p.brand_id)
      .map((p) => [p.brand_id, storefrontPrimaryImageUrl(p)]),
  );
  const featuredBrands = brands
    .filter((brand) => brandIdsWithProducts.has(brand.id))
    .map((brand) => ({
      id: brand.id,
      name: brand.name,
      nameEn: brand.nameEn ?? null,
      slug: brand.slug,
      imageUrl: brandImageById.get(brand.id) ?? null,
    }));
  const topProductReviews = [...productReviews]
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return (
        (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA)
      );
    })
    .slice(0, 3);

  return (
    <main className="overflow-x-hidden">
      <StoreHero
        categories={nav?.catalogCategories ?? []}
        contact={contact}
        ratingSummary={storeRatingSummary}
      />

      {/*
        Temporal: sección «Explora por marca» oculta; descomentar para restaurar.
        <section
          id="marcas"
          className="scroll-mt-32 bg-background pb-20 pt-24 sm:scroll-mt-36 sm:pb-24 sm:pt-28"
        >
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
                  href={`/brands/${b.slug}`}
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
        */}

      {/* Featured products — mismo gris que el fondo de página bajo el Hero (bg-background) */}
      <section
        id="destacados"
        className="scroll-mt-32 border-b border-border/60 bg-background py-20 sm:scroll-mt-36 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <HomeSectionHeading
              align="left"
              // eyebrow="Selección"
              title={
                <LocalizedText
                  es="Productos destacados"
                  en="Featured products"
                />
              }
              description={
                <LocalizedText
                  es="Los favoritos de quienes ya instalaron con nosotros. Conecta tu catalogo real cuando quieras."
                  en="Favorites from customers who already installed with us."
                />
              }
              className="sm:max-w-xl"
              titleClassName="text-3xl sm:text-4xl"
            />
            <Link
              href="/products/featured"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "shrink-0 rounded-full border-primary/30 bg-card px-5 font-semibold hover:bg-primary/5",
              )}
            >
              <LocalizedText es="Ver catalogo" en="View catalog" />
            </Link>
          </div>

          <div className="mt-6 lg:mt-8">
            {featuredProducts.length > 0 ? (
              <SimilarProducts
                hideHeading
                products={featuredProducts}
                priceTier={priceTier}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                <LocalizedText
                  es="Pronto anadiremos productos destacados a esta seccion."
                  en="Featured products will appear here soon."
                />
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      {/* <section className="border-b border-border/60 bg-background py-20 sm:py-24">
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
        </section> */}

      {/* Services */}
      <ServicesSection services={(servicesData ?? []) as ServiceWithI18n[]} />

      {/* Banner emocional */}
      {/* <section className="border-y border-border/60 bg-gradient-to-br from-primary/[0.09] via-background to-secondary/[0.06] py-20 sm:py-24">
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
                    Productos seleccionados y servicios que te quitan fricción.
                    Menos dudas, más confianza.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  href="/products"
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
      </section> */}

      {/* Educativo */}
      {/* <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HomeSectionHeading
            // eyebrow="Proceso"
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
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.s}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section> */}

      {/* Ofertas */}
      <section
        id="ofertas"
        className="scroll-mt-32 border-t border-white/10 bg-gradient-to-br from-brand-hero-from via-[#1a2540] to-brand-hero-to py-20 sm:scroll-mt-36 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <HomeSectionHeading
              align="left"
              // eyebrow="Promos"
              title={<LocalizedText es="Ofertas que suman" en="Great offers" />}
              description={
                <LocalizedText
                  es="Promociones puntuales para mejorar tu seguridad."
                  en="Special promotions to improve your security."
                />
              }
              className="sm:max-w-xl"
              titleClassName="text-3xl text-white sm:text-4xl"
              descriptionClassName="text-white/80"
            />
            <Link
              href="/products"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "shrink-0 rounded-full border-white bg-card px-5 font-semibold text-foreground hover:border-white hover:bg-[#1a2540] hover:text-white",
              )}
            >
              <LocalizedText es="Ver catalogo" en="View catalog" />
            </Link>
          </div>
          {/*
          <div className="mt-6 lg:mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          */}
          <div className="mt-6 lg:mt-8">
            <StorefrontProductGrid
              products={offerProducts}
              priceTier={priceTier}
              gridClassName="lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      {/* <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 shadow-soft-lg sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-xl">
              <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                ¿Proyecto grande o instalación en Miami?
              </h2>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Cuéntanos qué necesitas y te respondemos con una propuesta
                clara.
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
      </section> */}

      {/* Social proof */}
      <section className="bg-muted/70 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HomeSectionHeading
            // eyebrow="Testimonios"
            title={<LocalizedText es="Historias reales" en="Real stories" />}
            description={
              <LocalizedText
                es="Personas como tu que ya confiaron en nosotros."
                en="People like you who already trusted us."
              />
            }
            titleClassName="text-3xl sm:text-4xl"
          />
          <div className="mt-6 lg:mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topProductReviews.map((review) => (
              <figure
                key={review.id}
                className="flex h-full flex-col rounded-3xl border border-border/50 bg-card p-5 shadow-soft sm:p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div
                    className="flex items-center gap-0.5 text-amber-500"
                    aria-hidden
                  >
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-primary"
                    aria-hidden
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {review.productName}
                </p>
                <blockquote className="mt-4 flex-1 border-l-2 border-primary/40 pl-4 text-sm italic leading-relaxed text-muted-foreground">
                  {review.comment ?? (
                    <LocalizedText
                      es="Sin comentario escrito."
                      en="No written comment."
                    />
                  )}
                </blockquote>
                <figcaption className="mt-5 text-sm font-bold text-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="h-4 w-4 text-primary/85" aria-hidden />
                    {review.reviewerLabel}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href="/leave-review"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-full border-primary/30 bg-card px-6 font-semibold hover:bg-primary/5",
              )}
            >
              <LocalizedText es="Ver todas resenas" en="See all reviews" />
            </Link>
          </div>
        </div>
      </section>

      {/* Marcas */}
      <section
        id="marcas"
        className="scroll-mt-32 border-t border-border/60 bg-background py-20 sm:scroll-mt-36 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <HomeSectionHeading
              align="left"
              title={
                <LocalizedText
                  es="Marcas que impulsan tu seguridad"
                  en="Brands that power your security"
                />
              }
              description={
                <LocalizedText
                  es="Explora equipos reales por marca y encuentra justo lo que necesitas para tu instalacion."
                  en="Explore real equipment by brand and find exactly what your installation needs."
                />
              }
              className="sm:max-w-2xl"
              titleClassName="text-3xl sm:text-4xl"
            />
          </div>

          <div className="mt-6 lg:mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {featuredBrands.map((brand) => (
                <article
                  key={brand.id}
                  className="group overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
                >
                  <Link
                    href={`/brands/${brand.slug}`}
                  className="block"
                  aria-label={`Ver productos / View products - ${brand.name}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {brand.imageUrl ? (
                      <Image
                        src={brand.imageUrl}
                        alt={`Equipo / Product of ${brand.name}`}
                        fill
                        sizes="(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/20 via-muted/40 to-background" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  </div>
                </Link>

                <div className="flex items-start justify-between gap-2.5 px-4 py-3">
                  <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug text-foreground break-words">
                    <LocalizedText es={brand.name} en={brand.nameEn} />
                  </h3>
                    <Link
                      href={`/brands/${brand.slug}`}
                    aria-label={`Ver productos / View products - ${brand.name}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-9 w-9 shrink-0 rounded-full border-primary/30 p-0 hover:bg-primary/5",
                    )}
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FAQSection items={siteFaqs} />

      {/*
      Sección Newsletter (oculta temporalmente — descomenta para mostrarla).
      Si la reactivas, vuelve a importar: Button desde @/components/ui/button e Input desde @/components/ui/input.
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
              <Button
                type="button"
                className="h-11 rounded-xl font-semibold sm:w-auto"
              >
                Suscribirme
              </Button>
            </div>
          </div>
        </div>
      </section>
      */}
    </main>
  );
}
