"use client";

import { useMemo, useState } from "react";
import type { AdminUser } from "@/modules/admin/users/users.types";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { Eye, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteUserAction } from "./actions";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { UserDetailDrawer } from "./UserDetailDrawer";

interface Props {
  users: AdminUser[];
  /** Mientras carga (p. ej. Suspense): spinner en el cuerpo de la tabla */
  isLoading?: boolean;
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
  const { execute, isPending } = useServerAction(deleteUserAction, {
    successMessage: "Usuario eliminado",
    errorMessage: "No se pudo eliminar el usuario",
    onSuccess: () => {
      onDeleteSuccess();
      router.refresh();
    },
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
      focusCancel: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "hsl(0 72% 45%)",
      cancelButtonColor: "hsl(215 16% 47%)",
    });

    if (!result.isConfirmed) return;
    execute(user.id);
  };

  const deleteDisabled = isPending || isAdminUser;

  return (
    <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
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

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      { accessorKey: "fullName", header: "Nombre" },
      { accessorKey: "role", header: "Rol" },
      {
        accessorKey: "lastSignInAt",
        header: "Último acceso",
        cell: ({ row }) =>
          formatDateDdMmYyyyHhMm(row.original.lastSignInAt),
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
      <DataTable columns={columns} data={users} isLoading={isLoading} />
      <UserDetailDrawer
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />
    </TooltipProvider>
  );
}
