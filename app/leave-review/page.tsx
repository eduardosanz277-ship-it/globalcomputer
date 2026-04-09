import { Inter } from "next/font/google";
import { adminServiceLikeInputClassName } from "@/components/admin/admin-form-classes";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function LeaveReviewPage() {
  const textareaAdminClassName = cn(
    adminServiceLikeInputClassName,
    "h-auto min-h-36 resize-y px-3 py-2 text-sm outline-none",
  );

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            items={[{ label: "Inicio", href: "/" }, { label: "Reseñas" }]}
            className={inter.className}
          />
          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title="Deja una reseña"
              description="Cuéntanos tu experiencia para ayudar a otros compradores."
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
              descriptionClassName={`${inter.className} mt-1 max-w-[700px] text-[15px] font-normal text-muted-foreground sm:text-base`}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-3xl px-4 pb-12 sm:px-6 lg:px-8">
        <form className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm dark:bg-card">
            <div className="grid gap-4">
              <Input
                placeholder="Nombre"
                className={adminServiceLikeInputClassName}
                autoComplete="name"
              />
              <Input
                type="email"
                placeholder="Correo electrónico"
                className={adminServiceLikeInputClassName}
                autoComplete="email"
              />
              <textarea
                className={textareaAdminClassName}
                placeholder="Tu reseña"
                rows={6}
              />
            </div>
          </div>
          <Button type="button">Enviar reseña</Button>
        </form>
      </div>
    </main>
  );
}
