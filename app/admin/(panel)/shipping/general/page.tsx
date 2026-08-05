import { getShippingSettingsAdminService } from "@/modules/shipping/shipping.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { ShippingGeneralForm } from "./ShippingGeneralForm";
import { ShippingGeneralPageHeader } from "./ShippingGeneralPageHeader";

export default async function AdminShippingGeneralPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  const initial = await getShippingSettingsAdminService();

  return (
    <div className="w-full max-w-full space-y-6">
      <ShippingGeneralPageHeader />
      <ShippingGeneralForm initial={initial} />
    </div>
  );
}
