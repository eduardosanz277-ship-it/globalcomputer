import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { CartCheckoutSuccessClient } from "@/components/store/CartCheckoutSuccessClient";
import { cn } from "@/utils/cn";

export const metadata: Metadata = {
  title: "Pago recibido",
  description: "Gracias por tu compra.",
};

export default function CarritoExitoPage() {
  return (
    <div className="min-h-[50vh] bg-gradient-to-b from-muted/25 to-background px-4 py-16 sm:px-6">
      <CartCheckoutSuccessClient />
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-9 w-9" strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          ¡Gracias por tu compra!
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Stripe ha procesado el pago. Si hace falta, recibirás el recibo por correo. En este
          dispositivo el carrito se ha vaciado.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/productos"
            className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}
          >
            Seguir comprando
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
