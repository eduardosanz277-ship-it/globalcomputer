"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import type { AdminUserDetail } from "@/modules/admin/users/users.types";
import {
  approveBusinessRegistrationAction,
  rejectBusinessRegistrationAction,
  getUserDetailAction,
} from "./actions";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { Loader2, Mail, Phone, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { useServerAction } from "@/hooks/use-server-action";

type Props = {
  userId: string | null;
  onClose: () => void;
  /**
   * Panel Suscripciones (empresas): textos del slide-over y campos acordes al contexto
   * (sin badge de rol ni último acceso en el detalle).
   */
  subscriptionContext?: boolean;
};

function businessStatusText(d: AdminUserDetail): string {
  if (d.role !== "BUSINESS") return "—";
  const s = d.businessRegistrationStatus ?? "pending";
  if (s === "pending") return "Pendiente de aprobación";
  if (s === "rejected") return "Rechazada";
  return "Aprobada";
}

function roleLabel(role: AdminUserDetail["role"]): string {
  if (role === "ADMIN") return "Administrador";
  if (role === "BUSINESS") return "Empresa";
  if (role === "CLIENT") return "Cliente";
  return role;
}

function roleBadgeClass(role: AdminUserDetail["role"]): string {
  if (role === "ADMIN") {
    return "border border-secondary/35 bg-secondary/10 text-secondary";
  }
  return "border border-border bg-muted text-muted-foreground";
}

function businessBadgeClass(
  status: AdminUserDetail["businessRegistrationStatus"],
): string {
  if (status === "approved") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "rejected") {
    return "border border-red-200 bg-red-50 text-red-700";
  }
  return "border border-amber-200 bg-amber-50 text-amber-700";
}

function DetailField({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  const hasValue = Boolean(value?.trim());

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <p
          className={
            hasValue
              ? mono
                ? "text-sm font-medium text-foreground"
                : "text-base font-medium text-foreground"
              : "text-sm text-muted-foreground/70"
          }
        >
          {hasValue ? value : "—"}
        </p>
      </div>
    </div>
  );
}

