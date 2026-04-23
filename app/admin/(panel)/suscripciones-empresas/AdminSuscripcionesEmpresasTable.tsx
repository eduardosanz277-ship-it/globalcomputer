"use client";

import {
  approveBusinessRegistrationAction,
  deleteUserAction,
  rejectBusinessRegistrationAction,
} from "@/app/admin/(panel)/users/actions";
import { UserDetailDrawer } from "@/app/admin/(panel)/users/UserDetailDrawer";
import {
  AdminTableEmptyEmDash,
  adminTableOptionalString,
} from "@/components/admin/admin-table-empty";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useServerAction } from "@/hooks/use-server-action";
import type { AdminBusinessProfileRow } from "@/modules/admin/business-profiles/business-profiles.types";
import type { BusinessRegistrationStatus } from "@/modules/auth/auth.types";
import type { Column, ColumnDef, Row } from "@tanstack/react-table";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { cn } from "@/utils/cn";
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  MoreVertical,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Select from "react-select";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import { BusinessProfileCard } from "@/components/dashboard/business-profile-card";
import { FilterX } from "lucide-react";

const APPROVAL_FILTER_VALUES = [
  "all",
  "pending",
  "approved",
  "rejected",
] as const;
const STATUS_FILTER_WIDE_CH = "Todos los estados".length + 7;

type ApprovalFilter = (typeof APPROVAL_FILTER_VALUES)[number];

function approvalLabel(
  s: BusinessRegistrationStatus | null | undefined,
  t: (key: string) => string,
): string {
  const v = s ?? "pending";
  if (v === "pending") return t("admin.businessSubscriptions.status.pending");
  if (v === "rejected") return t("admin.businessSubscriptions.status.rejected");
  return t("admin.businessSubscriptions.status.approved");
}

function approvalBadgeClass(
  s: BusinessRegistrationStatus | null | undefined,
): string {
  const v = s ?? "pending";
  if (v === "pending") {
    return "border border-amber-200/90 bg-amber-50 text-amber-900";
  }
  if (v === "rejected") {
    return "border border-red-200/90 bg-red-50 text-red-800";
  }
  return "border border-emerald-200/90 bg-emerald-50 text-emerald-900";
}

function businessDisplayName(
  row: AdminBusinessProfileRow,
  t: (key: string) => string,
): string {
  return (
    row.fullName?.trim() ||
    row.email?.trim() ||
    t("admin.businessSubscriptions.table.noName")
  );
}

function businessSortValue(row: AdminBusinessProfileRow): string {
  return `${row.fullName ?? ""} ${row.email ?? ""}`.trim().toLowerCase();
}

function businessInitial(row: AdminBusinessProfileRow): string {
  const name = row.fullName?.trim();
  if (name) return name.slice(0, 1).toUpperCase();
  const em = row.email?.trim();
  if (em) return em.slice(0, 1).toUpperCase();
  return "?";
}

/** Aprobada → azul suave; pendiente/rechazada → gris suave. */
function businessAvatarClass(row: AdminBusinessProfileRow): string {
  const s = row.businessRegistrationStatus ?? "pending";
  if (s === "approved") {
    return "bg-sky-50 text-sky-800 ring-1 ring-sky-200/70 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-800/60";
  }
  return "bg-muted text-muted-foreground ring-1 ring-border";
}

function lastSignInTimestampMs(row: AdminBusinessProfileRow): number | null {
  const raw = row.lastSignInAt;
  if (raw == null) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

function createdAtTimestampMs(row: AdminBusinessProfileRow): number | null {
  const raw = row.createdAt;
  if (raw == null) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

function approvalStatusSortValue(
  s: BusinessRegistrationStatus | null | undefined,
): number {
  const v = s ?? "pending";
  if (v === "pending") return 0;
  if (v === "approved") return 1;
  return 2;
}

/**
 * Estado suave en filas de la tabla.
 * Mantiene el fondo neutro como las otras tablas (hover muted),
 * y marca el estado con una barrita (2px) a la izquierda.
 */
function businessSubscriptionRowClassName(
  row: AdminBusinessProfileRow,
): string {
  const s = row.businessRegistrationStatus ?? "pending";
  const base = "hover:bg-muted/50 transition-colors duration-150";

  // 2px barrita a la izquierda (suave) usando `box-shadow inset`.
  // rgba(..., 0.35) para que sea sutil.
  if (s === "pending") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(245,158,11,0.35)]");
  }
  if (s === "rejected") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(239,68,68,0.35)]");
  }
  return cn(base, "shadow-[inset_2px_0_0_rgba(16,185,129,0.35)]");
}

