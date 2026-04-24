import { getAppConfigSettingsService } from "@/modules/admin/app-config/app-config.service";
import { AdminSettingsForm } from "./AdminSettingsForm";
import { SettingsPageHeader } from "./SettingsPageHeader";

export default async function AdminSettingsPage() {
  const initial = await getAppConfigSettingsService();

  return (
    <div className="w-full max-w-full space-y-6">
      <SettingsPageHeader />
      <AdminSettingsForm initial={initial} />
    </div>
  );
}
