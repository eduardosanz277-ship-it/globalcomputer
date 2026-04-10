import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  House,
  BriefcaseBusiness,
  FolderTree,
  Layers,
  ListChecks,
  ListTodo,
  Package,
  Settings,
  Shapes,
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
  { href: "/admin/brands", label: "Marcas", icon: Tag },
  {
    href: "/admin/brand-types",
    label: "Tipos por marca",
    icon: Shapes,
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
  {
    href: "/admin/categories",
    label: "Categorías",
    icon: FolderTree,
  },
  {
    href: "/admin/subcategories",
    label: "Subcategorías",
    icon: Layers,
  },
  {
    href: "/admin/services",
    label: "Servicios",
    icon: BriefcaseBusiness,
  },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  {
    href: "/admin/suscripciones-empresas",
    label: "Suscripciones de Empresas",
    icon: BadgeCheck,
  },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];
