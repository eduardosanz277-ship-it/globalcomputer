"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import type { AdminUserDetail } from "@/modules/admin/users/users.types";
import {
  approveBusinessRegistrationAction,
  rejectBusinessRegistrationAction,
  getUserDetailAction,
} from "./actions";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import { useServerAction } from "@/hooks/use-server-action";

type Props = {
  userId: string | null;
  onClose: () => void;
};

function businessStatusText(d: AdminUserDetail): string {
  if (d.role !== "BUSINESS") return "—";
  const s = d.businessRegistrationStatus ?? "pending";
  if (s === "pending") return "Pendiente de aprobación";
  if (s === "rejected") return "Rechazada";
  return "Aprobada";
}

export function UserDetailDrawer({ userId, onClose }: Props) {
  const router = useRouter();
  const open = userId !== null;
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { execute: approveBusiness, isPending: approvingBusiness } =
    useServerAction(approveBusinessRegistrationAction, {
      successMessage:
        "Empresa aprobada. Se ha enviado un correo de notificación.",
      errorMessage: "No se pudo aprobar la empresa",
      onSuccess: () => onClose(),
      onSettled: () => router.refresh(),
    });

  const { execute: rejectBusiness, isPending: rejectingBusiness } =
    useServerAction(rejectBusinessRegistrationAction, {
      successMessage: "Solicitud de empresa rechazada.",
      errorMessage: "No se pudo rechazar la solicitud",
      onSuccess: () => onClose(),
      onSettled: () => router.refresh(),
    });

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

  const handleRejectClick = async () => {
    if (!userId || !detail) return;
    const label = detail.fullName?.trim() || detail.email || userId;
    const wasApproved = detail.businessRegistrationStatus === "approved";
    const result = await Swal.fire({
      title: "¿Rechazar solicitud?",
      html: wasApproved
        ? `La solicitud de <strong>${label}</strong> quedará como <strong>rechazada</strong>. El usuario dejará de poder iniciar sesión como empresa (aunque antes estuviera aprobada).`
        : `La solicitud de <strong>${label}</strong> quedará como <strong>rechazada</strong>.`,
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      focusCancel: true,
      confirmButtonText: "Rechazar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "hsl(0 72% 45%)",
      cancelButtonColor: "hsl(215 16% 47%)",
      customClass: { popup: "swal-equal-width-buttons" },
    });
    if (!result.isConfirmed) return;
    rejectBusiness(userId);
  };

  const handleApproveClick = async () => {
    if (!userId || !detail) return;
    const label = detail.fullName?.trim() || detail.email || userId;
    const result = await Swal.fire({
      title: "¿Aprobar solicitud?",
      html: `Se aprobará el registro de <strong>${label}</strong>. Se enviará un correo de notificación al usuario.`,
      icon: "question",
      showCancelButton: true,
      reverseButtons: true,
      focusCancel: true,
      confirmButtonText: "Aprobar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "hsl(142 76% 32%)",
      cancelButtonColor: "hsl(215 16% 47%)",
      customClass: { popup: "swal-equal-width-buttons" },
    });
    if (!result.isConfirmed) return;
    approveBusiness(userId);
  };

  const approvalBusy = approvingBusiness || rejectingBusiness;

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
          {detail && detail.role === "BUSINESS" && userId ? (
            <div className="flex flex-wrap items-center gap-2">
              {detail.businessRegistrationStatus === "pending" ||
              detail.businessRegistrationStatus == null ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-destructive/60 text-destructive hover:bg-destructive/10"
                    disabled={approvalBusy}
                    onClick={handleRejectClick}
                  >
                    {rejectingBusiness ? "Rechazando…" : "Rechazar solicitud"}
                  </Button>
                  <Button
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={approvalBusy}
                    onClick={handleApproveClick}
                  >
                    {approvingBusiness ? "Aprobando…" : "Aprobar empresa"}
                  </Button>
                </>
              ) : null}
              {detail.businessRegistrationStatus === "approved" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/60 text-destructive hover:bg-destructive/10"
                  disabled={approvalBusy}
                  onClick={handleRejectClick}
                >
                  {rejectingBusiness ? "Rechazando…" : "Rechazar solicitud"}
                </Button>
              ) : null}
            </div>
          ) : null}
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
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
              {detail.role === "BUSINESS" ? (
                <>
                  <div>
                    <dt className="text-muted-foreground">Estado empresa</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {businessStatusText(detail)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Teléfono</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {detail.phone?.trim() || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      Employer Identification Number (EIN)
                    </dt>
                    <dd className="mt-0.5 font-mono text-sm font-medium text-foreground">
                      {detail.employerIdentificationNumber?.trim() || "—"}
                    </dd>
                  </div>
                </>
              ) : null}
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
