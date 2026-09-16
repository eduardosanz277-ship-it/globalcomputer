"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import type { AdminUserDetail } from "@/modules/admin/users/users.types";
import type { BusinessRegistrationStatus } from "@/modules/auth/auth.types";
import {
  approveBusinessRegistrationAction,
  deleteUserAction,
  rejectBusinessRegistrationAction,
  getUserDetailAction,
} from "./actions";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import {
  Loader2,
  Mail,
  Phone,
  Hash,
  Clock3,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use-server-action";
import { bindAdminAction } from "@/lib/admin/bind-admin-action";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";

type Props = {
  userId: string | null;
  onClose: () => void;
  /**
   * Panel Suscripciones (empresas): textos del slide-over y campos acordes al contexto
   * (sin badge de rol ni último acceso en el detalle).
   */
  subscriptionContext?: boolean;
  onBusinessRegistrationStatusChange?: (
    userId: string,
    status: BusinessRegistrationStatus,
  ) => void;
  onUserRemoved?: (userId: string) => void;
};

function businessStatusText(
  d: AdminUserDetail,
  t: (key: string) => string,
): string {
  if (d.role !== "BUSINESS") return "—";
  const s = d.businessRegistrationStatus ?? "pending";
  if (s === "pending") return t("admin.userDetail.businessStatus.pendingReview");
  if (s === "rejected") return t("admin.userDetail.businessStatus.rejected");
  return t("admin.userDetail.businessStatus.approved");
}

function roleLabel(
  role: AdminUserDetail["role"],
  t: (key: string) => string,
): string {
  if (role === "ADMIN") return t("admin.userDetail.role.admin");
  if (role === "BUSINESS") return t("admin.userDetail.role.business");
  if (role === "CLIENT") return t("admin.userDetail.role.client");
  return role;
}

function ActionTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
        >
          <span className="block font-medium">{label}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
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
  onDelete,
  showRejectButton,
  showApproveButton,
  showDeleteButton,
  subscriptionContext,
}: {
  user: AdminUserDetail;
  approvalBusy: boolean;
  onReject: () => void;
  onApprove: () => void;
  onDelete: () => void;
  showRejectButton: boolean;
  showApproveButton: boolean;
  showDeleteButton: boolean;
  subscriptionContext: boolean;
}) {
  const { t, locale } = useI18n();
  const businessStatus = businessStatusText(user, t);
  const isBusiness = user.role === "BUSINESS";
  const isClient = user.role === "CLIENT";
  const showCompanyStatusBadge = isBusiness;
  const showEinField = isBusiness;
  const showPhone = isBusiness || isClient || user.role === "ADMIN";
  const detailSectionTitle = subscriptionContext
    ? isBusiness
      ? t("admin.userDetail.section.subscriptionBusiness")
      : isClient
        ? t("admin.userDetail.section.contact")
        : t("admin.userDetail.section.account")
    : isClient
      ? t("admin.userDetail.section.contact")
      : isBusiness
        ? t("admin.userDetail.section.business")
        : t("admin.userDetail.section.account");
  const hasActions = showRejectButton || showApproveButton || showDeleteButton;
  const registrationDate = user.createdAt
    ? formatDateDdMmYyyyHhMm(user.createdAt, locale)
    : "—";

  return (
    <div className="space-y-4 md:space-y-5">
      <header className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-5">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {user.fullName?.trim() || t("admin.userDetail.unnamedUser")}
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
                {roleLabel(user.role, t)}
              </span>
            )}
            {showCompanyStatusBadge ? (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${businessBadgeClass(user.businessRegistrationStatus)}`}
              >
                {businessStatus}
              </span>
            ) : null}
          </div>
        </div>

        {hasActions ? (
          <div className="flex w-full shrink-0 justify-end sm:w-auto sm:justify-end">
            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
              {showApproveButton ? (
                <ActionTooltip label={t("admin.userDetail.buttons.approveBusiness")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-700 transition hover:bg-emerald-50"
                    disabled={approvalBusy}
                    onClick={onApprove}
                    aria-label={t("admin.userDetail.buttons.approveBusiness")}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  </Button>
                </ActionTooltip>
              ) : null}
              {showRejectButton ? (
                <ActionTooltip label={t("admin.userDetail.buttons.rejectRequest")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-500/95 transition hover:bg-rose-50/90 dark:text-rose-400/90 dark:hover:bg-rose-950/30"
                    disabled={approvalBusy}
                    onClick={onReject}
                    aria-label={t("admin.userDetail.buttons.rejectRequest")}
                  >
                    <XCircle className="h-4 w-4" aria-hidden />
                  </Button>
                </ActionTooltip>
              ) : null}
              {showDeleteButton ? (
                <ActionTooltip label={t("admin.businessSubscriptions.menu.delete")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 transition",
                      approvalBusy
                        ? "cursor-not-allowed text-muted-foreground/60"
                        : "text-destructive hover:bg-destructive/10",
                    )}
                    disabled={approvalBusy}
                    onClick={onDelete}
                    aria-label={t("admin.businessSubscriptions.menu.delete")}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </ActionTooltip>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>

      <section className="space-y-4 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        <h3 className="text-sm font-medium text-foreground">
          {detailSectionTitle}
        </h3>
        <div className="grid gap-y-4">
          <DetailField
            label={t("admin.userDetail.phone")}
            value={showPhone ? user.phone : null}
            icon={<Phone className="h-4 w-4" aria-hidden />}
          />
          {showEinField ? (
            <DetailField
              label={t("admin.userDetail.ein")}
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
              label={t("admin.userDetail.lastAccess")}
              value={
                user.lastSignInAt
                  ? formatDateDdMmYyyyHhMm(user.lastSignInAt, locale)
                  : null
              }
            />
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        <h3 className="text-sm font-medium text-foreground">
          {t("admin.userDetail.metadata.title")}
        </h3>
        <div className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="h-4 w-4" aria-hidden />
          <span>
            {t("admin.userDetail.metadata.registeredPrefix")} {registrationDate}
          </span>
        </div>
      </section>
    </div>
  );
}

export function UserDetailDrawer({
  userId,
  onClose,
  subscriptionContext = false,
  onBusinessRegistrationStatusChange,
  onUserRemoved,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const open = userId !== null;
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { executeAsync: approveBusinessAsync, isPending: approvingBusiness } =
    useServerAction(bindAdminAction(approveBusinessRegistrationAction, locale), {
      successMessage: t("admin.userDetail.toast.approved"),
      errorMessage: t("admin.userDetail.toast.approveError"),
      onSuccess: () => {
        if (
          userId &&
          detail &&
          (detail.businessRegistrationStatus === "pending" ||
            detail.businessRegistrationStatus == null ||
            detail.businessRegistrationStatus === "rejected")
        ) {
          onBusinessRegistrationStatusChange?.(userId, "approved");
        }
        onClose();
      },
      onSettled: () => router.refresh(),
    });

  const { executeAsync: rejectBusinessAsync, isPending: rejectingBusiness } =
    useServerAction(bindAdminAction(rejectBusinessRegistrationAction, locale), {
      successMessage: t("admin.userDetail.toast.rejected"),
      errorMessage: t("admin.userDetail.toast.rejectError"),
      onSuccess: () => {
        if (
          userId &&
          detail &&
          (detail.businessRegistrationStatus === "pending" ||
            detail.businessRegistrationStatus == null)
        ) {
          onBusinessRegistrationStatusChange?.(userId, "rejected");
        }
        onClose();
      },
      onSettled: () => router.refresh(),
    });

  const { executeAsync: deleteUserAsync, isPending: deletingUser } =
    useServerAction(bindAdminAction(deleteUserAction, locale), {
      successMessage: t("admin.businessSubscriptions.toast.deleted"),
      errorMessage: t("admin.businessSubscriptions.toast.deleteError"),
      onSuccess: () => {
        if (userId) {
          onUserRemoved?.(userId);
        }
        onClose();
      },
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

    getUserDetailAction(userId, locale)
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError(res.message);
          return;
        }
        setDetail(res.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setError(t("admin.userDetail.error.loadUser"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, t, locale]);

  const handleRejectClick = async () => {
    if (!userId || !detail) return;
    const label = detail.fullName?.trim() || detail.email || userId;
    const wasApproved = detail.businessRegistrationStatus === "approved";
    onClose();
    await swalSaasConfirmAsync({
      title: t("admin.userDetail.confirm.rejectTitle"),
      html: wasApproved
        ? `${t("admin.userDetail.confirm.rejectApprovedPrefix")} <strong>${label}</strong> ${t("admin.userDetail.confirm.rejectApprovedSuffix")}`
        : `${t("admin.userDetail.confirm.rejectPendingPrefix")} <strong>${label}</strong> ${t("admin.userDetail.confirm.rejectPendingSuffix")}`,
      confirmButtonText: t("admin.userDetail.confirm.rejectConfirm"),
      cancelButtonText: t("admin.businessSubscriptions.confirm.cancel"),
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => rejectBusinessAsync(userId),
    });
  };

  const handleApproveClick = async () => {
    if (!userId || !detail) return;
    const label = detail.fullName?.trim() || detail.email || userId;
    onClose();
    await swalSaasConfirmAsync({
      title: t("admin.userDetail.confirm.approveTitle"),
      html: `${t("admin.userDetail.confirm.approveMessagePrefix")} <strong>${label}</strong>. ${t("admin.userDetail.confirm.approveMessageSuffix")}`,
      confirmButtonText: t("admin.userDetail.confirm.approveConfirm"),
      cancelButtonText: t("admin.businessSubscriptions.confirm.cancel"),
      variant: "positive",
      iconType: "question",
      preConfirm: () => approveBusinessAsync(userId),
    });
  };

  const handleDeleteClick = async () => {
    if (!userId || !detail) return;
    const label = detail.fullName?.trim() || detail.email || userId;
    onClose();
    await swalSaasConfirmAsync({
      title: t("admin.businessSubscriptions.confirm.deleteTitle"),
      html: `${t("admin.businessSubscriptions.confirm.deleteMessagePrefix")} <strong>${label}</strong>. ${t("admin.businessSubscriptions.confirm.deleteMessageSuffix")}`,
      confirmButtonText: t("admin.businessSubscriptions.confirm.deleteConfirm"),
      cancelButtonText: t("admin.businessSubscriptions.confirm.cancel"),
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => deleteUserAsync(userId),
    });
  };

  const approvalBusy = approvingBusiness || rejectingBusiness || deletingUser;

  const showApproveButton =
    Boolean(detail && userId && detail.role === "BUSINESS") &&
    (detail?.businessRegistrationStatus === "pending" ||
      detail?.businessRegistrationStatus == null ||
      detail?.businessRegistrationStatus === "rejected");

  const showRejectButton =
    Boolean(detail && userId && detail.role === "BUSINESS") &&
    (detail?.businessRegistrationStatus === "pending" ||
      detail?.businessRegistrationStatus == null ||
      detail?.businessRegistrationStatus === "approved");

  const showDeleteButton =
    Boolean(detail && userId) && detail?.role !== "ADMIN";

  const slideTitle = subscriptionContext
    ? t("admin.userDetail.slide.subscriptionTitle")
    : t("admin.userDetail.slide.userTitle");
  const slideDescription = subscriptionContext
    ? t("admin.userDetail.slide.subscriptionDescription")
    : t("admin.userDetail.slide.userDescription");
  const slideAriaLabel = subscriptionContext
    ? t("admin.userDetail.slide.subscriptionAria")
    : t("admin.userDetail.slide.userAria");

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
          <span className="sr-only">{t("tablePagination.loadingData")}</span>
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
              showDeleteButton={showDeleteButton}
              onDelete={handleDeleteClick}
              subscriptionContext={subscriptionContext}
            />
          ) : null}
        </>
      )}
    </SlideOver>
  );
}
