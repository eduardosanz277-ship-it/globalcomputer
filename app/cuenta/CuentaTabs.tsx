"use client";

import { useState } from "react";
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

const tabs = [
  { id: "profile", label: "Perfil" },
  { id: "addresses", label: "Direcciones" },
  { id: "orders", label: "Mis pedidos" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function CuentaTabs({ initialName, email, addresses, orders }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0].id);

  return (
    <div className="rounded-2xl border border-border bg-background/80 p-3 shadow-sm sm:p-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={
              activeTab === tab.id
                ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-primary/30 transition hover:bg-primary/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                : "rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:border-border hover:bg-muted/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
            }
            onClick={() => setActiveTab(tab.id)}
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
