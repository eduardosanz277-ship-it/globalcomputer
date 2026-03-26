import { SearchX, Table2 } from "lucide-react";
import { cn } from "@/utils/cn";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: boolean;
  /**
   * `no-data`: tabla sin registros.
   * `no-match`: hay datos pero el filtro no devuelve filas.
   */
  variant?: "no-data" | "no-match";
  className?: string;
};

function EmptyStateIcon({ variant }: { variant: "no-data" | "no-match" }) {
  if (variant === "no-match") {
    return (
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-muted/40 shadow-sm"
        aria-hidden
      >
        <SearchX
          className="h-7 w-7 text-muted-foreground/85"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  return (
    <div
      className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-border/90 bg-muted/30"
      aria-hidden
    >
      <Table2 className="h-7 w-7 text-muted-foreground/80" strokeWidth={1.5} />
    </div>
  );
}

export function EmptyState({
  title = "No hay datos disponibles.",
  description = "",
  icon = true,
  variant = "no-data",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center text-muted-foreground",
        className,
      )}
    >
      {icon ? <EmptyStateIcon variant={variant} /> : null}

      <h3 className="font-medium text-foreground">{title}</h3>

      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
