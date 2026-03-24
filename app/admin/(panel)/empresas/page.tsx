import { redirect } from "next/navigation";

/** Ruta antigua: redirige al nombre actual de la sección. */
export default function AdminEmpresasRedirectPage() {
  redirect("/admin/suscripciones-empresas");
}
