"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";
import { useI18n } from "@/components/i18n/I18nProvider";
import { consumeLoginSuccessToast } from "@/lib/login-success-toast";

const LOGIN_PATHS = new Set(["/login", "/admin/login"]);

/**
 * Muestra «Sesión iniciada» tras navegar al destino (tienda o panel admin),
 * no en la pantalla de login.
 */
export function LoginSuccessToast() {
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    if (!pathname || LOGIN_PATHS.has(pathname)) return;
    if (!consumeLoginSuccessToast()) return;
    toast.success(t("login.toast.signedIn"));
  }, [pathname, t]);

  return null;
}
