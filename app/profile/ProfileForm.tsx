"use client";

import { adminServiceLikeInputClassName } from "@/components/admin/admin-form-classes";
import { useI18n } from "@/components/i18n/I18nProvider";
import { SUPPORTED_LOCALES } from "@/components/i18n/translations";
import { ButtonPending } from "@/components/ui/button-pending";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { useServerAction } from "@/hooks/use-server-action";
import { translate } from "@/lib/i18n/get-translation";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { updateProfileNameAction } from "./actions";

type FormValues = {
  name: string;
};

type Props = {
  initialName: string | null | undefined;
  email: string;
};

export function ProfileForm({ initialName, email }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const form = useForm<FormValues>({
    defaultValues: {
      name: initialName ?? "",
    },
  });
  const { execute, isPending } = useServerAction(updateProfileNameAction, {
    successMessage: t("profile.toastNameUpdated"),
    errorMessage: t("profile.toastNameUpdateError"),
    onSettled: () => router.refresh(),
  });
  const isSubmittingRef = useRef(false);

  /** En reposo: mismo ancho es/en según el texto más largo de Guardar/Save. Al guardar, el botón usa su ancho natural (spinner + Saving/Guardando). */
  const saveButtonIdleMinWidth = useMemo(() => {
    const maxSave = Math.max(
      ...SUPPORTED_LOCALES.map((loc) => translate(loc, "profile.save").length),
    );
    return `calc(3rem + ${maxSave}ch)`;
  }, []);

  const onSubmit = async (values: FormValues) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      await execute({ name: values.name });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.profileCardTitle")}</CardTitle>
        <CardDescription>{t("profile.profileCardDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                {t("profile.fullName")}
                <RequiredMark />
              </Label>
              <Input
                id="name"
                className={adminServiceLikeInputClassName}
                aria-required
                {...form.register("name")}
              />
              {form.formState.errors.name?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="account-email" className="text-sm font-medium">
                {t("profile.email")}
              </Label>
              <Input
                id="account-email"
                type="email"
                value={email}
                readOnly
                disabled
                className={adminServiceLikeInputClassName}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <ButtonPending
              type="submit"
              pending={isPending}
              pendingLabel={t("profile.saving")}
              skipMinWidth
              style={
                isPending ? undefined : { minWidth: saveButtonIdleMinWidth }
              }
              className="justify-center px-6"
            >
              {t("profile.save")}
            </ButtonPending>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
