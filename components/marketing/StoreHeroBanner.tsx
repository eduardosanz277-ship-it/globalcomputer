"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import {
  HERO_CYCLE_SLIDE_TRANSITION,
  HeroAjaxPulseVisual,
} from "@/components/marketing/HeroAjaxPulseVisual";
import type {
  HeroCategory,
  HeroContact,
} from "@/components/marketing/StoreHero";
import { buttonVariants } from "@/components/ui/button-variants";
import { inter } from "@/lib/fonts/inter";
import { cn } from "@/utils/cn";
import { Headphones, Phone, ShieldCheck, Truck } from "lucide-react";
import { motion, useAnimation } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";

const TRUST_PILLS = [
  { Icon: Truck, label: "Envíos a EE.UU", labelEn: "Shipping to the U.S." },
  { Icon: ShieldCheck, label: "Garantía real", labelEn: "Real warranty" },
  { Icon: Headphones, label: "Te ayudamos", labelEn: "We help you" },
] as const;

/**
 * HeroAjaxPulseVisual está pensado para una altura de 500px fija (todas sus medidas
 * internas — círculos, recorte de la foto — están calculadas en base a eso). Para mostrarlo
 * más chico en tablet/mobile, en vez de reescribir su geometría se envuelve en un wrapper de
 * HERO_VISUAL_DESIGN_HEIGHT con un `scale()` que lo reduce completo y proporcionalmente al
 * alto real deseado en cada breakpoint.
 */
const HERO_VISUAL_DESIGN_HEIGHT = 500;
const MOBILE_VISUAL_HEIGHT = 300;
const TABLET_VISUAL_HEIGHT = 380;

/** Debe coincidir en orden con IMAGES de HeroAjaxPulseVisual (ajax, cámaras, control, soporte). */
const HERO_CATEGORY_LABELS = [
  { es: "Alarmas de Seguridad", en: "Security Alarms" },
  { es: "Cámaras de Seguridad", en: "Security Cameras" },
  { es: "Control de Acceso", en: "Access Control" },
  { es: "Mantenimiento y Soporte", en: "Maintenance & Support" },
] as const;

/** Índice par → entra desde arriba hacia abajo y se retira hacia arriba. Índice impar → entra desde abajo hacia arriba y se retira hacia abajo. Se alternan en orden, igual que antes con solo 2 textos. */
function offscreenY(index: number) {
  return index % 2 === 0 ? "-100%" : "100%";
}

/**
 * Texto que rota en sincronía EXACTA con las fotos de HeroAjaxPulseVisual: no tiene timer
 * propio, sino que `onCycleStart` (pasado por HeroAjaxPulseVisual) dispara el swap en el
 * mismísimo instante en que la foto empieza a cambiar, así nunca pueden desincronizarse.
 *
 * Cada texto tiene una dirección fija propia según su índice (ver `offscreenY`), no es un
 * carrusel genérico: siempre entra/sale por el mismo lado.
 */
