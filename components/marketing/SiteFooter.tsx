"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import {
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Music2,
  Phone,
} from "lucide-react";
import { type PublicSiteContact, siteContactMapsUrl } from "@/lib/site";

export function SiteFooter({ contact }: { contact: PublicSiteContact }) {
  const { t } = useI18n();

  return (
    <footer
      id="ayuda"
      className="relative scroll-mt-32 border-t border-white/10 bg-[#141619] text-zinc-400 sm:scroll-mt-36"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              {t("footer.company")}
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href="/#destacados"
                  className="text-zinc-400 transition hover:text-white"
                >
                  {t("footer.featured")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#servicios"
                  className="text-zinc-400 transition hover:text-white"
                >
                  {t("footer.services")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#ofertas"
                  className="text-zinc-400 transition hover:text-white"
                >
                  {t("footer.offers")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#marcas"
                  className="text-zinc-400 transition hover:text-white"
                >
                  {t("footer.brands")}
                </Link>
              </li>
              <li>
                <Link
                  href="/leave-review"
                  className="text-zinc-400 transition hover:text-white"
                >
                  {t("footer.reviews")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              {t("footer.help")}
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-zinc-400 transition hover:text-white"
                >
                  {t("footer.accountOrders")}
                </Link>
              </li>
              <li>
                <span className="text-zinc-500">
                  {t("footer.shippingReturns")}
                </span>
              </li>
              <li>
                <span className="text-zinc-500">{t("footer.warranty")}</span>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-zinc-400 transition hover:text-white"
                >
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              {t("footer.contactSection")}
            </p>
            <a
              href={`tel:${contact.phoneTel}`}
              className="group flex items-start gap-3 text-zinc-400 transition hover:text-white"
            >
              <Phone
                className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition group-hover:text-white"
                aria-hidden
              />
              <span>{contact.phoneDisplay}</span>
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="group flex items-start gap-3 text-zinc-400 transition hover:text-white"
            >
              <Mail
                className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition group-hover:text-white"
                aria-hidden
              />
              <span>{contact.email}</span>
            </a>
            <a
              href={siteContactMapsUrl(contact.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 text-zinc-400 transition hover:text-white"
              aria-label={t("footer.mapsAria").replace(
                "{address}",
                contact.address,
              )}
            >
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition group-hover:text-white"
                aria-hidden
              />
              <span>{contact.address}</span>
            </a>
            <p className="flex items-start gap-3">
              <Clock
                className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500"
                aria-hidden
              />
              <span>{t("footer.supportHours")}</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              {t("footer.social")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="https://www.facebook.com/globalcomptersusa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-white"
                aria-label={t("footer.facebookAria")}
              >
                <Facebook className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="https://www.instagram.com/globalcomputersusa?igsh=MTdiMnFicXF0dmthYQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-white"
                aria-label={t("footer.instagramAria")}
              >
                <Instagram className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="https://www.tiktok.com/@globalcomputersusa?_r=1&_t=ZP-95LFaENqPwV"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-white"
                aria-label={t("footer.tiktokAria")}
              >
                <Music2 className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 text-center text-xs text-zinc-400 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} Global Computers USA.{" "}
            {t("footer.rightsReserved")} {t("footer.createdBy")}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="#" className="transition hover:text-zinc-300">
              {t("footer.privacy")}
            </Link>
            <Link href="#" className="transition hover:text-zinc-300">
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
