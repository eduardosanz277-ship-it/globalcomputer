"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import type { ContactMessageAdmin } from "@/modules/admin/contact-messages/contact-messages.types";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { DataTable } from "@/components/ui/data-table";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { ContactMessageDetailDrawer } from "./ContactMessageDetailDrawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  messages: ContactMessageAdmin[];
  isLoading?: boolean;
};

function createdAtSortMs(row: ContactMessageAdmin): number {
  const t = new Date(row.createdAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function truncateWithDots(text: string, max = 120): string {
  const value = text.trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

export function AdminContactsTable({ messages, isLoading = false }: Props) {
  const [selectedMessage, setSelectedMessage] =
    useState<ContactMessageAdmin | null>(null);

  const renderMobileRow = useCallback((row: Row<ContactMessageAdmin>) => {
    const item = row.original;
    const phone = item.phone?.trim();
    const relative = formatRelativeLastAccess(item.createdAt);
    const absolute = formatDateDdMmYyyyHhMm(item.createdAt);

    return (
      <li key={row.id}>
        <button
          type="button"
          className="relative block w-full min-w-0 rounded-xl border border-border/80 bg-card p-5 text-left text-card-foreground transition-shadow duration-200 hover:shadow-sm"
          onClick={() => setSelectedMessage(item)}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="truncate text-base font-semibold leading-snug tracking-tight text-foreground">
                {truncateWithDots(item.subject, 72)}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {truncateWithDots(item.message, 180)}
              </p>
            </div>

            <div className="space-y-1 border-t border-border/60 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contacto
              </p>
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="break-all text-sm text-muted-foreground">
                {item.email}
              </p>
              <p className="text-sm text-muted-foreground">
                {phone || <AdminTableEmptyEmDash />}
              </p>
            </div>

            <div className="space-y-1 border-t border-border/60 pt-4">
              <p className="text-sm text-muted-foreground">Fecha de envío</p>
              <p className="text-sm text-foreground">
                {relative != null ? relative : absolute}
              </p>
            </div>
          </div>
        </button>
      </li>
    );
  }, []);

  const columns = useMemo<ColumnDef<ContactMessageAdmin>[]>(
    () => [
      {
        id: "contact",
        accessorFn: (row) =>
          `${row.name} ${row.email} ${row.phone ?? ""} ${row.subject} ${row.message}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.name.localeCompare(rowB.original.name, "es", {
            sensitivity: "base",
          }),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Contacto"
            ariaLabelIdle="Ordenar por contacto"
            ariaLabelAsc="Ordenado de la A a la Z. Clic para invertir"
            ariaLabelDesc="Ordenado de la Z a la A. Clic para quitar orden"
          />
        ),
        meta: {
          cellClassName:
            "min-w-0 max-w-[min(26rem,52vw)] md:max-w-[min(20rem,32vw)]",
        },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {row.original.name}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        ),
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: "Teléfono",
        cell: ({ row }) => {
          const phone = row.original.phone?.trim();
          if (!phone) return <AdminTableEmptyEmDash />;
          return <span className="text-sm text-foreground">{phone}</span>;
        },
      },
      {
        id: "subject",
        accessorKey: "subject",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.subject.localeCompare(rowB.original.subject, "es", {
            sensitivity: "base",
          }),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Asunto"
            ariaLabelIdle="Ordenar por asunto"
            ariaLabelAsc="Ordenado de la A a la Z. Clic para invertir"
            ariaLabelDesc="Ordenado de la Z a la A. Clic para quitar orden"
          />
        ),
        meta: { cellClassName: "max-w-[min(15rem,26vw)]" },
        cell: ({ row }) => (
          <span className="block truncate text-sm text-foreground">
            {row.original.subject}
          </span>
        ),
      },
      {
        id: "message",
        accessorKey: "message",
        header: "Mensaje",
        meta: { cellClassName: "max-w-[min(24rem,40vw)]" },
        cell: ({ row }) => (
          <p className="truncate text-sm text-muted-foreground">
            {truncateWithDots(row.original.message)}
          </p>
        ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          createdAtSortMs(rowA.original) - createdAtSortMs(rowB.original),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Fecha"
            ariaLabelIdle="Ordenar por fecha"
            ariaLabelAsc="Más antiguo primero. Clic para invertir"
            ariaLabelDesc="Más reciente primero. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => {
          const raw = row.original.createdAt;
          const relative = formatRelativeLastAccess(raw);
          const absolute = formatDateDdMmYyyyHhMm(raw);
          if (relative == null) {
            return (
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                {absolute}
              </span>
            );
          }
          return (
            <TooltipProvider delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help whitespace-nowrap text-sm text-muted-foreground">
                    {relative}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
                >
                  <span className="block font-medium">Fecha de envío</span>
                  <span className="mt-0.5 block text-muted-foreground">
                    {absolute}
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
    ],
    [],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={messages}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder="Buscar por nombre, correo, asunto o mensaje…"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() => "hover:bg-muted/50 transition-colors duration-150"}
        onRowClick={(row) => setSelectedMessage(row)}
        renderMobileRow={renderMobileRow}
      />
      <ContactMessageDetailDrawer
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
      />
    </>
  );
}
