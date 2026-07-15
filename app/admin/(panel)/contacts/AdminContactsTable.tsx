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
import { useI18n } from "@/components/i18n/I18nProvider";
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

const CONTACT_COLUMN_CLASS =
  "min-w-[16rem] max-w-[min(26rem,42vw)] md:max-w-[min(22rem,36vw)]";
const PHONE_COLUMN_CLASS = "w-[9rem] min-w-[9rem] max-w-[9rem]";
const SUBJECT_COLUMN_CLASS = "w-[12rem] min-w-[12rem] max-w-[12rem]";
const MESSAGE_COLUMN_CLASS = "w-[18rem] min-w-[18rem] max-w-[18rem]";
const CREATED_AT_COLUMN_CLASS = "w-[12.75rem] min-w-[12.75rem] max-w-[12.75rem]";

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
  const { t, locale } = useI18n();
  const [selectedMessage, setSelectedMessage] =
    useState<ContactMessageAdmin | null>(null);

  const renderMobileRow = useCallback(
    (row: Row<ContactMessageAdmin>) => {
      const item = row.original;
      const phone = item.phone?.trim();
      const relative = formatRelativeLastAccess(item.createdAt, locale);
      const absolute = formatDateDdMmYyyyHhMm(item.createdAt, locale).replace(
        ", ",
        " ",
      );

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
                  {t("admin.contacts.table.contact")}
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
                <p className="text-sm text-muted-foreground">
                  {t("admin.contacts.table.sentAt")}
                </p>
                <p className="text-sm text-foreground">
                  {relative != null ? relative : absolute}
                </p>
              </div>
            </div>
          </button>
        </li>
      );
    },
    [locale, t],
  );

  const columns = useMemo<ColumnDef<ContactMessageAdmin>[]>(
    () => [
      {
        id: "contact",
        accessorFn: (row) =>
          `${row.name} ${row.email} ${row.phone ?? ""} ${row.subject} ${row.message}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.name.localeCompare(rowB.original.name, locale, {
            sensitivity: "base",
          }),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.contacts.table.contact")}
            ariaLabelIdle={t("admin.contacts.table.contactSortIdle")}
            ariaLabelAsc={t("admin.contacts.table.contactSortAsc")}
            ariaLabelDesc={t("admin.contacts.table.contactSortDesc")}
          />
        ),
        meta: {
          cellClassName: CONTACT_COLUMN_CLASS,
        },
        cell: ({ row }) => {
          const unread = !row.original.isRead;
          return (
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate text-base text-foreground",
                  unread ? "font-bold" : "font-semibold",
                )}
              >
                {row.original.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {row.original.email}
              </p>
            </div>
          );
        },
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: t("admin.contacts.table.phone"),
        meta: { cellClassName: PHONE_COLUMN_CLASS },
        cell: ({ row }) => {
          const phone = row.original.phone?.trim();
          if (!phone) return <AdminTableEmptyEmDash />;
          return <span className="text-sm text-foreground whitespace-nowrap">{phone}</span>;
        },
      },
      {
        id: "subject",
        accessorKey: "subject",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.subject.localeCompare(rowB.original.subject, locale, {
            sensitivity: "base",
          }),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.contacts.table.subject")}
            ariaLabelIdle={t("admin.contacts.table.subjectSortIdle")}
            ariaLabelAsc={t("admin.contacts.table.subjectSortAsc")}
            ariaLabelDesc={t("admin.contacts.table.subjectSortDesc")}
          />
        ),
        meta: { cellClassName: SUBJECT_COLUMN_CLASS },
        cell: ({ row }) => (
          <span
            className={cn(
              "block truncate text-sm text-foreground",
              !row.original.isRead ? "font-semibold" : "font-medium",
            )}
          >
            {row.original.subject}
          </span>
        ),
      },
      {
        id: "message",
        accessorKey: "message",
        header: t("admin.contacts.table.message"),
        meta: { cellClassName: MESSAGE_COLUMN_CLASS },
        cell: ({ row }) => (
          <p className="truncate text-sm text-foreground">
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
            label={t("admin.contacts.table.date")}
            ariaLabelIdle={t("admin.contacts.table.dateSortIdle")}
            ariaLabelAsc={t("admin.contacts.table.dateSortAsc")}
            ariaLabelDesc={t("admin.contacts.table.dateSortDesc")}
          />
        ),
        meta: { cellClassName: CREATED_AT_COLUMN_CLASS },
        cell: ({ row }) => {
          const raw = row.original.createdAt;
          const relative = formatRelativeLastAccess(raw, locale);
          const absolute = formatDateDdMmYyyyHhMm(raw, locale).replace(", ", " ");
          if (relative == null) {
            return (
              <span className="whitespace-nowrap tabular-nums text-sm text-muted-foreground">
                {absolute}
              </span>
            );
          }
          return (
            <TooltipProvider delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help whitespace-nowrap tabular-nums text-sm text-muted-foreground">
                    {relative}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
                >
                  <span className="block font-medium">
                    {t("admin.contacts.table.sentAt")}
                  </span>
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
    [locale, t],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={messages}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder={t("admin.contacts.filters.searchPlaceholder")}
        tableClassName="table-fixed"
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
