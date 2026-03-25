"use client";

import {
  approveBusinessRegistrationAction,
  deleteUserAction,
  rejectBusinessRegistrationAction,
} from "@/app/admin/(panel)/users/actions";
import { UserDetailDrawer } from "@/app/admin/(panel)/users/UserDetailDrawer";
import {
  AdminTableEmptyEmDash,
  adminTableDateCell,
  adminTableOptionalString,
} from "@/components/admin/admin-table-empty";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useServerAction } from "@/hooks/use-server-action";
import type { AdminBusinessProfileRow } from "@/modules/admin/business-profiles/business-profiles.types";
import type { BusinessRegistrationStatus } from "@/modules/auth/auth.types";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
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
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Select from "react-select";
import { appSelectStyles } from "@/components/ui/react-select-app-styles";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const APPROVAL_FILTER_OPTIONS = [
  { value: "all" as const, label: "Todos los estados" },
  { value: "pending" as const, label: "Pendiente" },
  { value: "approved" as const, label: "Aprobada" },
  { value: "rejected" as const, label: "Rechazada" },
] as const;

type ApprovalFilter = (typeof APPROVAL_FILTER_OPTIONS)[number]["value"];

function approvalLabel(
  s: BusinessRegistrationStatus | null | undefined,
): string {
  const v = s ?? "pending";
  if (v === "pending") return "Pendiente";
  if (v === "rejected") return "Rechazada";
  return "Aprobada";
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

function businessDisplayName(row: AdminBusinessProfileRow): string {
  return row.fullName?.trim() || row.email?.trim() || "Sin nombre";
}

function businessSortValue(row: AdminBusinessProfileRow): string {
  return `${row.fullName ?? ""} ${row.email ?? ""}`
    .trim()
    .toLowerCase();
}

function lastSignInTimestampMs(
  row: AdminBusinessProfileRow,
): number | null {
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

/** Fondo suave por estado de alta (null cuenta como pendiente). */
function businessSubscriptionRowClassName(
  row: AdminBusinessProfileRow,
): string {
  const s = row.businessRegistrationStatus ?? "pending";
  if (s === "pending") {
    return "bg-amber-50/95 hover:bg-amber-100/85";
  }
  if (s === "rejected") {
    return "bg-red-50/95 hover:bg-red-100/80";
  }
  return "bg-emerald-50/95 hover:bg-emerald-100/80";
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const { execute: approveBusiness, isPending: approvingBusiness } =
    useServerAction(approveBusinessRegistrationAction, {
      successMessage:
        "Empresa aprobada. Se ha enviado un correo de notificación.",
      errorMessage: "No se pudo aprobar la empresa",
      onSuccess: () => {
        onDeleteSuccess();
        setOpen(false);
      },
      onSettled: () => router.refresh(),
    });

  const { execute: rejectBusiness, isPending: rejectingBusiness } =
    useServerAction(rejectBusinessRegistrationAction, {
      successMessage: "Solicitud de empresa rechazada.",
      errorMessage: "No se pudo rechazar la solicitud",
      onSuccess: () => {
        onDeleteSuccess();
        setOpen(false);
      },
      onSettled: () => router.refresh(),
    });

  const { execute: deleteUser, isPending: deletingUser } = useServerAction(
    deleteUserAction,
    {
      successMessage: "Usuario eliminado",
      errorMessage: "No se pudo eliminar el usuario",
      onSuccess: () => {
        onDeleteSuccess();
        setOpen(false);
      },
      onSettled: () => router.refresh(),
    },
  );

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
    const result = await Swal.fire({
      title: "¿Eliminar suscripción de empresa?",
      html: `Vas a eliminar el usuario y perfil de <strong>${label}</strong>. Esta acción <strong>no se puede deshacer</strong>.`,
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      focusCancel: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "hsl(0 72% 45%)",
      cancelButtonColor: "hsl(215 16% 47%)",
      customClass: { popup: "swal-equal-width-buttons" },
    });

    if (!result.isConfirmed) return;
    deleteUser(row.id);
  };

  const handleReject = async () => {
    const label = row.fullName?.trim() || row.email || row.id;
    const wasApproved = row.businessRegistrationStatus === "approved";
    const result = await Swal.fire({
      title: "¿Rechazar solicitud?",
      html: wasApproved
        ? `La solicitud de <strong>${label}</strong> quedará como <strong>rechazada</strong>. El usuario dejará de poder iniciar sesión como empresa.`
        : `La solicitud de <strong>${label}</strong> quedará como <strong>rechazada</strong>. El usuario no podrá iniciar sesión como empresa.`,
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
    rejectBusiness(row.id);
  };

  const handleApprove = async () => {
    const label = row.fullName?.trim() || row.email || row.id;
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
    approveBusiness(row.id);
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
          Ver detalles
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
              Aprobar registro
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10"
              disabled={busy}
              onClick={() => {
                void handleReject();
              }}
            >
              <XCircle className="h-4 w-4 shrink-0" aria-hidden />
              Rechazar solicitud
            </button>
          </>
        ) : null}

        {showApprovedRejectOnly ? (
          <>
            <div className="my-1 h-px bg-border/70" role="separator" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10"
              disabled={busy}
              onClick={() => {
                void handleReject();
              }}
            >
              <XCircle className="h-4 w-4 shrink-0" aria-hidden />
              Rechazar solicitud
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
          {deletingUser ? "Eliminando…" : "Eliminar"}
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
        aria-label="Abrir menú de acciones"
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
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");

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
    APPROVAL_FILTER_OPTIONS.find((o) => o.value === approvalFilter) ??
    APPROVAL_FILTER_OPTIONS[0];

  const columns = useMemo<ColumnDef<AdminBusinessProfileRow>[]>(
    () => [
      {
        id: "business",
        accessorFn: (row) =>
          `${row.fullName ?? ""} ${row.email ?? ""}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          businessSortValue(rowA.original).localeCompare(
            businessSortValue(rowB.original),
            "es",
            { sensitivity: "base" },
          ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Empresa"
            ariaLabelIdle="Ordenar por empresa"
            ariaLabelAsc="Ordenado de la A a la Z. Clic para invertir"
            ariaLabelDesc="Ordenado de la Z a la A. Clic para quitar orden"
          />
        ),
        meta: {
          cellClassName:
            "min-w-0 max-w-[min(28rem,50vw)] md:max-w-[min(22rem,40vw)]",
        },
        cell: ({ row }) => {
          const r = row.original;
          const name = businessDisplayName(r);
          const email = r.email?.trim();
          return (
            <div className="min-w-0">
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
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Teléfono",
        cell: ({ row }) =>
          adminTableOptionalString(row.original.phone, {
            classNameWhenPresent: "text-foreground",
          }),
      },
      {
        accessorKey: "employerIdentificationNumber",
        header: "EIN",
        cell: ({ row }) => {
          const v = row.original.employerIdentificationNumber?.trim();
          if (!v) return <AdminTableEmptyEmDash />;
          return <span className="font-mono text-xs">{v}</span>;
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
            label="Estado alta"
            ariaLabelIdle="Ordenar por estado de alta"
            ariaLabelAsc="Pendiente primero. Clic para invertir"
            ariaLabelDesc="Rechazada primero. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              approvalBadgeClass(row.original.businessRegistrationStatus),
            )}
          >
            {approvalLabel(row.original.businessRegistrationStatus)}
          </span>
        ),
      },
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
            label="Registro"
            ariaLabelIdle="Ordenar por fecha de registro"
            ariaLabelAsc="Más antiguo primero. Clic para invertir"
            ariaLabelDesc="Más reciente primero. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {adminTableDateCell(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        meta: { align: "right", cellClassName: "w-[4.5rem]" },
        header: () => <span className="sr-only">Acciones</span>,
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
    [],
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder="Buscar por negocio, email, teléfono o EIN…"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={(row) =>
          cn(
            businessSubscriptionRowClassName(row),
            "transition-colors duration-150",
          )
        }
        toolbarFilters={
          <div className="w-full min-w-0 min-[1440px]:max-w-[13rem]">
            <Select<(typeof APPROVAL_FILTER_OPTIONS)[number], false>
              instanceId="suscripciones-empresas-approval-filter"
              inputId="suscripciones-empresas-approval-filter-input"
              aria-label="Filtrar por estado de alta"
              isSearchable={false}
              isClearable={false}
              options={[...APPROVAL_FILTER_OPTIONS]}
              value={filterValue}
              onChange={(opt) => {
                if (opt) setApprovalFilter(opt.value);
              }}
              styles={appSelectStyles}
              className="w-full"
            />
          </div>
        }
      />
      <UserDetailDrawer
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />
    </div>
  );
}
