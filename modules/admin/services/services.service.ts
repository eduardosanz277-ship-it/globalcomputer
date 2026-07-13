import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import {
  repoCreateService,
  repoDeleteServiceImagesByIds,
  repoDeleteService,
  repoGetNextServiceImageSortOrder,
  repoGetServiceById,
  repoInsertServiceImages,
  repoListServiceImageStorageRefsByIds,
  repoListServices,
  repoUnsetPrimaryServiceImage,
  repoUpdateServiceBanner,
  repoUpdateServiceImagesMetadata,
  repoUpdateService,
} from "./services.repository";
import type {
  ExistingServiceImageOutput,
  ServiceBannerAsset,
  ServiceBannerBreakpoint,
  ServiceBannerFiles,
  ServiceBannerRemovals,
  ServiceInsert,
  ServiceUpdate,
} from "./services.types";
import { serviceFormSchema } from "./services.schema";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { slugify } from "@/lib/slugify";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

function mapDbError(err: unknown, fallback: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/foreign key|23503|violates/i.test(msg)) {
    return new Error(
      "No se puede eliminar: existen imágenes u otros registros vinculados a este servicio."
    );
  }
  if (/23505|unique constraint|duplicate key/i.test(msg)) {
    return new Error(
      "Conflicto al guardar las imágenes (imagen principal). Si persiste, recarga e inténtalo de nuevo."
    );
  }
  return err instanceof Error ? err : new Error(fallback);
}

const SERVICE_IMAGES_BUCKET = "global_bucket";

const BANNER_BREAKPOINTS: ServiceBannerBreakpoint[] = [
  "mobile",
  "tablet",
  "desktop",
];

function sanitizeFileName(name: string) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return base || "image";
}

async function removeStorageObject(
  storageBucket: string | null | undefined,
  storagePath: string | null | undefined,
) {
  if (!storageBucket?.trim() || !storagePath?.trim()) return;
  const { error } = await createSupabaseAdminClient()
    .storage.from(storageBucket)
    .remove([storagePath]);
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("No se pudo eliminar archivo de storage:", error.message);
  }
}

