import { getAppBaseUrl } from "@/lib/app-url";
import type { OrderEmailLineItem } from "@/lib/email/templates/orderEmailBlocks";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

type OrderItemRow = {
  product_id?: string | null;
  product_name: string | null;
  product_sku?: string | null;
  quantity: number | null;
  unit_price: string | number | null;
  total_price: string | number | null;
};

function parseMoney(value: string | number | null | undefined): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(2));
}

export function buildOrderEmailProductPageUrl(
  slug: string | null | undefined,
  appUrl?: string,
): string | null {
  const trimmed = slug?.trim();
  if (!trimmed) return null;
  const base = (appUrl ?? getAppBaseUrl()).replace(/\/$/, "");
  return `${base}/products/${encodeURIComponent(trimmed)}`;
}

/** Resuelve slug → URL de ficha; el SKU nunca va en el enlace (solo el nombre). */
export async function mapOrderEmailLineItems(
  supabase: SupabaseAdmin,
  rows: OrderItemRow[],
  options?: { appUrl?: string; fallbackProductName?: string },
): Promise<OrderEmailLineItem[]> {
  const appUrl = options?.appUrl ?? getAppBaseUrl();
  const fallbackProductName = options?.fallbackProductName ?? "Producto";
  const list = Array.isArray(rows) ? rows : [];

  const productIds = [
    ...new Set(
      list
        .map((row) => String(row.product_id ?? "").trim())
        .filter(Boolean),
    ),
  ];

  const slugByProductId: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from("products")
      .select("id, slug")
      .in("id", productIds);
    if (error) {
      console.warn("[email] no se pudieron cargar slugs de producto", error.message);
    } else {
      for (const row of data ?? []) {
        const id = String(row.id ?? "").trim();
        const slug = String(row.slug ?? "").trim();
        if (id && slug) slugByProductId[id] = slug;
      }
    }
  }

  return list.map((row) => {
    const productId = String(row.product_id ?? "").trim();
    const productName =
      String(row.product_name ?? "").trim() || fallbackProductName;
    const productSku =
      typeof row.product_sku === "string" && row.product_sku.trim()
        ? row.product_sku.trim()
        : null;

    return {
      productName,
      productSku,
      productUrl: productId
        ? buildOrderEmailProductPageUrl(slugByProductId[productId], appUrl)
        : null,
      quantity: Number(row.quantity ?? 0),
      unitPrice: parseMoney(row.unit_price),
      totalPrice: parseMoney(row.total_price),
    };
  });
}
