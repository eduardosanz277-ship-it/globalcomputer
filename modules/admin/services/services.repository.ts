import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  Service,
  ServiceBannerAsset,
  ServiceBannerBreakpoint,
  ServiceImage,
  ServiceInsert,
  ServiceUpdate,
} from "./services.types";

type ServiceRow = {
  id: string;
  name: string;
  name_en: string | null;
  short_description: string | null;
  short_description_en: string | null;
  description: string | null;
  description_en: string | null;
  slug: string;
  banner_mobile_url: string | null;
  banner_mobile_storage_bucket: string | null;
  banner_mobile_storage_path: string | null;
  banner_tablet_url: string | null;
  banner_tablet_storage_bucket: string | null;
  banner_tablet_storage_path: string | null;
  banner_desktop_url: string | null;
  banner_desktop_storage_bucket: string | null;
  banner_desktop_storage_path: string | null;
  service_images?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
};

const SERVICE_SELECT =
  "id, name, name_en, slug, short_description, short_description_en, description, description_en, banner_mobile_url, banner_mobile_storage_bucket, banner_mobile_storage_path, banner_tablet_url, banner_tablet_storage_bucket, banner_tablet_storage_path, banner_desktop_url, banner_desktop_storage_bucket, banner_desktop_storage_path, created_at, updated_at, service_images(id, url, is_primary, sort_order, created_at)";

function mapBanner(
  url: string | null,
  storageBucket: string | null,
  storagePath: string | null,
): ServiceBannerAsset {
  return {
    url: url?.trim() || null,
    storageBucket: storageBucket?.trim() || null,
    storagePath: storagePath?.trim() || null,
  };
}

function mapRow(row: ServiceRow): Service {
  const images: ServiceImage[] =
    row.service_images
      ?.slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({
        id: img.id,
        url: img.url,
        isPrimary: img.is_primary,
        sortOrder: img.sort_order,
      })) ?? [];
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0];
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? null,
    shortDescription: row.short_description ?? null,
    shortDescriptionEn: row.short_description_en ?? null,
    description: row.description,
    descriptionEn: row.description_en ?? null,
    imageUrl: primaryImage?.url ?? null,
    images,
    bannerMobile: mapBanner(
      row.banner_mobile_url,
      row.banner_mobile_storage_bucket,
      row.banner_mobile_storage_path,
    ),
    bannerTablet: mapBanner(
      row.banner_tablet_url,
      row.banner_tablet_storage_bucket,
      row.banner_tablet_storage_path,
    ),
    bannerDesktop: mapBanner(
      row.banner_desktop_url,
      row.banner_desktop_storage_bucket,
      row.banner_desktop_storage_path,
    ),
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function repoListServices(): Promise<Service[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("services")
    .select(SERVICE_SELECT)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as ServiceRow[]).map(mapRow);
}

export async function repoGetServiceById(id: string): Promise<Service | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("services")
    .select(SERVICE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapRow(data as ServiceRow);
}

export async function repoCreateService(payload: ServiceInsert): Promise<Service> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("services")
    .insert({
      name: payload.name,
      name_en: payload.nameEn,
      slug: payload.slug,
      short_description: payload.shortDescription || null,
      short_description_en: payload.shortDescriptionEn || null,
      description: payload.description || null,
      description_en: payload.descriptionEn || null,
    })
    .select(SERVICE_SELECT)
    .single();

  if (error) throw error;
  return mapRow(data as ServiceRow);
}

