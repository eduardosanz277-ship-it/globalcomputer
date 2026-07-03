import { LocalizedText } from "@/components/i18n/LocalizedText";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";

export function FeaturedProductsEmptyState() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/35 p-8 shadow-soft sm:p-10"
      role="status"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/[0.07] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-secondary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
        <div
          className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/[0.06] text-primary shadow-sm ring-1 ring-primary/5"
          aria-hidden
        >
          <Star className="h-8 w-8" strokeWidth={1.35} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            <LocalizedText
              es="No hay productos disponibles en esta sección por ahora. Mientras tanto, puedes explorar todo el catálogo."
              en="No products are available in this section yet. In the meantime, you can browse the full catalog."
            />
          </p>
        </div>

        <Link
          href="/products"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "group shrink-0 gap-2 rounded-full px-6 shadow-md shadow-primary/20",
          )}
        >
          <LocalizedText es="Ver catálogo" en="View catalog" />
          <ArrowRight
            className="h-4 w-4 transition group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}
