import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer id="ayuda" className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Global Computers USA
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Equipos de videovigilancia, redes y tecnología para hogar y
              negocio.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Tienda</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#categorias" className="hover:text-foreground">
                  Categorías
                </Link>
              </li>
              <li>
                <Link href="#destacados" className="hover:text-foreground">
                  Destacados
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground">
                  Crear cuenta
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Ayuda</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-foreground">
                  Seguimiento de pedido
                </Link>
              </li>
              <li>
                <span className="cursor-default">Envíos y devoluciones</span>
              </li>
              <li>
                <span className="cursor-default">Garantía</span>
              </li>
            </ul>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Contacto</p>
            <p className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>+1 (000) 000-0000</span>
            </p>
            <p className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>ventas@globalcomputer.local</span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>Miami, FL · Envíos a todo EE. UU.</span>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} Global Computers USA. Todos los
            derechos reservados. Creado por Veltrix Digital.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="#" className="hover:text-foreground">
              Privacidad
            </Link>
            <Link href="#" className="hover:text-foreground">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
