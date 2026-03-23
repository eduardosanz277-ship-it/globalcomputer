import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Vista ejemplo “Estado de envíos” (datos mock hasta conectar API). */
export default function AdminOrdersPage() {
  const rows = [
    {
      id: "ORD-5",
      client: "Cliente demo",
      delivery: "Delivery",
      status: "Pendiente",
      date: "17/03/2025 10:30",
      courier: "—",
      amount: "120.00",
      payment: "Tarjeta",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          Estado de envíos
        </h1>
        <p className="text-sm text-muted-foreground">
          Filtra por estado y pedido.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            defaultValue="pendiente"
            aria-label="Estado"
          >
            <option value="pendiente">Pendiente</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
          </select>
        </div>
        <Input
          className="max-w-xs"
          placeholder="Buscar pedido..."
          type="search"
          aria-label="Buscar pedido"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Envío</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Repartidor</th>
                <th className="px-4 py-3 font-medium">Importe</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium w-12" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/80 last:border-0">
                  <td className="px-4 py-3 font-medium">{r.id}</td>
                  <td className="px-4 py-3">{r.client}</td>
                  <td className="px-4 py-3">{r.delivery}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3">{r.courier}</td>
                  <td className="px-4 py-3">S/ {r.amount}</td>
                  <td className="px-4 py-3">{r.payment}</td>
                  <td className="px-4 py-3">
                    <Button size="icon" variant="ghost" aria-label="Ver detalle">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
