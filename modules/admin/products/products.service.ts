import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import { repoGetSubcategoryCategoryId } from "@/modules/admin/subcategories/subcategories.repository";
import {
  repoCreateProduct,
  repoDeleteProduct,
  repoDeleteProductImagesByIds,
  repoGetLastLowStockAlertAt,
  repoGetProductStockSnapshot,
  repoInsertProductImages,
  repoListProductImageUrlsByIds,
  repoListProducts,
  repoReplaceProductCharacteristicValues,
  repoUpsertLowStockAlertAt,
  repoUnsetPrimaryProductImage,
  repoUpdateProduct,
  repoUpdateProductManualPdfUrl,
  repoUpdateProductImagesMetadata,
} from "./products.repository";
import {
  productCharacteristicValueInputSchema,
  productFormSchema,
  type ProductFormValues,
} from "./products.schema";
import type {
  ExistingProductImageOutput,
  ProductCharacteristicValueInput,
  ProductInsert,
  ProductUpdate,
} from "./products.types";
import { slugify } from "@/lib/slugify";
import { sendLowStockAlertEmail } from "@/lib/email/sendLowStockAlertEmail";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

async function assertProductPlacementConsistent(data: ProductFormValues) {
  const sub = data.placementSubcategoryId?.trim();
  if (!sub) return;
  const parentId = await repoGetSubcategoryCategoryId(sub);
  if (!parentId || parentId !== data.placementCategoryId) {
    throw new Error(
      "La subcategoría no corresponde a la categoría elegida.",
    );
  }
}

/** PostgREST/Supabase suele devolver `{ message, code, details }` sin ser `instanceof Error`. */
function getSupabaseErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function getPostgresErrorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code?: unknown }).code;
    if (typeof c === "string" && c.length > 0) return c;
  }
  return undefined;
}

function mapDbError(err: unknown, fallback: string): Error {
  const msg = getSupabaseErrorMessage(err);
  const code = getPostgresErrorCode(err);

  if (
    code === "23505" ||
    /duplicate key|23505|unique constraint/i.test(msg)
  ) {
    if (/sku/i.test(msg)) {
      return new Error("Ya existe un producto con ese SKU.");
    }
    return new Error("Ya existe un producto con esa combinación de datos.");
  }
  if (
    code === "23503" ||
    /foreign key|23503|violates foreign key/i.test(msg)
  ) {
    return new Error(
      "No se puede guardar o eliminar el producto por relaciones vinculadas (marca, tipo, imágenes o características). Comprueba que el tipo por marca corresponda a la marca seleccionada.",
    );
  }
  if (code === "23502" || /null value|not null/i.test(msg)) {
    return new Error("Faltan datos obligatorios para guardar el producto.");
  }
  if (code === "23514" || /check constraint/i.test(msg)) {
    return new Error(
      "Los datos no cumplen las reglas de validación en la base de datos.",
    );
  }
  if (code === "42501" || /permission denied|row-level security|RLS/i.test(msg)) {
    return new Error("No tienes permiso para realizar esta operación.");
  }

  const detail =
    msg && !/^\[object Object\]$/.test(msg) ? `: ${msg}` : "";
  return new Error(`${fallback}${detail}`);
}

/**
 * Si hay archivo de manual, la URL definitiva la fija el upload al bucket.
 * No guardar en la misma operación un `manualPdfUrl` de formulario que pueda
 * contradecir ese archivo (p. ej. enlace externo + PDF subido).
 */
function mergeProductPayloadForManualPdfUpload(
  data: ProductInsert,
  manualPdfFile: File | null | undefined,
): ProductInsert {
  const hasUpload = Boolean(manualPdfFile && manualPdfFile.size > 0);
  if (!hasUpload) return data;
  return { ...data, manualPdfUrl: "" };
}

function resolveProductSlug(name: string): string {
  const normalized = slugify(name);
  return normalized || crypto.randomUUID();
}

const PRODUCT_IMAGES_BUCKET = "global_bucket";

async function getLowStockNotificationConfig() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_config")
    .select("key, value")
    .in("key", [
      "support_email",
      "low_stock_notifications_enabled",
      "notifications_enabled",
      "low_stock_threshold",
    ]);

  if (error) throw error;

  const map = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));

  const supportEmail =
    typeof map.support_email === "string" ? map.support_email.trim() : "";
  const lowStockEnabled =
    map.low_stock_notifications_enabled === true ||
    (map.low_stock_notifications_enabled === undefined &&
      map.notifications_enabled === true);
  const rawThreshold = map.low_stock_threshold;
  const parsedThreshold =
    typeof rawThreshold === "number"
      ? rawThreshold
      : typeof rawThreshold === "string"
        ? parseInt(rawThreshold, 10)
        : Number(rawThreshold);
  const threshold = Number.isFinite(parsedThreshold) ? parsedThreshold : 5;

  return {
    supportEmail,
    lowStockEnabled,
    threshold,
  };
}

