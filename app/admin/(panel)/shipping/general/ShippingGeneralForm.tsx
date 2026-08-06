"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import Select from "react-select";
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
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import { useServerAction } from "@/hooks/use-server-action";
import { updateShippingSettingsAdminAction } from "@/modules/shipping/shipping.actions";
import {
  shippingSettingsFormSchema,
  type ShippingSettingsFormValues,
} from "@/modules/shipping/shipping.schema";
import type {
  ShippingPendingPaymentWaitUnit,
  ShippingSettings,
} from "@/modules/shipping/shipping.types";
import { cn } from "@/utils/cn";
import { useI18n } from "@/components/i18n/I18nProvider";

type Props = {
  initial: ShippingSettings;
};

type WaitUnitOption = {
  value: ShippingPendingPaymentWaitUnit;
  label: string;
};

export function ShippingGeneralForm({ initial }: Props) {
  const { t } = useI18n();
  const form = useForm<ShippingSettingsFormValues>({
    resolver: zodResolver(shippingSettingsFormSchema),
    defaultValues: {
      autoCalcMaxSubtotal: initial.autoCalcMaxSubtotal,
      overLimitAction: initial.overLimitAction,
      whatsappPhone: initial.whatsappPhone,
      whatsappMessage: initial.whatsappMessage,
      whatsappMessageEn: initial.whatsappMessageEn,
      freeShippingEnabled: initial.freeShippingEnabled,
      freeShippingMinSubtotal: initial.freeShippingMinSubtotal,
      freeShippingSurchargeBehavior: initial.freeShippingSurchargeBehavior,
      pendingPaymentMaxWaitValue: initial.pendingPaymentMaxWaitValue,
      pendingPaymentMaxWaitUnit: initial.pendingPaymentMaxWaitUnit,
    },
  });

  const freeOn = form.watch("freeShippingEnabled");
  const errors = form.formState.errors;

  const waitUnitOptions = useMemo<WaitUnitOption[]>(
    () => [
      {
        value: "minutes",
        label: t("admin.shipping.general.fields.pendingPaymentWaitUnitMinutes"),
      },
      {
        value: "hours",
        label: t("admin.shipping.general.fields.pendingPaymentWaitUnitHours"),
      },
      {
        value: "days",
        label: t("admin.shipping.general.fields.pendingPaymentWaitUnitDays"),
      },
    ],
    [t],
  );

  const { execute, isPending } = useServerAction(
    updateShippingSettingsAdminAction,
    {
      successMessage: t("admin.shipping.general.toast.saved"),
    },
  );

  useEffect(() => {
    form.reset({
      autoCalcMaxSubtotal: initial.autoCalcMaxSubtotal,
      overLimitAction: initial.overLimitAction,
      whatsappPhone: initial.whatsappPhone,
      whatsappMessage: initial.whatsappMessage,
      whatsappMessageEn: initial.whatsappMessageEn,
      freeShippingEnabled: initial.freeShippingEnabled,
      freeShippingMinSubtotal: initial.freeShippingMinSubtotal,
      freeShippingSurchargeBehavior: initial.freeShippingSurchargeBehavior,
      pendingPaymentMaxWaitValue: initial.pendingPaymentMaxWaitValue,
      pendingPaymentMaxWaitUnit: initial.pendingPaymentMaxWaitUnit,
    });
  }, [initial, form]);

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => execute(values))}
      className="w-full space-y-6"
    >
      <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex min-h-0 flex-col">
          <CardHeader>
            <CardTitle>{t("admin.shipping.general.autoCalc.title")}</CardTitle>
            <CardDescription>
              {t("admin.shipping.general.autoCalc.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4">
            <div className="space-y-2">
              <Label htmlFor="autoCalcMaxSubtotal">
                {t("admin.shipping.general.fields.autoCalcMaxSubtotal")}
                <RequiredMark />
              </Label>
              <Input
                id="autoCalcMaxSubtotal"
                type="number"
                step="0.01"
                min={0}
                className={adminServiceLikeInputClassName}
                {...form.register("autoCalcMaxSubtotal", { valueAsNumber: true })}
              />
              {errors.autoCalcMaxSubtotal ? (
                <p className="text-sm text-destructive">
                  {errors.autoCalcMaxSubtotal.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>
                {t("admin.shipping.general.fields.overLimitAction")}
                <RequiredMark />
              </Label>
              <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm text-foreground">
                {t("admin.shipping.general.overLimit.whatsapp")}
              </div>
              <input type="hidden" {...form.register("overLimitAction")} />
              <p className="text-xs text-muted-foreground">
                {t("admin.shipping.general.overLimit.hint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappPhone">
                {t("admin.shipping.general.fields.whatsappPhone")}
                <RequiredMark />
              </Label>
              <Input
                id="whatsappPhone"
                className={adminServiceLikeInputClassName}
                placeholder={t(
                  "admin.shipping.general.fields.whatsappPhonePlaceholder",
                )}
                {...form.register("whatsappPhone")}
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.shipping.general.fields.whatsappPhoneHint")}
              </p>
              {errors.whatsappPhone ? (
                <p className="text-sm text-destructive">
                  {errors.whatsappPhone.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappMessage">
                {t("admin.shipping.general.fields.whatsappMessage")}
                <RequiredMark />
              </Label>
              <textarea
                id="whatsappMessage"
                rows={4}
                className={cn(
                  /* Misma base que `Input`: borde + anillo de foco del sistema */
                  "w-full rounded-lg border border-input/90 bg-background px-3 py-2.5 text-sm shadow-sm transition-[box-shadow,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2",
                  adminServiceLikeInputClassName,
                  "h-auto min-h-[6rem] resize-y leading-relaxed",
                )}
                {...form.register("whatsappMessage")}
              />
              {errors.whatsappMessage ? (
                <p className="text-sm text-destructive">
                  {errors.whatsappMessage.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappMessageEn">
                {t("admin.shipping.general.fields.whatsappMessageEn")}
                <RequiredMark />
              </Label>
              <textarea
                id="whatsappMessageEn"
                rows={4}
                className={cn(
                  "w-full rounded-lg border border-input/90 bg-background px-3 py-2.5 text-sm shadow-sm transition-[box-shadow,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2",
                  adminServiceLikeInputClassName,
                  "h-auto min-h-[6rem] resize-y leading-relaxed",
                )}
                {...form.register("whatsappMessageEn")}
              />
              {errors.whatsappMessageEn ? (
                <p className="text-sm text-destructive">
                  {errors.whatsappMessageEn.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 border-t border-border/60 pt-4">
              <p className="text-sm font-medium text-foreground">
                {t("admin.shipping.general.pendingWait.title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("admin.shipping.general.pendingWait.description")}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_10rem]">
                <div className="space-y-2">
                  <Label htmlFor="pendingPaymentMaxWaitValue">
                    {t(
                      "admin.shipping.general.fields.pendingPaymentMaxWaitValue",
                    )}
                    <RequiredMark />
                  </Label>
                  <Input
                    id="pendingPaymentMaxWaitValue"
                    type="number"
                    min={1}
                    step={1}
                    className={adminServiceLikeInputClassName}
                    {...form.register("pendingPaymentMaxWaitValue", {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.pendingPaymentMaxWaitValue ? (
                    <p className="text-sm text-destructive">
                      {errors.pendingPaymentMaxWaitValue.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pendingPaymentMaxWaitUnit">
                    {t(
                      "admin.shipping.general.fields.pendingPaymentMaxWaitUnit",
                    )}
                    <RequiredMark />
                  </Label>
                  <Controller
                    control={form.control}
                    name="pendingPaymentMaxWaitUnit"
                    render={({ field }) => {
                      const value =
                        waitUnitOptions.find(
                          (option) => option.value === field.value,
                        ) ?? waitUnitOptions[2];
                      return (
                        <Select<WaitUnitOption, false>
                          instanceId="shipping-pending-wait-unit"
                          inputId="pendingPaymentMaxWaitUnit"
                          aria-label={t(
                            "admin.shipping.general.fields.pendingPaymentMaxWaitUnit",
                          )}
                          isSearchable={false}
                          isClearable={false}
                          options={waitUnitOptions}
                          value={value}
                          onChange={(option) => {
                            if (option) field.onChange(option.value);
                          }}
                          onBlur={field.onBlur}
                          styles={appToolbarSelectStyles}
                          className="w-full min-w-0"
                        />
                      );
                    }}
                  />
                  {errors.pendingPaymentMaxWaitUnit ? (
                    <p className="text-sm text-destructive">
                      {errors.pendingPaymentMaxWaitUnit.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.shipping.general.fields.pendingPaymentMaxWaitHint")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col">
          <CardHeader>
            <CardTitle>
              {t("admin.shipping.general.freeShipping.title")}
            </CardTitle>
            <CardDescription>
              {t("admin.shipping.general.freeShipping.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-3 py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {t("admin.shipping.general.fields.freeShippingEnabled")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("admin.shipping.general.fields.freeShippingEnabledHint")}
                </p>
              </div>
              <Controller
                control={form.control}
                name="freeShippingEnabled"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label={t(
                      "admin.shipping.general.fields.freeShippingEnabled",
                    )}
                  />
                )}
              />
            </div>

            <div className={cn("space-y-2", !freeOn && "opacity-60")}>
              <Label htmlFor="freeShippingMinSubtotal">
                {t("admin.shipping.general.fields.freeShippingMinSubtotal")}
                <RequiredMark />
              </Label>
              <Input
                id="freeShippingMinSubtotal"
                type="number"
                step="0.01"
                min={0}
                disabled={!freeOn}
                className={adminServiceLikeInputClassName}
                {...form.register("freeShippingMinSubtotal", {
                  valueAsNumber: true,
                })}
              />
              {errors.freeShippingMinSubtotal ? (
                <p className="text-sm text-destructive">
                  {errors.freeShippingMinSubtotal.message}
                </p>
              ) : null}
            </div>

            <fieldset className={cn("space-y-3", !freeOn && "opacity-60")}>
              <legend className="text-sm font-medium text-foreground">
                {t("admin.shipping.general.fields.freeShippingBehavior")}
              </legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 px-3 py-3">
                <input
                  type="radio"
                  className="mt-1"
                  value="keep_surcharges"
                  disabled={!freeOn}
                  {...form.register("freeShippingSurchargeBehavior")}
                />
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">
                    {t("admin.shipping.general.behavior.keep")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t("admin.shipping.general.behavior.keepHint")}
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 px-3 py-3">
                <input
                  type="radio"
                  className="mt-1"
                  value="waive_surcharges"
                  disabled={!freeOn}
                  {...form.register("freeShippingSurchargeBehavior")}
                />
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">
                    {t("admin.shipping.general.behavior.waive")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t("admin.shipping.general.behavior.waiveHint")}
                  </span>
                </span>
              </label>
            </fieldset>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <ButtonPending
          type="submit"
          pending={isPending}
          pendingLabel={t("admin.shipping.general.saving")}
          className="min-w-[10rem]"
        >
          {t("admin.shipping.general.save")}
        </ButtonPending>
      </div>
    </form>
  );
}
