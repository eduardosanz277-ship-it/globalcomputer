"use client";

import { motion, useAnimation, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Animación del hero: 2 fotos que se alternan (pack Ajax / cluster de cámaras).
 *
 * Todo arranca a la vez, en CIRCLE_TRANSITION / SLIDE_TRANSITION (misma duración,
 * TRANSITION_SECONDS):
 *  - Los 3 círculos decorativos se encogen rápido y pasan el resto del tiempo volviendo a
 *    crecer (ver `times` en CIRCLE_TRANSITION) — el "in" de los círculos arranca mucho antes
 *    de que la foto termine de salir.
 *  - Al mismo tiempo que los círculos empiezan a encogerse, la foto actual empieza a salir
 *    deslizando hacia la derecha mientras la siguiente entra deslizando desde la derecha
 *    (nunca queda espacio en blanco).
 *
 * El borde derecho de la caja de recorte de la foto no es una línea recta: sigue el arco
 * exacto del círculo azul (PHOTO_BOX_CLIP_PATH), así el límite de recorte se confunde con
 * el propio círculo en vez de mostrarse como un corte recto.
 *
 * Se usan controles imperativos (useAnimation) para que la animación solo se dispare
 * cuando corresponde (nunca al montar la página) — al cargar, todo queda quieto en reposo
 * hasta que pasa el primer HOLD_MS.
 *
 * Posiciones/tamaños de los círculos y curva de easing sacados del prototipo real de
 * Figma (node-id 323:1185 / 323:1723). Las fotos quedan siempre por delante de los 3
 * círculos, con su borde derecho pinneado al borde derecho del círculo azul.
 */

const EASE_SMART_ANIMATE: [number, number, number, number] = [0.263, -0.008, 0, 0.999];
/** Duración de la cortina de la foto (salida+entrada). */
const TRANSITION_SECONDS = 1.4;
/**
 * Duración del pulso completo de los círculos (encogerse y volver a crecer). Igual a
 * TRANSITION_SECONDS a propósito: ambos arrancan juntos y terminan juntos (el "in" de los
 * círculos termina justo cuando la foto termina de salir/entrar), pero gracias al reparto
 * interno (`times` en CIRCLE_TRANSITION) el tramo de "in" en sí es más corto/ágil que el de
 * "out", así se siente más rápido aunque ambos ciclos completos duren lo mismo.
 */
const CIRCLE_DURATION_SECONDS = TRANSITION_SECONDS;
/** Se exporta para que otros elementos (ej. el texto rotativo de la categoría) sigan el mismo ritmo. */
export const HERO_CYCLE_HOLD_MS = 3000;
const HOLD_MS = HERO_CYCLE_HOLD_MS;
const CIRCLE_DELAY = 0;

const IMAGES = [
  "/images/hero/ajax_devices.png",
  "/images/hero/cameras_devices.png",
  "/images/hero/control.png",
  "/images/hero/soporte.png",
] as const;

/**
 * Todo el componente está pensado para una altura de 500px fija; con aspectRatio
 * 917.2/668 el root mide ≈686.53px de ancho. Estos valores en px (no %) son los mismos
 * porcentajes usados en toda la animación (10.6%, 30.55%, 61.11%, y el círculo BLUE de más
 * abajo) ya convertidos, para poder calcular a mano el arco de recorte de la foto.
 */
const ROOT_WIDTH_PX = 686.53;
const BOX_LEFT_PX = 0.106 * ROOT_WIDTH_PX;
const BOX_TOP_PX = 0.3055 * 500;
const BOX_WIDTH_PX = ROOT_WIDTH_PX - BOX_LEFT_PX - 0.1299 * ROOT_WIDTH_PX;
const BOX_HEIGHT_PX = 0.6111 * 500;
const SLIDE_DISTANCE_PX = BOX_WIDTH_PX;
/**
 * En vez de un borde recto, el lado derecho de la caja de recorte de la foto sigue
 * exactamente el arco del círculo azul (mismo centro y radio), como un path SVG:
 * línea recta arriba, arco hacia afuera y de vuelta hacia adentro copiando la curva del
 * círculo, línea recta abajo. Así el límite de recorte se confunde con el propio círculo
 * en vez de mostrarse como un corte recto — no hace falta "esconder" el borde en ningún
 * lado en particular, porque ya no hay borde recto que esconder.
 */
const BLUE_CENTER_X_PX = (0.3299 + 0.5402 / 2) * ROOT_WIDTH_PX;
const BLUE_CENTER_Y_PX = 0.187 * 500 + (0.5402 * ROOT_WIDTH_PX) / 2;
const BLUE_RADIUS_PX = (0.5402 * ROOT_WIDTH_PX) / 2;

function arcXAtY(y: number): number {
  const dy = y - BLUE_CENTER_Y_PX;
  const dx = Math.sqrt(Math.max(BLUE_RADIUS_PX * BLUE_RADIUS_PX - dy * dy, 0));
  return BLUE_CENTER_X_PX + dx;
}

const ARC_TOP_X = arcXAtY(BOX_TOP_PX) - BOX_LEFT_PX;
const ARC_BOTTOM_X = arcXAtY(BOX_TOP_PX + BOX_HEIGHT_PX) - BOX_LEFT_PX;

const PHOTO_BOX_CLIP_PATH = `path('M 0 0 L ${ARC_TOP_X} 0 A ${BLUE_RADIUS_PX} ${BLUE_RADIUS_PX} 0 0 1 ${ARC_BOTTOM_X} ${BOX_HEIGHT_PX} L 0 ${BOX_HEIGHT_PX} Z')`;

/** El pack Ajax queda más ancho que el de cámaras, así que se corre un poco más a la izquierda para no verse tan pegado al círculo azul. */
const EXTRA_RIGHT_INSET_PX: Record<(typeof IMAGES)[number], number> = {
  "/images/hero/ajax_devices.png": 0.049 * BOX_WIDTH_PX,
  "/images/hero/cameras_devices.png": 0,
  "/images/hero/control.png": 0,
  "/images/hero/soporte.png": 0.04 * BOX_WIDTH_PX,
};

/** El pack de cámaras queda flotando un poco alto respecto al pack Ajax; se baja un poco. */
const EXTRA_TRANSLATE_Y: Record<(typeof IMAGES)[number], string> = {
  "/images/hero/ajax_devices.png": "0px",
  "/images/hero/cameras_devices.png": "7px",
  "/images/hero/control.png": "0px",
  "/images/hero/soporte.png": "0px",
};

const EXTRA_TRANSLATE_X: Record<(typeof IMAGES)[number], string> = {
  "/images/hero/ajax_devices.png": "0px",
  "/images/hero/cameras_devices.png": "1px",
  "/images/hero/control.png": "0px",
  "/images/hero/soporte.png": "0px",
};

/** El tester de soporte queda más alto que ancho, así que se ve más grande que el resto dentro de la misma caja; se reduce un poco, anclado a la misma esquina inferior derecha. */
const EXTRA_SCALE: Record<(typeof IMAGES)[number], number> = {
  "/images/hero/ajax_devices.png": 1,
  "/images/hero/cameras_devices.png": 1,
  "/images/hero/control.png": 1,
  "/images/hero/soporte.png": 0.8,
};

type CircleSpec = {
  color: string;
  border?: string;
  big: { left: number; top: number; size: number };
  small: { left: number; top: number; size: number };
};

const RING: CircleSpec = {
  color: "transparent",
  border: "1px solid rgba(0,0,0,0.18)",
  big: { left: 27.04, top: 0, size: 72.94 },
  small: { left: 27.04, top: 73.5, size: 19.3 },
};

const GOLD: CircleSpec = {
  color: "#E2B65D",
  big: { left: 33.47, top: 12.43, size: 58.66 },
  small: { left: 33.47, top: 75.3, size: 12.87 },
};

const BLUE: CircleSpec = {
  color: "#0563A3",
  big: { left: 32.99, top: 18.7, size: 54.02 },
  small: { left: 33.04, top: 74.55, size: 13.3 },
};

/**
 * Cada círculo (RING/GOLD/BLUE) tiene DOS instancias en el DOM (A y B) que se turnan: en
 * todo momento una está "grande" (visible, en reposo) y la otra "chica" (opacidad 0,
 * escondida). En cada ciclo, la que estaba grande se desvanece por completo (encoge +
 * opacidad a 0, sin volver a crecer — nada de rebote) mientras la otra aparece (crece +
 * opacidad a 1) AL MISMO TIEMPO, con la misma duración — un cruce real entre dos círculos
 * en vez de una sola animación de ida y vuelta, igual que ya se hace con las 2 fotos.
 */
const CIRCLE_TRANSITION = {
  duration: CIRCLE_DURATION_SECONDS,
  delay: CIRCLE_DELAY,
  ease: EASE_SMART_ANIMATE,
};

const SLIDE_TRANSITION = { duration: TRANSITION_SECONDS, ease: EASE_SMART_ANIMATE };
/** Mismo timing exacto que SLIDE_TRANSITION, exportado para sincronizar el texto rotativo de categoría. */
export const HERO_CYCLE_SLIDE_TRANSITION = SLIDE_TRANSITION;

function circleBigStyle(spec: CircleSpec) {
  return {
    left: `${spec.big.left}%`,
    top: `${spec.big.top}%`,
    width: `${spec.big.size}%`,
    opacity: 1,
  };
}

function circleSmallStyle(spec: CircleSpec) {
  return {
    left: `${spec.small.left}%`,
    top: `${spec.small.top}%`,
    width: `${spec.small.size}%`,
    opacity: 0,
  };
}

export function HeroAjaxPulseVisual({
  className,
  onCycleStart,
}: {
  className?: string;
  /** Se llama justo al empezar cada ciclo, para que otros elementos (ej. el texto rotativo de categoría) se muevan exactamente en el mismo instante y nunca se desincronicen. */
  onCycleStart?: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);

  // Dos instancias por círculo (A/B) para el cruce real sin rebote — ver comentario arriba.
  const ringA = useAnimation();
  const ringB = useAnimation();
  const goldA = useAnimation();
  const goldB = useAnimation();
  const blueA = useAnimation();
  const blueB = useAnimation();
  const showingARef = useRef(true);

  const outControls = useAnimation();
  const inControls = useAnimation();

  const currentSrc = IMAGES[step % IMAGES.length];
  const nextSrc = IMAGES[(step + 1) % IMAGES.length];

  const onCycleStartRef = useRef(onCycleStart);
  useEffect(() => {
    onCycleStartRef.current = onCycleStart;
  }, [onCycleStart]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    let timeoutId: number;

    const runTransition = async () => {
      onCycleStartRef.current?.();

      if (showingARef.current) {
        void ringA.start(circleSmallStyle(RING), CIRCLE_TRANSITION);
        void goldA.start(circleSmallStyle(GOLD), CIRCLE_TRANSITION);
        void blueA.start(circleSmallStyle(BLUE), CIRCLE_TRANSITION);
        void ringB.start(circleBigStyle(RING), CIRCLE_TRANSITION);
        void goldB.start(circleBigStyle(GOLD), CIRCLE_TRANSITION);
        void blueB.start(circleBigStyle(BLUE), CIRCLE_TRANSITION);
      } else {
        void ringB.start(circleSmallStyle(RING), CIRCLE_TRANSITION);
        void goldB.start(circleSmallStyle(GOLD), CIRCLE_TRANSITION);
        void blueB.start(circleSmallStyle(BLUE), CIRCLE_TRANSITION);
        void ringA.start(circleBigStyle(RING), CIRCLE_TRANSITION);
        void goldA.start(circleBigStyle(GOLD), CIRCLE_TRANSITION);
        void blueA.start(circleBigStyle(BLUE), CIRCLE_TRANSITION);
      }
      showingARef.current = !showingARef.current;

      void outControls.start({ x: `${SLIDE_DISTANCE_PX}px` }, SLIDE_TRANSITION);
      await inControls.start({ x: "0px" }, SLIDE_TRANSITION);

      // La transición terminó: la foto "siguiente" pasa a ser la actual. Reseteamos las
      // capas al instante (sin animación) antes de que el próximo ciclo las reutilice.
      setStep((s) => s + 1);
      outControls.set({ x: "0px" });
      inControls.set({ x: `${SLIDE_DISTANCE_PX}px` });
    };

    const scheduleCycle = () => {
      timeoutId = window.setTimeout(() => {
        void runTransition().then(scheduleCycle);
      }, HOLD_MS);
    };

    scheduleCycle();
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  return (
    <div
      className={className}
      style={{ position: "relative", height: "100%", width: "auto", aspectRatio: "917.2 / 668" }}
      aria-hidden
    >
      <motion.div
        style={{
          position: "absolute",
          borderRadius: "9999px",
          border: RING.border,
          aspectRatio: "1 / 1",
          zIndex: 0,
          ...circleBigStyle(RING),
        }}
        animate={ringA}
      />
      <motion.div
        style={{
          position: "absolute",
          borderRadius: "9999px",
          border: RING.border,
          aspectRatio: "1 / 1",
          zIndex: 0,
          ...circleSmallStyle(RING),
        }}
        animate={ringB}
      />
      <motion.div
        style={{
          position: "absolute",
          borderRadius: "9999px",
          backgroundColor: GOLD.color,
          aspectRatio: "1 / 1",
          zIndex: 0,
          ...circleBigStyle(GOLD),
        }}
        animate={goldA}
      />
      <motion.div
        style={{
          position: "absolute",
          borderRadius: "9999px",
          backgroundColor: GOLD.color,
          aspectRatio: "1 / 1",
          zIndex: 0,
          ...circleSmallStyle(GOLD),
        }}
        animate={goldB}
      />
      <motion.div
        style={{
          position: "absolute",
          borderRadius: "9999px",
          backgroundColor: BLUE.color,
          aspectRatio: "1 / 1",
          zIndex: 0,
          ...circleBigStyle(BLUE),
        }}
        animate={blueA}
      />
      <motion.div
        style={{
          position: "absolute",
          borderRadius: "9999px",
          backgroundColor: BLUE.color,
          aspectRatio: "1 / 1",
          zIndex: 0,
          ...circleSmallStyle(BLUE),
        }}
        animate={blueB}
      />

      {/*
        El lado derecho de estas cajas ya no es una línea recta: sigue el arco del círculo
        azul (PHOTO_BOX_CLIP_PATH), así el límite de recorte se confunde con el propio
        círculo y la foto se ve deslizarse (entrar/salir) con normalidad, sin necesidad de
        esconderla detrás de los círculos.
      */}
      <div
        style={{
          position: "absolute",
          left: "10.6%",
          top: "30.55%",
          width: `${BOX_WIDTH_PX}px`,
          height: `${BOX_HEIGHT_PX}px`,
          overflow: "hidden",
          clipPath: PHOTO_BOX_CLIP_PATH,
          zIndex: 2,
        }}
      >
        <motion.div
          style={{ position: "absolute", inset: 0, x: "0px" }}
          animate={outControls}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              right: `${EXTRA_RIGHT_INSET_PX[currentSrc]}px`,
              transform: `translate(${EXTRA_TRANSLATE_X[currentSrc]}, ${EXTRA_TRANSLATE_Y[currentSrc]}) scale(${EXTRA_SCALE[currentSrc]})`,
              transformOrigin: "right bottom",
            }}
          >
            <Image
              src={currentSrc}
              alt=""
              fill
              className="object-contain object-right-bottom"
              sizes="(min-width: 1024px) 700px, 60vw"
              priority
            />
          </div>
        </motion.div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "10.6%",
          top: "30.55%",
          width: `${BOX_WIDTH_PX}px`,
          height: `${BOX_HEIGHT_PX}px`,
          overflow: "hidden",
          clipPath: PHOTO_BOX_CLIP_PATH,
          zIndex: 2,
        }}
      >
        <motion.div
          style={{ position: "absolute", inset: 0, x: `${SLIDE_DISTANCE_PX}px` }}
          animate={inControls}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              right: `${EXTRA_RIGHT_INSET_PX[nextSrc]}px`,
              transform: `translate(${EXTRA_TRANSLATE_X[nextSrc]}, ${EXTRA_TRANSLATE_Y[nextSrc]}) scale(${EXTRA_SCALE[nextSrc]})`,
              transformOrigin: "right bottom",
            }}
          >
            <Image
              src={nextSrc}
              alt=""
              fill
              className="object-contain object-right-bottom"
              sizes="(min-width: 1024px) 700px, 60vw"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
