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
    <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
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
