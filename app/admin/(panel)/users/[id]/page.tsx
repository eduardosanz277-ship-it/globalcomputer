import { redirect } from "next/navigation";

/** Los detalles se muestran en el panel lateral; la ruta antigua redirige al listado. */
export default function AdminUserDetailRedirect() {
  redirect("/admin/users");
}
