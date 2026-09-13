# GlobalComputer

**Plataforma Full-Stack desarrollada con Next.js, TypeScript y Supabase**

GlobalComputer es una aplicación web Full-Stack desarrollada con **Next.js, TypeScript y Supabase**, utilizando una arquitectura modular orientada a la separación de responsabilidades, seguridad, mantenibilidad y escalabilidad.

El proyecto integra autenticación, perfiles y roles, panel administrativo, gestión de datos, validación de formularios, PostgreSQL, Row Level Security (RLS), almacenamiento de archivos, Server Actions, componentes reutilizables y flujos de CI/CD.

El objetivo del proyecto es aplicar buenas prácticas de desarrollo Full-Stack en una aplicación real, manteniendo separadas la interfaz de usuario, la lógica de negocio, la validación y el acceso a datos.

---

## 🚀 Tecnologías

### Frontend

* **Next.js 14+** — App Router
* **React**
* **TypeScript**
* **Tailwind CSS**
* **shadcn/ui-like components**
* **React Toastify**
* **TanStack Table**

### Backend y datos

* **Next.js Server Actions**
* **Supabase**
* **PostgreSQL**
* **Supabase Auth**
* **Supabase Storage**
* **Row Level Security (RLS)**

### Arquitectura y validación

* **Zod**
* Arquitectura modular
* Repository Pattern
* Service Layer
* Separación de responsabilidades
* Validación de datos en servidor

### DevOps

* **Git**
* **GitHub Actions**
* **Vercel**
* Migraciones SQL
* Variables de entorno
* CI/CD

---

# ✨ Funcionalidades principales

## 🔐 Autenticación y autorización

El sistema implementa autenticación mediante **Supabase Auth** y autorización basada en roles.

Incluye:

* Registro de usuarios
* Login mediante email y contraseña
* Gestión de sesiones
* Perfiles de usuario
* Roles `USER` y `ADMIN`
* Rutas protegidas
* Autorización del lado del servidor
* Sincronización entre `auth.users` y `public.profiles`
* Cookies para mantener las sesiones
* Server Actions para operaciones de autenticación

---

## 👤 Perfiles y roles

Los usuarios disponen de un perfil asociado a su cuenta de Supabase.

Los roles actualmente definidos son:

```text
USER
ADMIN
```

El rol se almacena en `public.profiles` y se utiliza para determinar el acceso a funcionalidades administrativas.

La arquitectura permite extender posteriormente el sistema con permisos más específicos.

---

# 🛡️ Seguridad

La aplicación implementa diferentes capas de seguridad.

### Autenticación

La identidad de los usuarios es gestionada mediante **Supabase Auth**.

### Autorización

Las operaciones protegidas se validan mediante:

* Sesiones autenticadas
* Roles
* Comprobaciones del lado del servidor
* Rutas protegidas
* Políticas RLS

### Row Level Security

Las tablas de PostgreSQL utilizan **Row Level Security (RLS)** para controlar qué información puede consultar o modificar cada usuario.

Esto proporciona una capa adicional de protección directamente en la base de datos.

### Validación

Los datos provenientes del cliente se validan utilizando **Zod** antes de ejecutar la lógica de negocio.

### Variables de entorno

Las credenciales y configuraciones sensibles se mantienen mediante variables de entorno.

La `SUPABASE_SERVICE_ROLE_KEY` se utiliza exclusivamente en operaciones del lado del servidor y nunca debe exponerse al cliente.

---

# 🏗️ Arquitectura

El proyecto utiliza una arquitectura modular que separa las diferentes responsabilidades de la aplicación.

La estructura principal es:

```text
app/
├── rutas
├── páginas
└── Server Actions

modules/
├── auth/
│   ├── auth.schema.ts
│   ├── auth.types.ts
│   ├── auth.repository.ts
│   └── auth.service.ts
│
└── otros módulos de negocio

components/
└── ui/

lib/

hooks/

utils/

supabase/
└── migrations/

docs/

scripts/

.github/
└── workflows/
```

La lógica de negocio se organiza dentro de `modules/`, evitando colocar acceso a datos y reglas de negocio directamente dentro de los componentes de React.

---

# 🧩 Patrón utilizado por los módulos

