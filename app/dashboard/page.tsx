import { redirect } from "next/navigation";
import { getCurrentUserService } from "@/modules/auth/auth.service";

/** Compatibilidad: el área de usuario está en la raíz y en `/cuenta`. */
export default async function DashboardPage() {
  const user = await getCurrentUserService();
  if (!user) {
    redirect("/login");
  }
  redirect("/");
}
