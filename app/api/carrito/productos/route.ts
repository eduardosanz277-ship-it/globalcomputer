import { NextResponse } from "next/server";
import { getStorefrontProductsByIds } from "@/modules/catalog/storefront-products.service";

/**
 * GET /api/carrito/productos?ids=uuid1,uuid2
 * Devuelve los productos activos para hidratar el carrito (localStorage).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }
  if (ids.length > 100) {
    return NextResponse.json({ error: "Demasiados ids" }, { status: 400 });
  }
  const products = await getStorefrontProductsByIds(ids);
  return NextResponse.json({ products });
}
