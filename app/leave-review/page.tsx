import { adminServiceLikeInputClassName } from "@/components/admin/admin-form-classes";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

export default async function LeaveReviewPage() {
  const textareaAdminClassName = cn(
    adminServiceLikeInputClassName,
    "h-auto min-h-36 resize-y px-3 py-2 text-sm outline-none",
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <HomeSectionHeading
        eyebrow="Opiniones"
        title="Deja una reseña"
        description="Cuéntanos tu experiencia para ayudar a otros compradores."
      />
      <form className="mt-8 space-y-6">
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
    </main>
  );
}

