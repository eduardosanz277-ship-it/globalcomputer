"use client";

import { useMemo, useState } from "react";
import type { Service } from "@/modules/admin/services/services.types";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteServiceAction } from "./actions";
import { ServiceFormDialog } from "./ServiceFormDialog";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";

interface Props {
  services: Service[];
  isLoading?: boolean;
}

function RowActions({ row, onEdit }: { row: Service; onEdit: () => void }) {
  const router = useRouter();
  const { execute, isPending } = useServerAction(deleteServiceAction, {
    successMessage: "Servicio eliminado",
    errorMessage: "No se pudo eliminar el servicio",
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "¿Eliminar servicio?",
      html: `Vas a eliminar <strong>${row.name}</strong>.`,
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

  return (
    <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
            onClick={onEdit}
            aria-label="Editar servicio"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Editar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-8 w-8 shrink-0"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Eliminar servicio"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isPending ? "Eliminando…" : "Eliminar"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function AdminServicesTable({ services, isLoading = false }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const columns = useMemo<ColumnDef<Service>[]>(
    () => [
      {
        id: "image",
        header: "Imagen",
        meta: {
          cellClassName: "w-[72px] min-w-[72px] max-w-[72px]",
        },
        cell: ({ row }) => {
          const imageUrl = row.original.imageUrl;
          if (!imageUrl) {
            return (
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">
                Sin img
              </div>
            );
          }
          return (
            <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border/80 bg-muted">
              <Image
                src={imageUrl}
                alt={`Imagen de ${row.original.name}`}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Nombre",
        meta: {
          cellClassName:
            "min-w-0 overflow-hidden md:max-[1439px]:min-w-[10rem] md:max-[1439px]:max-w-[12rem] w-[18%] max-w-[18%]",
        },
        cell: ({ row }) => (
          <span className="block min-w-0 max-w-full truncate">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Descripción",
        meta: {
          cellClassName:
            "min-w-0 overflow-hidden md:max-[1439px]:min-w-[14rem] md:max-[1439px]:w-[40%]",
        },
        cell: ({ row }) => {
          const text = row.original.description?.trim();
          if (!text) {
            return (
              <span className="block min-w-0 max-w-full truncate italic text-muted-foreground/80">
                —
              </span>
            );
          }
          return (
            <span className="block min-w-0 max-w-full truncate">{text}</span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Última actualización",
        meta: {
          cellClassName: "w-[22%] min-w-0 whitespace-nowrap overflow-hidden",
        },
        cell: ({ row }) => formatDateDdMmYyyyHhMm(row.original.updatedAt),
      },
      {
        id: "actions",
        meta: {
          align: "right",
          // Con table-fixed, w-[1%] del layout por defecto rompe la columna; ancho fijo para 2 iconos.
          cellClassName:
            "w-[9rem] min-w-[9rem] max-w-[9rem] overflow-visible pl-3 pr-4 md:pl-4",
        },
        header: "Acciones",
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
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={services}
          isLoading={isLoading}
          tableClassName="table-fixed"
          searchPlaceholder="Buscar…"
          toolbarActions={
            <Button
              type="button"
              className="w-full shrink-0 min-[1440px]:w-auto"
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
      </div>

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        service={editing}
      />
    </TooltipProvider>
  );
}
