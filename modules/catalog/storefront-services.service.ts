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
  name_en: string | null;
  slug: string;
  short_description: string | null;
  short_description_en: string | null;
  description: string | null;
  description_en: string | null;
  banner_mobile_url: string | null;
  banner_tablet_url: string | null;
  banner_desktop_url: string | null;
  images: ServiceImageRow[];
};

const SERVICE_SELECT =
  "id, name, name_en, slug, short_description, short_description_en, description, description_en, banner_mobile_url, banner_tablet_url, banner_desktop_url, service_images(id, url, is_primary, sort_order)";

function mapService(data: {
  id: string;
  name: string;
  name_en: string | null;
  slug: string | null;
  short_description: string | null;
  short_description_en: string | null;
  description: string | null;
  description_en: string | null;
  banner_mobile_url: string | null;
  banner_tablet_url: string | null;
  banner_desktop_url: string | null;
  service_images: ServiceImageRow[] | null;
}): StorefrontService {
  return {
    id: data.id,
    name: data.name,
    name_en: data.name_en ?? null,
    slug: data.slug ?? slugify(data.name),
    short_description: data.short_description ?? null,
    short_description_en: data.short_description_en ?? null,
    description: data.description,
    description_en: data.description_en ?? null,
    banner_mobile_url: data.banner_mobile_url ?? null,
    banner_tablet_url: data.banner_tablet_url ?? null,
    banner_desktop_url: data.banner_desktop_url ?? null,
    images: (data.service_images ?? []) as ServiceImageRow[],
  };
}

export async function getServiceBySlug(
  slug: string,
): Promise<StorefrontService | null> {
  const normalizedSlug = slugify(slug);
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("services")
    .select(SERVICE_SELECT)
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error) {
    console.warn("[storefront] getServiceBySlug", normalizedSlug, error.message);
    return null;
  }
  if (!data) return null;
  return mapService(data);
}

export async function getServiceById(
  id: string,
): Promise<StorefrontService | null> {
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("services")
    .select(SERVICE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.warn("[storefront] getServiceById", id, error.message);
    return null;
  }
  if (!data) return null;
  return mapService(data);
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
