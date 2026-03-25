"use client";

import { useMemo, useState } from "react";
import type { AdminUser } from "@/modules/admin/users/users.types";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Select, { type StylesConfig } from "react-select";
import { CheckCircle2, Eye, Trash2, XCircle } from "lucide-react";
import {
  adminTableDateCell,
  adminTableOptionalString,
} from "@/components/admin/admin-table-empty";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use-server-action";
import {
  approveBusinessRegistrationAction,
  rejectBusinessRegistrationAction,
  deleteUserAction,
} from "./actions";
import { UserDetailDrawer } from "./UserDetailDrawer";
import type { UserRole } from "@/modules/auth/auth.types";

const ROLE_FILTER_OPTIONS = [
  { value: "all" as const, label: "Todos" },
  { value: "CLIENT" as const, label: "Cliente" },
  { value: "BUSINESS" as const, label: "Empresa" },
] as const;

type RoleFilter = (typeof ROLE_FILTER_OPTIONS)[number]["value"];

const filterSelectStyles: StylesConfig<
  (typeof ROLE_FILTER_OPTIONS)[number],
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

interface Props {
  users: AdminUser[];
  /** Mientras carga (p. ej. Suspense): spinner en el cuerpo de la tabla */
  isLoading?: boolean;
}

function roleDisplayLabel(role: UserRole): string {
  if (role === "BUSINESS") return "Empresa";
  if (role === "CLIENT") return "Cliente";
  return role;
}

function RowActions({
  user,
  onViewDetail,
  onDeleteSuccess,
}: {
  user: AdminUser;
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

  const isAdminUser = user.role === "ADMIN";

  const handleDelete = async () => {
    if (isAdminUser) return;
    const label = user.fullName?.trim() || user.id;
    const result = await Swal.fire({
      title: "¿Eliminar usuario?",
      html: `Vas a eliminar a <strong>${label}</strong>. Esta acción <strong>no se puede deshacer</strong>.`,
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
    execute(user.id);
  };

  const deleteDisabled = isPending || isAdminUser;
  const showApproveBusiness =
    user.role === "BUSINESS" &&
    (user.businessRegistrationStatus === "pending" ||
      user.businessRegistrationStatus == null);

  const showRejectApprovedOnly =
    user.role === "BUSINESS" &&
    user.businessRegistrationStatus === "approved";

  const handleRejectBusiness = async () => {
    const label = user.fullName?.trim() || user.id;
    const wasApproved = user.businessRegistrationStatus === "approved";
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
    rejectBusiness(user.id);
  };

  const handleApproveBusiness = async () => {
    const label = user.fullName?.trim() || user.id;
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
    approveBusiness(user.id);
  };

  const approvalBusy = approvingBusiness || rejectingBusiness;

  return (
    <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
      {showApproveBusiness ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0 border-destructive/60 text-destructive hover:bg-destructive/10"
                disabled={approvalBusy}
                onClick={handleRejectBusiness}
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
                onClick={handleApproveBusiness}
                aria-label="Aprobar empresa"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Aprobar registro de empresa</TooltipContent>
          </Tooltip>
        </>
      ) : null}
      {showRejectApprovedOnly ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0 border-destructive/60 text-destructive hover:bg-destructive/10"
              disabled={approvalBusy}
              onClick={handleRejectBusiness}
              aria-label="Rechazar solicitud de empresa"
            >
              <XCircle className="h-4 w-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Rechazar solicitud (estado rechazado)</TooltipContent>
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
        <TooltipContent side="top">Ver detalles del usuario</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          {deleteDisabled ? (
            <span className="inline-flex">
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8 shrink-0"
                disabled
                aria-label={
                  isAdminUser
                    ? "Eliminar no disponible (administrador)"
                    : "Eliminando usuario"
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </span>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8 shrink-0"
              onClick={handleDelete}
              aria-label="Eliminar usuario"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent side="top">
          {isAdminUser
            ? "No se puede eliminar un usuario administrador"
            : isPending
              ? "Eliminando…"
              : "Eliminar usuario"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function AdminUsersTable({ users, isLoading = false }: Props) {
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") return users;
    return users.filter((u) => u.role === (roleFilter as UserRole));
  }, [users, roleFilter]);

  const filterValue =
    ROLE_FILTER_OPTIONS.find((o) => o.value === roleFilter) ??
    ROLE_FILTER_OPTIONS[0];

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Nombre",
        cell: ({ row }) =>
          adminTableOptionalString(row.original.fullName, {
            classNameWhenPresent: "font-medium text-foreground",
          }),
      },
      {
        id: "role",
        accessorKey: "role",
        header: "Rol",
        cell: ({ row }) => roleDisplayLabel(row.original.role),
      },
      {
        accessorKey: "lastSignInAt",
        header: "Último acceso",
        cell: ({ row }) => adminTableDateCell(row.original.lastSignInAt),
      },
      {
        id: "actions",
        meta: { align: "right" },
        header: "Acciones",
        cell: ({ row }) => (
          <RowActions
            user={row.original}
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
          data={filteredUsers}
          isLoading={isLoading}
          searchPlaceholder="Buscar…"
          toolbarFilters={
            <div className="w-full min-w-0">
              <Select<(typeof ROLE_FILTER_OPTIONS)[number], false>
                instanceId="users-role-filter"
                inputId="users-role-filter-input"
                aria-label="Filtrar por rol"
                isSearchable={false}
                isClearable={false}
                options={[...ROLE_FILTER_OPTIONS]}
                value={filterValue}
                onChange={(opt) => {
                  if (opt) setRoleFilter(opt.value);
                }}
                styles={filterSelectStyles}
                className="w-full"
              />
            </div>
          }
        />
      </div>
      <UserDetailDrawer
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />
    </TooltipProvider>
  );
}
