/** Etiquetas de color para stock (tipografía y padding van en el componente, alineados al badge de %). */
export function stockBadgeClass(stock: number): {
  label: string;
  className: string;
  /** Badge bajo el precio en tarjetas: borde suave, texto 12–13px / peso 500 en el componente. */
  cardLabelClassName: string;
} {
  if (stock <= 0) {
    return {
      label: "Agotado",
      className:
        "bg-neutral-600 text-white dark:bg-neutral-600 dark:text-white",
      cardLabelClassName:
        "border border-neutral-400 bg-neutral-200/80 text-neutral-900 dark:border-neutral-500 dark:bg-neutral-950/70 dark:text-neutral-400",
    };
  }
  if (stock <= 5) {
    return {
      label:
        stock === 1
          ? "Solo 1 disponible"
          : `Solo ${stock} disponibles`,
      className:
        "bg-amber-500/95 text-white dark:bg-amber-600/95",
      cardLabelClassName:
        "border border-[#D97706]/40 bg-[#D97706]/10 text-[#D97706] dark:border-[#D97706]/45 dark:bg-[#D97706]/15",
    };
  }
  return {
    label: "En stock",
    className: "bg-emerald-600/95 text-white dark:bg-emerald-600/95",
    cardLabelClassName:
      "border border-emerald-600/35 bg-emerald-500/[0.1] text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-400",
  };
}
