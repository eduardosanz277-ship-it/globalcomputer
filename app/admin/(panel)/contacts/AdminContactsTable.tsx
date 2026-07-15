"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import Select from "react-select";
import { FilterX } from "lucide-react";
import {
  CONTACT_NOTIFICATIONS_REFRESH_EVENT,
  type ContactMessageAdmin,
} from "@/modules/admin/contact-messages/contact-messages.types";
import { markContactMessageReadAdminAction } from "@/modules/admin/contact-messages/actions";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
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
import { useServerAction } from "@/hooks/use-server-action";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import { cn } from "@/utils/cn";

type Props = {
  messages: ContactMessageAdmin[];
  isLoading?: boolean;
};

type ReadFilter = "all" | "unread" | "read";

const CONTACT_COLUMN_CLASS =
  "min-w-[16rem] max-w-[min(26rem,42vw)] md:max-w-[min(22rem,36vw)]";
const PHONE_COLUMN_CLASS = "w-[9rem] min-w-[9rem] max-w-[9rem]";
const SUBJECT_COLUMN_CLASS = "w-[12rem] min-w-[12rem] max-w-[12rem]";
const MESSAGE_COLUMN_CLASS = "w-[18rem] min-w-[18rem] max-w-[18rem]";
const STATUS_COLUMN_CLASS = "w-[8.75rem] min-w-[8.75rem] max-w-[8.75rem]";
const CREATED_AT_COLUMN_CLASS = "w-[12.75rem] min-w-[12.75rem] max-w-[12.75rem]";
/** Ancho fijo ≥1440px: texto de la opción inicial + margen para padding e indicador (`ch`). */
const STATUS_FILTER_WIDE_CH = "Todos los estados".length + 7;

