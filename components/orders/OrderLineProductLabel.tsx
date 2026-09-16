import { cn } from "@/utils/cn";

type Props = {
  name: string;
  sku?: string | null;
  skuLabel?: string;
  className?: string;
  nameClassName?: string;
};

/** Nombre de producto + SKU en tablas y listas de detalle de pedido. */
export function OrderLineProductLabel({
  name,
  sku,
  skuLabel = "SKU",
  className,
  nameClassName,
}: Props) {
  const trimmedSku = sku?.trim();

  return (
    <div className={cn("min-w-0", className)}>
      <span className={cn("break-words", nameClassName)}>{name}</span>
      {trimmedSku ? (
        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
          {skuLabel}: {trimmedSku}
        </span>
      ) : null}
    </div>
  );
}
