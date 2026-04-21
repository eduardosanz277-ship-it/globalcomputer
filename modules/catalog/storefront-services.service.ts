import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import { slugify } from "@/lib/slugify";

type ServiceImageRow = {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number | null;
};

export type StorefrontService = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  images: ServiceImageRow[];
};

export async function getServiceBySlug(
  slug: string,
): Promise<StorefrontService | null> {
  const normalizedSlug = slugify(slug);
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, slug, description, service_images(id, url, is_primary, sort_order)")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error) {
    console.warn("[storefront] getServiceBySlug", normalizedSlug, error.message);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug ?? slugify(data.name),
    description: data.description,
    images: (data.service_images ?? []) as ServiceImageRow[],
  };
}

export async function getServiceById(
  id: string,
): Promise<StorefrontService | null> {
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, slug, description, service_images(id, url, is_primary, sort_order)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.warn("[storefront] getServiceById", id, error.message);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug ?? slugify(data.name),
    description: data.description,
    images: (data.service_images ?? []) as ServiceImageRow[],
  };
}

export async function getServiceBySlugOrId(
  param: string,
): Promise<{ service: StorefrontService; source: "slug" | "id" } | null> {
  const slugService = await getServiceBySlug(param);
  if (slugService) return { service: slugService, source: "slug" };

  const idRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!idRe.test(param)) return null;

  const idService = await getServiceById(param);
  if (idService) return { service: idService, source: "id" };
  return null;
}
