import { Card, CardContent } from "@/components/ui/card";
import { StoreOrdersTable } from "@/components/admin/StoreOrdersTable";
import { repoListAdminStoreOrders } from "@/modules/commerce/store-orders.admin.service";
import { ensureAdminUserService } from "@/modules/auth/auth.service";
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

export default async function AdminOrdersPage() {
  try {
    await ensureAdminUserService();
    const orders = await repoListAdminStoreOrders({ limit: 50 });

    return (
      <Card className="w-full">
        <CardContent className="space-y-4">
          <OrdersPageHeader />
          <hr className="border-border" />
          <StoreOrdersTable orders={orders} />
        </CardContent>
      </Card>
    );
  } catch (error) {
    const message = formatAdminOrdersError(error);
    return <OrdersErrorState message={message} />;
  }
}
