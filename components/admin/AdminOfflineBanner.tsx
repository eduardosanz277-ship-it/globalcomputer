"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { WifiOff } from "lucide-react";

/**
 * Sin red el router no llega al servidor, así que ningún error boundary se renderiza:
 * este aviso avisa antes de que el usuario intente navegar por el menú.
 */
export function AdminOfflineBanner() {
  const { t } = useI18n();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const sync = () => setIsOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-xs font-medium text-destructive"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {t("common.connectionError.bannerOffline")}
    </div>
  );
}