async function notifyLowStockIfNeeded(params: {
  productId: string;
  productName: string;
  productSku: string;
  previousStock: number | null;
  newStock: number;
}) {
  const config = await getLowStockNotificationConfig();
  if (!config.lowStockEnabled) return;
  if (!config.supportEmail) return;
  if (params.newStock < 0) return;
  if (params.newStock > config.threshold) return;

  const crossedFromAbove =
    params.previousStock == null || params.previousStock > config.threshold;
  if (!crossedFromAbove) return;

  try {
    const now = new Date();
    const lastSentAtRaw = await repoGetLastLowStockAlertAt(params.productId);
    if (lastSentAtRaw) {
      const lastSentAtMs = new Date(lastSentAtRaw).getTime();
      if (Number.isFinite(lastSentAtMs)) {
        const diffMs = now.getTime() - lastSentAtMs;
        if (diffMs < 24 * 60 * 60 * 1000) {
          return;
        }
      }
    }

    await sendLowStockAlertEmail({
      to: config.supportEmail,
      productName: params.productName,
      productSku: params.productSku,
      stock: params.newStock,
      threshold: config.threshold,
    });
    await repoUpsertLowStockAlertAt(params.productId, now.toISOString());
  } catch (error) {
    console.error("[low-stock-email] Error enviando alerta:", error);
  }
}

function sanitizeFileName(name: string) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return base || "image";
}

function extractStoragePathFromPublicUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  const tail = url.slice(idx + marker.length);
  const expectedPrefix = `${PRODUCT_IMAGES_BUCKET}/`;
  if (!tail.startsWith(expectedPrefix)) return null;
  const encodedPath = tail.slice(expectedPrefix.length);
  if (!encodedPath) return null;
  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return encodedPath;
  }
}

async function removeStoredObjectsByPublicUrls(urls: Array<string | null | undefined>) {
  const toRemove = urls
    .map((url) => (url ? extractStoragePathFromPublicUrl(url) : null))
    .filter((v): v is string => Boolean(v));
  if (toRemove.length === 0) return;

  const { error } = await createSupabaseAdminClient().storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove(toRemove);
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("No se pudieron eliminar archivos del storage:", error.message);
  }
}

