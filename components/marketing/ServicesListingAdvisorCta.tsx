import { LocalizedText } from "@/components/i18n/LocalizedText";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";
import { Inter } from "next/font/google";
import { PhoneCall } from "lucide-react";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function ServicesListingAdvisorCta({
  phoneDisplay,
  phoneTel,
}: {
  phoneDisplay: string;
  phoneTel: string;
}) {
  return (
    <section className="border-t border-border/60 bg-muted/40 py-12 sm:py-14">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2
          className={`${inter.className} text-[1.75rem] font-bold leading-tight text-foreground sm:text-[2rem]`}
        >
          <LocalizedText
            es="¿No sabes qué servicio necesitas?"
            en="Not sure which service you need?"
          />
        </h2>
        <p
          className={`${inter.className} mt-3 text-[15px] text-muted-foreground sm:text-base`}
        >
          <LocalizedText
            es="Habla con un asesor y te ayudamos a elegir la solución correcta para tu espacio."
            en="Talk to an advisor and we'll help you choose the right solution for your space."
          />
        </p>
        <Link
          href={`tel:${phoneTel}`}
          className={cn(
            buttonVariants({ size: "lg" }),
            inter.className,
            "mt-6 inline-flex h-10 gap-2 rounded-xl border border-primary/25 bg-primary px-8 font-semibold text-primary-foreground transition-colors duration-200 hover:border-primary hover:bg-primary/85 sm:h-11",
          )}
          aria-label={`Hablar con un asesor (${phoneDisplay})`}
        >
          <PhoneCall
            className="h-4 w-4 shrink-0 text-primary-foreground"
            aria-hidden
          />
          {phoneDisplay}
        </Link>
      </div>
    </section>
  );
}
