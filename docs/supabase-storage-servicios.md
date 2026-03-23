# Supabase Storage — imágenes de servicios

La migración `20250317120000_service_images_storage.sql` crea el bucket **`global_bucket`** y amplía `public.service_images` con `storage_path`, `storage_bucket` e `is_primary`.

## Qué es “S3” en Supabase

- **Storage de Supabase** ya usa almacenamiento compatible con **S3** por debajo.
- En la app suele bastar el **cliente JS** (`supabase.storage.from('global_bucket').upload(...)`).
- La **API S3** (credenciales tipo Access Key / Secret para herramientas S3) es una opción del **Dashboard** (según plan/región): **Storage → S3** o documentación actual de tu proyecto.

## Configuración en el Dashboard (recomendado)

1. **Aplicar migraciones** (local o remoto):
   ```bash
   supabase db push
   # o
   supabase migration up
   ```
2. Tras la migración, en **Storage** debería aparecer el bucket **`global_bucket`** (público, límite ~5 MB, MIME de imagen).
3. Si creas el bucket a mano en lugar de la migración, usa el mismo **nombre** `global_bucket` y marca **Public** si quieres URLs públicas como en la migración.

## Variables de entorno (app Next.js)

Ya necesitas (como mínimo):

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (o anon key) | Cliente browser / subidas con sesión de usuario |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo **servidor** (si subes/borras sin JWT de usuario; evita exponerla al cliente) |

Las subidas con **política “solo ADMIN”** deben hacerse con un usuario autenticado cuyo `profiles.role = 'ADMIN'`, usando el cliente con su sesión (cookies), **o** con Service Role en una **Server Action** / **Route Handler** que valide admin antes de llamar a Storage.

## Flujo típico de subida (múltiples imágenes)

1. Admin sube archivo:
   - Ruta sugerida: `services/<service_id>/<uuid>.<ext>`
2. Tras `upload`, obtén la URL pública:
   - `getPublicUrl({ path: storage_path })` en bucket público.
3. Inserta fila en `service_images`:
   - `url` = URL pública
   - `storage_path` = misma ruta usada en `upload`
   - `storage_bucket` = `'global_bucket'`
   - `sort_order` = orden en galería
   - `is_primary` = una sola `true` por `service_id`

## Borrado

- Eliminar objeto: `storage.from('global_bucket').remove([storage_path])`
- Luego borrar la fila en `service_images` (o al revés según consistencia que quieras).

## CORS / local

- En local, Supabase CLI sirve API y Storage; si subes desde otro origen, revisa **Settings → API → CORS** en proyectos alojados.

## Resumen de la migración SQL

| Elemento | Descripción |
|----------|-------------|
| `service_images.is_primary` | Marca la imagen principal (única por servicio) |
| `service_images.storage_path` | Ruta dentro del bucket |
| `service_images.storage_bucket` | Por defecto `global_bucket` |
| Bucket `global_bucket` | Público, imágenes, 5 MB |
| RLS `storage.objects` | Lectura pública; escritura solo `is_admin()` |
| RLS `public.services` / `service_images` | **SELECT** público; mutaciones solo admin (políticas previas) |