Los módulos siguen una estructura similar a:

```text
modules/auth/
├── auth.schema.ts
├── auth.types.ts
├── auth.repository.ts
└── auth.service.ts
```

### `*.schema.ts`

Contiene los esquemas de validación utilizando **Zod**.

### `*.types.ts`

Define los tipos TypeScript relacionados con el módulo.

### `*.repository.ts`

Centraliza el acceso a Supabase y a la base de datos.

### `*.service.ts`

Contiene la lógica de negocio y las validaciones necesarias antes de acceder a los datos.

Este enfoque permite mantener una separación clara entre:

```text
UI
 ↓
Server Action
 ↓
Service
 ↓
Repository
 ↓
Supabase / PostgreSQL
```

---

# 📁 Estructura principal

```text
globalcomputer/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/
│   ├── register/
│   ├── dashboard/
│   └── auth/
│
├── modules/
│   └── auth/
│       ├── auth.schema.ts
│       ├── auth.types.ts
│       ├── auth.repository.ts
│       └── auth.service.ts
│
├── components/
│   └── ui/
│
├── lib/
│   ├── supabaseClient.ts
│   └── supabaseServer.ts
│
├── hooks/
│   └── use-server-action.ts
│
├── utils/
│   └── cn.ts
│
├── supabase/
│   └── migrations/
│
├── scripts/
│
├── docs/
│
└── .github/
    └── workflows/
```

---

# 📊 Dashboard

El proyecto incluye un dashboard protegido mediante autenticación.

El dashboard utiliza **TanStack Table** para mostrar información de forma dinámica.

Incluye soporte para:

* Tablas dinámicas
* Filtrado
* Gestión de datos
* Roles
* Operaciones protegidas
* Server-side data access

---

# 🏷️ Catálogo de marcas y tipos

El sistema incorpora un catálogo organizado mediante:

### `brands`

Contiene las marcas disponibles.

* `name` único
* Lectura pública
* Gestión restringida a administradores
* Campo `active`

### `brand_types`

Permite definir tipos asociados a cada marca.

* `brand_id`
* `name`
* Nombre único por marca
* Gestión restringida a administradores

### `products`

Los productos utilizan:

```text
brand_type_id
```

como referencia al tipo de producto.

Esto reemplaza la estructura anterior basada en:

```text
product_type_id
product_types
```

---

# 🖼️ Imágenes de servicios

Las imágenes relacionadas con los servicios utilizan **Supabase Storage**.

La implementación se encuentra documentada en:

```text
docs/supabase-storage-servicios.md
```

y utiliza la migración:

```text
20250317120000_service_images_storage.sql
```

El acceso al almacenamiento está integrado con las políticas de seguridad de Supabase.

---

# 🗄️ Base de datos y migraciones

La aplicación utiliza **PostgreSQL mediante Supabase**.

Las modificaciones del esquema se mantienen mediante migraciones SQL versionadas.

Las migraciones principales se encuentran en:

```text
supabase/migrations/
```

Entre ellas se incluyen migraciones relacionadas con:

* Perfiles
* Productos
* Comercio
* Reseñas
* Suscripciones
* Roles
* RLS
* Marcas
* Tipos por marca
* Imágenes de servicios
* Estados activos
* Permisos del esquema `public`

---

# 🔄 Migraciones SQL

Las migraciones iniciales incluyen:

```text
20250117100000
20250117100001
20250117100002
20250117100003
20250117100004
20250117100005
```

La migración:

```text
20250117100005
```

incluye permisos `GRANT` sobre el esquema `public` para evitar errores:

```text
42501 - permission denied for schema public
```

al utilizar la API.

Las migraciones posteriores incluyen cambios relacionados con servicios, marcas, tipos de productos y estados activos.

---

# 🗃️ Aplicar migraciones

Para aplicar el esquema a un proyecto Supabase vinculado:

```bash
supabase link --project-ref <TU_REF>
supabase db push
```

Si una base de datos ya tenía migraciones antiguas aplicadas, eliminarlas del repositorio no elimina automáticamente su historial de:

```text
supabase_migrations.schema_migrations
```

En una base de datos nueva solamente se aplicarán las migraciones presentes en la carpeta correspondiente.

---