export async function repoUpdateService(
  id: string,
  payload: ServiceUpdate
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: payload.name,
      name_en: payload.nameEn,
      slug: payload.slug,
      short_description: payload.shortDescription || null,
      short_description_en: payload.shortDescriptionEn || null,
      description: payload.description || null,
      description_en: payload.descriptionEn || null,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function repoUpdateServiceBanner(
  serviceId: string,
  breakpoint: ServiceBannerBreakpoint,
  asset: ServiceBannerAsset,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const payload =
    breakpoint === "mobile"
      ? {
          banner_mobile_url: asset.url,
          banner_mobile_storage_bucket: asset.storageBucket,
          banner_mobile_storage_path: asset.storagePath,
        }
      : breakpoint === "tablet"
        ? {
            banner_tablet_url: asset.url,
            banner_tablet_storage_bucket: asset.storageBucket,
            banner_tablet_storage_path: asset.storagePath,
          }
        : {
            banner_desktop_url: asset.url,
            banner_desktop_storage_bucket: asset.storageBucket,
            banner_desktop_storage_path: asset.storagePath,
          };

  const { error } = await supabase
    .from("services")
    .update(payload)
    .eq("id", serviceId);
  if (error) throw error;
}

export async function repoDeleteService(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) throw error;
}

export async function repoInsertServiceImages(
  payload: Array<{
    serviceId: string;
    url: string;
    storageBucket: string;
    storagePath: string;
    isPrimary: boolean;
    sortOrder: number;
  }>
): Promise<void> {
  if (payload.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("service_images").insert(
    payload.map((item) => ({
      service_id: item.serviceId,
      url: item.url,
      storage_bucket: item.storageBucket,
      storage_path: item.storagePath,
      is_primary: item.isPrimary,
      sort_order: item.sortOrder,
    }))
  );
  if (error) throw error;
}

export async function repoUnsetPrimaryServiceImage(serviceId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("service_images")
    .update({ is_primary: false })
    .eq("service_id", serviceId)
    .eq("is_primary", true);
  if (error) throw error;
}

export async function repoGetNextServiceImageSortOrder(
  serviceId: string
): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("service_images")
    .select("sort_order")
    .eq("service_id", serviceId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.sort_order ?? -1) + 1;
}

export async function repoUpdateServiceImagesMetadata(
  serviceId: string,
  images: Array<{ id: string; order: number; isPrimary: boolean }>
): Promise<void> {
  if (images.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const hasPrimary = images.some((img) => img.isPrimary);
  const normalized = hasPrimary
    ? images
    : images.map((img, idx) => ({ ...img, isPrimary: idx === 0 }));

  /**
   * El índice único `idx_service_images_one_primary_per_service` solo permite
   * una fila con `is_primary = true` por servicio. Actualizar fila a fila puede
   * dejar dos filas en `true` entre UPDATEs y provocar 23505.
   * Solución: desmarcar todas las de este servicio y luego aplicar orden y principal.
   */
  const { error: clearErr } = await supabase
    .from("service_images")
    .update({ is_primary: false })
    .eq("service_id", serviceId);
  if (clearErr) throw clearErr;

  for (const img of normalized) {
    const { error } = await supabase
      .from("service_images")
      .update({
        sort_order: img.order,
        is_primary: img.isPrimary,
      })
      .eq("id", img.id)
      .eq("service_id", serviceId);
    if (error) throw error;
  }
}

export async function repoListServiceImageStorageRefsByIds(
  serviceId: string,
  imageIds: string[]
): Promise<Array<{ storageBucket: string; storagePath: string }>> {
  if (imageIds.length === 0) return [];
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("service_images")
    .select("storage_bucket, storage_path")
    .eq("service_id", serviceId)
    .in("id", imageIds);
  if (error) throw error;
  return (data ?? [])
    .map((row) => ({
      storageBucket: String((row as { storage_bucket?: unknown }).storage_bucket ?? ""),
      storagePath: String((row as { storage_path?: unknown }).storage_path ?? ""),
    }))
    .filter((row) => row.storageBucket && row.storagePath);
}

export async function repoDeleteServiceImagesByIds(
  serviceId: string,
  imageIds: string[]
): Promise<void> {
  if (imageIds.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("service_images")
    .delete()
    .eq("service_id", serviceId)
    .in("id", imageIds);
  if (error) throw error;
}
