"use client";

import { useEffect, useState } from "react";
import type { AdminUserDetail } from "@/modules/admin/users/users.types";
import { getUserDetailAction } from "./actions";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";

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

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Detalle de usuario"
      description="Datos del perfil y de la sesión."
      contentAriaLabel="Detalle del usuario"
      footer={
        <SlideOverFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </SlideOverFooter>
      }
    >
      {loading ? (
        <div
          className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-3 py-8"
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
        <>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          {!error && detail ? (
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Nombre</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {detail.fullName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {detail.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Rol</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {detail.role}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Último acceso</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {detail.lastSignInAt
                    ? formatDateDdMmYyyyHhMm(detail.lastSignInAt)
                    : "—"}
                </dd>
              </div>
            </dl>
          ) : null}
        </>
      )}
    </SlideOver>
  );
}
