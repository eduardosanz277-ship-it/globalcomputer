import { Card, CardContent } from "@/components/ui/card";
import { StoreOrdersTable } from "@/components/admin/StoreOrdersTable";
import { repoListAdminStoreOrders } from "@/modules/commerce/store-orders.admin.service";
import { ensureAdminUserService } from "@/modules/auth/auth.service";

function formatAdminOrdersError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "Hubo un problema al consultar los pedidos.";
}

export default async function AdminOrdersPage() {
  try {
    await ensureAdminUserService();
    const orders = await repoListAdminStoreOrders({ limit: 50 });

    return (
      <Card className="w-full">
        <CardContent className="space-y-4">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">Pedidos Stripe</h1>
            <p className="text-sm text-muted-foreground">
              Revisa montos, impuestos y aplica los estados de procesamiento.
            </p>
          </header>
          <hr className="border-border" />
          <StoreOrdersTable orders={orders} />
        </CardContent>
      </Card>
    );
  } catch (error) {
    const message = formatAdminOrdersError(error);
    return (
      <div className="w-full space-y-4 rounded-2xl border border-destructive/60 bg-destructive/10 p-6 text-sm text-destructive-foreground">
        <h1 className="text-xl font-semibold text-destructive">Pedidos Stripe</h1>
        <p>
          {message}. Comprueba que tu sesión sea de administrador y que las políticas RLS
          de `store_orders` estén aplicadas en Supabase antes de recargar.
        </p>
      </div>
    );
  }
}
