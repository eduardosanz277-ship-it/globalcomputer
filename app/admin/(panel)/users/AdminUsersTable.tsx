"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import type { AdminUser } from "@/modules/admin/users/users.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import Select from "react-select";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useServerAction } from "@/hooks/use-server-action";
import { rejectBusinessRegistrationAction, deleteUserAction } from "./actions";
import { UserDetailDrawer } from "./UserDetailDrawer";
import type { UserRole } from "@/modules/auth/auth.types";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { cn } from "@/utils/cn";
import { UserProfileCard } from "@/components/dashboard/user-profile-card";
import { Eye, FilterX, MoreVertical, Trash2, XCircle } from "lucide-react";
const ROLE_FILTER_VALUES = ["all", "CLIENT", "BUSINESS"] as const;

/** Ancho fijo ≥1440px: texto de la opción inicial + margen para padding e indicador (`ch`). */
const ROLE_FILTER_WIDE_CH = "Todos los roles".length + 7;
const USER_COLUMN_CLASS =
  "min-w-[16.5rem] max-w-[min(28rem,42vw)] md:max-w-[min(23rem,36vw)]";
const ROLE_COLUMN_CLASS = "w-[8.75rem] min-w-[8.75rem] max-w-[8.75rem]";
const LAST_SIGN_IN_COLUMN_CLASS = "w-[12.75rem] min-w-[12.75rem] max-w-[12.75rem]";
const ACTIONS_COLUMN_CLASS = "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]";

type RoleFilter = (typeof ROLE_FILTER_VALUES)[number];

interface Props {
  users: AdminUser[];
  isLoading?: boolean;
}

function userDisplayName(user: AdminUser, t: (key: string) => string): string {
  return user.fullName?.trim() || user.email?.trim() || t("admin.users.table.noName");
}

/** Valor estable para ordenar la columna Usuario (nombre + email, locale es). */
function userSortValue(u: AdminUser): string {
  return `${u.fullName ?? ""} ${u.email ?? ""}`.trim().toLowerCase();
}

function userInitial(u: AdminUser): string {
  const name = u.fullName?.trim();
  if (name) return name.slice(0, 1).toUpperCase();
  const em = u.email?.trim();
  if (em) return em.slice(0, 1).toUpperCase();
  return "?";
}

/** Empresa → azul marca; resto → gris marca. */
function userAvatarClass(u: AdminUser): string {
  if (u.role === "BUSINESS") {
    return "bg-primary/15 text-primary ring-1 ring-primary/25";
  }
  return "bg-muted text-muted-foreground ring-1 ring-border";
}

