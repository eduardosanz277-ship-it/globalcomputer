# Next.js + Supabase Starter (App Router)

Proyecto base en **Next.js 14 (App Router) + TypeScript** con:

- **Supabase** (auth + perfiles + roles)
- **TailwindCSS**
- **shadcn/ui-like** componentes (`button`, `input`, `card`, `form`)
- **React-Toastify** para toasts
- **TanStack Table** para tablas dinámicas

## Requisitos previos

- Node.js 18+
- Cuenta y proyecto en Supabase

## Instalación

```bash
npm install
```

Crear un archivo `.env.local` copiando desde `.env.example`:

```bash
cp .env.example .env.local
```

Rellena:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## Scripts

```bash
npm run dev    # desarrollo (Turbopack)
npm run build  # build producción
npm run start  # servidor producción
npm run lint   # linting
```

## Migraciones SQL

En `supabase/migrations/` hay migraciones numeradas (`20250117100000` … `20250117100005`) que definen el **esquema base** (perfiles, productos, comercio, reseñas/suscripciones, RLS, auth en `public` y **`20250117100005`**: permisos `GRANT` en el esquema `public` para evitar error **42501** *permission denied for schema public* con la API).

**No** se incluyen migraciones que crearan o modificaran un **usuario admin por defecto** (seed/reset de admin en SQL); el admin se gestiona con el script opcional `pnpm run seed:admin` y la Admin API.

Para aplicar el esquema en un proyecto Supabase vinculado:

```bash
supabase link --project-ref <TU_REF>
supabase db push
```

Si tu base ya tenía aplicadas migraciones antiguas de admin, el historial en `supabase_migrations.schema_migrations` no se borra solo al quitar archivos del repo; en bases nuevas solo se aplicarán las migraciones que queden en la carpeta.

## Seed admin (opcional)

Para crear/actualizar el admin con la **Admin API** y sincronizar `public.profiles`:

1. En `.env.local`: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`, `ADMIN_ROLE`.
2. Ejecuta:

```bash
pnpm run seed:admin
```

Si la Admin API devuelve **User not found** para un usuario creado solo por SQL, el script intenta una RPC `seed_reset_auth_password_by_email` **solo si existe** en tu base. Si no la creaste, usa **Authentication → Users → Reset password** o vuelve a definir esa función en SQL.

El login en `/login` y `/admin/login` usa la **Server Action** `loginAction` (`signInWithPassword` en el servidor con `@supabase/ssr` + cookies). El archivo raíz **`proxy.ts`** (Next.js 16+) delega en `supabase/middleware.ts` para refrescar la sesión con `getUser()`.

### Auth: login falla aunque `auth.users` exista

Para login por email/contraseña suele hacer falta una fila en **`auth.identities`** con `provider = 'email'` y datos coherentes con `auth.users`. Si el usuario solo existía en SQL, revisa identidades y campos `aud` / `role` / `raw_app_meta_data` en `auth.users` según la documentación de Supabase.

Si el login sigue fallando, ejecuta **`pnpm run seed:admin`** o resetea la contraseña en el Dashboard.

### Login sigue fallando

1. **Aislar si es la app o las credenciales** (usa la misma URL y clave **anon/publishable** que en `.env.local`, no la service role):

   ```bash
   pnpm run test:auth
   ```

   - Si **falla aquí**, el problema es proyecto Supabase / contraseña / usuario (vuelve a `pnpm run seed:admin` o revisa *Authentication → Providers → Email*).
   - Si **funciona aquí** pero no en el navegador: reinicia `pnpm dev`, borra cookies del sitio y comprueba que no haya dos variables de entorno distintas entre terminal y Next.

2. Tras cambiar `.env.local`, **reinicia** el servidor de desarrollo.

3. En SQL Editor (mismo proyecto), comprueba bloqueos:

   ```sql
   select email, banned_until, email_confirmed_at
   from auth.users
   where email = 'admin@globalcomputer.com';
   ```

### `POST .../auth/v1/token?grant_type=password` → 400 (Bad Request) en el navegador

Si el login falla **solo en el navegador** pero **`pnpm run test:auth`** funciona, suele ser la **clave publishable** / entorno del cliente. El login usa **`loginAction`** (Server Action): la petición a Auth se hace **desde el servidor** (Node), igual que el script de prueba.

Si **`test:auth`** devuelve **`invalid_credentials` / 400**, la contraseña **no coincide** con el hash en `auth.users` (no es un fallo de Next.js). En orden: (1) revisa `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env.local` (caracteres `#` comentan el resto de la línea; usa comillas si hace falta); (2) `pnpm run seed:admin`; (3) vuelve a `pnpm run test:auth`; (4) si sigue igual, en el Dashboard **Authentication → Users** usa **Reset password** para ese usuario.

### Dashboard: filtros por email / teléfono

El panel indexa búsquedas por `auth.users` e `auth.identities`. Normaliza emails en minúsculas y alinea `identity_data` con el email del usuario si el filtro no encuentra la cuenta. **El filtro “Phone”** solo aplica si el usuario tiene teléfono.

## Despliegue en Vercel