function HeroRotatingCategoryLabel({
  t,
  triggerRef,
}: {
  t: (es: string, en?: string | null) => string;
  triggerRef: React.MutableRefObject<(() => void) | null>;
}) {
  const alarmsControls = useAnimation();
  const camerasControls = useAnimation();
  const showingAlarmsRef = useRef(true);

  useEffect(() => {
    triggerRef.current = () => {
      const showingAlarms = showingAlarmsRef.current;
      if (showingAlarms) {
        void alarmsControls.start(
          { y: "-100%", opacity: 0 },
          HERO_CYCLE_SLIDE_TRANSITION,
        );
        void camerasControls.start(
          { y: "0%", opacity: 1 },
          HERO_CYCLE_SLIDE_TRANSITION,
        );
      } else {
        void camerasControls.start(
          { y: "100%", opacity: 0 },
          HERO_CYCLE_SLIDE_TRANSITION,
        );
        void alarmsControls.start(
          { y: "0%", opacity: 1 },
          HERO_CYCLE_SLIDE_TRANSITION,
        );
      }
      showingAlarmsRef.current = !showingAlarms;
    };
    return () => {
      triggerRef.current = null;
    };
  }, [alarmsControls, camerasControls, triggerRef]);

  const alarms = HERO_CATEGORY_LABELS[0];
  const cameras = HERO_CATEGORY_LABELS[1];
  const alarmsText = t(alarms.es, alarms.en);
  const camerasText = t(cameras.es, cameras.en);

  return (
    <span className="relative inline-block h-[1.6em] overflow-hidden align-bottom">
      {/*
        Sizer invisible: los dos textos apilados en la misma celda de grid (no por cantidad
        de caracteres, que no refleja el ancho real con fuente proporcional) para que el
        contenedor tome el ancho del más ancho de verdad y nunca se corte una letra.
      */}
      <span className="invisible grid whitespace-nowrap [&>*]:col-start-1 [&>*]:row-start-1">
        <span>{alarmsText}</span>
        <span>{camerasText}</span>
      </span>
      <motion.span
        className="absolute inset-x-0 top-0 whitespace-nowrap"
        style={{ y: "0%", opacity: 1 }}
        animate={alarmsControls}
      >
        {alarmsText}
      </motion.span>
      <motion.span
        className="absolute inset-x-0 top-0 whitespace-nowrap"
        style={{ y: "100%", opacity: 0 }}
        animate={camerasControls}
      >
        {camerasText}
      </motion.span>
    </span>
  );
}

