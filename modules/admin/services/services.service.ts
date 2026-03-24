import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import {
  repoCreateService,
  repoDeleteServiceImagesByIds,
  repoDeleteService,
  repoGetNextServiceImageSortOrder,
  repoInsertServiceImages,
  repoListServiceImageStorageRefsByIds,
  repoListServices,
  repoUnsetPrimaryServiceImage,
  repoUpdateServiceImagesMetadata,
  repoUpdateService,
} from "./services.repository";
import type {
  ExistingServiceImageOutput,
  ServiceInsert,
  ServiceUpdate,
} from "./services.types";
import { serviceFormSchema } from "./services.schema";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

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

function sanitizeFileName(name: string) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return base || "image";
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

export async function getAllServicesService() {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoListServices();
}

export async function createServiceService(
  payload: ServiceInsert,
  imageFiles?: File[],
  primaryImageIndex = 0
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = serviceFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    const created = await repoCreateService(parsed.data);
    const validFiles = (imageFiles ?? []).filter((f) => f && f.size > 0);
    if (validFiles.length > 0) {
      const primaryIndex =
        primaryImageIndex >= 0 && primaryImageIndex < validFiles.length
          ? primaryImageIndex
          : 0;
      await uploadServiceImages(created.id, validFiles, primaryIndex);
    }
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
  removedImageIds?: string[]
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = serviceFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    await repoUpdateService(id, parsed.data);

    /**
     * Eliminar filas antes de actualizar orden/principal evita violar el índice único
     * de “una imagen principal por servicio” cuando aún existen en BD las filas borradas.
     */
    if ((removedImageIds ?? []).length > 0) {
      const refs = await repoListServiceImageStorageRefsByIds(id, removedImageIds ?? []);
      await repoDeleteServiceImagesByIds(id, removedImageIds ?? []);

      for (const ref of refs) {
        const { error } = await createSupabaseAdminClient().storage
          .from(ref.storageBucket)
          .remove([ref.storagePath]);
        if (error) {
          // eslint-disable-next-line no-console
          console.warn("No se pudo eliminar archivo de storage:", error.message);
        }
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
  } catch (e) {
    throw mapDbError(e, "No se pudo actualizar el servicio");
  }
}

export async function deleteServiceService(id: string) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  try {
    await repoDeleteService(id);
  } catch (e) {
    throw mapDbError(e, "No se pudo eliminar el servicio");
  }
}
