import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function LeaveReviewPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <HomeSectionHeading
        eyebrow="Opiniones"
        title="Deja una reseña"
        description="Cuéntanos tu experiencia para ayudar a otros compradores."
      />
      <form className="mt-8 grid gap-4">
        <Input placeholder="Nombre" />
        <Input placeholder="Correo electrónico" />
        <textarea className="h-36 rounded-xl border border-border/50 bg-card p-3 text-sm" placeholder="Tu reseña" />
        <div className="mt-2">
          <Button type="button">Enviar reseña</Button>
        </div>
      </form>
    </main>
  );
}

