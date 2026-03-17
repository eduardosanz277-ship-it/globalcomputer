"use client";

import type { AdminUser } from "@/modules/admin/users/users.types";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { updateUserRoleAction } from "./actions";

interface Props {
  users: AdminUser[];
}

const columns: ColumnDef<AdminUser>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "fullName", header: "Nombre" },
  { accessorKey: "role", header: "Rol" },
  {
    accessorKey: "createdAt",
    header: "Creado",
    cell: ({ row }) => {
      const v = row.original.createdAt;
      return v ? new Date(v).toLocaleString() : "-";
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => <RowActions user={row.original} />,
  },
];

function RowActions({ user }: { user: AdminUser }) {
  const { execute: setUser, isPending } = useServerAction(
    (role: "USER" | "ADMIN") => updateUserRoleAction(user.id, role),
    {
      successMessage: "Rol actualizado",
      errorMessage: "No se pudo actualizar el rol",
    }
  );

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={user.role === "USER" ? "default" : "outline"}
        disabled={isPending}
        onClick={() => setUser("USER")}
      >
        USER
      </Button>
      <Button
        size="sm"
        variant={user.role === "ADMIN" ? "default" : "outline"}
        disabled={isPending}
        onClick={() => setUser("ADMIN")}
      >
        ADMIN
      </Button>
    </div>
  );
}

export function AdminUsersTable({ users }: Props) {
  return <DataTable columns={columns} data={users} />;
}

