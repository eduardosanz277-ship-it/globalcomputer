import { LocalizedText } from "@/components/i18n/LocalizedText";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import type { MarketingBreadcrumbItem } from "@/components/marketing/MarketingBreadcrumb";
import { ServiceHeroMobileImage } from "@/components/services/ServiceHeroMobileImage";
import { resolveServiceHeroContent } from "@/components/services/service-hero-banners";
import { inter } from "@/lib/fonts/inter";
import Image from "next/image";
import { cn } from "@/utils/cn";

type Props = {
  serviceName: string;
  serviceNameEn: string | null;
  shortDescription?: string | null;
  shortDescriptionEn?: string | null;
  bannerMobileUrl?: string | null;
  bannerTabletUrl?: string | null;
  bannerDesktopUrl?: string | null;
  breadcrumbItems: MarketingBreadcrumbItem[];
  breadcrumbClassName?: string;
  className?: string;
};

type HeroOverlayProps = {
  breadcrumbItems: MarketingBreadcrumbItem[];
  breadcrumbClassName?: string;
  serviceName: string;
  serviceNameEn: string | null;
  summaryEs: string;
  summaryEn: string;
  /** Espacio superior dentro del área de contenido (bajo el breadcrumb). */
  contentOffsetClass: string;
  usingDefaults?: boolean;
};

function HeroBannerOverlay({
  breadcrumbItems,
  breadcrumbClassName,
  serviceName,
  serviceNameEn,
  summaryEs,
  summaryEn,
  contentOffsetClass,
  usingDefaults = false,
}: HeroOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col">
      <div className="shrink-0">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:py-6 lg:px-8">
          <MarketingBreadcrumb
            className={breadcrumbClassName}
            items={breadcrumbItems}
          />
        </div>
      </div>
      <div
        className={cn("pointer-events-none min-h-0 flex-1", contentOffsetClass)}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "w-full",
              usingDefaults
                ? "mx-auto max-w-none text-center md:max-w-[70%] lg:max-w-[60%]"
                : "mx-auto max-w-none text-center md:mx-0 md:max-w-[50%] md:text-left lg:max-w-[45%]",
            )}
          >
            <h1
              className={cn(
                inter.className,
                "text-[24px] font-bold leading-tight tracking-[0.006em] sm:text-[28px] lg:text-[35px] lg:leading-[2.5rem]",
                usingDefaults
                  ? "text-white"
                  : "text-foreground [-webkit-text-stroke:0.55px_rgba(255,255,255,0.8)]",
              )}
              style={usingDefaults ? undefined : { paintOrder: "stroke fill" }}
            >
              <LocalizedText es={serviceName} en={serviceNameEn} />
            </h1>
            {summaryEs || summaryEn ? (
              <p
                className={cn(
                  inter.className,
                  "mt-3 text-[15px] font-medium leading-relaxed sm:text-base lg:mt-3.5 lg:text-[1.2rem] lg:leading-[1.7rem]",
                  usingDefaults
                    ? "text-white"
                    : "text-foreground [-webkit-text-stroke:0.45px_rgba(255,255,255,0.75)]",
                )}
                style={
                  usingDefaults ? undefined : { paintOrder: "stroke fill" }
                }
              >
                <LocalizedText es={summaryEs} en={summaryEn} />
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiceHeroBanner({
  serviceName,
  serviceNameEn,
  shortDescription,
  shortDescriptionEn,
  bannerMobileUrl,
  bannerTabletUrl,
  bannerDesktopUrl,
  breadcrumbItems,
  breadcrumbClassName,
  className,
}: Props) {
  const content = resolveServiceHeroContent({
    mobileUrl: bannerMobileUrl,
    tabletUrl: bannerTabletUrl,
    desktopUrl: bannerDesktopUrl,
    shortDescription,
    shortDescriptionEn,
  });

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-white max-md:border-b-0 md:border-b md:border-border/40 lg:border-b-0 lg:bg-background",
        className,
      )}
    >
      <div className="relative w-full md:hidden">
        <ServiceHeroMobileImage src={content.mobileSrc} />
        <HeroBannerOverlay
          breadcrumbItems={breadcrumbItems}
          breadcrumbClassName={breadcrumbClassName}
          serviceName={serviceName}
          serviceNameEn={serviceNameEn}
          summaryEs={content.summaryEs}
          summaryEn={content.summaryEn}
          contentOffsetClass="pt-[1.5%]"
          usingDefaults={content.usingDefaults}
        />
      </div>

      <div
        className={cn(
          "relative hidden w-full overflow-hidden md:block",
          "md:aspect-[2/1] lg:aspect-[1024/432] lg:min-h-[27rem]",
        )}
      >
        <Image
          src={content.tabletSrc}
          alt=""
          fill
          priority
          sizes="(min-width: 768px) and (max-width: 1023px) 100vw, 0px"
          className="object-cover object-[62%_center] lg:hidden"
          aria-hidden
        />
        <Image
          src={content.desktopSrc}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 100vw, 0px"
          className="hidden object-cover object-left lg:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] hidden h-14 bg-gradient-to-b from-transparent via-background/32 to-background lg:block"
          aria-hidden
        />
        <HeroBannerOverlay
          breadcrumbItems={breadcrumbItems}
          breadcrumbClassName={breadcrumbClassName}
          serviceName={serviceName}
          serviceNameEn={serviceNameEn}
          summaryEs={content.summaryEs}
          summaryEn={content.summaryEn}
          contentOffsetClass={
            content.usingDefaults
              ? "pt-[1%] lg:pt-[1.5%]"
              : "pt-[3%] lg:pt-[4%]"
          }
          usingDefaults={content.usingDefaults}
        />
      </div>
    </section>
  );
}
