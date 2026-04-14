import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type DashboardProductRow = {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  active: boolean;
};

type DashboardTableProps = {
  rows: DashboardProductRow[];
};

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Solo visibilidad en catálogo (`products.active`). El stock va en la columna Stock. */
function catalogStatusPill(active: boolean) {
  if (!active) {
    return (
      <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
        Inactivo
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      Activo
    </span>
  );
}

export function DashboardTable({ rows }: DashboardTableProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Actividad reciente</CardTitle>
        <CardDescription>
          Productos con cambio más reciente (orden por fecha de última
          actualización).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavia no hay productos para mostrar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-3 font-medium">Producto</th>
                  <th className="px-2 py-3 font-medium">Marca</th>
                  <th className="px-2 py-3 font-medium">Precio</th>
                  <th className="px-2 py-3 font-medium">Stock</th>
                  <th className="px-2 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    <td className="px-2 py-3 font-medium text-foreground">
                      {row.name}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {row.brand}
                    </td>
                    <td className="px-2 py-3">
                      {moneyFormatter.format(row.price)}
                    </td>
                    <td className="px-2 py-3">
                      {row.stock.toLocaleString("es-AR")}
                    </td>
                    <td className="px-2 py-3">
                      {catalogStatusPill(row.active)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
