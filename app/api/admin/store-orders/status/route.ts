import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdminUserService } from "@/modules/auth/auth.service";
import { repoUpdateStoreOrderStatus } from "@/modules/commerce/store-orders.admin.service";

const statusSchema = z.union([
  z.literal("confirmada"),
  z.literal("procesando"),
  z.literal("enviando"),
  z.literal("completada"),
]);

const bodySchema = z.object({
  orderId: z.string().uuid(),
  status: statusSchema,
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
    await ensureAdminUserService();
    await repoUpdateStoreOrderStatus(parsed.data.orderId, parsed.data.status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/store-orders status", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "No se pudo actualizar el estado." },
      { status: 500 },
    );
  }
}