# 👑 Seed del administrador

El proyecto incluye un script opcional para crear o actualizar el usuario administrador utilizando la **Supabase Admin API**.

Configura en `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_FULL_NAME=
ADMIN_ROLE=
```

Después ejecuta:

```bash
pnpm run seed:admin
```

El script permite sincronizar el usuario de autenticación con:

```text
public.profiles
```

---

# 🔑 Flujo de autenticación

## Registro

El flujo de registro utiliza:

```text
/register
   ↓
registerSchema
   ↓
registerService
   ↓
auth.repository
   ↓
supabase.auth.signUp
```

Después del registro se crea el perfil correspondiente en:

```text
public.profiles
```

mediante un trigger/función de PostgreSQL.

---

## Login

El login utiliza:

```text
/login
/admin/login
```

y la Server Action:

```text
loginAction
```

La autenticación utiliza:

```text
signInWithPassword()
```

mediante `@supabase/ssr`.

La sesión se mantiene mediante cookies.

---

## Gestión de sesiones

El archivo raíz:

```text
proxy.ts
```

delega en:

```text
supabase/middleware.ts
```

para refrescar y validar la sesión mediante:

```text
getUser()
```

Esto permite proteger las rutas que requieren autenticación.

---

# 🧑‍💼 Roles `USER` y `ADMIN`

El sistema utiliza actualmente dos roles:

### USER

Es el rol asignado por defecto a los usuarios registrados.

### ADMIN

Permite acceder a funcionalidades administrativas.

El rol se obtiene desde:

```text
public.profiles
```

y se expone mediante el tipo:

```text
SessionUser
```

Esto permite proteger rutas y operaciones mediante comprobaciones como:

```typescript
user.role === "ADMIN"
```

También pueden utilizarse políticas RLS para reforzar estas restricciones directamente en PostgreSQL.

---

# 🔍 Diagnóstico de autenticación

El proyecto incluye herramientas para diagnosticar problemas relacionados con autenticación.

Para comprobar las credenciales directamente:

```bash
pnpm run test:auth
```

Si el comando falla, el problema normalmente está relacionado con:

* Usuario
* Contraseña
* Proyecto Supabase
* Configuración de Email Provider
* Identidades
* Variables de entorno

Si funciona desde Node.js pero falla en el navegador, revisar:

* Variables `NEXT_PUBLIC_*`
* Cookies
* Variables duplicadas
* Reinicio del servidor de desarrollo
* Configuración del cliente Supabase

---

# 🔐 `auth.users` e `auth.identities`

Para autenticación mediante email/password, Supabase utiliza información relacionada tanto con:

```text
auth.users
```

como:

```text
auth.identities
```

Si un usuario fue creado directamente mediante SQL y posteriormente no puede iniciar sesión, puede ser necesario verificar:

* `auth.identities`
* `provider`
* `aud`
* `role`
* `raw_app_meta_data`

En estos casos se recomienda utilizar el flujo oficial de Supabase Auth o:

```bash
pnpm run seed:admin
```

También puede utilizarse:

```text
Authentication → Users → Reset password
```

desde el Dashboard de Supabase.

---

# 🔎 Dashboard: búsqueda de usuarios

El dashboard permite realizar búsquedas relacionadas con usuarios utilizando información de:

```text
auth.users
auth.identities
```

Los emails se normalizan en minúsculas para facilitar las búsquedas.

El filtro de teléfono solamente aplica a usuarios que tengan un número de teléfono registrado.

---

# 🧪 Validación y manejo de errores

La aplicación utiliza **Zod** para validar información antes de ejecutar operaciones de negocio.

Además, utiliza:

* Server Actions
* Estados de carga
* Manejo de errores
* Mensajes de validación
* Toast notifications
* Validación del lado del servidor

El hook:

```text
hooks/use-server-action.ts
```

permite reutilizar el comportamiento de Server Actions junto con notificaciones de éxito y error.

---

# 🎨 Componentes UI

Los componentes reutilizables se encuentran en:

```text
components/ui/
```

Actualmente incluyen componentes como:

```text
button
input
label
card
form
data-table
```

Estos componentes permiten mantener una interfaz consistente y reducir duplicación de código.

---

