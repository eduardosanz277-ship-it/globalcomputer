"use client";

import { useCallback, useMemo, useState } from "react";
import type { Service } from "@/modules/admin/services/services.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteServiceAction } from "./actions";
import { ServiceFormDialog } from "./ServiceFormDialog";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { ServiceProfileCard } from "@/components/dashboard/service-profile-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  services: Service[];
  isLoading?: boolean;
}

function serviceInitial(name: string): string {
  const t = name.trim();
  return t ? t.slice(0, 1).toUpperCase() : "?";
}

function updatedAtSortMs(row: Service): number {
  const t = new Date(row.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function RowActions({ row, onEdit }: { row: Service; onEdit: () => void }) {
  const router = useRouter();
  const { executeAsync, isPending } = useServerAction(deleteServiceAction, {
    successMessage: "Servicio eliminado",
    errorMessage: "No se pudo eliminar el servicio",
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: "¿Eliminar servicio?",
      html: `Vas a eliminar <strong>${row.name}</strong>.`,
      confirmButtonText: "Eliminar",
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => executeAsync(row.id),
    });
  };

  return (
    <AdminEditDeleteRowMenu
      onEdit={onEdit}
      onDelete={() => void handleDelete()}
      isDeleting={isPending}
    />
  );
}

export function AdminServicesTable({ services, isLoading = false }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const renderMobileRow = useCallback(
    (row: Row<Service>) => {
      const r = row.original;
      return (
        <li key={row.id}>
          <ServiceProfileCard
            name={r.name}
            imageUrl={r.imageUrl}
            description={r.description}
            updatedAt={r.updatedAt}
            className="hover:bg-muted/50 transition-colors duration-150"
            actions={
              <RowActions
                row={r}
                onEdit={() => {
                  setEditing(r);
                  setDialogOpen(true);
                }}
              />
            }
          />
        </li>
      );
    },
    [],
  );

  const columns = useMemo<ColumnDef<Service>[]>(
    () => [
      {
        id: "service",
        accessorFn: (row) => `${row.name} ${row.description ?? ""}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.name.localeCompare(rowB.original.name, "es", {
            sensitivity: "base",
          }),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Servicio"
            ariaLabelIdle="Ordenar por nombre"
            ariaLabelAsc="Ordenado de la A a la Z. Clic para invertir"
            ariaLabelDesc="Ordenado de la Z a la A. Clic para quitar orden"
          />
        ),
        meta: {
          cellClassName:
            "min-w-0 max-w-[min(36rem,85vw)] md:max-w-[min(28rem,50vw)]",
        },
        cell: ({ row }) => {
          const r = row.original;
          const imageUrl = r.imageUrl;
          const desc = r.description?.trim();
          return (
            <div className="flex min-w-0 items-start gap-3">
              {imageUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border/80 bg-muted">
                  <Image
                    src={imageUrl}
                    alt={r.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted text-sm font-semibold text-muted-foreground"
                  aria-hidden
                >
                  {serviceInitial(r.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">
                  {r.name}
                </p>
                {desc ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {desc}
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
        id: "updatedAt",
        accessorKey: "updatedAt",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          updatedAtSortMs(rowA.original) - updatedAtSortMs(rowB.original),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Última actualización"
            ariaLabelIdle="Ordenar por última actualización"
            ariaLabelAsc="Más antiguo primero. Clic para invertir"
            ariaLabelDesc="Más reciente primero. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => {
          const raw = row.original.updatedAt;
          const relative = formatRelativeLastAccess(raw);
          const absolute = formatDateDdMmYyyyHhMm(raw);
          if (relative == null) {
            return (
              <span className="text-sm text-muted-foreground">
                {absolute}
              </span>
            );
          }
          return (
            <TooltipProvider delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-sm text-muted-foreground">
                    {relative}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
                >
                  <span className="block font-medium">Última actualización</span>
                  <span className="mt-0.5 block text-muted-foreground">{absolute}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        id: "actions",
        meta: { align: "right", cellClassName: "w-[4.5rem]" },
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onEdit={() => {
              setEditing(row.original);
              setDialogOpen(true);
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
        data={services}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder="Buscar por nombre o descripción…"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
        renderMobileRow={renderMobileRow}
        toolbarActions={
          <Button
            type="button"
            className="h-9 w-full shrink-0 md:w-auto"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Nuevo
          </Button>
        }
      />

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        service={editing}
      />
    </div>
  );
}
