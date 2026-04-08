import { AdminHeader } from "@/components/admin/AdminHeader";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CuentaTabs } from "./CuentaTabs";
import { CuentaAddress, CuentaOrder } from "./types";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Datos de tu perfil y sesión.",
};

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
    .from("orders")
    .select("id, status, total, created_at, order_items ( id )")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const mappedOrders: CuentaOrder[] = (orders ?? []).map((order) => ({
    id: order.id,
    status: order.status,
    total: Number(order.total) || 0,
    createdAt: order.created_at,
    itemsCount: order.order_items?.length ?? 0,
  }));

  const headerUser = {
    fullName: profile?.full_name ?? user.fullName ?? "",
    email: user.email,
    role: user.role,
  };

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      <AdminHeader user={headerUser} variant="standalone" brandHref="/" />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Mi cuenta
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tu panel personal actualizado con tendencias actuales por
                  sección.
                </p>
              </div>
            </div>

            <Suspense
              fallback={
                <div className="min-h-[12rem] animate-pulse rounded-2xl border border-border bg-muted/20" />
              }
            >
              <CuentaTabs
                initialName={profile?.full_name ?? user.fullName}
                email={user.email}
                addresses={mappedAddresses}
                orders={mappedOrders}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