# 🧮 Utilidades

Las utilidades compartidas se encuentran en:

```text
utils/
```

Por ejemplo:

```text
utils/cn.ts
```

utiliza:

```text
clsx
tailwind-merge
```

para combinar clases Tailwind de forma segura.

---

# ☁️ Despliegue en Vercel

El proyecto está preparado para desplegarse en **Vercel**.

### 1. Subir el repositorio

El repositorio puede alojarse en:

* GitHub
* GitLab
* Bitbucket

### 2. Crear el proyecto

Desde Vercel:

```text
New Project
```

y seleccionar el repositorio.

Vercel detectará automáticamente Next.js.

### 3. Configurar variables

En:

```text
Project Settings
→ Environment Variables
```

configurar:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
```

y cualquier otra variable requerida por el entorno.

### 4. Deploy

Vercel ejecutará automáticamente:

```bash
npm run build
```

y desplegará la aplicación.

Next.js App Router, Server Actions y SSR funcionan de forma nativa en Vercel.

---

# 🔁 CI/CD

El repositorio incluye workflows de **GitHub Actions** para automatizar tareas relacionadas con el desarrollo y despliegue.

La idea general del flujo es:

```text
Desarrollo
    ↓
Git Push
    ↓
GitHub
    ↓
GitHub Actions
    ↓
Validaciones / Migraciones
    ↓
Deploy
    ↓
Vercel
```

Esto permite mantener un proceso de despliegue reproducible y reducir errores manuales.

---

# 🛠️ Requisitos previos

Para ejecutar el proyecto localmente necesitas:

* **Node.js 18+**
* npm o pnpm
* Una cuenta de Supabase
* Un proyecto Supabase configurado
* Supabase CLI para trabajar con migraciones

---

# 📦 Instalación

Clonar el repositorio:

```bash
git clone https://github.com/eduardosanz277-ship-it/globalcomputer.git
```

Entrar al proyecto:

```bash
cd globalcomputer
```

Instalar dependencias:

```bash
npm install
```

o:

```bash
pnpm install
```

---

# ⚙️ Variables de entorno

Crear:

```text
.env.local
```

a partir de:

```text
.env.example
```

Por ejemplo:

```bash
cp .env.example .env.local
```

Configurar:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
```

Para operaciones administrativas también puede ser necesario:

```env
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_FULL_NAME=
ADMIN_ROLE=
```

> **Importante:** nunca publiques ni subas al repositorio una `SUPABASE_SERVICE_ROLE_KEY` real.

---

# ▶️ Scripts disponibles

### Desarrollo

```bash
npm run dev
```

Utiliza Turbopack para el desarrollo.

### Build

```bash
npm run build
```

Genera el build de producción.

### Producción

```bash
npm run start
```

Inicia el servidor de producción.

### Lint

```bash
npm run lint
```

Ejecuta las comprobaciones de linting.

### Seed del administrador

```bash
pnpm run seed:admin
```

Crea o actualiza el usuario administrador.

### Prueba de autenticación

```bash
pnpm run test:auth
```

Permite comprobar el flujo de autenticación directamente.

---

# 📚 Documentación adicional

La carpeta:

```text
docs/
```

contiene documentación técnica adicional del proyecto.

Por ejemplo:

```text
docs/supabase-storage-servicios.md
```

documenta la configuración relacionada con el almacenamiento de imágenes de servicios.

---

# 🧠 Principios de desarrollo

El proyecto sigue varios principios orientados a mantener una base de código limpia y escalable.

### Separación de responsabilidades

La interfaz, la lógica de negocio y el acceso a datos se mantienen separados.

### Single Responsibility

Cada módulo y servicio intenta mantener una responsabilidad clara.

### Reutilización

La funcionalidad común se encapsula en:

* Componentes
* Hooks
* Utilities
* Services
* Repositories

### Type Safety

TypeScript se utiliza para reducir errores y mantener contratos claros entre las diferentes capas.

### Validación

Los datos externos se validan mediante Zod antes de llegar a la lógica de negocio.

### Seguridad por capas

La seguridad se implementa mediante:

```text
Authentication
      ↓
Authorization
      ↓
Server-side validation
      ↓
RLS
      ↓
PostgreSQL
```