function UserDetailContent({
  user,
  approvalBusy,
  onReject,
  onApprove,
  showRejectButton,
  showApproveButton,
  subscriptionContext,
}: {
  user: AdminUserDetail;
  approvalBusy: boolean;
  onReject: () => void;
  onApprove: () => void;
  showRejectButton: boolean;
  showApproveButton: boolean;
  subscriptionContext: boolean;
}) {
  const businessStatus = businessStatusText(user);
  const isBusiness = user.role === "BUSINESS";
  const isClient = user.role === "CLIENT";
  const showCompanyStatusBadge = isBusiness;
  const showEinField = isBusiness;
  const showPhone = isBusiness || isClient || user.role === "ADMIN";
  const detailSectionTitle = subscriptionContext
    ? isBusiness
      ? "Datos de la empresa y la solicitud de alta"
      : isClient
        ? "Información de contacto"
        : "Información de la cuenta"
    : isClient
      ? "Información de contacto"
      : isBusiness
        ? "Información del negocio"
        : "Información de la cuenta";
  const hasActions = showRejectButton || showApproveButton;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {user.fullName?.trim() || "Usuario sin nombre"}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              <span className="break-all">{user.email?.trim() || "—"}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {subscriptionContext ? (
              <>
                {/* Oculto en Suscripciones: badge de rol
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeClass(user.role)}`}
                >
                  Rol: {roleLabel(user.role)}
                </span>
                */}
              </>
            ) : (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeClass(user.role)}`}
              >
                Rol: {roleLabel(user.role)}
              </span>
            )}
            {showCompanyStatusBadge ? (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${businessBadgeClass(user.businessRegistrationStatus)}`}
              >
                Estado empresa: {businessStatus}
              </span>
            ) : null}
          </div>
        </div>

        {hasActions ? (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-right">
              Acciones
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {showApproveButton ? (
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={approvalBusy}
                  onClick={onApprove}
                >
                  {approvalBusy ? "Aprobando…" : "Aprobar empresa"}
                </Button>
              ) : null}
              {showRejectButton ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-rose-200/90 text-rose-600/90 hover:bg-rose-50/90 dark:border-rose-900/45 dark:text-rose-400/90 dark:hover:bg-rose-950/35"
                  disabled={approvalBusy}
                  onClick={onReject}
                >
                  {approvalBusy ? "Rechazando…" : "Rechazar solicitud"}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {detailSectionTitle}
        </h3>
        <div className="grid gap-y-4">
          <DetailField
            label="Teléfono"
            value={showPhone ? user.phone : null}
            icon={<Phone className="h-4 w-4" aria-hidden />}
          />
          {showEinField ? (
            <DetailField
              label="EIN"
              value={user.employerIdentificationNumber}
              mono
              icon={<Hash className="h-4 w-4" aria-hidden />}
            />
          ) : null}
          {subscriptionContext ? (
            <>
              {/* Oculto en Suscripciones: último acceso
              <DetailField
                label="Último acceso"
                value={
                  user.lastSignInAt
                    ? formatDateDdMmYyyyHhMm(user.lastSignInAt)
                    : null
                }
              />
              */}
            </>
          ) : (
            <DetailField
              label="Último acceso"
              value={
                user.lastSignInAt
                  ? formatDateDdMmYyyyHhMm(user.lastSignInAt)
                  : null
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}

export function UserDetailDrawer({
  userId,
  onClose,
  subscriptionContext = false,
}: Props) {
  const router = useRouter();
  const open = userId !== null;
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { executeAsync: approveBusinessAsync, isPending: approvingBusiness } =
    useServerAction(approveBusinessRegistrationAction, {
      successMessage:
        "Empresa aprobada. Se ha enviado un correo de notificación.",
      errorMessage: "No se pudo aprobar la empresa",
      onSuccess: () => onClose(),
      onSettled: () => router.refresh(),
    });

  const { executeAsync: rejectBusinessAsync, isPending: rejectingBusiness } =
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
    await swalSaasConfirmAsync({
      title: "¿Rechazar solicitud?",
      html: wasApproved
        ? `La solicitud de <strong>${label}</strong> quedará como <strong>rechazada</strong>. El usuario dejará de poder iniciar sesión como empresa (aunque antes estuviera aprobada).`
        : `La solicitud de <strong>${label}</strong> quedará como <strong>rechazada</strong>.`,
      confirmButtonText: "Rechazar",
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => rejectBusinessAsync(userId),
    });
  };

  const handleApproveClick = async () => {
    if (!userId || !detail) return;
    const label = detail.fullName?.trim() || detail.email || userId;
    await swalSaasConfirmAsync({
      title: "¿Aprobar solicitud?",
      html: `Se aprobará el registro de <strong>${label}</strong>. Se enviará un correo de notificación al usuario.`,
      confirmButtonText: "Aprobar",
      variant: "positive",
      iconType: "question",
      preConfirm: () => approveBusinessAsync(userId),
    });
  };

  const approvalBusy = approvingBusiness || rejectingBusiness;

  const showApproveButton =
    Boolean(detail && userId && detail.role === "BUSINESS") &&
    (detail?.businessRegistrationStatus === "pending" ||
      detail?.businessRegistrationStatus == null);

  const showRejectButton =
    Boolean(detail && userId && detail.role === "BUSINESS") &&
    (detail?.businessRegistrationStatus === "pending" ||
      detail?.businessRegistrationStatus == null ||
      detail?.businessRegistrationStatus === "approved");

  const slideTitle = subscriptionContext
    ? "Detalles de la suscripción"
    : "Detalles del usuario";
  const slideDescription = subscriptionContext
    ? "Empresa, contacto y estado de la solicitud de alta a la plataforma."
    : "Datos del perfil y de la sesión.";
  const slideAriaLabel = subscriptionContext
    ? "Detalle de la suscripción"
    : "Detalle del usuario";

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={slideTitle}
      description={slideDescription}
      contentAriaLabel={slideAriaLabel}
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
            <UserDetailContent
              user={detail}
              approvalBusy={approvalBusy}
              onReject={handleRejectClick}
              onApprove={handleApproveClick}
              showRejectButton={showRejectButton}
              showApproveButton={showApproveButton}
              subscriptionContext={subscriptionContext}
            />
          ) : null}
        </>
      )}
    </SlideOver>
  );
}
