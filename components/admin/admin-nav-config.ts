import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CircleHelp,
  BriefcaseBusiness,
  FolderTree,
  LayoutDashboard,
  Layers,
  ListChecks,
  ListOrdered,
  ListTodo,
  MessageSquare,
  MessageSquareText,
  Package,
  Settings,
  Shapes,
  Star,
  Tag,
  Truck,
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

export type AdminNavGroup = {
  id: string;
  labelKey: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "home",
    labelKey: "admin.menu.groupHome",
    items: [
      {
        href: "/admin/home",
        labelKey: "admin.menu.home",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "catalog",
    labelKey: "admin.menu.groupCatalog",
    items: [
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
        labelKey: "admin.menu.characteristics",
        icon: ListChecks,
        children: [
          {
            href: "/admin/general-characteristics",
            labelKey: "admin.menu.generalCharacteristics",
          },
          {
            href: "/admin/specific-characteristics",
            labelKey: "admin.menu.specificCharacteristics",
          },
        ],
      },
    ],
  },
  {
    id: "sales",
    labelKey: "admin.menu.groupSales",
    items: [
      { href: "/admin/orders", labelKey: "admin.menu.orders", icon: ListOrdered },
    ],
  },
  {
    id: "users",
    labelKey: "admin.menu.groupUsers",
    items: [
      { href: "/admin/users", labelKey: "admin.menu.users", icon: Users },
      {
        href: "/admin/suscripciones-empresas",
        labelKey: "admin.menu.businessSubscriptions",
        icon: BadgeCheck,
      },
    ],
  },
  {
    id: "communication",
    labelKey: "admin.menu.groupCommunication",
    items: [
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
        href: "/admin/reviews/products",
        labelKey: "admin.menu.reviews",
        icon: Star,
        children: [
          {
            href: "/admin/reviews/products",
            labelKey: "admin.menu.reviewsProducts",
          },
          {
            href: "/admin/reviews/site",
            labelKey: "admin.menu.reviewsSite",
          },
        ],
      },
    ],
  },
  {
    id: "services",
    labelKey: "admin.menu.groupServices",
    items: [
      {
        href: "/admin/services",
        labelKey: "admin.menu.services",
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    id: "shipping",
    labelKey: "admin.menu.groupShipping",
    items: [
      {
        href: "/admin/shipping/general",
        labelKey: "admin.menu.shipping",
        icon: Truck,
        children: [
          {
            href: "/admin/shipping/general",
            labelKey: "admin.menu.shippingGeneral",
          },
          {
            href: "/admin/shipping/rates",
            labelKey: "admin.menu.shippingRates",
          },
        ],
      },
    ],
  },
  {
    id: "settings",
    labelKey: "admin.menu.groupSettings",
    items: [
      {
        href: "/admin/settings",
        labelKey: "admin.menu.settings",
        icon: Settings,
      },
    ],
  },
];
