import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import {
  getStorefrontProductsByIds,
  type StorefrontProduct,
} from "@/modules/catalog/storefront-products.service";

/** Accesorios vinculados a un producto (orden definido por el admin en `product_accessories.sort_order`). */
export async function listAccessoryStorefrontProducts(
  productId: string,
): Promise<StorefrontProduct[]> {
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("product_accessories")
    .select("accessory_product_id, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return [];

  const orderedIds = data.map((row) => String(row.accessory_product_id));
  try {
    const products = await getStorefrontProductsByIds(orderedIds);
    const byId = new Map(products.map((p) => [p.id, p]));

    return orderedIds
      .map((id) => byId.get(id))
      .filter((p): p is StorefrontProduct => Boolean(p));
  } catch {
    return [];
  }
}
