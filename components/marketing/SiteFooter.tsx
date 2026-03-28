import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";

export function SiteFooter() {
  return (
    <footer
      id="ayuda"
      className="relative scroll-mt-32 border-t border-white/10 bg-[#141619] text-zinc-400 sm:scroll-mt-36"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="lg:col-span-1">
            <div className="inline-flex max-w-[min(100%,360px)] rounded-xl bg-white px-4 py-3.5 shadow-sm">
              <AppLogo className="h-14 max-h-[3.75rem] sm:h-[4.25rem] sm:max-h-[4.75rem]" />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
              Videovigilancia y tecnología para hogar y negocio. Compra clara,
              envío y soporte de verdad.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              Tienda
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href="#categorias"
                  className="text-zinc-400 transition hover:text-white"
                >
                  Categorías
                </Link>
              </li>
              <li>
                <Link
                  href="#destacados"
                  className="text-zinc-400 transition hover:text-white"
                >
                  Destacados
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-zinc-400 transition hover:text-white"
                >
                  Crear cuenta
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              Ayuda
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-zinc-400 transition hover:text-white"
                >
                  Tu cuenta / pedidos
                </Link>
              </li>
              <li>
                <span className="text-zinc-500">Envíos y devoluciones</span>
              </li>
              <li>
                <span className="text-zinc-500">Garantía</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              Contacto
            </p>
            <p className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
              <span>+1 (000) 000-0000</span>
            </p>
            <p className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
              <span>ventas@globalcomputer.local</span>
            </p>
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
              <span>Miami, FL · Envíos a todo EE. UU.</span>
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-center text-xs text-zinc-600 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} Global Computers USA. Todos los derechos
            reservados.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="#" className="transition hover:text-zinc-300">
              Privacidad
            </Link>
            <Link href="#" className="transition hover:text-zinc-300">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