/** Timestamp en ms para ordenar por último acceso; null = sin dato (queda al final). */
function lastSignInTimestampMs(u: AdminUser): number | null {
  const raw = u.lastSignInAt;
  if (raw == null) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

function roleBadgeClass(role: UserRole): string {
  if (role === "BUSINESS") {
    return "border border-primary/25 bg-primary/10 text-primary";
  }
  if (role === "CLIENT") {
    return "border border-border bg-muted text-muted-foreground";
  }
  return "border border-secondary/35 bg-secondary/10 text-secondary";
}

function roleLabel(role: UserRole, t: (key: string) => string): string {
  if (role === "BUSINESS") return t("admin.users.roles.business");
  if (role === "CLIENT") return t("admin.users.roles.client");
  if (role === "ADMIN") return t("admin.users.roles.admin");
  return role;
}

const MENU_MIN_WIDTH_PX = 208; // 13rem

function UsersRowActionsMenu({
  user,
  onViewDetail,
  onDeleteSuccess,
}: {
  user: AdminUser;
  onViewDetail: () => void;
  onDeleteSuccess: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const { executeAsync: rejectBusinessAsync, isPending: rejectingBusiness } =
    useServerAction(rejectBusinessRegistrationAction, {
      successMessage: t("admin.users.toast.rejected"),
      errorMessage: t("admin.users.toast.rejectError"),
      onSuccess: () => {
        onDeleteSuccess();
        setOpen(false);
      },
      onSettled: () => router.refresh(),
    });

  const { executeAsync: deleteUserAsync, isPending: deletingUser } =
    useServerAction(deleteUserAction, {
      successMessage: t("admin.users.toast.deleted"),
      errorMessage: t("admin.users.toast.deleteError"),
      onSuccess: () => {
        onDeleteSuccess();
        setOpen(false);
      },
      onSettled: () => router.refresh(),
    });

  const isAdminUser = user.role === "ADMIN";
  const showReject =
    user.role === "BUSINESS" &&
    (user.businessRegistrationStatus === "approved" ||
      user.businessRegistrationStatus === "pending" ||
      user.businessRegistrationStatus == null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const left = Math.max(8, r.right - MENU_MIN_WIDTH_PX);
      setMenuPos({ top: r.bottom + 4, left });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  const handleReject = async () => {
    const label = user.fullName?.trim() || user.email || user.id;
    const wasApproved = user.businessRegistrationStatus === "approved";
    await swalSaasConfirmAsync({
      title: t("admin.users.confirm.rejectTitle"),
      html: wasApproved
        ? `${t("admin.users.confirm.rejectApprovedPrefix")} <strong>${label}</strong> ${t("admin.users.confirm.rejectApprovedSuffix")}`
        : `${t("admin.users.confirm.rejectPendingPrefix")} <strong>${label}</strong> ${t("admin.users.confirm.rejectPendingSuffix")}`,
      confirmButtonText: t("admin.users.confirm.rejectConfirm"),
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => rejectBusinessAsync(user.id),
    });
  };

  const handleDelete = async () => {
    if (isAdminUser) return;
    const label = user.fullName?.trim() || user.email || user.id;
    await swalSaasConfirmAsync({
      title: t("admin.users.confirm.deleteTitle"),
      html: `${t("admin.users.confirm.deleteMessagePrefix")} <strong>${label}</strong>. ${t("admin.users.confirm.deleteMessageSuffix")}`,
      confirmButtonText: t("admin.users.confirm.deleteConfirm"),
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => deleteUserAsync(user.id),
    });
  };

  const busy = rejectingBusiness || deletingUser;

  const menuContent =
    open && menuPos ? (
      <div
        ref={menuRef}
        className="fixed z-[100] min-w-[13rem] overflow-hidden rounded-lg border border-border/80 bg-popover py-1 shadow-lg ring-1 ring-black/5"
        style={{ top: menuPos.top, left: menuPos.left }}
        role="menu"
      >
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted/80"
          onClick={() => {
            onViewDetail();
            setOpen(false);
          }}
        >
          <Eye className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          {t("admin.users.menu.viewDetails")}
        </button>
        {showReject ? (
          <>
            <div className="my-1 h-px bg-border/70" role="separator" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-500/95 transition hover:bg-rose-50/90 dark:text-rose-400/90 dark:hover:bg-rose-950/30"
              disabled={busy}
              onClick={() => {
                void handleReject();
              }}
            >
              <XCircle className="h-4 w-4 shrink-0" aria-hidden />
              {t("admin.users.menu.rejectRequest")}
            </button>
          </>
        ) : null}
        <div className="my-1 h-px bg-border/70" role="separator" />
        <button
          type="button"
          role="menuitem"
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
            isAdminUser || busy
              ? "cursor-not-allowed text-muted-foreground/60"
              : "text-destructive hover:bg-destructive/10",
          )}
          disabled={isAdminUser || busy}
          onClick={() => {
            if (isAdminUser) return;
            void handleDelete();
          }}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          {deletingUser
            ? t("admin.users.menu.deleting")
            : t("admin.users.menu.delete")}
        </button>
      </div>
    ) : null;

  return (
    <div className="relative flex justify-end" ref={wrapRef}>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground md:rounded-md md:border md:border-border/80 md:bg-background md:hover:bg-muted/60"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("admin.users.menu.openActions")}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </Button>
      {typeof document !== "undefined" && menuContent
        ? createPortal(menuContent, document.body)
        : null}
    </div>
  );
}

export function AdminUsersTable({ users, isLoading = false }: Props) {
  const { t, locale } = useI18n();
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const roleFilterOptions = useMemo(
    () =>
      [
        { value: "all" as const, label: t("admin.users.filters.allRoles") },
        { value: "CLIENT" as const, label: t("admin.users.roles.client") },
        { value: "BUSINESS" as const, label: t("admin.users.roles.business") },
      ] as const,
    [t],
  );

  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") return users;
    return users.filter((u) => u.role === (roleFilter as UserRole));
  }, [users, roleFilter]);

  const filterValue =
    roleFilterOptions.find((o) => o.value === roleFilter) ??
    roleFilterOptions[0];

  const clearRoleFilter = useCallback(() => {
    setRoleFilter("all");
  }, []);

  /*
   * Botón "Nuevo" en la barra (acceso a /admin/suscripciones-empresas) — oculto temporalmente.
   * Para reactivarlo: importar `Plus` desde lucide-react, añadir `const router = useRouter();`
   * y pasar de nuevo `toolbarActions` al `DataTable`:
   *
   * toolbarActions={
   *   <Button
   *     type="button"
   *     className="h-9 w-full shrink-0 md:w-auto"
   *     onClick={() => router.push("/admin/suscripciones-empresas")}
   *     title="Gestionar solicitudes de registro de empresas"
   *   >
   *     <Plus className="mr-2 h-4 w-4" aria-hidden />
   *     Nuevo
   *   </Button>
   * }
   */

  const renderMobileRow = useCallback(
    (row: Row<AdminUser>) => {
      const u = row.original;
      return (
        <li key={row.id}>
          <UserProfileCard
            email={u.email ?? ""}
            fullName={u.fullName}
            role={u.role}
            lastSignInAt={u.lastSignInAt}
            locale={locale}
            className="hover:bg-muted/50 transition-colors duration-150"
            actions={
              <UsersRowActionsMenu
                user={u}
                onViewDetail={() => setDetailUserId(u.id)}
                onDeleteSuccess={() => {
                  setDetailUserId((current) =>
                    current === u.id ? null : current,
                  );
                }}
              />
            }
          />
        </li>
      );
    },
    [locale],
  );

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: "user",
        accessorFn: (row) => `${row.fullName ?? ""} ${row.email ?? ""}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          userSortValue(rowA.original).localeCompare(
            userSortValue(rowB.original),
            locale,
            { sensitivity: "base" },
          ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.users.table.user")}
            ariaLabelIdle={t("admin.users.table.userSortIdle")}
            ariaLabelAsc={t("admin.users.table.userSortAsc")}
            ariaLabelDesc={t("admin.users.table.userSortDesc")}
          />
        ),
        meta: {
          cellClassName: USER_COLUMN_CLASS,
        },
        cell: ({ row }) => {
          const u = row.original;
          const name = userDisplayName(u, t);
          const email = u.email?.trim();
          return (
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  userAvatarClass(u),
                )}
                aria-hidden
              >
                {userInitial(u)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">
                  {name}
                </p>
                {email ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {email}
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
        id: "role",
        accessorKey: "role",
        header: t("admin.users.table.role"),
        meta: {
          cellClassName: ROLE_COLUMN_CLASS,
        },
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              roleBadgeClass(row.original.role),
            )}
          >
            {roleLabel(row.original.role, t)}
          </span>
        ),
      },
      {
        id: "lastSignInAt",
        accessorKey: "lastSignInAt",
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = lastSignInTimestampMs(rowA.original);
          const b = lastSignInTimestampMs(rowB.original);
          if (a == null && b == null) return 0;
          if (a == null) return 1;
          if (b == null) return -1;
          return a - b;
        },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.users.table.lastSignIn")}
            ariaLabelIdle={t("admin.users.table.lastSignInSortIdle")}
            ariaLabelAsc={t("admin.users.table.lastSignInSortAsc")}
            ariaLabelDesc={t("admin.users.table.lastSignInSortDesc")}
          />
        ),
        meta: {
          cellClassName: LAST_SIGN_IN_COLUMN_CLASS,
        },
        cell: ({ row }) => {
          const raw = row.original.lastSignInAt;
          if (!raw) {
            return <AdminTableEmptyEmDash />;
          }
          const absolute = formatDateDdMmYyyyHhMm(raw, locale).replace(", ", " ");
          return <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">{absolute}</span>;
        },
      },
      {
        id: "actions",
        meta: { align: "right", cellClassName: ACTIONS_COLUMN_CLASS },
        header: () => <span className="sr-only">{t("admin.users.table.actions")}</span>,
        cell: ({ row }) => (
          <UsersRowActionsMenu
            user={row.original}
            onViewDetail={() => setDetailUserId(row.original.id)}
            onDeleteSuccess={() => {
              setDetailUserId((current) =>
                current === row.original.id ? null : current,
              );
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
        data={filteredUsers}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder={t("admin.users.filters.searchPlaceholder")}
        tableClassName="table-fixed"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
        renderMobileRow={renderMobileRow}
        toolbarFilters={
          <div className="flex w-full min-w-0 items-center gap-2">
            <div
              className={cn(
                "min-w-0 flex-1",
                "min-[1440px]:box-border min-[1440px]:w-[var(--users-role-filter-w)] min-[1440px]:min-w-[var(--users-role-filter-w)] min-[1440px]:max-w-[var(--users-role-filter-w)] min-[1440px]:flex-none min-[1440px]:shrink-0",
              )}
              style={
                {
                  ["--users-role-filter-w" as string]: `${ROLE_FILTER_WIDE_CH}ch`,
                } as CSSProperties
              }
            >
              <Select<(typeof roleFilterOptions)[number], false>
                instanceId="users-role-filter"
                inputId="users-role-filter-input"
                aria-label={t("admin.users.filters.roleAria")}
                isSearchable={false}
                isClearable={false}
                options={[...roleFilterOptions]}
                value={filterValue}
                onChange={(opt) => {
                  if (opt) setRoleFilter(opt.value);
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
              disabled={isLoading || roleFilter === "all"}
              onClick={clearRoleFilter}
              title={t("admin.users.filters.clear")}
              aria-label={t("admin.users.filters.clearRoleAria")}
            >
              <FilterX className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        }
      />
      <UserDetailDrawer
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />
    </div>
  );
}
