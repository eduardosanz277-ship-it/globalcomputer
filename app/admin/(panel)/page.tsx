import { redirect } from "next/navigation";

/** Entrada del panel admin: redirige al Home del panel. */
export default function AdminIndexPage() {
  redirect("/admin/home");
}
