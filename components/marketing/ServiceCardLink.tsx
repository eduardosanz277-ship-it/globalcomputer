import Link from "next/link";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { plainTextFromHtml } from "@/lib/plainTextFromHtml";
import { clampText } from "@/components/marketing/service-card-shared";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

type ServiceCardLinkProps = {
  name: string;
  /** Puede incluir HTML; se muestra como texto plano recortado. */
  description: string | null | undefined;
  imageUrl: string | null;
  href: string;
};

export function ServiceCardLink({
  name,
  description,
  imageUrl,
  href,
}: ServiceCardLinkProps) {
  const excerpt = clampText(plainTextFromHtml(description ?? ""), 130);

  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-border/50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-card to-muted/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3
          className={cn(
            poppins.className,
            "text-lg font-semibold leading-snug text-foreground transition group-hover:text-primary",
          )}
        >
          {name}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {excerpt}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition group-hover:bg-primary/90">
            Ver servicio
            <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-background/90 px-4 text-sm font-semibold text-foreground/90 backdrop-blur-sm transition group-hover:border-primary/30 group-hover:bg-primary/[0.04]">
            Hablar con asesor
            <MessageCircle className="h-4 w-4" aria-hidden />
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>
    </Link>
  );
}
