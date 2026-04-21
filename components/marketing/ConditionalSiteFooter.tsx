"use client";

import type { PublicSiteContact } from "@/lib/site";
import { usePathname } from "next/navigation";
import { SiteFooter } from "./SiteFooter";

export function ConditionalSiteFooter({ contact }: { contact: PublicSiteContact }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/profile")) return null;
  if (pathname === "/login") return null;
  if (pathname?.startsWith("/register")) return null;
  return <SiteFooter contact={contact} />;
}
