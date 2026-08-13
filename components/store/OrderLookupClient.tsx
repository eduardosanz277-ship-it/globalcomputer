"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { GuestOrderDetailsPanel } from "@/components/store/GuestOrderDetailsPanel";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import type { GuestOrderLookupResult } from "@/modules/commerce/store-order-guest-lookup.service";
import { cn } from "@/utils/cn";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const INPUT_CLASS = cn(
  "h-11 w-full rounded-xl border border-border/80 bg-white px-3 py-2.5 text-sm shadow-sm transition",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0",
  "placeholder:text-muted-foreground/70",
);

type OrderLookupFormValues = {
  orderNumber: string;
  email: string;
};

type FormErrorKey =
  | "NOT_FOUND"
  | "INVALID_BODY"
  | "INVALID_JSON"
  | "SERVER_ERROR"
  | "GENERIC";

export function OrderLookupClient() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const [formErrorKey, setFormErrorKey] = useState<FormErrorKey | null>(null);
  const [order, setOrder] = useState<GuestOrderLookupResult | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        orderNumber: z
          .string()
          .trim()
          .min(1, t("orderLookup.orderNumberRequired")),
        email: z
          .string()
          .trim()
          .min(1, t("orderLookup.emailRequired"))
          .email(t("orderLookup.emailInvalid")),
      }),
    [t],
  );

  const form = useForm<OrderLookupFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      orderNumber: "",
      email: "",
    },
    mode: "onSubmit",
  });

  const {
    formState: { errors, isSubmitting, isSubmitted },
    setValue,
    trigger,
  } = form;

  useEffect(() => {
    document.title = t("orderLookup.metaTitle");
  }, [locale, t]);

  useEffect(() => {
    const fromQuery = searchParams.get("order")?.trim();
    if (fromQuery) setValue("orderNumber", fromQuery);
  }, [searchParams, setValue]);

  useEffect(() => {
    if (isSubmitted) void trigger();
  }, [locale, schema, isSubmitted, trigger]);

  function formErrorMessage(key: FormErrorKey | null): string | null {
    if (!key) return null;
    if (key === "NOT_FOUND") return t("orderLookup.errorNotFound");
    if (key === "INVALID_BODY" || key === "INVALID_JSON") {
      return t("orderLookup.errorInvalidBody");
    }
    return t("orderLookup.errorGeneric");
  }

  async function onSubmit(values: OrderLookupFormValues) {
    setFormErrorKey(null);
    setOrder(null);

    try {
      const res = await fetch("/api/site-orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: values.orderNumber.trim(),
          email: values.email.trim(),
        }),
      });
      const payload = (await res.json().catch(() => null)) as {
        order?: GuestOrderLookupResult;
        code?: string;
      } | null;
      if (!res.ok || !payload?.order) {
        const code = payload?.code;
        if (
          code === "NOT_FOUND" ||
          code === "INVALID_BODY" ||
          code === "INVALID_JSON" ||
          code === "SERVER_ERROR"
        ) {
          setFormErrorKey(code);
        } else {
          setFormErrorKey("GENERIC");
        }
        return;
      }
      setOrder(payload.order);
    } catch {
      setFormErrorKey("GENERIC");
    }
  }

  const formError = formErrorMessage(formErrorKey);

  return (
    <div className="mx-auto grid max-w-3xl gap-8 pb-10 lg:max-w-4xl">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft sm:p-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {t("orderLookup.formTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("orderLookup.formDescription")}
          </p>
        </div>

        <Form form={form} onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              name="orderNumber"
              label={t("orderLookup.orderNumberLabel")}
              required
              disabled={isSubmitting}
              error={errors.orderNumber?.message}
              autoComplete="off"
              className={cn(INPUT_CLASS, "font-mono")}
              placeholder={t("orderLookup.orderNumberPlaceholder")}
            />
            <FormField
              name="email"
              label={t("orderLookup.emailLabel")}
              type="email"
              required
              disabled={isSubmitting}
              error={errors.email?.message}
              autoComplete="email"
              className={INPUT_CLASS}
              placeholder={t("orderLookup.emailPlaceholder")}
            />
          </div>

          {formError ? (
            <p
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full rounded-xl font-semibold sm:w-auto sm:px-8"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 shrink-0 animate-spin"
                  aria-hidden
                />
                {t("orderLookup.submitting")}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" aria-hidden />
                {t("orderLookup.submit")}
              </>
            )}
          </Button>
        </Form>
      </section>

      {order ? <GuestOrderDetailsPanel order={order} /> : null}
    </div>
  );
}
