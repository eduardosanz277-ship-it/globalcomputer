"use client";

import { useMemo, useState } from "react";
import type { FaqAdmin } from "@/modules/admin/faqs/faqs.types";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteFaqAdminAction } from "./actions";
import { FaqFormDialog } from "./FaqFormDialog";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { cn } from "@/utils/cn";

type Props = {
  faqs: FaqAdmin[];
  isLoading?: boolean;
};

function updatedAtSortMs(row: FaqAdmin): number {
  const t = new Date(row.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function answerExcerpt(answer: string): string {
  const text = answer.trim();
  if (text.length <= 120) return text;
  return `${text.slice(0, 119)}…`;
}

function RowActions({ row, onEdit }: { row: FaqAdmin; onEdit: () => void }) {
  const router = useRouter();
  const { executeAsync, isPending } = useServerAction(deleteFaqAdminAction, {
    successMessage: "Pregunta frecuente eliminada",
    errorMessage: "No se pudo eliminar la pregunta frecuente",
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: "¿Eliminar pregunta frecuente?",
      html: `Se eliminará: <strong>${row.question}</strong>.`,
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

export function AdminFaqsTable({ faqs, isLoading = false }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FaqAdmin | null>(null);

  const columns = useMemo<ColumnDef<FaqAdmin>[]>(
    () => [
      {
        id: "question",
        accessorFn: (row) => `${row.question} ${row.answer}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.question.localeCompare(rowB.original.question, "es", {
            sensitivity: "base",
          }),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Pregunta"
            ariaLabelIdle="Ordenar por pregunta"
            ariaLabelAsc="Ordenado de la A a la Z. Clic para invertir"
            ariaLabelDesc="Ordenado de la Z a la A. Clic para quitar orden"
          />
        ),
        meta: {
          cellClassName:
            "min-w-0 max-w-[min(42rem,85vw)] md:max-w-[min(34rem,58vw)]",
        },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {row.original.question}
            </p>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {answerExcerpt(row.original.answer)}
            </p>
          </div>
        ),
      },
      {
        id: "active",
        accessorKey: "active",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          Number(rowB.original.active) - Number(rowA.original.active),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Estado"
            ariaLabelIdle="Ordenar por estado"
            ariaLabelAsc="Inactivas primero. Clic para invertir"
            ariaLabelDesc="Activas primero. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              row.original.active
                ? "border border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:text-emerald-200"
                : "border border-border bg-muted text-muted-foreground",
            )}
          >
            {row.original.active ? "Activa" : "Inactiva"}
          </span>
        ),
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
            label="Actualizada"
            ariaLabelIdle="Ordenar por última actualización"
            ariaLabelAsc="Más antiguo primero. Clic para invertir"
            ariaLabelDesc="Más reciente primero. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.updatedAt).toLocaleDateString("es-ES")}
          </span>
        ),
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
        data={faqs}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder="Buscar por pregunta o respuesta…"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
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
            Nueva
          </Button>
        }
      />

      <FaqFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        faq={editing}
      />
    </div>
  );
}
