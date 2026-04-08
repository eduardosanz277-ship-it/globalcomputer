"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ProfileForm } from "./ProfileForm";
import { AddressesSection } from "./AddressesSection";
import { OrdersSection } from "./OrdersSection";
import type { CuentaAddress, CuentaOrder } from "./types";

type Props = {
  initialName: string | null | undefined;
  email: string;
  addresses: CuentaAddress[];
  orders: CuentaOrder[];
};

export const CUENTA_TABS = [
  { id: "profile", label: "Perfil" },
  { id: "orders", label: "Pedidos" },
  { id: "addresses", label: "Direcciones" },
] as const;

export type CuentaTabId = (typeof CUENTA_TABS)[number]["id"];

function tabFromQuery(raw: string | null): CuentaTabId {
  if (raw === "orders" || raw === "addresses" || raw === "profile") {
    return raw;
  }
  return "profile";
}

export function CuentaTabs({ initialName, email, addresses, orders }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = useMemo(
    () => tabFromQuery(searchParams.get("tab")),
    [searchParams],
  );

  const setTab = useCallback(
    (id: CuentaTabId) => {
      router.replace(`/cuenta?tab=${id}`, { scroll: false });
    },
    [router],
  );

  return (
    <div className="rounded-2xl border border-border bg-background/80 p-3 shadow-sm sm:p-5">
      <div className="flex flex-wrap gap-2">
        {CUENTA_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={
              activeTab === tab.id
                ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-primary/30 transition hover:bg-primary/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                : "rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:border-border hover:bg-muted/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
            }
            onClick={() => setTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-6">
        {activeTab === "profile" && (
          <ProfileForm initialName={initialName} email={email} />
        )}
        {activeTab === "addresses" && (
          <AddressesSection addresses={addresses} />
        )}
        {activeTab === "orders" && <OrdersSection orders={orders} />}
      </div>
    </div>
  );
}
