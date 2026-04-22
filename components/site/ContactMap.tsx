"use client";

import dynamic from "next/dynamic";
import { Loader2, MapPin, MapPinned } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";

type ContactMapProps = {
  businessName: string;
  address: string;
  mapsUrl: string;
  center?: [number, number];
  zoom?: number;
};

const ContactMapLeaflet = dynamic(() => import("./ContactMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="grid h-80 w-full place-items-center bg-muted/30 text-sm text-muted-foreground md:h-96">
      <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Cargando mapa
      </span>
    </div>
  ),
});

export function ContactMap({
  businessName,
  address,
  mapsUrl,
  center = [25.567028063498697, -80.37994839738671],
  zoom = 17,
}: ContactMapProps) {
  return (
    <section className="relative isolate space-y-4 py-5 sm:py-10">
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 bg-muted/80"
        aria-hidden
      />
      <p className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-foreground sm:text-base">
        <MapPinned className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        Visítenos en nuestra ubicación en Miami, FL.
      </p>
      <div className="group relative z-0 overflow-hidden rounded-xl border border-border/70 shadow-sm">
        <ContactMapLeaflet
          center={center}
          zoom={zoom}
          businessName={businessName}
          address={address}
        />
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 w-[calc(100%-1.5rem)] max-w-max -translate-x-1/2 rounded-full bg-white px-3 py-1.5 text-center text-xs font-medium text-foreground shadow-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Usa ctrl + rueda del ratón para acercar el mapa
        </div>
      </div>

      <div className="flex justify-center">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <MapPin className="mr-2 h-4 w-4" aria-hidden />
          Ver en Google Maps
        </a>
      </div>
    </section>
  );
}
