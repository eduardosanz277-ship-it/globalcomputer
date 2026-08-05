"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/cn";
import type { StorefrontServiceHeroSlide } from "@/modules/catalog/storefront-services.service";

const AUTOPLAY_DELAY_MS = 6000;

type Props = {
  slides: StorefrontServiceHeroSlide[];
  className?: string;
};

export function HeroServiceSlider({ slides, className }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: slides.length > 1,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || slides.length <= 1) return;
    const id = window.setInterval(() => {
      emblaApi.scrollNext();
    }, AUTOPLAY_DELAY_MS);
    return () => window.clearInterval(id);
  }, [emblaApi, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      aria-hidden={slides.length <= 1}
    >
      <div className="h-full w-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="relative h-full min-w-0 flex-[0_0_100%]"
            >
              <Link
                href={`/services/${slide.slug}`}
                aria-label={slide.name}
                tabIndex={index === selectedIndex ? 0 : -1}
                className="absolute inset-0 block"
              >
                <Image
                  src={slide.banner_mobile_url}
                  alt=""
                  fill
                  priority={index === 0}
                  loading={index === 0 ? undefined : "lazy"}
                  sizes="(max-width: 767px) 100vw, 0px"
                  className="object-cover object-center md:hidden"
                  aria-hidden
                />
                <Image
                  src={slide.banner_tablet_url}
                  alt=""
                  fill
                  priority={index === 0}
                  loading={index === 0 ? undefined : "lazy"}
                  sizes="(min-width: 768px) and (max-width: 1023px) 100vw, 0px"
                  className="hidden object-cover object-center md:block lg:hidden"
                  aria-hidden
                />
                <Image
                  src={slide.banner_desktop_url}
                  alt=""
                  fill
                  priority={index === 0}
                  loading={index === 0 ? undefined : "lazy"}
                  sizes="(min-width: 1024px) 100vw, 0px"
                  className="hidden object-cover object-center lg:block"
                  aria-hidden
                />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[1] flex justify-center gap-1.5 sm:bottom-5">
          {slides.map((slide, index) => (
            <span
              key={slide.id}
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-white/40 transition-all",
                index === selectedIndex && "w-5 bg-white",
              )}
              aria-hidden
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
