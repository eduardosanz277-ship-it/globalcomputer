import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CircleHelp,
  House,
  BriefcaseBusiness,
  FolderTree,
  Layers,
  ListChecks,
  ListOrdered,
  ListTodo,
  MessageSquare,
  MessageSquareText,
  Package,
  Settings,
  Shapes,
  Tag,
  Users,
} from "lucide-react";

export type AdminNavSubItem = {
  href: string;
  labelKey: string;
};

export type AdminNavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** Submenú opcional (acordeón en el lateral) */
  children?: AdminNavSubItem[];
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/home", labelKey: "admin.menu.home", icon: House },
  { href: "/admin/products", labelKey: "admin.menu.products", icon: Package },
  {
    href: "/admin/categories",
    labelKey: "admin.menu.categories",
    icon: FolderTree,
  },
  {
    href: "/admin/subcategories",
    labelKey: "admin.menu.subcategories",
    icon: Layers,
  },
  { href: "/admin/brands", labelKey: "admin.menu.brands", icon: Tag },
  {
    href: "/admin/brand-types",
    labelKey: "admin.menu.brandTypes",
    icon: Shapes,
  },
  {
    href: "/admin/general-characteristics",
    labelKey: "admin.menu.generalCharacteristics",
    icon: ListChecks,
  },
  {
    href: "/admin/specific-characteristics",
    labelKey: "admin.menu.specificCharacteristics",
    icon: ListTodo,
  },
  { href: "/admin/orders", labelKey: "admin.menu.orders", icon: ListOrdered },
  {
    href: "/admin/suscripciones-empresas",
    labelKey: "admin.menu.businessSubscriptions",
    icon: BadgeCheck,
  },
  { href: "/admin/users", labelKey: "admin.menu.users", icon: Users },
  {
    href: "/admin/contacts",
    labelKey: "admin.menu.contactMessages",
    icon: MessageSquareText,
  },
  {
    href: "/admin/faqs",
    labelKey: "admin.menu.faqs",
    icon: CircleHelp,
  },
  {
    href: "/admin/services",
    labelKey: "admin.menu.services",
    icon: BriefcaseBusiness,
  },
  { href: "/admin/settings", labelKey: "admin.menu.settings", icon: Settings },
];