function createdAtSortMs(row: ContactMessageAdmin): number {
  const t = new Date(row.createdAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function truncateWithDots(text: string, max = 120): string {
  const value = text.trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function readBadgeClass(isRead: boolean): string {
  if (!isRead) {
    return "border border-amber-200/90 bg-amber-50 text-amber-900";
  }
  return "border border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:text-emerald-200";
}

const readStatusBadgeBaseClass =
  "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium";

export function AdminContactsTable({ messages, isLoading = false }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [selectedMessage, setSelectedMessage] =
    useState<ContactMessageAdmin | null>(null);
  const [optimisticReadIds, setOptimisticReadIds] = useState<
    Record<string, true>
  >({});
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const openedQueryMessageIdRef = useRef<string | null>(null);

  const { executeAsync: executeMarkRead } = useServerAction(
    markContactMessageReadAdminAction,
    {
      errorMessage: t("admin.contacts.toast.markReadError"),
    },
  );

  useEffect(() => {
    setOptimisticReadIds((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        const row = messages.find((m) => m.id === id);
        if (!row || row.isRead) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [messages]);

  const isMessageRead = useCallback(
    (message: ContactMessageAdmin) =>
      message.isRead || Boolean(optimisticReadIds[message.id]),
    [optimisticReadIds],
  );

  const displayMessages = useMemo(
    () =>
      messages.map((message) =>
        isMessageRead(message) && !message.isRead
          ? { ...message, isRead: true }
          : message,
      ),
    [messages, isMessageRead],
  );

  const readFilterOptions = useMemo(
    () =>
      [
        {
          value: "all" as const,
          label: t("admin.contacts.filters.all"),
        },
        {
          value: "unread" as const,
          label: t("admin.contacts.status.unread"),
        },
        {
          value: "read" as const,
          label: t("admin.contacts.status.read"),
        },
      ] as const,
    [t],
  );

  const filteredMessages = useMemo(() => {
    if (readFilter === "all") return displayMessages;
    if (readFilter === "unread") {
      return displayMessages.filter((m) => !m.isRead);
    }
    return displayMessages.filter((m) => m.isRead);
  }, [displayMessages, readFilter]);

  const filterValue =
    readFilterOptions.find((o) => o.value === readFilter) ??
    readFilterOptions[0];

  const openMessage = useCallback(
    (item: ContactMessageAdmin) => {
      const alreadyRead = isMessageRead(item);
      setSelectedMessage(
        alreadyRead ? item : { ...item, isRead: true, readAt: item.readAt },
      );
      if (alreadyRead) return;

      setOptimisticReadIds((prev) => ({ ...prev, [item.id]: true }));
      void executeMarkRead(item.id)
        .then(() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new Event(CONTACT_NOTIFICATIONS_REFRESH_EVENT),
            );
          }
          startTransition(() => {
            router.refresh();
          });
        })
        .catch(() => {
          setOptimisticReadIds((prev) => {
            const next = { ...prev };
            delete next[item.id];
            return next;
          });
        });
    },
    [executeMarkRead, isMessageRead, router, startTransition],
  );

  const messageIdFromQuery = searchParams.get("message");

  useEffect(() => {
    if (!messageIdFromQuery) {
      openedQueryMessageIdRef.current = null;
      return;
    }
    if (isLoading || messages.length === 0) return;
    if (openedQueryMessageIdRef.current === messageIdFromQuery) return;

    const found = messages.find((m) => m.id === messageIdFromQuery);
    openedQueryMessageIdRef.current = messageIdFromQuery;

    if (found) {
      openMessage(found);
    }

    router.replace("/admin/contacts", { scroll: false });
  }, [isLoading, messageIdFromQuery, messages, openMessage, router]);

  const renderMobileRow = useCallback(
    (row: Row<ContactMessageAdmin>) => {
      const item = row.original;
      const phone = item.phone?.trim();
      const relative = formatRelativeLastAccess(item.createdAt, locale);
      const absolute = formatDateDdMmYyyyHhMm(item.createdAt, locale).replace(
        ", ",
        " ",
      );
      const unread = !item.isRead;

      return (
        <li key={row.id}>
          <button
            type="button"
            className={cn(
              "relative block w-full min-w-0 rounded-xl border border-border/80 bg-card p-5 text-left text-card-foreground transition-shadow duration-200 hover:shadow-sm",
              unread && "border-amber-200/80 bg-amber-50/40",
            )}
            onClick={() => openMessage(item)}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <h3
                    className={cn(
                      "truncate text-base leading-snug tracking-tight text-foreground",
                      unread ? "font-bold" : "font-semibold",
                    )}
                  >
                    {truncateWithDots(item.subject, 72)}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {truncateWithDots(item.message, 180)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0",
                    readStatusBadgeBaseClass,
                    readBadgeClass(item.isRead),
                  )}
                >
                  {unread
                    ? t("admin.contacts.status.unread")
                    : t("admin.contacts.status.read")}
                </span>
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
    [locale, openMessage, t],
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
          return (
            <span className="whitespace-nowrap text-sm text-foreground">
              {phone}
            </span>
          );
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
        id: "status",
        accessorFn: (row) => (row.isRead ? 1 : 0),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          Number(rowA.original.isRead) - Number(rowB.original.isRead),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.contacts.table.status")}
            ariaLabelIdle={t("admin.contacts.table.statusSortIdle")}
            ariaLabelAsc={t("admin.contacts.table.statusSortAsc")}
            ariaLabelDesc={t("admin.contacts.table.statusSortDesc")}
          />
        ),
        meta: { cellClassName: STATUS_COLUMN_CLASS },
        cell: ({ row }) => (
          <span
            className={cn(
              readStatusBadgeBaseClass,
              readBadgeClass(row.original.isRead),
            )}
          >
            {row.original.isRead
              ? t("admin.contacts.status.read")
              : t("admin.contacts.status.unread")}
          </span>
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
          const absolute = formatDateDdMmYyyyHhMm(raw, locale).replace(
            ", ",
            " ",
          );
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

  const toolbarFilters = useMemo(
    () => (
      <div className="flex w-full min-w-0 items-center gap-2">
        <div
          className={cn(
            "min-w-0 flex-1",
            "min-[1440px]:box-border min-[1440px]:w-[var(--contacts-status-filter-w)] min-[1440px]:min-w-[var(--contacts-status-filter-w)] min-[1440px]:max-w-[var(--contacts-status-filter-w)] min-[1440px]:flex-none min-[1440px]:shrink-0",
          )}
          style={
            {
              ["--contacts-status-filter-w" as string]: `${STATUS_FILTER_WIDE_CH}ch`,
            } as CSSProperties
          }
        >
          <Select<(typeof readFilterOptions)[number], false>
            instanceId="contacts-read-filter"
            inputId="contacts-read-filter-input"
            aria-label={t("admin.contacts.filters.statusAria")}
            isSearchable={false}
            isClearable={false}
            options={[...readFilterOptions]}
            value={filterValue}
            onChange={(opt) => {
              if (opt) setReadFilter(opt.value);
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
          disabled={readFilter === "all"}
          onClick={() => setReadFilter("all")}
          title={t("admin.contacts.filters.clear")}
          aria-label={t("admin.contacts.filters.clearAria")}
        >
          <FilterX className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    ),
    [filterValue, readFilter, readFilterOptions, t],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredMessages}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder={t("admin.contacts.filters.searchPlaceholder")}
        toolbarFilters={toolbarFilters}
        tableClassName="table-fixed"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={(row) =>
          cn(
            "hover:bg-muted/50 transition-colors duration-150",
            !row.isRead && "bg-amber-50/30",
          )
        }
        onRowClick={(row) => openMessage(row)}
        renderMobileRow={renderMobileRow}
      />
      <ContactMessageDetailDrawer
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
      />
    </>
  );
}
