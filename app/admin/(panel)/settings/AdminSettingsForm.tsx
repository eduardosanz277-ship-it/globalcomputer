"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useServerAction } from "@/hooks/use-server-action";
import { updateAppConfigAction } from "@/modules/admin/app-config/app-config.actions";
import {
  appConfigFormSchema,
  type AppConfigFormValues,
} from "@/modules/admin/app-config/app-config.schema";
import type { AppConfigSettings } from "@/modules/admin/app-config/app-config.types";
import { cn } from "@/utils/cn";

type Props = {
  initial: AppConfigSettings;
};

export function AdminSettingsForm({ initial }: Props) {
  const form = useForm<AppConfigFormValues>({
    resolver: zodResolver(appConfigFormSchema),
    defaultValues: {
      supportEmail: initial.supportEmail,
      supportPhone: initial.supportPhone,
      lowStockNotificationsEnabled: initial.lowStockNotificationsEnabled,
      lowStockThreshold: initial.lowStockThreshold,
    },
  });

  const lowStockAlertsOn = form.watch("lowStockNotificationsEnabled");

  const { execute, isPending } = useServerAction(updateAppConfigAction, {
    successMessage: "Configuración guardada",
  });

  const onSubmit = (values: AppConfigFormValues) => {
    execute(values);
  };

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
      <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex min-h-0 flex-col lg:h-full">
          <CardHeader>
            <CardTitle>Contacto de soporte</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supportEmail">
                Email
                <RequiredMark />
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="supportEmail"
                  type="email"
                  autoComplete="email"
                  className="pl-9"
                  aria-required
                  {...form.register("supportEmail")}
                />
              </div>
              {errors.supportEmail && (
                <p className="text-sm text-destructive">{errors.supportEmail.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportPhone">
                Teléfono
                <RequiredMark />
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="supportPhone"
                  type="tel"
                  autoComplete="tel"
                  className="pl-9"
                  aria-required
                  {...form.register("supportPhone")}
                />
              </div>
              {errors.supportPhone && (
                <p className="text-sm text-destructive">{errors.supportPhone.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col lg:h-full">
          <CardHeader>
            <CardTitle>Stock bajo</CardTitle>
            <CardDescription>
              Activa o desactiva las alertas por inventario bajo; si están activas,
              define el umbral.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="space-y-4 rounded-lg border border-dashed border-border px-4 py-3">
              <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-4">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="low-stock-notifications-enabled"
                    className="text-base font-medium"
                  >
                    Alertas de stock bajo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Activa para recibir avisos cuando el inventario esté por debajo
                    del umbral.
                  </p>
                </div>
                <Controller
                  name="lowStockNotificationsEnabled"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="low-stock-notifications-enabled"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  )}
                />
              </div>

              <div
                className={cn(
                  "space-y-2 transition-opacity",
                  !lowStockAlertsOn && "pointer-events-none opacity-50"
                )}
              >
                <Label htmlFor="lowStockThreshold">
                  Umbral (límite)
                  <RequiredMark />
                </Label>
                <p className="text-sm text-muted-foreground">
                  Se alerta cuando la cantidad en stock sea menor o igual a este
                  número (solo si las alertas de stock bajo están activas).
                </p>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min={0}
                  step={1}
                  disabled={!lowStockAlertsOn || isPending}
                  aria-required={lowStockAlertsOn}
                  {...form.register("lowStockThreshold", { valueAsNumber: true })}
                />
                {errors.lowStockThreshold && (
                  <p className="text-sm text-destructive">
                    {errors.lowStockThreshold.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex w-full justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
