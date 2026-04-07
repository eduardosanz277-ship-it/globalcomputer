/** Etiquetas de color para stock (tipografía y padding van en el componente, alineados al badge de %). */
export function stockBadgeClass(stock: number): {
  label: string;
  className: string;
} {
  if (stock <= 0) {
    return {
      label: "Agotado",
      className:
        "bg-neutral-600 text-white dark:bg-neutral-600 dark:text-white",
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
    };
  }
  return {
    label: "En stock",
    className: "bg-emerald-600/95 text-white dark:bg-emerald-600/95",
  };
}
