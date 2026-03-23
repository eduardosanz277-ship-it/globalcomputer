import { redirect } from "next/navigation";

/** El panel solo expone Usuarios en el menú; /admin redirige allí. */
export default function AdminIndexPage() {
  redirect("/admin/users");
}
