import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

const DESCRIPTION_IMAGES_PREFIX = "products/description-content";

function sanitizeFileName(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return base || "image";
}

export type UploadDescriptionImageResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

/**
 * Sube una imagen al bucket público `global_bucket` (mismas políticas que
 * productos/servicios: admin autenticado). La ruta queda bajo
 * `products/description-content/` para organizar objetos del editor.
 *
 * Reutiliza el cliente browser (`lib/supabaseClient.ts`) con sesión de admin.
 */
export async function uploadProductDescriptionImage(
  file: File,
): Promise<UploadDescriptionImageResult> {
  if (!file || file.size <= 0) {
    return { ok: false, error: "Archivo vacío" };
  }

  const supabase = createSupabaseBrowserClient();
  const fileName = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const storagePath = `${DESCRIPTION_IMAGES_PREFIX}/${fileName}`;

  const { error } = await supabase.storage
    .from("global_bucket")
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
    });

  if (error) {
    return {
      ok: false,
      error: error.message || "No se pudo subir la imagen",
    };
  }

  const { data } = supabase.storage
    .from("global_bucket")
    .getPublicUrl(storagePath);

  return { ok: true, publicUrl: data.publicUrl };
}
