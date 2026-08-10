"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ManualQuoteShippingAddressForm,
  type ManualQuoteShippingAddressValues,
} from "@/components/store/ManualQuoteShippingAddressForm";
import { Loader2, MapPin } from "lucide-react";

export type { ManualQuoteShippingAddressValues };

const FORM_ID = "manual-quote-shipping-address-dialog-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  onSubmit: (values: ManualQuoteShippingAddressValues) => void;
};

/** Modal de dirección (p. ej. página /cart). En el drawer del carrito el form va inline. */
export function ManualQuoteShippingAddressDialog({
  open,
  onOpenChange,
  submitting,
  onSubmit,
}: Props) {
  const { t } = useI18n();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="z-[200] max-h-[min(92vh,40rem)] w-[calc(100vw-1.5rem)] max-w-none gap-0 overflow-hidden rounded-lg border-border/60 p-0 shadow-xl sm:w-full sm:max-w-md"
        overlayClassName="z-[200]"
      >
        <DialogHeader className="space-y-0 border-b border-border/60 bg-muted/25 px-5 pb-4 pt-5 text-left sm:px-6">
          <div className="flex gap-3 pr-8">
            <div
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex"
              aria-hidden
            >
              <MapPin className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-base font-semibold sm:text-lg">
                {t("storefront.cart.quoteAddressTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed sm:text-sm">
                {t("storefront.cart.quoteAddressDescription")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[min(58vh,26rem)] overflow-y-auto p-4">
          <ManualQuoteShippingAddressForm
            formId={FORM_ID}
            active={open}
            submitting={submitting}
            onSubmit={onSubmit}
          />
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/15 px-5 py-3 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            {t("storefront.cart.quoteAddressCancel")}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.loading")}…
              </>
            ) : (
              t("storefront.cart.quoteAddressContinue")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
