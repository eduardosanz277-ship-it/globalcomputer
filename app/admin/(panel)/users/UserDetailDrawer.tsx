"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import type { AdminUserDetail } from "@/modules/admin/users/users.types";
import { getUserDetailAction } from "./actions";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { Loader2 } from "lucide-react";

type Props = {
  userId: string | null;
  onClose: () => void;
};

export function UserDetailDrawer({ userId, onClose }: Props) {
  const open = userId !== null;
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    getUserDetailAction(userId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el usuario.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const panel = (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 transition-opacity"
        aria-label="Cerrar panel"
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl",
          "transition-transform duration-300 ease-out"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
      >
        <div className="border-b border-border px-4 py-3">
          <h2 id="user-detail-title" className="text-lg font-semibold">
            Detalle de usuario
          </h2>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
          {loading ? (
            <div
              className="flex flex-1 items-center justify-center p-8"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="h-10 w-10 animate-spin text-muted-foreground"
                aria-hidden
              />
              <span className="sr-only">Cargando…</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {!error && detail && (
                <dl className="grid gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Nombre</dt>
                    <dd className="mt-0.5 font-medium">{detail.fullName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="mt-0.5 font-medium">{detail.email ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Rol</dt>
                    <dd className="mt-0.5 font-medium">{detail.role}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Último acceso</dt>
                    <dd className="mt-0.5 font-medium">
                      {detail.lastSignInAt
                        ? formatDateDdMmYyyyHhMm(detail.lastSignInAt)
                        : "—"}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto border-t border-border p-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(panel, document.body);
}
