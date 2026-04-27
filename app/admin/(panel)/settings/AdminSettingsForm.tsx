"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, Mail, MapPin, Percent, Phone } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { ButtonPending } from "@/components/ui/button-pending";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { adminServiceLikeInputClassName } from "@/components/admin/admin-form-classes";
import { useServerAction } from "@/hooks/use-server-action";
import { updateAppConfigAction } from "@/modules/admin/app-config/app-config.actions";
import {
  createAppConfigFormSchema,
  type AppConfigFormValues,
} from "@/modules/admin/app-config/app-config.schema";
import type { AppConfigSettings } from "@/modules/admin/app-config/app-config.types";
import { cn } from "@/utils/cn";
import { useI18n } from "@/components/i18n/I18nProvider";

type Props = {
  initial: AppConfigSettings;
};

export function AdminSettingsForm({ initial }: Props) {
  const { t } = useI18n();
  const localizedSchema = createAppConfigFormSchema({
    supportEmailRequired: t("admin.settings.form.errors.supportEmailRequired"),
    supportEmailInvalid: t("admin.settings.form.errors.supportEmailInvalid"),
    supportPhoneRequired: t("admin.settings.form.errors.supportPhoneRequired"),
    supportAddressRequired: t("admin.settings.form.errors.supportAddressRequired"),
    lowStockThresholdMin: t("admin.settings.form.errors.lowStockThresholdMin"),
    offerAmountMin: t("admin.settings.form.errors.offerAmountMin"),
    offerPercentageMin: t("admin.settings.form.errors.offerPercentageMin"),
    offerPercentageMax: t("admin.settings.form.errors.offerPercentageMax"),
  });
  const form = useForm<AppConfigFormValues>({
    resolver: zodResolver(localizedSchema),
    defaultValues: {
      supportEmail: initial.supportEmail,
      supportPhone: initial.supportPhone,
      supportAddress: initial.supportAddress,
      lowStockNotificationsEnabled: initial.lowStockNotificationsEnabled,
      lowStockThreshold: initial.lowStockThreshold,
      offerAmount: initial.offerAmount,
      offerPercentage: initial.offerPercentage,
    },
  });

  const lowStockAlertsOn = form.watch("lowStockNotificationsEnabled");

  const { execute, isPending } = useServerAction(updateAppConfigAction, {
    successMessage: t("admin.settings.toast.saved"),
  });

  const onSubmit = (values: AppConfigFormValues) => {
    execute(values);
  };

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
      <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
        <Card className="flex min-h-0 flex-col lg:h-full">
          <CardHeader>
            <CardTitle>{t("admin.settings.form.support.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supportEmail" className="text-sm font-medium">
                {t("admin.settings.form.support.email")}
                <RequiredMark />
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="supportEmail"
                  type="email"
                  autoComplete="email"
                  className={cn(adminServiceLikeInputClassName, "pl-9")}
                  aria-required
                  {...form.register("supportEmail")}
                />
              </div>
              {errors.supportEmail && (
                <p className="text-sm text-destructive">
                  {errors.supportEmail.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportPhone" className="text-sm font-medium">
                {t("admin.settings.form.support.phone")}
                <RequiredMark />
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="supportPhone"
                  type="tel"
                  autoComplete="tel"
                  className={cn(adminServiceLikeInputClassName, "pl-9")}
                  aria-required
                  {...form.register("supportPhone")}
                />
              </div>
              {errors.supportPhone && (
                <p className="text-sm text-destructive">
                  {errors.supportPhone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportAddress" className="text-sm font-medium">
                {t("admin.settings.form.support.address")}
                <RequiredMark />
              </Label>
              <div className="relative">
                <MapPin
                  className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                <textarea
                  id="supportAddress"
                  rows={3}
                  autoComplete="street-address"
                  className={cn(
                    /* Misma base que `Input` (email): borde `border-input/90` + anillo foco */
                    "w-full rounded-lg border border-input/90 bg-background px-3 py-2.5 text-sm shadow-sm transition-[box-shadow,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2",
                    adminServiceLikeInputClassName,
                    "h-auto min-h-[5.5rem] resize-y pl-9 pr-3 leading-relaxed",
                  )}
                  aria-required
                  {...form.register("supportAddress")}
                />
              </div>
              {errors.supportAddress && (
                <p className="text-sm text-destructive">
                  {errors.supportAddress.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col lg:h-full">
          <CardHeader>
            <CardTitle>{t("admin.settings.form.lowStock.title")}</CardTitle>
            <CardDescription>
              {t("admin.settings.form.lowStock.description")}
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
                    {t("admin.settings.form.lowStock.alertsLabel")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.settings.form.lowStock.alertsHint")}
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
                  !lowStockAlertsOn && "pointer-events-none opacity-50",
                )}
              >
                <Label htmlFor="lowStockThreshold" className="text-sm font-medium">
                  {t("admin.settings.form.lowStock.thresholdLabel")}
                  <RequiredMark />
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("admin.settings.form.lowStock.thresholdHint")}
                </p>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min={0}
                  step={1}
                  disabled={!lowStockAlertsOn || isPending}
                  className={adminServiceLikeInputClassName}
                  aria-required={lowStockAlertsOn}
                  {...form.register("lowStockThreshold", {
                    valueAsNumber: true,
                  })}
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

        <Card className="flex min-h-0 flex-col lg:h-full">
          <CardHeader>
            <CardTitle>{t("admin.settings.form.offer.title")}</CardTitle>
            <CardDescription>
              {t("admin.settings.form.offer.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offerAmount" className="text-sm font-medium">
                {t("admin.settings.form.offer.amountLabel")}
                <RequiredMark />
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("admin.settings.form.offer.amountHint")}
              </p>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="offerAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  className={cn(adminServiceLikeInputClassName, "pl-9")}
                  aria-required
                  {...form.register("offerAmount", {
                    valueAsNumber: true,
                  })}
                />
              </div>
              {errors.offerAmount && (
                <p className="text-sm text-destructive">
                  {errors.offerAmount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="offerPercentage" className="text-sm font-medium">
                {t("admin.settings.form.offer.percentageLabel")}
                <RequiredMark />
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("admin.settings.form.offer.percentageHint")}
              </p>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="offerPercentage"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  className={cn(adminServiceLikeInputClassName, "pl-9")}
                  aria-required
                  {...form.register("offerPercentage", {
                    valueAsNumber: true,
                  })}
                />
              </div>
              {errors.offerPercentage && (
                <p className="text-sm text-destructive">
                  {errors.offerPercentage.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex w-full justify-end">
        <ButtonPending
          type="submit"
          pending={isPending}
          pendingLabel={t("admin.settings.form.saving")}
        >
          {t("admin.settings.form.save")}
        </ButtonPending>
      </div>
    </form>
  );
}
