"use client";

import { useCallback, useMemo, useState } from "react";
import type { FaqAdmin } from "@/modules/admin/faqs/faqs.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
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
import { FaqProfileCard } from "@/components/dashboard/faq-profile-card";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  faqs: FaqAdmin[];
  isLoading?: boolean;
};

const QUESTION_COLUMN_CLASS =
  "min-w-[16rem] w-[min(40rem,56vw)] max-w-[min(40rem,56vw)]";
const STATUS_COLUMN_CLASS = "w-[8.5rem] min-w-[8.5rem] max-w-[8.5rem]";
const UPDATED_AT_COLUMN_CLASS = "w-[13rem] min-w-[13rem] max-w-[13rem]";
const ACTIONS_COLUMN_CLASS = "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]";

function updatedAtSortMs(row: FaqAdmin): number {
  const t = new Date(row.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function localizedQuestion(row: FaqAdmin, locale: string): string {
  const english = row.questionEn.trim();
  return locale === "en" && english ? english : row.question;
}

function localizedAnswer(row: FaqAdmin, locale: string): string {
  const english = row.answerEn.trim();
  return locale === "en" && english ? english : row.answer;
}

function RowActions({
  row,
  questionText,
  onEdit,
  t,
}: {
  row: FaqAdmin;
  questionText: string;
  onEdit: () => void;
  t: (key: string) => string;
}) {
  const router = useRouter();
  const { executeAsync, isPending } = useServerAction(deleteFaqAdminAction, {
    successMessage: t("admin.faqs.toast.deleted"),
    errorMessage: t("admin.faqs.toast.deleteError"),
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: t("admin.faqs.confirm.deleteTitle"),
      html: `${t("admin.faqs.confirm.deleteMessagePrefix")} <strong>${questionText}</strong>.`,
      confirmButtonText: t("admin.faqs.confirm.deleteConfirm"),
      cancelButtonText: t("admin.faqs.form.cancel"),
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
      deletingLabel={t("admin.faqs.menu.deleting")}
      deleteLabel={t("admin.faqs.menu.delete")}
    />
  );
}

export function AdminFaqsTable({ faqs, isLoading = false }: Props) {
  const { t, locale } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FaqAdmin | null>(null);

  const renderMobileRow = useCallback(
    (row: Row<FaqAdmin>) => {
      const r = row.original;
      return (
        <li key={row.id}>
          <FaqProfileCard
            question={localizedQuestion(r, locale)}
            answer={localizedAnswer(r, locale)}
            active={r.active}
            updatedAt={r.updatedAt}
            className="hover:bg-muted/50 transition-colors duration-150"
            actions={
              <RowActions
                row={r}
                questionText={localizedQuestion(r, locale)}
                t={t}
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
    [locale, t],
  );

  const columns = useMemo<ColumnDef<FaqAdmin>[]>(
    () => [
      {
        id: "question",
        accessorFn: (row) =>
          `${row.question} ${row.questionEn} ${row.answer} ${row.answerEn}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          localizedQuestion(rowA.original, locale).localeCompare(
            localizedQuestion(rowB.original, locale),
            locale,
            {
              sensitivity: "base",
            },
          ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.faqs.table.question")}
            ariaLabelIdle={t("admin.faqs.table.questionSortIdle")}
            ariaLabelAsc={t("admin.faqs.table.questionSortAsc")}
            ariaLabelDesc={t("admin.faqs.table.questionSortDesc")}
          />
        ),
        meta: {
          cellClassName: QUESTION_COLUMN_CLASS,
        },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {localizedQuestion(row.original, locale)}
            </p>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {localizedAnswer(row.original, locale)}
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
            label={t("admin.faqs.table.status")}
            ariaLabelIdle={t("admin.faqs.table.statusSortIdle")}
            ariaLabelAsc={t("admin.faqs.table.statusSortAsc")}
            ariaLabelDesc={t("admin.faqs.table.statusSortDesc")}
          />
        ),
        meta: { cellClassName: STATUS_COLUMN_CLASS },
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              row.original.active
                ? "border border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:text-emerald-200"
                : "border border-border bg-muted text-muted-foreground",
            )}
          >
            {row.original.active
              ? t("admin.faqs.table.statusActive")
              : t("admin.faqs.table.statusInactive")}
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
            label={t("admin.faqs.table.updatedAt")}
            ariaLabelIdle={t("admin.faqs.table.updatedAtSortIdle")}
            ariaLabelAsc={t("admin.faqs.table.updatedAtSortAsc")}
            ariaLabelDesc={t("admin.faqs.table.updatedAtSortDesc")}
          />
        ),
        meta: { cellClassName: UPDATED_AT_COLUMN_CLASS },
        cell: ({ row }) => {
          const raw = row.original.updatedAt;
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
                    {t("admin.faqs.table.updatedTooltip")}
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
      {
        id: "actions",
        meta: { align: "right", cellClassName: ACTIONS_COLUMN_CLASS },
        header: () => <span className="sr-only">{t("admin.faqs.table.actions")}</span>,
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            questionText={localizedQuestion(row.original, locale)}
            t={t}
            onEdit={() => {
              setEditing(row.original);
              setDialogOpen(true);
            }}
          />
        ),
      },
    ],
    [locale, t],
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={faqs}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder={t("admin.faqs.filters.searchPlaceholder")}
        tableClassName="table-fixed"
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
            className="h-9 w-full shrink-0 md:w-24"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t("admin.faqs.buttonNew")}
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
