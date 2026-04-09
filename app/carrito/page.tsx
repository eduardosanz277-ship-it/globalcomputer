import type { Metadata } from "next";
import { StoreCartView } from "@/components/store/StoreCartView";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";

export const metadata: Metadata = {
  title: "Tu carrito de compras",
  description: "Revisa los productos en tu carrito y continúa la compra.",
};

export default async function CarritoPage() {
  const user = await getCurrentUserService();
  const tier = resolveStorefrontPriceTier(user?.role);

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div
        id="cart-page-hero"
        className="border-b border-border/60 bg-card/40 transition-all duration-300"
      >
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Carrito de compras
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona cantidades y revisa el total antes de finalizar.
          </p>
        </div>
      </div>
      <StoreCartView tier={tier} />
    </div>
  );
}
