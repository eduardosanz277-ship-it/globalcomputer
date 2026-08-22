"use client";

import { motion, useAnimation, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Animación del hero: 2 fotos que se alternan (pack Ajax / cluster de cámaras).
 *
 * Todo pasa en una sola transición simultánea de TRANSITION_SECONDS:
 *  - La foto actual sale deslizando hacia la derecha mientras la siguiente entra
 *    deslizando desde la derecha, al mismo tiempo (nunca queda espacio en blanco).
 *  - Los 3 círculos decorativos hacen su ciclo completo de encogerse/ocultarse y volver a
 *    crecer/aparecer DENTRO de esa misma ventana de tiempo: arrancan a encogerse en el
 *    instante en que la foto empieza a salir, y ya terminaron de reaparecer para cuando la
 *    foto que entra termina de asentarse.
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
/** Duración total de la transición simultánea (salida+entrada de foto = ciclo completo de círculos). */
const TRANSITION_SECONDS = 1.4;
const HOLD_MS = 3000;
const CIRCLE_DELAY = 0;

const IMAGES = [
  "/images/hero/ajax_devices.png",
  "/images/hero/cameras_devices.png",
] as const;

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

const CIRCLE_TRANSITION = {
  duration: TRANSITION_SECONDS,
  delay: CIRCLE_DELAY,
  times: [0, 0.2, 1],
  ease: [EASE_SMART_ANIMATE, EASE_SMART_ANIMATE],
};

const SLIDE_TRANSITION = { duration: TRANSITION_SECONDS, ease: EASE_SMART_ANIMATE };

function circleRestStyle(spec: CircleSpec): React.CSSProperties {
  return {
    left: `${spec.big.left}%`,
    top: `${spec.big.top}%`,
    width: `${spec.big.size}%`,
    opacity: 1,
  };
}

function circlePulseKeyframes(spec: CircleSpec) {
  return {
    left: [`${spec.big.left}%`, `${spec.small.left}%`, `${spec.big.left}%`],
    top: [`${spec.big.top}%`, `${spec.small.top}%`, `${spec.big.top}%`],
    width: [`${spec.big.size}%`, `${spec.small.size}%`, `${spec.big.size}%`],
    opacity: [1, 0, 1],
  };
}

export function HeroAjaxPulseVisual({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);

  const ringControls = useAnimation();
  const goldControls = useAnimation();
  const blueControls = useAnimation();
  const outControls = useAnimation();
  const inControls = useAnimation();

  const currentSrc = IMAGES[step % IMAGES.length];
  const nextSrc = IMAGES[(step + 1) % IMAGES.length];

  useEffect(() => {
    if (prefersReducedMotion) return;

    let timeoutId: number;

    const runTransition = async () => {
      void ringControls.start(circlePulseKeyframes(RING), CIRCLE_TRANSITION);
      void goldControls.start(circlePulseKeyframes(GOLD), CIRCLE_TRANSITION);
      void blueControls.start(circlePulseKeyframes(BLUE), CIRCLE_TRANSITION);
      void outControls.start({ x: "100%" }, SLIDE_TRANSITION);
      await inControls.start({ x: "0%" }, SLIDE_TRANSITION);

      // La transición terminó: la foto "siguiente" pasa a ser la actual. Reseteamos las
      // capas al instante (sin animación) antes de que el próximo ciclo las reutilice.
      setStep((s) => s + 1);
      outControls.set({ x: "0%" });
      inControls.set({ x: "100%" });
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
          ...circleRestStyle(RING),
        }}
        animate={ringControls}
      />
      <motion.div
        style={{
          position: "absolute",
          borderRadius: "9999px",
          backgroundColor: GOLD.color,
          aspectRatio: "1 / 1",
          zIndex: 0,
          ...circleRestStyle(GOLD),
        }}
        animate={goldControls}
      />
      <motion.div
        style={{
          position: "absolute",
          borderRadius: "9999px",
          backgroundColor: BLUE.color,
          aspectRatio: "1 / 1",
          zIndex: 0,
          ...circleRestStyle(BLUE),
        }}
        animate={blueControls}
      />

      {/* Borde derecho pinneado exactamente al borde derecho del círculo azul en reposo (32.99% + 54.02% = 87.01%), igual para las 2 fotos. */}
      <div
        style={{
          position: "absolute",
          left: "10.6%",
          right: "12.99%",
          top: "30.55%",
          height: "61.11%",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <motion.div
          style={{ position: "absolute", inset: 0, x: "0%" }}
          animate={outControls}
        >
          <Image
            src={currentSrc}
            alt=""
            fill
            className="object-contain object-right-bottom"
            sizes="(min-width: 1024px) 700px, 60vw"
            priority
          />
        </motion.div>

        <motion.div
          style={{ position: "absolute", inset: 0, x: "100%" }}
          animate={inControls}
        >
          <Image
            src={nextSrc}
            alt=""
            fill
            className="object-contain object-right-bottom"
            sizes="(min-width: 1024px) 700px, 60vw"
          />
        </motion.div>
      </div>
    </div>
  );
}
