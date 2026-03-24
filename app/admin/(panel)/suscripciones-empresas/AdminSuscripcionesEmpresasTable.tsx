"use client";

import {
  approveBusinessRegistrationAction,
  deleteUserAction,
  rejectBusinessRegistrationAction,
} from "@/app/admin/(panel)/users/actions";
import { UserDetailDrawer } from "@/app/admin/(panel)/users/UserDetailDrawer";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use-server-action";
import type { AdminBusinessProfileRow } from "@/modules/admin/business-profiles/business-profiles.types";
import type { BusinessRegistrationStatus } from "@/modules/auth/auth.types";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Eye, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Select, { type StylesConfig } from "react-select";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const APPROVAL_FILTER_OPTIONS = [
  { value: "all" as const, label: "Todos" },
  { value: "pending" as const, label: "Pendiente" },
  { value: "approved" as const, label: "Aprobada" },
  { value: "rejected" as const, label: "Rechazada" },
] as const;

type ApprovalFilter = (typeof APPROVAL_FILTER_OPTIONS)[number]["value"];

const filterSelectStyles: StylesConfig<
  (typeof APPROVAL_FILTER_OPTIONS)[number],
  false
> = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    width: "100%",
    minWidth: 0,
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "hsl(214 32% 91% / 0.9)",
    backgroundColor: "hsl(0 0% 100%)",
    boxShadow: state.isFocused
      ? "0 0 0 2px hsl(222.2 84% 56.3% / 0.3)"
      : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "&:hover": {
      borderColor: "hsl(214 32% 91% / 0.9)",
    },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(222.2 84% 4.9%)",
    fontSize: "0.875rem",
  }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(215.4 16.3% 46.9%)",
    padding: "0 8px",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(0 0% 100%)",
    border: "1px solid hsl(214 32% 91% / 0.9)",
    borderRadius: "0.5rem",
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    padding: "8px 12px",
    backgroundColor: state.isSelected
      ? "hsl(222.2 47.4% 11.2%)"
      : state.isFocused
        ? "hsl(210 40% 96.1%)"
        : "hsl(0 0% 100%)",
    color: state.isSelected ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
    cursor: "pointer",
  }),
};

function approvalLabel(
  s: BusinessRegistrationStatus | null | undefined
): string {
  const v = s ?? "pending";
  if (v === "pending") return "Pendiente";
  if (v === "rejected") return "Rechazada";
  return "Aprobada";
}

/** Fondo suave por estado de alta (null cuenta como pendiente). */
function businessSubscriptionRowClassName(
  row: AdminBusinessProfileRow
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

interface Props {
  rows: AdminBusinessProfileRow[];
  isLoading?: boolean;
}

function RowActions({
  row,
  onViewDetail,
  onDeleteSuccess,
}: {
  row: AdminBusinessProfileRow;
  onViewDetail: () => void;
  onDeleteSuccess: () => void;
}) {
  const router = useRouter();
  const { execute: approveBusiness, isPending: approvingBusiness } =
    useServerAction(approveBusinessRegistrationAction, {
      successMessage:
        "Empresa aprobada. Se ha enviado un correo de notificación.",
      errorMessage: "No se pudo aprobar la empresa",
      onSuccess: () => onDeleteSuccess(),
      onSettled: () => router.refresh(),
    });

  const { execute: rejectBusiness, isPending: rejectingBusiness } =
    useServerAction(rejectBusinessRegistrationAction, {
      successMessage: "Solicitud de empresa rechazada.",
      errorMessage: "No se pudo rechazar la solicitud",
      onSuccess: () => onDeleteSuccess(),
      onSettled: () => router.refresh(),
    });

  const { execute, isPending } = useServerAction(deleteUserAction, {
    successMessage: "Usuario eliminado",
    errorMessage: "No se pudo eliminar el usuario",
    onSuccess: () => onDeleteSuccess(),
    onSettled: () => router.refresh(),
  });

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
    execute(row.id);
  };

  const showPendingActions =
    row.businessRegistrationStatus === "pending" ||
    row.businessRegistrationStatus == null;

  const showApprovedRejectOnly =
    row.businessRegistrationStatus === "approved";

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

  const approvalBusy = approvingBusiness || rejectingBusiness;

  return (
    <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
      {showPendingActions ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0 border-destructive/60 text-destructive hover:bg-destructive/10"
                disabled={approvalBusy}
                onClick={handleReject}
                aria-label="Rechazar solicitud de empresa"
              >
                <XCircle className="h-4 w-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Rechazar solicitud</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="default"
                className="h-8 w-8 shrink-0 bg-emerald-600 hover:bg-emerald-700"
                disabled={approvalBusy}
                onClick={handleApprove}
                aria-label="Aprobar empresa"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Aprobar registro de empresa</TooltipContent>
          </Tooltip>
        </>
      ) : null}
      {showApprovedRejectOnly ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0 border-destructive/60 text-destructive hover:bg-destructive/10"
              disabled={approvalBusy}
              onClick={handleReject}
              aria-label="Rechazar solicitud de empresa"
            >
              <XCircle className="h-4 w-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Rechazar solicitud</TooltipContent>
        </Tooltip>
      ) : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
            onClick={onViewDetail}
            aria-label="Ver detalles"
          >
            <Eye className="h-4 w-4" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Ver detalles</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-8 w-8 shrink-0"
            disabled={isPending}
            onClick={handleDelete}
            aria-label="Eliminar suscripción de empresa"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isPending ? "Eliminando…" : "Eliminar empresa"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function AdminSuscripcionesEmpresasTable({
  rows,
  isLoading = false,
}: Props) {
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] =
    useState<ApprovalFilter>("all");

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
        accessorKey: "fullName",
        header: "Negocio",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.fullName?.trim() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.email ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Teléfono",
        cell: ({ row }) => row.original.phone?.trim() || "—",
      },
      {
        accessorKey: "employerIdentificationNumber",
        header: "EIN",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.employerIdentificationNumber?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "approval",
        header: "Estado alta",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {approvalLabel(row.original.businessRegistrationStatus)}
          </span>
        ),
      },
      {
        accessorKey: "lastSignInAt",
        header: "Último acceso",
        cell: ({ row }) =>
          formatDateDdMmYyyyHhMm(row.original.lastSignInAt),
      },
      {
        accessorKey: "createdAt",
        header: "Registro",
        cell: ({ row }) =>
          formatDateDdMmYyyyHhMm(row.original.createdAt),
      },
      {
        id: "actions",
        meta: { align: "right" },
        header: "Acciones",
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onViewDetail={() => setDetailUserId(row.original.id)}
            onDeleteSuccess={() => {
              setDetailUserId((current) =>
                current === row.original.id ? null : current
              );
            }}
          />
        ),
      },
    ],
    []
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          getRowClassName={businessSubscriptionRowClassName}
          searchPlaceholder="Buscar suscripción negocio, email, teléfono o EIN…"
          toolbarFilters={
            <div className="w-full min-w-0 max-w-xs">
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
                styles={filterSelectStyles}
                className="w-full"
              />
            </div>
          }
        />
        {!isLoading && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay suscripciones de empresa registradas todavía.
          </p>
        ) : null}
      </div>
      <UserDetailDrawer
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />
    </TooltipProvider>
  );
}
