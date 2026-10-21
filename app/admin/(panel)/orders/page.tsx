import { Card, CardContent } from "@/components/ui/card";
import { StoreOrdersTable } from "@/components/admin/StoreOrdersTable";
import { repoListAdminStoreOrdersPage } from "@/modules/commerce/store-orders.admin.service";
import type { SiteOrderStatus } from "@/modules/commerce/store-orders.service";
import {
  parseAdminTableQuery,
  readAdminTableParam,
  type AdminTableSearchParams,
} from "@/lib/admin/server-table";
import { ensureAdminUserService } from "@/modules/auth/auth.service";
import { isTaggedNetworkError } from "@/lib/errors/rsc-network-error";
import { OrdersErrorState } from "./OrdersErrorState";
import { OrdersPageHeader } from "./OrdersPageHeader";

function formatAdminOrdersError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "";
}

/** Columnas ordenables de `StoreOrdersTable`. */
const ORDERS_SORT_IDS = [
  "order_number",
  "created_at",
  "customer",
  "total_amount",
  "shipping_method",
  "status",
] as const;

const ORDER_STATUSES: readonly SiteOrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipping",
  "completed",
  "cancelled",
];

type Props = {
  searchParams?: Promise<AdminTableSearchParams>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  try {
    await ensureAdminUserService();
    const params = (await searchParams) ?? {};
    const statusParam = readAdminTableParam(params, "status");
    const shippingParam = readAdminTableParam(params, "shipping");
    const page = await repoListAdminStoreOrdersPage({
      ...parseAdminTableQuery(params, ORDERS_SORT_IDS),
      status: (ORDER_STATUSES as readonly string[]).includes(statusParam)
        ? (statusParam as SiteOrderStatus)
        : null,
      shippingMethod:
        shippingParam === "automatic" || shippingParam === "manual"
          ? shippingParam
          : null,
      conflictOnly: readAdminTableParam(params, "conflict") === "1",
    });

    return (
      <Card className="w-full">
        <CardContent className="space-y-4">
          <OrdersPageHeader />
          <hr className="border-border" />
          <StoreOrdersTable page={page} />
        </CardContent>
      </Card>
    );
  } catch (error) {
    // La pista sobre RLS sólo aplica a fallos reales de permisos; sin red la resuelve
    // el error boundary del panel con el estado de conexión.
    if (isTaggedNetworkError(error)) throw error;
    const message = formatAdminOrdersError(error);
    return <OrdersErrorState message={message} />;
  }
}
