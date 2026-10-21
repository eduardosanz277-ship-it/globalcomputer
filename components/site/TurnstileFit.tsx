"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import {
  Turnstile,
  type TurnstileInstance,
  type TurnstileProps,
} from "@marsidev/react-turnstile";

/** Ancho mínimo que Cloudflare impone al widget (también en modo `flexible`). */
const TURNSTILE_MIN_WIDTH = 300;
const TURNSTILE_HEIGHT = 65;

/**
 * Turnstile que ocupa el ancho del contenedor. Si el contenedor es más angosto
 * que el mínimo de Cloudflare (p. ej. móviles de 320px), escala el widget para
 * que no se desborde.
 */
export const TurnstileFit = forwardRef<TurnstileInstance, TurnstileProps>(
  function TurnstileFit(props, ref) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      const update = () => {
        const width = el.clientWidth;
        setScale(
          width > 0 && width < TURNSTILE_MIN_WIDTH
            ? width / TURNSTILE_MIN_WIDTH
            : 1,
        );
      };
      update();
      const observer = new ResizeObserver(update);
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    const scaled = scale < 1;

    return (
      <div
        ref={wrapRef}
        className="w-full max-w-full overflow-hidden"
        style={scaled ? { height: TURNSTILE_HEIGHT * scale } : undefined}
      >
        <div
          style={
            scaled
              ? {
                  width: TURNSTILE_MIN_WIDTH,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }
              : { width: "100%" }
          }
        >
          <Turnstile ref={ref} {...props} style={{ width: "100%" }} />
        </div>
      </div>
    );
  },
);