export function StoreHeroBanner({
  categories,
  contact,
}: {
  categories: HeroCategory[];
  contact: HeroContact;
}) {
  const { locale } = useI18n();
  const t = (es: string, en?: string | null) =>
    locale === "en" ? en?.trim() || es : es;
  const labelTriggerRef = useRef<(() => void) | null>(null);

  return (
    <section
      className={cn(
        inter.className,
        "relative flex flex-col justify-center overflow-hidden bg-white pb-8 sm:pb-10 md:min-h-[420px] lg:min-h-[540px]",
      )}
    >
      <div className="relative z-20 mx-auto w-full max-w-7xl bg-transparent py-6 sm:py-8 md:px-8 md:py-6">
        <div className="grid items-center gap-10">
          <div className="text-center md:max-w-[48%] md:text-left lg:max-w-[60%] xl:max-w-[56%]">
            <div className="px-4 sm:px-6 md:px-0">
              <p className="text-[15px] font-bold uppercase tracking-wider text-primary sm:text-base lg:text-lg">
                <HeroRotatingCategoryLabel t={t} triggerRef={labelTriggerRef} />
              </p>
              <h1 className="text-[1.9rem] font-bold leading-tight tracking-tight text-foreground sm:text-[2.35rem] md:text-[26px] lg:text-[48px]">
                {t(
                  "Tu seguridad, simple y clara",
                  "Your security, simple and clear",
                )}
              </h1>
              <p className="mx-auto mt-4 text-pretty text-[14px] font-medium text-muted-foreground sm:text-[15px] md:mx-0 md:text-[14px] lg:text-[17px]">
                {t(
                  "Cámaras, grabadoras y kits con precios claros, y equipos que te orientan.",
                  "Cameras, recorders, and kits with clear prices, and teams that guide you.",
                )}
                <br />
                {t(
                  "Así debería ser comprar tecnología.",
                  "This is how buying technology should feel.",
                )}
              </p>

              <ul className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
                {TRUST_PILLS.map(({ Icon, label, labelEn }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-2 text-[12.8px] font-medium text-foreground"
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    {t(label, labelEn)}
                  </li>
                ))}
              </ul>
            </div>

            {/*
              Visual animado solo para mobile: va encima de los botones, pegado al borde
              derecho real. HeroAjaxPulseVisual está pensado para una altura de 500px fija
              (todas sus medidas internas son en base a eso), así que en vez de reescribir
              su geometría, se envuelve en un wrapper de MOBILE_VISUAL_HEIGHT de alto con
              un `scale()` que lo reduce completo (posición, círculos, recorte) de forma
              proporcional. Desde md (tablet) en adelante se usa el layout de dos columnas
              con el visual a la derecha ocupando el alto de la sección (ver bloques
              absolutos más abajo).
            */}
            <div
              className="relative ml-auto mr-0 mt-6 w-full md:hidden"
              style={{ height: MOBILE_VISUAL_HEIGHT }}
            >
              <div
                className="absolute right-0 top-0"
                style={{
                  height: HERO_VISUAL_DESIGN_HEIGHT,
                  transform: `scale(${MOBILE_VISUAL_HEIGHT / HERO_VISUAL_DESIGN_HEIGHT})`,
                  transformOrigin: "top right",
                }}
              >
                {/* Sin onCycleStart aquí: solo la instancia de desktop dispara el texto rotativo (ver más abajo), para no disparar el swap varias veces por ciclo si hay más de una instancia montada a la vez. */}
                <HeroAjaxPulseVisual />
              </div>
            </div>

            <div className="px-4 sm:px-6 md:px-0">
              <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center md:justify-start">
                <Link
                  href="/products"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-10 w-full gap-2 rounded-full bg-primary px-8 font-semibold text-primary-foreground transition hover:scale-[1.02] hover:bg-primary sm:h-11 sm:w-auto",
                  )}
                >
                  {t("Comprar ahora", "Shop now")}
                </Link>
                <Link
                  href={`tel:${contact.phoneTel}`}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-10 w-full gap-2 rounded-full border-border bg-white px-5 font-semibold text-foreground transition hover:bg-muted/60 sm:h-11 sm:w-auto",
                  )}
                  aria-label={`${t("Llamar al", "Call")} ${contact.phoneDisplay}`}
                >
                  <Phone
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  {contact.phoneDisplay}
                </Link>
              </div>

              {/*
                Solo en tablet (md) esta lista se sale del ancho de la columna (48% del
                grid) para ocupar el ancho completo — 100/48 ≈ 208.34%, ya que la columna
                está anclada a la izquierda (sin mx-auto), así crece hacia la derecha sin
                necesitar reposicionarse. En mobile y desktop (lg/xl) queda igual que antes.
              */}
              <div className="mt-9 md:w-[208.34%] lg:w-auto lg:pr-20 xl:pr-28">
                <p className="text-[16px] font-bold uppercase tracking-wider text-foreground">
                  {t("Explorar por categorías", "Browse by category")}
                </p>
                <ul className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                  {categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/catalog/${c.slug}`}
                        prefetch={false}
                        aria-label={`${t("Ver productos en", "View products in")} ${t(c.name, c.nameEn)}`}
                        className="inline-flex items-center rounded-full border border-border bg-white px-4 py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        {t(c.name, c.nameEn)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*
        Visual animado para tablet (md): mismo componente que desktop, reducido con scale()
        (ver comentario del bloque de mobile más arriba) para caber en TABLET_VISUAL_HEIGHT.
        Se sale del contenedor centrado para quedar pegado al borde derecho real de la
        ventana, igual que hacía antes la imagen fija hero_md.svg.
      */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden md:block lg:hidden"
        style={{ height: TABLET_VISUAL_HEIGHT }}
      >
        <div
          className="absolute right-0 top-0"
          style={{
            height: HERO_VISUAL_DESIGN_HEIGHT,
            transform: `scale(${TABLET_VISUAL_HEIGHT / HERO_VISUAL_DESIGN_HEIGHT})`,
            transformOrigin: "top right",
          }}
        >
          {/* Sin onCycleStart aquí tampoco, por la misma razón que en mobile. */}
          <HeroAjaxPulseVisual />
        </div>
      </div>

      {/*
        Visual animado para desktop (lg): círculos que "respiran" (se achican y bajan cada
        5s, 1.2s de transición) igual que el prototipo de Figma "Desktop Ajax" ⇄
        "Desktop Camara" (node-id 323:1185 / 323:1723). Alto fijo, pegado arriba: los
        últimos 40px de la sección quedan libres para que la tira de confianza flotante
        (que sube con -mt-10 desde la sección siguiente) no quede detrás de la imagen.
      */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden h-[500px] lg:block">
        <div className="mx-auto flex h-full w-full max-w-7xl justify-end md:px-8">
          <HeroAjaxPulseVisual
            onCycleStart={() => labelTriggerRef.current?.()}
          />
        </div>
      </div>
    </section>
  );
}
