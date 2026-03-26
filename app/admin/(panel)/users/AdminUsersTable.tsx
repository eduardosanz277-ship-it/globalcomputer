"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { AdminUser } from "@/modules/admin/users/users.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Select from "react-select";
import { appSelectStyles } from "@/components/ui/react-select-app-styles";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import {
  rejectBusinessRegistrationAction,
  deleteUserAction,
} from "./actions";
import { UserDetailDrawer } from "./UserDetailDrawer";
import type { UserRole } from "@/modules/auth/auth.types";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { cn } from "@/utils/cn";
import { UserProfileCard } from "@/components/dashboard/user-profile-card";
import { Eye, MoreVertical, Trash2, XCircle } from "lucide-react";

const ROLE_FILTER_OPTIONS = [
  { value: "all" as const, label: "Todos los roles" },
  { value: "CLIENT" as const, label: "Cliente" },
  { value: "BUSINESS" as const, label: "Empresa" },
] as const;

type RoleFilter = (typeof ROLE_FILTER_OPTIONS)[number]["value"];

interface Props {
  users: AdminUser[];
  isLoading?: boolean;
}

function userDisplayName(user: AdminUser): string {
  return user.fullName?.trim() || user.email?.trim() || "Sin nombre";
}

/** Valor estable para ordenar la columna Usuario (nombre + email, locale es). */
function userSortValue(u: AdminUser): string {
  return `${u.fullName ?? ""} ${u.email ?? ""}`
    .trim()
    .toLowerCase();
}

function userInitial(u: AdminUser): string {
  const name = u.fullName?.trim();
  if (name) return name.slice(0, 1).toUpperCase();
  const em = u.email?.trim();
  if (em) return em.slice(0, 1).toUpperCase();
  return "?";
}

/** Empresa → azul suave; resto → gris suave. */
function userAvatarClass(u: AdminUser): string {
  if (u.role === "BUSINESS") {
    return "bg-sky-50 text-sky-800 ring-1 ring-sky-200/70 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-800/60";
  }
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700/60";
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
    return "border border-blue-200/90 bg-blue-50 text-blue-800";
  }
  if (role === "CLIENT") {
    return "border border-slate-200/90 bg-slate-100 text-slate-700";
  }
  return "border border-violet-200/90 bg-violet-50 text-violet-800";
}

function roleLabel(role: UserRole): string {
  if (role === "BUSINESS") return "Empresa";
  if (role === "CLIENT") return "Cliente";
  if (role === "ADMIN") return "Administrador";
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const { execute: rejectBusiness, isPending: rejectingBusiness } =
    useServerAction(rejectBusinessRegistrationAction, {
      successMessage: "Solicitud de empresa rechazada.",
      errorMessage: "No se pudo rechazar la solicitud",
      onSuccess: () => {
        onDeleteSuccess();
        setOpen(false);
      },
      onSettled: () => router.refresh(),
    });

  const { execute: deleteUser, isPending: deletingUser } =
    useServerAction(deleteUserAction, {
      successMessage: "Usuario eliminado",
      errorMessage: "No se pudo eliminar el usuario",
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
      if (
        wrapRef.current?.contains(t) ||
        menuRef.current?.contains(t)
      ) {
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

  const handleDelete = async () => {
    if (isAdminUser) return;
    const label = user.fullName?.trim() || user.email || user.id;
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
    deleteUser(user.id);
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
          Ver detalles
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
              Rechazar solicitud
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
          {deletingUser ? "Eliminando…" : "Eliminar"}
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
        aria-label="Abrir menú de acciones"
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
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") return users;
    return users.filter((u) => u.role === (roleFilter as UserRole));
  }, [users, roleFilter]);

  const filterValue =
    ROLE_FILTER_OPTIONS.find((o) => o.value === roleFilter) ??
    ROLE_FILTER_OPTIONS[0];

  const renderMobileRow = useCallback((row: Row<AdminUser>) => {
    const u = row.original;
    return (
      <li key={row.id}>
        <UserProfileCard
          email={u.email ?? ""}
          fullName={u.fullName}
          role={u.role}
          lastSignInAt={u.lastSignInAt}
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
  }, []);

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: "user",
        accessorFn: (row) =>
          `${row.fullName ?? ""} ${row.email ?? ""}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          userSortValue(rowA.original).localeCompare(
            userSortValue(rowB.original),
            "es",
            { sensitivity: "base" },
          ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Usuario"
            ariaLabelIdle="Ordenar por usuario"
            ariaLabelAsc="Ordenado de la A a la Z. Clic para invertir"
            ariaLabelDesc="Ordenado de la Z a la A. Clic para quitar orden"
          />
        ),
        meta: {
          cellClassName:
            "min-w-0 max-w-[min(28rem,50vw)] md:max-w-[min(22rem,40vw)]",
        },
        cell: ({ row }) => {
          const u = row.original;
          const name = userDisplayName(u);
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
        header: "Rol",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              roleBadgeClass(row.original.role),
            )}
          >
            {roleLabel(row.original.role)}
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
            label="Último acceso"
            ariaLabelIdle="Ordenar por último acceso"
            ariaLabelAsc="Más antiguo primero. Clic para invertir"
            ariaLabelDesc="Más reciente primero. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => {
          const raw = row.original.lastSignInAt;
          if (!raw) {
            return <AdminTableEmptyEmDash />;
          }
          const absolute = formatDateDdMmYyyyHhMm(raw);
          return (
            <span className="text-sm text-muted-foreground">{absolute}</span>
          );
        },
      },
      {
        id: "actions",
        meta: { align: "right", cellClassName: "w-[4.5rem]" },
        header: () => <span className="sr-only">Acciones</span>,
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
    [],
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder="Buscar por nombre o email…"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
        renderMobileRow={renderMobileRow}
        toolbarFilters={
          <div className="w-full min-w-0 min-[1440px]:max-w-[13rem]">
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
              styles={appSelectStyles}
              className="w-full"
            />
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