async function uploadProductImages(
  productId: string,
  imageFiles: File[],
  primaryIndex: number,
) {
  if (imageFiles.length === 0) return;

  const supabase = createSupabaseAdminClient();
  const uploaded: Array<{ productId: string; url: string; isPrimary: boolean }> = [];

  for (const [idx, imageFile] of imageFiles.entries()) {
    if (!imageFile || imageFile.size <= 0) continue;

    const fileName = `${crypto.randomUUID()}-${sanitizeFileName(imageFile.name)}`;
    const storagePath = `products/${productId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, imageFile, {
        upsert: true,
        contentType: imageFile.type || undefined,
      });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(storagePath);

    uploaded.push({
      productId,
      url: data.publicUrl,
      isPrimary: primaryIndex >= 0 && idx === primaryIndex,
    });
  }

  if (uploaded.length === 0) return;
  if (uploaded.some((item) => item.isPrimary)) {
    await repoUnsetPrimaryProductImage(productId);
  }
  await repoInsertProductImages(uploaded);
}

async function uploadProductManualPdf(
  productId: string,
  pdfFile: File,
): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const fileName = `${crypto.randomUUID()}-${sanitizeFileName(pdfFile.name)}`;
  const storagePath = `products/${productId}/manuals/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, pdfFile, {
      upsert: true,
      contentType: pdfFile.type || "application/pdf",
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

function parseCharacteristicValues(
  values: ProductCharacteristicValueInput[] | undefined,
) {
  const safe = values ?? [];
  const parsed: ProductCharacteristicValueInput[] = [];
  for (const row of safe) {
    const result = productCharacteristicValueInputSchema.safeParse({
      specificId: row.specificId,
      value: row.value ?? "",
    });
    if (!result.success) {
      throw new Error(
        result.error.errors[0]?.message ??
        "Característica específica inválida",
      );
    }
    parsed.push({
      specificId: result.data.specificId,
      value: result.data.value,
    });
  }
  return parsed;
}

export async function getAllProductsService() {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoListProducts();
}

export async function createProductService(
  payload: ProductInsert,
  imageFiles?: File[],
  primaryImageIndex = 0,
  characteristicValues?: ProductCharacteristicValueInput[],
  manualPdfFile?: File | null,
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);

  const parsed = productFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  await assertProductPlacementConsistent(parsed.data);

  const parsedCharacteristics = parseCharacteristicValues(characteristicValues);

  try {
    const payloadWithSlug = {
      ...parsed.data,
      slug: resolveProductSlug(parsed.data.name),
    };
    const created = await repoCreateProduct(
      mergeProductPayloadForManualPdfUpload(payloadWithSlug, manualPdfFile ?? null),
    );

    if (parsedCharacteristics.length > 0) {
      await repoReplaceProductCharacteristicValues(
        created.id,
        parsedCharacteristics,
      );
    }

    const validFiles = (imageFiles ?? []).filter((f) => f && f.size > 0);
    if (validFiles.length > 0) {
      const primaryIndex =
        primaryImageIndex >= 0 && primaryImageIndex < validFiles.length
          ? primaryImageIndex
          : 0;
      await uploadProductImages(created.id, validFiles, primaryIndex);
    }

    if (manualPdfFile && manualPdfFile.size > 0) {
      const manualUrl = await uploadProductManualPdf(created.id, manualPdfFile);
      await repoUpdateProductManualPdfUrl(created.id, manualUrl);
    }

    await notifyLowStockIfNeeded({
      productId: created.id,
      productName: created.name,
      productSku: created.sku,
      previousStock: null,
      newStock: created.stock,
    });

    return created;
  } catch (e) {
    throw mapDbError(e, "No se pudo crear el producto");
  }
}

export async function updateProductService(
  id: string,
  payload: ProductUpdate,
  imageFiles?: File[],
  primaryImageIndex = 0,
  updatedExistingImages?: ExistingProductImageOutput[],
  removedImageIds?: string[],
  characteristicValues?: ProductCharacteristicValueInput[],
  manualPdfFile?: File | null,
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);

  const parsed = productFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  await assertProductPlacementConsistent(parsed.data);

  const parsedCharacteristics = parseCharacteristicValues(characteristicValues);

  try {
    const before = await repoGetProductStockSnapshot(id);

    const payloadWithSlug = {
      ...parsed.data,
      slug: resolveProductSlug(parsed.data.name),
    };
    const mergedPayload = mergeProductPayloadForManualPdfUpload(
      payloadWithSlug,
      manualPdfFile ?? null,
    );
    await repoUpdateProduct(id, mergedPayload);

    if ((removedImageIds ?? []).length > 0) {
      const removedUrls = await repoListProductImageUrlsByIds(id, removedImageIds ?? []);
      await repoDeleteProductImagesByIds(id, removedImageIds ?? []);
      await removeStoredObjectsByPublicUrls(removedUrls);
    }

    if ((updatedExistingImages ?? []).length > 0) {
      await repoUpdateProductImagesMetadata(id, updatedExistingImages ?? []);
    }

    const validFiles = (imageFiles ?? []).filter((f) => f && f.size > 0);
    if (validFiles.length > 0) {
      const primaryIndex =
        primaryImageIndex >= 0 && primaryImageIndex < validFiles.length
          ? primaryImageIndex
          : -1;
      await uploadProductImages(id, validFiles, primaryIndex);
    }

    const previousManualPdfUrl = before?.manualPdfUrl ?? null;
    if (manualPdfFile && manualPdfFile.size > 0) {
      const manualUrl = await uploadProductManualPdf(id, manualPdfFile);
      await repoUpdateProductManualPdfUrl(id, manualUrl);
      if (previousManualPdfUrl && previousManualPdfUrl !== manualUrl) {
        await removeStoredObjectsByPublicUrls([previousManualPdfUrl]);
      }
    } else if (!mergedPayload.manualPdfUrl && previousManualPdfUrl) {
      await removeStoredObjectsByPublicUrls([previousManualPdfUrl]);
    }

    await repoReplaceProductCharacteristicValues(id, parsedCharacteristics);

    await notifyLowStockIfNeeded({
      productId: id,
      productName: payloadWithSlug.name,
      productSku: payloadWithSlug.sku,
      previousStock: before?.stock ?? null,
      newStock: payloadWithSlug.stock,
    });

  } catch (e) {
    throw mapDbError(e, "No se pudo actualizar el producto");
  }
}

export async function deleteProductService(id: string) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);

  try {
    await repoDeleteProduct(id);
  } catch (e) {
    throw mapDbError(e, "No se pudo eliminar el producto");
  }
}