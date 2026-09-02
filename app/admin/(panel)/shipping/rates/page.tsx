import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { listShippingRatesAdminService } from "@/modules/shipping/shipping.service";
import { AdminShippingRatesTable } from "./AdminShippingRatesTable";
import { ShippingRatesPageHeader } from "./ShippingRatesPageHeader";

async function RatesTableSection() {
  const rates = await listShippingRatesAdminService();
  return <AdminShippingRatesTable rates={rates} />;
}

export default async function AdminShippingRatesPage() {
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <ShippingRatesPageHeader />

        <hr className="border-border" />

        <Suspense fallback={<AdminShippingRatesTable rates={[]} isLoading />}>
          <RatesTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
