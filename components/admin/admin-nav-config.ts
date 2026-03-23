import type { LucideIcon } from "lucide-react";
import { Users } from "lucide-react";

export type AdminNavSubItem = {
  href: string;
  label: string;
};

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Submenú opcional (acordeón en el lateral) */
  children?: AdminNavSubItem[];
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/users", label: "Usuarios", icon: Users },
];
