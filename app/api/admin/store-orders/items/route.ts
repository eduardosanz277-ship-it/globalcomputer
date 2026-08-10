import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdminUserService } from "@/modules/auth/auth.service";
import {
  repoGetAdminStoreOrderShippingAddress,
  repoListAdminStoreOrderItems,
} from "@/modules/commerce/store-orders.admin.service";

const bodySchema = z.object({
  orderId: z.string().uuid(),
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
    const [items, shippingAddress] = await Promise.all([
      repoListAdminStoreOrderItems(parsed.data.orderId),
      repoGetAdminStoreOrderShippingAddress(parsed.data.orderId),
    ]);
    return NextResponse.json({ items, shippingAddress });
  } catch (error) {
    console.error("admin/store-orders items", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "No se pudieron cargar los artículos." }, { status: 500 });
  }
}
