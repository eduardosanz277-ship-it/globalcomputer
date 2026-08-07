import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { translate } from "@/lib/i18n/get-translation";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CuentaTabs } from "./CuentaTabs";
import { ProfilePageHeading } from "./ProfilePageHeading";
import { CuentaAddress, CuentaOrder } from "./types";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: translate(locale, "profile.metaTitle"),
    description: translate(locale, "profile.metaDescription"),
  };
}

export default async function CuentaPage() {
  const user = await getCurrentUserService();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, role, created_at, updated_at, phone, employer_identification_number",
    )
    .eq("id", user.id)
    .maybeSingle();

  const { data: addresses } = await supabase
    .from("addresses")
    .select(
      "id, first_name, last_name, company, apartment, phone, street, city, state, postal_code, country, is_default, created_at",
    )
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  const mappedAddresses: CuentaAddress[] = (addresses ?? []).map((address) => ({
    id: address.id,
    firstName: address.first_name,
    lastName: address.last_name,
    company: address.company,
    apartment: address.apartment,
    phone: address.phone,
    street: address.street,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country,
    isDefault: Boolean(address.is_default),
  }));

  const { data: orders } = await supabase
    .from("store_orders")
    .select(
      "id, order_number, status, total_amount, amount_subtotal, amount_tax, amount_shipping, stripe_amount_total, created_at, store_order_items ( product_name, quantity, unit_price, total_price )",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const mappedOrders: CuentaOrder[] = (orders ?? []).map((order) => ({
    id: order.id,
    orderNumber:
      String(order.order_number ?? "").trim() || String(order.id).slice(0, 8),
    status: order.status,
    total: Number(order.total_amount) || 0,
    createdAt: order.created_at,
    itemsCount: order.store_order_items?.length ?? 0,
    amountSubtotal: Number(order.amount_subtotal) || 0,
    amountTax: Number(order.amount_tax) || 0,
    amountShipping: Number(order.amount_shipping) || 0,
    stripeAmountTotal: Number(order.stripe_amount_total) || 0,
    items:
      order.store_order_items?.map((item) => ({
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price) || 0,
        totalPrice: Number(item.total_price) || 0,
      })) ?? [],
  }));

  const headerUser = {
    fullName: profile?.full_name ?? user.fullName ?? "",
    email: user.email,
    role: user.role,
  };

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      <AdminHeader
        user={headerUser}
        variant="standalone"
        brandHref="/"
        hideBell
      />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border border-border/70 bg-card/80 shadow-2xl shadow-primary/10">
            <CardContent className="space-y-6 text-foreground">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <ProfilePageHeading />
              </div>

              <Suspense
                fallback={
                  <div className="min-h-[12rem] animate-pulse rounded-2xl border border-border bg-card/40" />
                }
              >
                <CuentaTabs
                  initialName={profile?.full_name ?? user.fullName}
                  email={user.email}
                  addresses={mappedAddresses}
                  orders={mappedOrders}
                />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
