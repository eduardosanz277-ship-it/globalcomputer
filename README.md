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
  - `app/auth/login` → login
  - `app/auth/register` → registro
  - `app/auth/logout` → endpoint POST logout
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

- **Registro** (`/auth/register`)
  - Valida datos con Zod (`registerSchema`)
  - Usa `registerService` → `auth.repository` → `supabase.auth.signUp`
  - Se crea perfil en `profiles` mediante trigger/función en Supabase
- **Login** (`/auth/login`)
  - Valida datos con Zod (`loginSchema`)
  - Usa `loginService` → `repoLogin`
  - Hook `useServerAction` muestra toasts de éxito/error
- **Dashboard** (`/dashboard`)
  - Server Component que llama `getCurrentUserService`
  - Si no hay usuario, hace `redirect("/auth/login")`
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

