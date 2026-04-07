import Link from "next/link";

export type MarketingBreadcrumbItem = {
  label: string;
  /** Obligatorio salvo en el último tramo (página actual). */
  href?: string;
};

type Props = {
  items: MarketingBreadcrumbItem[];
};

/**
 * Migas del storefront: `text-sm`, enlaces muted + hover, último tramo en negrita (mismo color).
 */
export function MarketingBreadcrumb({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Migas de pan"
      className="text-sm text-muted-foreground"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline">
            {i > 0 ? (
              <span className="mx-2" aria-hidden>
                /
              </span>
            ) : null}
            {isLast ? (
              <span className="font-bold text-muted-foreground">
                {item.label}
              </span>
            ) : (
              <Link href={item.href!} className="hover:text-foreground">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
