"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { AddressesSection } from "./AddressesSection";
import { OrdersSection } from "./OrdersSection";
import { ProfileForm } from "./ProfileForm";
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
      router.replace(`/profile?tab=${id}`, { scroll: false });
    },
    [router],
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setTab(value as CuentaTabId)}
      className="space-y-6 rounded-2xl  bg-white/60 shadow-sm"
    >
      <TabsList>
        {CUENTA_TABS.map((tab) => (
          <TabsTrigger value={tab.id} key={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="profile">
        <ProfileForm initialName={initialName} email={email} />
      </TabsContent>
      <TabsContent value="orders">
        <OrdersSection orders={orders} />
      </TabsContent>
      <TabsContent value="addresses">
        <AddressesSection addresses={addresses} orders={orders} />
      </TabsContent>
    </Tabs>
  );
}
