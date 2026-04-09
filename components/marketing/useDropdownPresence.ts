import { useEffect, useState } from "react";

/**
 * Solo anima la **apertura** (opacidad + translate). Al cerrar, desmonta al instante
 * (sin transición de salida).
 */
export function useDropdownPresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setEntered(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
    setMounted(false);
  }, [open]);

  return { mounted, entered };
}
