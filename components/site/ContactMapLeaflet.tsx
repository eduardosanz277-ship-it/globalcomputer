"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

type ContactMapLeafletProps = {
  center: [number, number];
  zoom: number;
  businessName: string;
  address: string;
};

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type LeafletContainerElement = HTMLDivElement & {
  _leaflet_id?: number;
};

function cleanupLeafletContainer(container: LeafletContainerElement) {
  if (typeof container._leaflet_id !== "undefined") {
    delete container._leaflet_id;
  }
}

export default function ContactMapLeaflet({
  center,
  zoom,
  businessName,
  address,
}: ContactMapLeafletProps) {
  const containerRef = useRef<LeafletContainerElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // En Fast Refresh/HMR, Leaflet puede conservar metadata del nodo y provocar "container is being reused".
    cleanupLeafletContainer(container);

    const map = L.map(container, {
      center,
      zoom,
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker(center, { icon: markerIcon }).addTo(map);
    marker.bindPopup(`${businessName} - ${address}`);

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
        if (!map.scrollWheelZoom.enabled()) {
          map.scrollWheelZoom.enable();
        }
        return;
      }

      if (map.scrollWheelZoom.enabled()) {
        map.scrollWheelZoom.disable();
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    map.invalidateSize();

    return () => {
      container.removeEventListener("wheel", handleWheel);
      map.remove();
      cleanupLeafletContainer(container);
    };
  }, [center, zoom, businessName, address]);

  return (
    <div
      ref={containerRef}
      className="relative z-0 h-80 w-full cursor-grab active:cursor-grabbing md:h-[26rem] lg:h-[30rem]"
    />
  );
}