function SortableHeader({
  column,
  label,
  ariaLabelIdle,
  ariaLabelAsc,
  ariaLabelDesc,
}: {
  column: Column<AdminBusinessProfileRow, unknown>;
  label: string;
  ariaLabelIdle: string;
  ariaLabelAsc: string;
  ariaLabelDesc: string;
}) {
  const sorted = column.getIsSorted();
  const ariaLabel =
    sorted === "asc"
      ? ariaLabelAsc
      : sorted === "desc"
        ? ariaLabelDesc
        : ariaLabelIdle;
  return (
    <>
      <span className="md:hidden">{label}</span>
      <button
        type="button"
        className={cn(
          "hidden max-w-full items-center gap-1.5 rounded-md px-0.5 py-0.5 -mx-0.5 md:inline-flex",
          "text-xs font-medium uppercase tracking-wide text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        )}
        onClick={() => column.toggleSorting()}
        aria-label={ariaLabel}
        aria-sort={
          sorted === "asc"
            ? "ascending"
            : sorted === "desc"
              ? "descending"
              : "none"
        }
      >
        {label}
        <span
          className="inline-flex h-4 w-4 shrink-0 text-muted-foreground/80"
          aria-hidden
        >
          {sorted === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : sorted === "desc" ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-70" />
          )}
        </span>
      </button>
    </>
  );
}

const MENU_MIN_WIDTH_PX = 208; // 13rem
const BUSINESS_COLUMN_CLASS =
  "min-w-[16rem] max-w-[min(29rem,42vw)] md:max-w-[min(24rem,36vw)]";
const PHONE_COLUMN_CLASS = "w-[9.5rem] min-w-[9.5rem] max-w-[9.5rem]";
const EIN_COLUMN_CLASS = "w-[10rem] min-w-[10rem] max-w-[10rem]";
const APPROVAL_COLUMN_CLASS = "w-[11.5rem] min-w-[11.5rem] max-w-[11.5rem]";
const CREATED_AT_COLUMN_CLASS = "w-[12.75rem] min-w-[12.75rem] max-w-[12.75rem]";
const ACTIONS_COLUMN_CLASS = "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]";

interface Props {
  rows: AdminBusinessProfileRow[];
  isLoading?: boolean;
}

/** Mismo patrón que `UsersRowActionsMenu`: botón ⋮ + menú en portal. */
function SuscripcionesRowActionsMenu({
  row,
  onViewDetail,
  onDeleteSuccess,
}: {
  row: AdminBusinessProfileRow;
  onViewDetail: () => void;
  onDeleteSuccess: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const { executeAsync: approveBusinessAsync, isPending: approvingBusiness } =
    useServerAction(approveBusinessRegistrationAction, {
      successMessage: t("admin.businessSubscriptions.toast.approved"),
      errorMessage: t("admin.businessSubscriptions.toast.approveError"),
      onSuccess: () => {
        onDeleteSuccess();
        setOpen(false);
      },
      onSettled: () => router.refresh(),
    });

  const { executeAsync: rejectBusinessAsync, isPending: rejectingBusiness } =
    useServerAction(rejectBusinessRegistrationAction, {
      successMessage: t("admin.businessSubscriptions.toast.rejected"),
      errorMessage: t("admin.businessSubscriptions.toast.rejectError"),
      onSuccess: () => {
        onDeleteSuccess();
        setOpen(false);
      },
      onSettled: () => router.refresh(),
    });

  const { executeAsync: deleteUserAsync, isPending: deletingUser } =
    useServerAction(deleteUserAction, {
      successMessage: t("admin.businessSubscriptions.toast.deleted"),
      errorMessage: t("admin.businessSubscriptions.toast.deleteError"),
      onSuccess: () => {
        onDeleteSuccess();
        setOpen(false);
      },
      onSettled: () => router.refresh(),
    });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const left = Math.max(8, r.right - MENU_MIN_WIDTH_PX);
      setMenuPos({ top: r.bottom + 4, left });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  const showPendingActions =
    row.businessRegistrationStatus === "pending" ||
    row.businessRegistrationStatus == null;

  const showApprovedRejectOnly = row.businessRegistrationStatus === "approved";

  const handleDelete = async () => {
    const label = row.fullName?.trim() || row.email || row.id;
    await swalSaasConfirmAsync({
      title: t("admin.businessSubscriptions.confirm.deleteTitle"),
      html: `${t("admin.businessSubscriptions.confirm.deleteMessagePrefix")} <strong>${label}</strong>. ${t("admin.businessSubscriptions.confirm.deleteMessageSuffix")}`,
      confirmButtonText: t("admin.businessSubscriptions.confirm.deleteConfirm"),
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => deleteUserAsync(row.id),
    });
  };

  const handleReject = async () => {
    const label = row.fullName?.trim() || row.email || row.id;
    const wasApproved = row.businessRegistrationStatus === "approved";
    await swalSaasConfirmAsync({
      title: t("admin.businessSubscriptions.confirm.rejectTitle"),
      html: wasApproved
        ? `${t("admin.businessSubscriptions.confirm.rejectApprovedPrefix")} <strong>${label}</strong> ${t("admin.businessSubscriptions.confirm.rejectApprovedSuffix")}`
        : `${t("admin.businessSubscriptions.confirm.rejectPendingPrefix")} <strong>${label}</strong> ${t("admin.businessSubscriptions.confirm.rejectPendingSuffix")}`,
      confirmButtonText: t("admin.businessSubscriptions.confirm.rejectConfirm"),
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => rejectBusinessAsync(row.id),
    });
  };

  const handleApprove = async () => {
    const label = row.fullName?.trim() || row.email || row.id;
    await swalSaasConfirmAsync({
      title: t("admin.businessSubscriptions.confirm.approveTitle"),
      html: `${t("admin.businessSubscriptions.confirm.approveMessagePrefix")} <strong>${label}</strong>. ${t("admin.businessSubscriptions.confirm.approveMessageSuffix")}`,
      confirmButtonText: t(
        "admin.businessSubscriptions.confirm.approveConfirm",
      ),
      variant: "positive",
      iconType: "question",
      preConfirm: () => approveBusinessAsync(row.id),
    });
  };

  const busy = approvingBusiness || rejectingBusiness || deletingUser;

  const menuContent =
    open && menuPos ? (
      <div
        ref={menuRef}
        className="fixed z-[100] min-w-[13rem] overflow-hidden rounded-lg border border-border/80 bg-popover py-1 shadow-lg ring-1 ring-black/5"
        style={{ top: menuPos.top, left: menuPos.left }}
        role="menu"
      >
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted/80"
          onClick={() => {
            onViewDetail();
            setOpen(false);
          }}
        >
          <Eye className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          {t("admin.businessSubscriptions.menu.viewDetails")}
        </button>

        {showPendingActions ? (
          <>
            <div className="my-1 h-px bg-border/70" role="separator" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-emerald-700 transition hover:bg-emerald-50"
              disabled={busy}
              onClick={() => {
                void handleApprove();
              }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              {t("admin.businessSubscriptions.menu.approve")}
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-500/95 transition hover:bg-rose-50/90 dark:text-rose-400/90 dark:hover:bg-rose-950/30"
              disabled={busy}
              onClick={() => {
                void handleReject();
              }}
            >
              <XCircle className="h-4 w-4 shrink-0" aria-hidden />
              {t("admin.businessSubscriptions.menu.reject")}
            </button>
          </>
        ) : null}

        {showApprovedRejectOnly ? (
          <>
            <div className="my-1 h-px bg-border/70" role="separator" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-500/95 transition hover:bg-rose-50/90 dark:text-rose-400/90 dark:hover:bg-rose-950/30"
              disabled={busy}
              onClick={() => {
                void handleReject();
              }}
            >
              <XCircle className="h-4 w-4 shrink-0" aria-hidden />
              {t("admin.businessSubscriptions.menu.reject")}
            </button>
          </>
        ) : null}

        <div className="my-1 h-px bg-border/70" role="separator" />
        <button
          type="button"
          role="menuitem"
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
            busy
              ? "cursor-not-allowed text-muted-foreground/60"
              : "text-destructive hover:bg-destructive/10",
          )}
          disabled={busy}
          onClick={() => {
            void handleDelete();
          }}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          {deletingUser
            ? t("admin.businessSubscriptions.menu.deleting")
            : t("admin.businessSubscriptions.menu.delete")}
        </button>
      </div>
    ) : null;

  return (
    <div className="relative flex justify-end" ref={wrapRef}>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground md:rounded-md md:border md:border-border/80 md:bg-background md:hover:bg-muted/60"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("admin.businessSubscriptions.menu.openActions")}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </Button>
      {typeof document !== "undefined" && menuContent
        ? createPortal(menuContent, document.body)
        : null}
    </div>
  );
}

export function AdminSuscripcionesEmpresasTable({
  rows,
  isLoading = false,
}: Props) {
  const { t, locale } = useI18n();
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");
  const approvalFilterOptions = useMemo(
    () =>
      [
        {
          value: "all" as const,
          label: t("admin.businessSubscriptions.filters.all"),
        },
        {
          value: "pending" as const,
          label: t("admin.businessSubscriptions.status.pending"),
        },
        {
          value: "approved" as const,
          label: t("admin.businessSubscriptions.status.approved"),
        },
        {
          value: "rejected" as const,
          label: t("admin.businessSubscriptions.status.rejected"),
        },
      ] as const,
    [t],
  );

  const filtered = useMemo(() => {
    if (approvalFilter === "all") return rows;
    return rows.filter((r) => {
      const s = r.businessRegistrationStatus;
      if (approvalFilter === "pending") {
        return s === "pending" || s == null || s === undefined;
      }
      if (approvalFilter === "rejected") return s === "rejected";
      if (approvalFilter === "approved") return s === "approved";
      return true;
    });
  }, [rows, approvalFilter]);

  const filterValue =
    approvalFilterOptions.find((o) => o.value === approvalFilter) ??
    approvalFilterOptions[0];

  const renderMobileRow = useCallback((row: Row<AdminBusinessProfileRow>) => {
    const r = row.original;
    return (
      <li key={row.id}>
        <BusinessProfileCard
          email={r.email ?? ""}
          fullName={r.fullName}
          businessRegistrationStatus={r.businessRegistrationStatus}
          lastSignInAt={r.lastSignInAt}
          createdAt={r.createdAt}
          phone={r.phone}
          employerIdentificationNumber={r.employerIdentificationNumber}
          className="hover:bg-muted/50 transition-colors duration-150"
          actions={
            <SuscripcionesRowActionsMenu
              row={r}
              onViewDetail={() => setDetailUserId(r.id)}
              onDeleteSuccess={() => {
                setDetailUserId((current) =>
                  current === r.id ? null : current,
                );
              }}
            />
          }
        />
      </li>
    );
  }, []);

  const columns = useMemo<ColumnDef<AdminBusinessProfileRow>[]>(
    () => [
      {
        id: "business",
        accessorFn: (row) => `${row.fullName ?? ""} ${row.email ?? ""}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          businessSortValue(rowA.original).localeCompare(
            businessSortValue(rowB.original),
            locale,
            { sensitivity: "base" },
          ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.businessSubscriptions.table.business")}
            ariaLabelIdle={t(
              "admin.businessSubscriptions.table.businessSortIdle",
            )}
            ariaLabelAsc={t("admin.businessSubscriptions.table.sortAsc")}
            ariaLabelDesc={t("admin.businessSubscriptions.table.sortDesc")}
          />
        ),
        meta: {
          cellClassName: BUSINESS_COLUMN_CLASS,
        },
        cell: ({ row }) => {
          const r = row.original;
          const name = businessDisplayName(r, t);
          const email = r.email?.trim();
          return (
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  businessAvatarClass(r),
                )}
                aria-hidden
              >
                {businessInitial(r)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">
                  {name}
                </p>
                {email ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {email}
                  </p>
                ) : (
                  <AdminTableEmptyEmDash className="text-sm" />
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: t("admin.businessSubscriptions.table.phone"),
        meta: {
          cellClassName: PHONE_COLUMN_CLASS,
        },
        cell: ({ row }) =>
          adminTableOptionalString(row.original.phone, {
            classNameWhenPresent: "text-foreground whitespace-nowrap",
          }),
      },
      {
        accessorKey: "employerIdentificationNumber",
        header: t("admin.businessSubscriptions.table.ein"),
        meta: {
          cellClassName: EIN_COLUMN_CLASS,
        },
        cell: ({ row }) => {
          const v = row.original.employerIdentificationNumber?.trim();
          if (!v) return <AdminTableEmptyEmDash />;
          return <span className="font-mono text-xs whitespace-nowrap">{v}</span>;
        },
      },
      {
        id: "approval",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          approvalStatusSortValue(rowA.original.businessRegistrationStatus) -
          approvalStatusSortValue(rowB.original.businessRegistrationStatus),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.businessSubscriptions.table.registrationStatus")}
            ariaLabelIdle={t(
              "admin.businessSubscriptions.table.registrationStatusSortIdle",
            )}
            ariaLabelAsc={t(
              "admin.businessSubscriptions.table.registrationStatusSortAsc",
            )}
            ariaLabelDesc={t(
              "admin.businessSubscriptions.table.registrationStatusSortDesc",
            )}
          />
        ),
        meta: {
          cellClassName: APPROVAL_COLUMN_CLASS,
        },
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              approvalBadgeClass(row.original.businessRegistrationStatus),
            )}
          >
            {approvalLabel(row.original.businessRegistrationStatus, t)}
          </span>
        ),
      },
      /*
      {
        id: "lastSignInAt",
        accessorKey: "lastSignInAt",
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = lastSignInTimestampMs(rowA.original);
          const b = lastSignInTimestampMs(rowB.original);
          if (a == null && b == null) return 0;
          if (a == null) return 1;
          if (b == null) return -1;
          return a - b;
        },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Último acceso"
            ariaLabelIdle="Ordenar por último acceso"
            ariaLabelAsc="Más antiguo primero. Clic para invertir"
            ariaLabelDesc="Más reciente primero. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => {
          const raw = row.original.lastSignInAt;
          const relative = formatRelativeLastAccess(raw);
          if (relative == null) {
            return <AdminTableEmptyEmDash />;
          }
          const absolute = raw ? formatDateDdMmYyyyHhMm(raw) : "";
          return (
            <span
              className="text-sm text-muted-foreground"
              title={absolute || undefined}
            >
              {relative}
            </span>
          );
        },
      },
      */
      {
        id: "createdAt",
        accessorKey: "createdAt",
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = createdAtTimestampMs(rowA.original);
          const b = createdAtTimestampMs(rowB.original);
          if (a == null && b == null) return 0;
          if (a == null) return 1;
          if (b == null) return -1;
          return a - b;
        },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.businessSubscriptions.table.createdAt")}
            ariaLabelIdle={t(
              "admin.businessSubscriptions.table.createdAtSortIdle",
            )}
            ariaLabelAsc={t(
              "admin.businessSubscriptions.table.createdAtSortAsc",
            )}
            ariaLabelDesc={t(
              "admin.businessSubscriptions.table.createdAtSortDesc",
            )}
          />
        ),
        meta: {
          cellClassName: CREATED_AT_COLUMN_CLASS,
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
            {formatDateDdMmYyyyHhMm(row.original.createdAt, locale)}
          </span>
        ),
      },
      {
        id: "actions",
        meta: { align: "right", cellClassName: ACTIONS_COLUMN_CLASS },
        header: () => (
          <span className="sr-only">
            {t("admin.businessSubscriptions.table.actions")}
          </span>
        ),
        cell: ({ row }) => (
          <SuscripcionesRowActionsMenu
            row={row.original}
            onViewDetail={() => setDetailUserId(row.original.id)}
            onDeleteSuccess={() => {
              setDetailUserId((current) =>
                current === row.original.id ? null : current,
              );
            }}
          />
        ),
      },
    ],
    [locale, t],
  );

  const toolbarFilters = useMemo(
    () => (
      <div className="flex w-full min-w-0 items-center gap-2">
        <div
          className={cn(
            "min-w-0 flex-1",
            "min-[1440px]:box-border min-[1440px]:w-[var(--orders-status-filter-w)] min-[1440px]:min-w-[var(--orders-status-filter-w)] min-[1440px]:max-w-[var(--orders-status-filter-w)] min-[1440px]:flex-none min-[1440px]:shrink-0",
          )}
          style={
            {
              ["--orders-status-filter-w" as string]: `${STATUS_FILTER_WIDE_CH}ch`,
            } as CSSProperties
          }
        >
          <Select<(typeof approvalFilterOptions)[number], false>
            instanceId="suscripciones-empresas-approval-filter"
            inputId="suscripciones-empresas-approval-filter-input"
            aria-label={t("admin.businessSubscriptions.filters.statusAria")}
            isSearchable={false}
            isClearable={false}
            options={[...approvalFilterOptions]}
            value={filterValue}
            onChange={(opt) => {
              if (opt) setApprovalFilter(opt.value);
            }}
            styles={appToolbarSelectStyles}
            className="w-full min-w-0"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-border/80 text-muted-foreground hover:text-foreground"
          disabled={approvalFilter === "all"}
          onClick={() => setApprovalFilter("all")}
          title={t("admin.businessSubscriptions.filters.clear")}
          aria-label={t("admin.businessSubscriptions.filters.clearAria")}
        >
          <FilterX className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    ),
    [approvalFilter, approvalFilterOptions, filterValue, t],
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder={t(
          "admin.businessSubscriptions.filters.searchPlaceholder",
        )}
        tableClassName="table-fixed"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={(row) => businessSubscriptionRowClassName(row)}
        renderMobileRow={renderMobileRow}
        toolbarFilters={toolbarFilters}
      />
      <UserDetailDrawer
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
        subscriptionContext
      />
    </div>
  );
}
