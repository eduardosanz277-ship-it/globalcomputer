"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/utils/cn";

type GalleryImage = { id: string; url: string };

type Props = {
  images: GalleryImage[];
  serviceName: string;
  serviceNameEn?: string | null;
  className?: string;
};

export function ServiceGallery({
  images,
  serviceName,
  serviceNameEn,
  className,
}: Props) {
  const { t, locale } = useI18n();
  const displayName =
    locale === "en" ? serviceNameEn?.trim() || serviceName : serviceName;
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const total = images.length;
  const canNavigate = total > 1;

  useEffect(() => {
    if (!lightboxOpen || !canNavigate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveIdx((i) => (i === 0 ? total - 1 : i - 1));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveIdx((i) => (i === total - 1 ? 0 : i + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, canNavigate, total]);

  if (total === 0) return null;

  const goToPrev = () => {
    if (!canNavigate) return;
    setActiveIdx((i) => (i === 0 ? total - 1 : i - 1));
  };

  const goToNext = () => {
    if (!canNavigate) return;
    setActiveIdx((i) => (i === total - 1 ? 0 : i + 1));
  };

  const openAt = (index: number) => {
    setActiveIdx(index);
    setLightboxOpen(true);
  };

  return (
    <section
      aria-label={t("servicePage.gallery.ariaLabel")}
      className={cn(
        "w-full px-4 py-8 sm:px-6 lg:px-0 lg:py-10",
        className,
      )}
    >
      <HomeSectionHeading
        className="max-w-none"
        align="left"
        title={t("servicePage.gallery.title")}
        description={t("servicePage.gallery.description")}
      />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {images.map((img, index) => (
          <button
            key={img.id}
            type="button"
            onClick={() => openAt(index)}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted text-left shadow-soft ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-soft-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-haspopup="dialog"
            aria-label={t("servicePage.gallery.openImageAria")
              .replace("{n}", String(index + 1))
              .replace("{total}", String(total))}
          >
            <Image
              src={img.url}
              alt={`${displayName} ${index + 1}`}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"
              className="object-cover transition duration-500 ease-out group-hover:scale-110"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md opacity-0 backdrop-blur-sm transition duration-300 group-hover:opacity-100 sm:bottom-4 sm:left-4"
            >
              <ZoomIn className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </button>
        ))}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className={cn(
            "flex max-h-[90vh] w-full max-w-[min(90vw,1200px)] translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:rounded-none",
            "[&>button]:right-0 [&>button]:top-0 [&>button]:z-[70] [&>button]:flex [&>button]:h-8 [&>button]:w-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-border/50 [&>button]:bg-background/95 [&>button]:p-0 [&>button]:opacity-100 [&>button]:shadow-md [&>button]:ring-offset-0 [&>button>svg]:h-[1.125rem] [&>button>svg]:w-[1.125rem] sm:[&>button]:right-1 sm:[&>button]:top-1",
          )}
        >
          <DialogTitle className="sr-only">
            {t("servicePage.gallery.zoomTitle")
              .replace("{n}", String(activeIdx + 1))
              .replace("{total}", String(total))}
          </DialogTitle>
          <div className="relative h-[min(85vh,90vw)] w-full min-h-[12rem]">
            <Image
              src={images[activeIdx].url}
              alt={`${displayName} ${activeIdx + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority={lightboxOpen}
            />
            {canNavigate ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                  }}
                  className="absolute left-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-md backdrop-blur-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-4"
                  aria-label={t("servicePage.gallery.prevImageAria")}
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-md backdrop-blur-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-4"
                  aria-label={t("servicePage.gallery.nextImageAria")}
                >
                  <ChevronRight
                    className="h-6 w-6"
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
