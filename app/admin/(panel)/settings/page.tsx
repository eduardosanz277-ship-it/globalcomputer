import { getAppConfigSettingsService } from "@/modules/admin/app-config/app-config.service";
import { AdminSettingsForm } from "./AdminSettingsForm";

export default async function AdminSettingsPage() {
  const initial = await getAppConfigSettingsService();

  return (
    <div className="w-full max-w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configuraciones generales
        </p>
      </div>
      <AdminSettingsForm initial={initial} />
    </div>
  );
}
