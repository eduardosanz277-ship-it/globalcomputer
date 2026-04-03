"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "./SiteFooter";

export function ConditionalSiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/cuenta")) return null;
  if (pathname === "/login") return null;
  if (pathname?.startsWith("/register")) return null;
  return <SiteFooter />;
}
