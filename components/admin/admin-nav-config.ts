import type { LucideIcon } from "lucide-react";
import {
  House,
  Layers,
  ListChecks,
  ListTodo,
  Settings,
  Tag,
  Users,
} from "lucide-react";

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
  { href: "/admin/home", label: "Home", icon: House },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/brands", label: "Marcas", icon: Tag },
  {
    href: "/admin/brand-types",
    label: "Tipos por marca",
    icon: Layers,
  },
  {
    href: "/admin/general-characteristics",
    label: "Características generales",
    icon: ListChecks,
  },
  {
    href: "/admin/specific-characteristics",
    label: "Características específicas",
    icon: ListTodo,
  },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];
