import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdminUserService } from "@/modules/auth/auth.service";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { processOrderInventory } from "@/modules/commerce/inventory.service";
import { maybeSendStoreOrderConfirmationEmail } from "@/modules/commerce/store-order-confirmation-email.service";
import { recordStoreOrderStatusChange } from "@/modules/commerce/store-order-status-history";

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

  const { orderId } = parsed.data;

  try {
    const admin = await ensureAdminUserService();
    const supabase = createSupabaseAdminClient();

    // Verify it's actually a conflict order
    const { data: order, error: fetchError } = await supabase
      .from("store_orders")
      .select("id, status, inventory_status")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    }

    if (order.inventory_status !== "conflict") {
      return NextResponse.json(
        { error: "Este pedido no tiene un conflicto de inventario activo.", code: "NO_CONFLICT" },
        { status: 400 },
      );
    }

    // Retry inventory processing (RPC handles idempotency: no movements exist for conflict orders)
    const result = await processOrderInventory(orderId, supabase);

    if (result.status === "success") {
      // Audit record (Punto 6)
      await recordStoreOrderStatusChange({
        orderId,
        status: order.status as never,
        previousStatus: order.status as never,
        changedBy: admin.id,
        note: "Inventory manually reprocessed by the admin after resolving stock conflict.",
        supabase,
      });

      // Send confirmation email now that inventory is resolved
      try {
        await maybeSendStoreOrderConfirmationEmail({ orderId, supabase });
      } catch (emailErr) {
        console.error("[reprocess] error enviando email de confirmación", emailErr);
      }

      return NextResponse.json({ ok: true, status: "success" });
    }

    if (result.status === "conflict") {
      return NextResponse.json(
        {
          ok: false,
          status: "conflict",
          conflicts: result.conflicts,
          error: "El inventario sigue siendo insuficiente.",
          code: "STILL_CONFLICT",
        },
        { status: 409 },
      );
    }

    if (result.status === "already_processed") {
      return NextResponse.json(
        {
          ok: false,
          status: "already_processed",
          error: "El inventario ya fue procesado anteriormente.",
          code: "ALREADY_PROCESSED",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, status: "error", error: result.error ?? "Error desconocido." },
      { status: 500 },
    );
  } catch (error) {
    console.error("admin/store-orders reprocess-inventory", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
    return NextResponse.json({ error: "No se pudo reprocesar el inventario." }, { status: 500 });
  }
}
