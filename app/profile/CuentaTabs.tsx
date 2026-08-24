"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appNavigationStart } from "@/lib/app-loading";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { cn } from "@/utils/cn";
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

export const PROFILE_TAB_IDS = ["profile", "orders", "addresses"] as const;

export type CuentaTabId = (typeof PROFILE_TAB_IDS)[number];

const TAB_LABEL_KEY: Record<CuentaTabId, string> = {
  profile: "profile.tabProfile",
  orders: "profile.tabOrders",
  addresses: "profile.tabAddresses",
};

function tabFromQuery(raw: string | null): CuentaTabId {
  if (raw === "orders" || raw === "addresses" || raw === "profile") {
    return raw;
  }
  return "profile";
}

export function CuentaTabs({ initialName, email, addresses, orders }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = useMemo(
    () => tabFromQuery(searchParams.get("tab")),
    [searchParams],
  );

  const setTab = useCallback(
    (id: CuentaTabId) => {
      if (id !== activeTab) appNavigationStart();
      router.replace(`/profile?tab=${id}`, { scroll: false });
    },
    [router, activeTab],
  );

  const tabTriggerClass =
    "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:border data-[state=inactive]:border-border/80 data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:shadow-none data-[state=inactive]:hover:bg-muted/30 data-[state=inactive]:hover:text-foreground";

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setTab(value as CuentaTabId)}
      className="space-y-4"
    >
      <TabsList
        className={cn(
          "flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-border/60 bg-transparent px-0 pt-0 pb-2 [scrollbar-width:thin]",
          "h-auto w-full flex-nowrap items-center justify-start rounded-none border-x-0 border-t-0 shadow-none",
        )}
      >
        {PROFILE_TAB_IDS.map((tabId) => (
          <TabsTrigger value={tabId} key={tabId} className={tabTriggerClass}>
            {t(TAB_LABEL_KEY[tabId])}
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
        <AddressesSection addresses={addresses} />
      </TabsContent>
    </Tabs>
  );
}
