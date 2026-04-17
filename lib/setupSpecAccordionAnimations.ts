/**
 * Configura el estado visual de los bloques `.spec-accordion-block`.
 *
 * El usuario pidió quitar cualquier efecto de expansión/colapso, así que
 * dejamos el cambio instantáneo y solo sincronizamos el layout.
 *
 * Compatible con cualquier versión del HTML serializado (antiguo o nuevo).
 *
 * @returns función de limpieza que elimina todos los listeners añadidos.
 */
export function setupSpecAccordionAnimations(container: HTMLElement): () => void {
  const cleanups: Array<() => void> = [];

  const details = container.querySelectorAll<HTMLDetailsElement>(
    "details.spec-accordion-block",
  );

  details.forEach((detail) => {
    const summary = detail.querySelector<HTMLElement>(":scope > summary");
    // Primer hijo que NO es summary = contenedor del cuerpo
    const body = Array.from(detail.children).find(
      (el) => el.tagName.toLowerCase() !== "summary",
    ) as HTMLElement | undefined;

    if (!summary || !body) return;

    // El primer hijo del body necesita min-height:0 para que el grid trick funcione
    const inner = body.firstElementChild as HTMLElement | null;
    if (inner) {
      inner.style.overflow = "hidden";
      inner.style.minHeight = "0";
    }

    const syncState = () => {
      body.style.display = "grid";
      body.style.overflow = "hidden";
      body.style.gridTemplateRows = detail.open ? "1fr" : "0fr";
      body.style.opacity = detail.open ? "1" : "0";
      body.style.transition = "none";
    };

    syncState();

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      detail.open = !detail.open;
      syncState();
    };

    summary.addEventListener("click", handleClick);
    cleanups.push(() => {
      summary.removeEventListener("click", handleClick);
    });
  });

  return () => cleanups.forEach((c) => c());
}
