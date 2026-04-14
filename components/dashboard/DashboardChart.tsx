import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartItem = {
  brand: string;
  total: number;
};

type DashboardChartProps = {
  items: ChartItem[];
};

function colorByIndex(index: number): string {
  const palette = [
    "bg-sky-500/80",
    "bg-indigo-500/80",
    "bg-violet-500/80",
    "bg-cyan-500/80",
    "bg-blue-500/80",
    "bg-emerald-500/80",
  ];
  return palette[index % palette.length];
}

export function DashboardChart({ items }: DashboardChartProps) {
  const maxValue = Math.max(...items.map((item) => item.total), 1);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Distribucion de productos por marca</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay datos de marcas para mostrar.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item, index) => {
              const width = (item.total / maxValue) * 100;
              return (
                <li key={item.brand} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.brand}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {item.total.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${colorByIndex(index)}`}
                      style={{ width: `${Math.max(width, 6)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
