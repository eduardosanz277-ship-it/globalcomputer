"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Image = { id: string; url: string };

export function ServiceGallery({ images }: { images: Image[] }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin imágenes
      </div>
    );
  }

  const lightbox =
    open && mounted ? (
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/92"
        role="dialog"
        aria-modal="true"
        aria-label="Visor de imagen"
        onClick={() => setOpen(false)}
      >
        <div
          className="relative flex h-full w-full max-h-[100dvh] items-center justify-center p-4 sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-[10001] rounded-full bg-black/50 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 z-[10001] -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/70 sm:left-4"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={images[index].url}
            alt={`Imagen ${index + 1} de ${images.length}`}
            className="max-h-[min(100dvh,100%)] max-w-[min(100vw,100%)] object-contain"
          />
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 z-[10001] -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/70 sm:right-4"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div>
      <div className="relative">
        <img
          src={images[index].url}
          alt="service image"
          className="h-64 w-full cursor-pointer rounded-lg object-cover"
          onClick={() => setOpen(true)}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              type="button"
              key={img.id}
              onClick={() => setIndex(i)}
              className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-md ring-2 ${
                i === index ? "ring-primary" : "ring-transparent"
              }`}
            >
              <img src={img.url} alt={`thumb-${i}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && createPortal(lightbox, document.body)}
    </div>
  );
}
