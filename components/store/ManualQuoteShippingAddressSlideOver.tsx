"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  ManualQuoteShippingAddressForm,
  type ManualQuoteShippingAddressValues,
} from "@/components/store/ManualQuoteShippingAddressForm";
import { Loader2 } from "lucide-react";

export type { ManualQuoteShippingAddressValues };

const FORM_ID = "manual-quote-shipping-address-slide-over-form";

type Props = {
  open: boolean;
  onClose: () => void;
  submitting: boolean;
  onSubmit: (values: ManualQuoteShippingAddressValues) => void;
};

/** Panel derecho de dirección de envío (página /cart y mismo look que el drawer). */
export function ManualQuoteShippingAddressSlideOver({
  open,
  onClose,
  submitting,
  onSubmit,
}: Props) {
  const { t } = useI18n();

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title={t("storefront.cart.quoteAddressTitle")}
      description={t("storefront.cart.quoteAddressDescription")}
      panelClassName="z-[100] w-full sm:max-w-md"
      contentAriaLabel={t("storefront.cart.quoteAddressTitle")}
      contentClassName="bg-muted/90"
      footer={
        <SlideOverFooter className="flex-col items-stretch gap-0 border-t-0 bg-muted/10 px-4 pb-5 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              className="w-full rounded-xl sm:flex-1"
              onClick={handleClose}
            >
              {t("storefront.cart.quoteAddressBack")}
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              disabled={submitting}
              className="w-full gap-2 rounded-xl sm:flex-1"
            >
              {submitting ? (
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
      }
    >
      <ManualQuoteShippingAddressForm
        formId={FORM_ID}
        active={open}
        submitting={submitting}
        onSubmit={onSubmit}
      />
    </SlideOver>
  );
}