async function uploadServiceImages(
  serviceId: string,
  imageFiles: File[],
  primaryIndex: number
) {
  if (imageFiles.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const baseSortOrder = await repoGetNextServiceImageSortOrder(serviceId);
  const uploaded: Array<{
    serviceId: string;
    url: string;
    storageBucket: string;
    storagePath: string;
    isPrimary: boolean;
    sortOrder: number;
  }> = [];

  for (const [idx, imageFile] of imageFiles.entries()) {
    if (!imageFile || imageFile.size <= 0) continue;
    const fileName = `${crypto.randomUUID()}-${sanitizeFileName(imageFile.name)}`;
    const storagePath = `services/${serviceId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(SERVICE_IMAGES_BUCKET)
      .upload(storagePath, imageFile, {
        upsert: true,
        contentType: imageFile.type || undefined,
      });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(SERVICE_IMAGES_BUCKET)
      .getPublicUrl(storagePath);

    uploaded.push({
      serviceId,
      url: data.publicUrl,
      storageBucket: SERVICE_IMAGES_BUCKET,
      storagePath,
      isPrimary: idx === primaryIndex,
      sortOrder: baseSortOrder + idx,
    });
  }

  if (uploaded.length === 0) return;
  if (uploaded.some((item) => item.isPrimary)) {
    await repoUnsetPrimaryServiceImage(serviceId);
  }
  await repoInsertServiceImages(uploaded);
}

function getBannerAsset(
  service: Awaited<ReturnType<typeof repoGetServiceById>>,
  breakpoint: ServiceBannerBreakpoint,
): ServiceBannerAsset {
  if (!service) {
    return { url: null, storageBucket: null, storagePath: null };
  }
  if (breakpoint === "mobile") return service.bannerMobile;
  if (breakpoint === "tablet") return service.bannerTablet;
  return service.bannerDesktop;
}

async function uploadServiceBanner(
  serviceId: string,
  breakpoint: ServiceBannerBreakpoint,
  file: File,
  previous: ServiceBannerAsset,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const fileName = `${breakpoint}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const storagePath = `services/${serviceId}/banners/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(SERVICE_IMAGES_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(SERVICE_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  await repoUpdateServiceBanner(serviceId, breakpoint, {
    url: data.publicUrl,
    storageBucket: SERVICE_IMAGES_BUCKET,
    storagePath,
  });

  if (
    previous.storagePath &&
    previous.storageBucket &&
    previous.storagePath !== storagePath
  ) {
    await removeStorageObject(previous.storageBucket, previous.storagePath);
  }
}

async function syncServiceBanners(
  serviceId: string,
  bannerFiles?: ServiceBannerFiles,
  bannerRemovals?: ServiceBannerRemovals,
) {
  const current = await repoGetServiceById(serviceId);

  for (const breakpoint of BANNER_BREAKPOINTS) {
    const file = bannerFiles?.[breakpoint] ?? null;
    const shouldRemove = Boolean(bannerRemovals?.[breakpoint]);
    const previous = getBannerAsset(current, breakpoint);

    if (file && file.size > 0) {
      await uploadServiceBanner(serviceId, breakpoint, file, previous);
      continue;
    }

    if (shouldRemove && previous.url) {
      await repoUpdateServiceBanner(serviceId, breakpoint, {
        url: null,
        storageBucket: null,
        storagePath: null,
      });
      await removeStorageObject(previous.storageBucket, previous.storagePath);
    }
  }
}

export async function getAllServicesService() {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoListServices();
}

export async function createServiceService(
  payload: ServiceInsert,
  imageFiles?: File[],
  primaryImageIndex = 0,
  bannerFiles?: ServiceBannerFiles,
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = serviceFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    const slug = slugify(parsed.data.name);
    const created = await repoCreateService({ ...parsed.data, slug });
    const validFiles = (imageFiles ?? []).filter((f) => f && f.size > 0);
    if (validFiles.length > 0) {
      const primaryIndex =
        primaryImageIndex >= 0 && primaryImageIndex < validFiles.length
          ? primaryImageIndex
          : 0;
      await uploadServiceImages(created.id, validFiles, primaryIndex);
    }
    await syncServiceBanners(created.id, bannerFiles);
    return created;
  } catch (e) {
    throw mapDbError(e, "No se pudo crear el servicio");
  }
}

export async function updateServiceService(
  id: string,
  payload: ServiceUpdate,
  imageFiles?: File[],
  primaryImageIndex = 0,
  updatedExistingImages?: ExistingServiceImageOutput[],
  removedImageIds?: string[],
  bannerFiles?: ServiceBannerFiles,
  bannerRemovals?: ServiceBannerRemovals,
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = serviceFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    const slug = slugify(parsed.data.name);
    await repoUpdateService(id, { ...parsed.data, slug });

    /**
     * Eliminar filas antes de actualizar orden/principal evita violar el índice único
     * de “una imagen principal por servicio” cuando aún existen en BD las filas borradas.
     */
    if ((removedImageIds ?? []).length > 0) {
      const refs = await repoListServiceImageStorageRefsByIds(id, removedImageIds ?? []);
      await repoDeleteServiceImagesByIds(id, removedImageIds ?? []);

      for (const ref of refs) {
        await removeStorageObject(ref.storageBucket, ref.storagePath);
      }
    }

    if ((updatedExistingImages ?? []).length > 0) {
      await repoUpdateServiceImagesMetadata(id, updatedExistingImages ?? []);
    }

    const validFiles = (imageFiles ?? []).filter((f) => f && f.size > 0);
    if (validFiles.length > 0) {
      const primaryIndex =
        primaryImageIndex >= 0 && primaryImageIndex < validFiles.length
          ? primaryImageIndex
          : 0;
      await uploadServiceImages(id, validFiles, primaryIndex);
    }

    await syncServiceBanners(id, bannerFiles, bannerRemovals);
  } catch (e) {
    throw mapDbError(e, "No se pudo actualizar el servicio");
  }
}

export async function deleteServiceService(id: string) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  try {
    const service = await repoGetServiceById(id);
    await repoDeleteService(id);
    if (service) {
      await removeStorageObject(
        service.bannerMobile.storageBucket,
        service.bannerMobile.storagePath,
      );
      await removeStorageObject(
        service.bannerTablet.storageBucket,
        service.bannerTablet.storagePath,
      );
      await removeStorageObject(
        service.bannerDesktop.storageBucket,
        service.bannerDesktop.storagePath,
      );
    }
  } catch (e) {
    throw mapDbError(e, "No se pudo eliminar el servicio");
  }
}