- Este proyecto está preparado para desplegarse directamente en **Vercel**:
  1. Sube el repo a GitHub/GitLab/Bitbucket.
  2. En Vercel, crea un nuevo proyecto apuntando a este repo.
  3. Vercel detectará automáticamente **Next.js** y usará `npm run build` / `npm run start`.
  4. Configura en la sección **Environment Variables** de Vercel las mismas variables que en `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
  5. Lanza el deploy.

No necesitas configuración extra: App Router, Server Actions y SSR funcionan de forma nativa en Vercel.

## Estructura principal

- `app/` → rutas y Server Actions
  - `app/layout.tsx` → layout raíz + `ToastContainer`
  - `app/page.tsx` → landing
  - `app/login` → login (ruta `/login`; `/auth/login` redirige aquí)
  - `app/register` → registro (ruta `/register`; `/auth/register` redirige aquí)
  - `app/auth/logout` → endpoint POST logout
  - Imágenes de **servicios** (Supabase Storage): ver `docs/supabase-storage-servicios.md` y migración `20250317120000_service_images_storage.sql`
  - **Marcas y tipos por marca**: migración `20250317130000_brands_and_brand_types.sql` — tablas `brands` (nombre) y `brand_types` (`brand_id` + `name`); en `products` la FK es `brand_type_id` (antes `product_types` / `product_type_id`).
  - `app/dashboard` → dashboard protegido + tabla TanStack Table
- `modules/` → lógica de negocio
  - `modules/auth/auth.schema.ts` → Zod schemas (login/registro)
  - `modules/auth/auth.types.ts` → tipos TS (roles, payloads)
  - `modules/auth/auth.repository.ts` → acceso a Supabase
  - `modules/auth/auth.service.ts` → lógica de negocio/validaciones
- `components/ui/` → componentes UI genéricos
  - `button`, `input`, `label`, `card`, `form`, `data-table`
- `lib/`
  - `supabaseClient.ts` → cliente browser
  - `supabaseServer.ts` → cliente server (Server Components/Actions)
- `hooks/`
  - `use-server-action.ts` → hook genérico para Server Actions + toasts
- `utils/`
  - `cn.ts` → helper de clases (`clsx` + `tailwind-merge`)

## Supabase: tablas y RLS recomendados

### Marcas (`brands`) y tipos por marca (`brand_types`)

- **`brands`**: `name` (único). Lectura pública; alta/edición/borrado solo **ADMIN** (`brands_all_admin`).
- **`brand_types`**: `brand_id` → `brands`, `name` (único por marca). Lectura pública; gestión solo **ADMIN**.
- **`products`**: columna **`brand_type_id`** referencia `brand_types` (sustituye el antiguo `product_type_id` / `product_types`).

### Tabla `profiles`

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'USER',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

Sincronizar perfil al registrarse (en Supabase → Auth → Hooks, o con Trigger):

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'USER');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

### RLS para `profiles`

```sql
alter table public.profiles enable row level security;

create policy "Profiles are readable by owner"
on public.profiles for select
using (auth.uid() = id);

create policy "Profiles are editable by owner"
on public.profiles for update
using (auth.uid() = id);
```

Para lógica de ADMIN podrías añadir una policy basada en `role = 'ADMIN'`.

### Tabla de ejemplo `items` (para la tabla del dashboard)

```sql
create table if not exists public.items (
  id bigserial primary key,
  name text not null,
  status text not null default 'active',
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.items enable row level security;

create policy "Users can see their own items"
on public.items for select
using (auth.uid() = user_id);
```

## Flujo de autenticación

- **Registro** (`/register`)
  - Valida datos con Zod (`registerSchema`)
  - Usa `registerService` → `auth.repository` → `supabase.auth.signUp`
  - Se crea perfil en `profiles` mediante trigger/función en Supabase
- **Login** (`/login`)
  - Valida datos con Zod (`loginSchema`)
  - Usa `loginService` → `repoLogin`
  - Hook `useServerAction` muestra toasts de éxito/error
- **Dashboard** (`/dashboard`)
  - Server Component que llama `getCurrentUserService`
  - Si no hay usuario, hace `redirect("/login")`
  - Muestra rol y datos de ejemplo desde tabla `items` en una `DataTable`

## Roles `USER` y `ADMIN`

- El campo `role` en `profiles` puede ser:
  - `USER` (por defecto en el registro)
  - `ADMIN` (asignar manualmente en la BD o mediante un flujo de administración)
- En `repoGetSessionUser` se lee `profiles.role` y se expone en `SessionUser`.
- A partir de ahí puedes:
  - Proteger rutas sólo para admins comprobando `user.role === "ADMIN"`.
  - Crear policies adicionales en Supabase para permitir ciertas operaciones sólo a `ADMIN`.

## Notas finales

- El proyecto está pensado para ser un **punto de partida**: añade más módulos bajo `modules/` con el mismo patrón (`*.schema.ts`, `*.types.ts`, `*.repository.ts`, `*.service.ts`).
- Todos los formularios pueden usar el hook `useServerAction` para conectar Server Actions con toasts de éxito/error.

