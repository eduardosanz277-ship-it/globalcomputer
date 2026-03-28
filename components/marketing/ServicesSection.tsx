import Link from "next/link";
import { Truck, ShieldCheck, Wrench, MessageSquare } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
};

const fallbackServices: Array<{
  name: string;
  description: string;
  key: "installation" | "maintenance" | "advisory";
}> = [
  {
    name: "Instalación profesional",
    description:
      "Te ayudamos a montar y configurar tu sistema para que funcione desde el día 1.",
    key: "installation",
  },
  {
    name: "Mantenimiento",
    description: "Revisiones y soporte técnico para mantener el rendimiento y la seguridad.",
    key: "maintenance",
  },
  {
    name: "Asesoría personalizada",
    description:
      "Recomendaciones según tu espacio, presupuesto y nivel de seguridad requerido.",
    key: "advisory",
  },
];

function iconForServiceName(name: string) {
  const n = name.toLowerCase();
  if (n.includes("instal") || n.includes("mont")) return Wrench;
  if (n.includes("manten") || n.includes("soporte") || n.includes("revision"))
    return ShieldCheck;
  if (n.includes("asesor") || n.includes("consulta") || n.includes("recom"))
    return MessageSquare;
  return Truck;
}

function clampText(text: string, maxLen: number) {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

export async function ServicesSection() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("services")
    .select("id, name, description")
    .limit(6);

  const services: ServiceRow[] = (data ?? []) as ServiceRow[];

  const list =
    services.length > 0
      ? services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? "",
        }))
      : fallbackServices.map((s, idx) => ({
          id: `fallback-${idx}`,
          name: s.name,
          description: s.description,
        }));

  return (
    <section
      id="servicios"
      className="scroll-mt-32 border-b border-border bg-muted/40 py-16 sm:scroll-mt-36 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <HomeSectionHeading
            align="left"
            eyebrow="Servicios"
            title="Servicios para tu instalación"
            description="Instalación, mantenimiento y asesoría sin complicaciones — un extra de confianza."
            className="max-w-xl lg:max-w-lg"
            titleClassName="text-3xl sm:text-4xl"
          />
          <div className="flex flex-wrap gap-3 lg:shrink-0">
            <Link
              href="#ayuda"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "rounded-xl shadow-sm",
              )}
            >
              Solicitar instalación
            </Link>
            <Link
              href="#ayuda"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "rounded-xl border-primary/30 bg-background hover:bg-primary/5",
              )}
            >
              Hablar con asesor
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => {
            const Icon = iconForServiceName(s.name);
            return (
              <div
                key={s.id}
                className="flex h-full flex-col rounded-3xl border border-border/60 bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
                      {s.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {clampText(s.description, 120)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
