"use client";

import { StoreCartLineItems } from "@/components/store/StoreCartLineItems";
import {
  ManualQuoteShippingAddressForm,
  type ManualQuoteShippingAddressValues,
} from "@/components/store/ManualQuoteShippingAddressForm";
import { StoreCartOrderSummary } from "@/components/store/StoreCartOrderSummary";
import { useCartProductsMap } from "@/components/store/useCartProductsMap";
import { useGcCart } from "@/components/store/useGcCart";
import { useRunCartMutation } from "@/components/store/useRunCartMutation";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import { gcCartClear } from "@/lib/store-cart";
import { redirectAfterManualQuoteSuccess, openWhatsAppWindowForUserGesture, closePreOpenedWhatsAppWindow } from "@/lib/manual-quote-success";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import { cn } from "@/utils/cn";
import { Loader2, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const ADDRESS_FORM_ID = "cart-drawer-quote-address-form";

type DrawerStep = "cart" | "address";

export function StoreCartDrawer({
  open,
  onClose,
  tier,
}: {
  open: boolean;
  onClose: () => void;
  tier: StorefrontPriceTier;
}) {
  const { t, locale } = useI18n();
  const items = useGcCart();
  const ids = items.map((i) => i.productId);
  const { productsById, loading } = useCartProductsMap(ids);
  const { mutationPending, runCartMutation } = useRunCartMutation();
  const listBusy = loading || mutationPending;
  /** Empieza en true para no pintar el listado un frame antes que los importes. */
  const [summaryPending, setSummaryPending] = useState(true);
  const [step, setStep] = useState<DrawerStep>("cart");
  const [quoteLoading, setQuoteLoading] = useState(false);

  /** Solo el carrito vacío real; no mezclar con `loading` (evita skeleton + pie inconsistente al borrar). */
  const isCartEmpty = items.length === 0;
  const showAddressStep = step === "address" && !isCartEmpty;

  useEffect(() => {
    if (!open) setStep("cart");
  }, [open]);

  useEffect(() => {
    if (isCartEmpty && step === "address") setStep("cart");
  }, [isCartEmpty, step]);

  function handleClose() {
    if (quoteLoading) return;
    setStep("cart");
    onClose();
  }

  async function submitManualQuote(
    shippingAddress: ManualQuoteShippingAddressValues,
  ) {
    if (quoteLoading || items.length === 0) return;
    const whatsappWindow = openWhatsAppWindowForUserGesture(
      t("storefront.cart.openingWhatsApp"),
    );
    setQuoteLoading(true);
    try {
      const res = await fetch("/api/site-orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            qty: item.qty,
          })),
          locale,
          shippingAddress,
        }),
      });
      const data = (await res.json()) as {
        whatsappUrl?: string;
        order?: { order_number?: string };
        error?: string;
      };
      if (!res.ok || !data.whatsappUrl) {
        throw new Error(
          data.error ?? t("storefront.cart.toastQuoteOrderError"),
        );
      }

      await gcCartClear();
      redirectAfterManualQuoteSuccess(data.whatsappUrl, {
        preOpenedWindow: whatsappWindow,
        orderNumber: data.order?.order_number,
      });
    } catch (e) {
      closePreOpenedWhatsAppWindow(whatsappWindow);
      const msg =
        e instanceof Error
          ? e.message
          : t("storefront.cart.toastQuoteOrderError");
      toast.error(msg);
      setQuoteLoading(false);
    }
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title={
        showAddressStep
          ? t("storefront.cart.quoteAddressTitle")
          : t("storefront.cart.drawerTitle")
      }
      description={
        showAddressStep
          ? t("storefront.cart.quoteAddressDescription")
          : t("storefront.cart.drawerDescription")
      }
      panelClassName="z-[100] w-full sm:max-w-md"
      contentAriaLabel={
        showAddressStep
          ? t("storefront.cart.quoteAddressTitle")
          : t("storefront.cart.drawerContentAria")
      }
      contentClassName="bg-muted/90"
      footer={
        isCartEmpty ? null : showAddressStep ? (
          <SlideOverFooter className="flex-col items-stretch gap-0 border-t-0 bg-muted/10 px-4 pb-5 pt-4">
            {/*
              Misma altura que la zona de botones del carrito:
              separador → gap space-y-4 (pt-4) → botones → pb-5 del footer.
            */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={quoteLoading}
                className="w-full rounded-xl sm:flex-1"
                onClick={() => setStep("cart")}
              >
                {t("storefront.cart.quoteAddressBack")}
              </Button>
              <Button
                type="submit"
                form={ADDRESS_FORM_ID}
                disabled={quoteLoading}
                className="w-full gap-2 rounded-xl sm:flex-1"
              >
                {quoteLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("common.loading")}…
                  </>
                ) : (
                  t("storefront.cart.quoteAddressContinue")
                )}
              </Button>
            </div>
          </SlideOverFooter>
        ) : (
          <SlideOverFooter className="flex-col items-stretch gap-0 border-t-0 bg-muted/10 px-4 py-5">
            <StoreCartOrderSummary
              items={items}
              productsById={productsById}
              loading={listBusy}
              tier={tier}
              variant="drawer"
              panelOpen={open && step === "cart"}
              onContinueShopping={handleClose}
              onUiPendingChange={setSummaryPending}
              onQuoteAddressRequest={() => setStep("address")}
            />
          </SlideOverFooter>
        )
      }
    >
      {isCartEmpty ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-border/60 bg-white/60">
            <ShoppingBasket
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={1.25}
            />
          </div>
          <p className="text-sm font-medium text-foreground">
            {t("storefront.cart.emptyTitle")}
          </p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            {t("storefront.cart.emptyDescription")}
          </p>
          <Link
            href="/products"
            onClick={handleClose}
            className={cn(
              buttonVariants({ variant: "default" }),
              "mt-5 h-11 rounded-xl px-6",
            )}
          >
            {t("storefront.cart.continueShopping")}
          </Link>
        </div>
      ) : showAddressStep ? (
        <ManualQuoteShippingAddressForm
          formId={ADDRESS_FORM_ID}
          active={open && step === "address"}
          submitting={quoteLoading}
          onSubmit={submitManualQuote}
        />
      ) : (
        <div className="space-y-2.5">
          <StoreCartLineItems
            items={items}
            productsById={productsById}
            loading={loading}
            mutationPending={mutationPending}
            summaryPending={summaryPending}
            runCartMutation={runCartMutation}
            tier={tier}
            dense
            onProductNavigate={handleClose}
          />
        </div>
      )}
    </SlideOver>
  );
}
