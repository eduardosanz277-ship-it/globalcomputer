import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdminUserService } from "@/modules/auth/auth.service";
import { repoUpdateStoreOrderStatus } from "@/modules/commerce/store-orders.admin.service";

const statusSchema = z.union([
  z.literal("pending"),
  z.literal("confirmed"),
  z.literal("processing"),
  z.literal("shipping"),
  z.literal("completed"),
  z.literal("cancelled"),
]);

const bodySchema = z.object({
  orderId: z.string().uuid(),
  status: statusSchema,
  amountShipping: z.number().positive().optional(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  try {
    const admin = await ensureAdminUserService();
    const updated = await repoUpdateStoreOrderStatus(
      parsed.data.orderId,
      parsed.data.status,
      parsed.data.amountShipping,
      admin.id,
    );
    return NextResponse.json({ ok: true, order: updated });
  } catch (error) {
    console.error("admin/store-orders status", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
    if (msg === "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    }
    if (msg === "SHIPPING_AMOUNT_REQUIRED") {
      return NextResponse.json(
        {
          error:
            "Para confirmar un pedido manual pendiente debes indicar el monto de envío.",
          code: "SHIPPING_AMOUNT_REQUIRED",
        },
        { status: 400 },
      );
    }
    if (msg === "STATUS_NOT_ALLOWED") {
      return NextResponse.json(
        {
          error:
            "Los pedidos con pago Stripe no admiten los estados pendiente ni cancelado.",
          code: "STATUS_NOT_ALLOWED",
        },
        { status: 400 },
      );
    }
    if (msg === "MANUAL_CONFIRM_REQUIRED") {
      return NextResponse.json(
        {
          error:
            "Los pedidos manuales pendientes deben confirmarse antes de pasar a otro estado.",
          code: "MANUAL_CONFIRM_REQUIRED",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "No se pudo actualizar el estado." },
      { status: 500 },
    );
  }
}
