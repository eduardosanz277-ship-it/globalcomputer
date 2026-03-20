/**
 * Seed / bootstrap del ADMIN por defecto.
 *
 * Motivo del fallback:
 * - En algunos esquemas, cuando el admin se creó con SQL directo en `auth.users`,
 *   la Admin API puede devolver `user_not_found` aunque la fila exista.
 * - En ese caso intentamos resetear el hash vía RPC `seed_reset_auth_password_by_email` (si existe en la BD).
 *
 * Uso:
 *   node scripts/seed-admin.mjs
 *
 * Requiere:
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME, ADMIN_ROLE
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Carga .env y .env.local si existen (solo para entorno local).
const root = process.cwd();
const envPath = resolve(root, ".env");
const envLocalPath = resolve(root, ".env.local");
if (existsSync(envPath)) dotenv.config({ path: envPath });
if (existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Comprueba que la clave sea la service_role (evita 42501 "permission denied for schema public" si pegaste la anon). */
function assertServiceRoleJwt(key) {
  try {
    const parts = String(key).split(".");
    if (parts.length !== 3) return;
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json);
    const role = payload.role;
    if (role && role !== "service_role") {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY no es la clave service_role (JWT role="${role}"). ` +
          `En Supabase: Settings → API → copia la clave secreta "service_role", no la "anon" / publishable.`
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("SUPABASE_SERVICE_ROLE_KEY")) throw e;
  }
}

const adminEmail = (process.env.ADMIN_EMAIL || "admin@globalcomputer.com").trim();
const adminPassword = (process.env.ADMIN_PASSWORD || "Admin*2026!").trim();
const adminFullName = process.env.ADMIN_FULL_NAME || "Administrador";
const adminRole = (process.env.ADMIN_ROLE || "ADMIN").trim();

if (!supabaseUrl) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en el entorno");
if (!serviceRoleKey)
  throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (service role) en el entorno");

assertServiceRoleJwt(serviceRoleKey);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

function isUserNotFound(err) {
  return (
    err &&
    (err.code === "user_not_found" ||
      err.status === 404 ||
      (typeof err.message === "string" &&
        err.message.toLowerCase().includes("user not found")))
  );
}

async function resetPasswordViaRpc() {
  const { error } = await supabase.rpc("seed_reset_auth_password_by_email", {
    target_email: adminEmail.toLowerCase(),
    plain_password: adminPassword,
  });

  if (error) {
    const msg = String(error.message || error);
    const missingFn =
      /function .* does not exist|schema cache|could not find/i.test(msg) ||
      error.code === "PGRST202";
    if (missingFn) {
      throw new Error(
        "La RPC seed_reset_auth_password_by_email no existe en la BD (p. ej. sin migraciones). " +
          "Crea la función en Supabase o resetea la contraseña desde Authentication → Users."
      );
    }
    console.error("[seed-admin] RPC error", error);
    throw new Error(`No se pudo resetear el password vía RPC: ${msg}`);
  }

  console.log("[seed-admin] password actualizado vía RPC");
}

/**
 * Obtiene el id del usuario por email vía Admin API (no usa PostgREST / public).
 * Útil cuando .from("profiles") falla con 42501 pero Auth sí responde.
 */
async function findUserIdByEmail(email) {
  const target = email.toLowerCase();
  let page = 1;
  const perPage = 200;
  const maxPages = 50;

  while (page <= maxPages) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const users = data?.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === target);
    if (found?.id) return found.id;

    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

function isPostgrestPublicDenied(err) {
  return (
    err &&
    (err.code === "42501" ||
      String(err.message || "").includes("permission denied for schema public"))
  );
}

async function upsertProfile(uid) {
  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: uid,
        full_name: adminFullName,
        role: adminRole,
      },
      { onConflict: "id" }
    );

  if (profileErr) throw profileErr;
}

/**
 * Si PostgREST no puede tocar public (42501), el admin ya puede tener contraseña vía Auth;
 * avisamos cómo alinear public.profiles a mano.
 */
function warnProfileSkipped(profileErr) {
  console.warn(
    "[seed-admin] No se pudo upsert en public.profiles (PostgREST). " +
      "La contraseña/metadata en Auth puede estar bien. Revisa en Dashboard → Authentication → Users, " +
      "y si hace falta sincroniza public.profiles en SQL Editor.",
    profileErr
  );
}

async function seed() {
  // 1) Resolver userId: primero profiles (rápido); si PostgREST falla (p. ej. 42501), Admin API por email
  let userId = null;

  const { data: adminProfiles, error: adminProfilesErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", adminRole)
    .limit(1);

  if (adminProfilesErr) {
    console.warn("[seed-admin] profiles query error", adminProfilesErr);
  } else if (Array.isArray(adminProfiles) && adminProfiles.length > 0) {
    userId = adminProfiles[0]?.id ?? null;
    console.log("[seed-admin] resolved userId from profiles", { userId });
  }

  // 2) Intentar actualizar password vía Admin API
  if (userId) {
    const { error: updErr } = await supabase.auth.admin.updateUserById(
      userId,
      {
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminFullName,
          role: adminRole,
        },
      }
    );

    if (!updErr) {
      await upsertProfile(userId);
      console.log("[seed-admin] OK (updateUserById)", {
        userId,
        email: adminEmail,
        role: adminRole,
      });
      return;
    }

    console.warn("[seed-admin] updateUserById failed", updErr);

    if (isUserNotFound(updErr)) {
      console.log(
        "[seed-admin] Admin API no encuentra el usuario; usando RPC de password…"
      );
      await resetPasswordViaRpc();
      await upsertProfile(userId);
      console.log("[seed-admin] OK (RPC + profile)", {
        userId,
        email: adminEmail,
        role: adminRole,
      });
      return;
    }

    throw updErr;
  }

  // 3) Sin userId en profiles: intentar createUser
  console.log("[seed-admin] No hay admin en profiles; intentando createUser…");

  const { data: created, error: createErr } =
    await supabase.auth.admin.createUser({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminFullName,
        role: adminRole,
      },
    });

  if (!createErr && created?.user?.id) {
    userId = created.user.id;
    await upsertProfile(userId);
    console.log("[seed-admin] OK (createUser)", {
      userId,
      email: adminEmail,
      role: adminRole,
    });
    return;
  }

  if (createErr) {
    console.warn("[seed-admin] createUser error", createErr);
    const msg = (createErr.message || "").toLowerCase();
    const duplicate =
      msg.includes("already") ||
      msg.includes("exists") ||
      createErr.status === 422;

    if (duplicate) {
      console.log("[seed-admin] Email ya existe; usando RPC…");
      await resetPasswordViaRpc();

      const { data: row } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", adminRole)
        .limit(1)
        .maybeSingle();

      if (row?.id) {
        await upsertProfile(row.id);
        console.log("[seed-admin] OK (RPC tras duplicate)", {
          userId: row.id,
          email: adminEmail,
        });
        return;
      }

      console.warn(
        "[seed-admin] RPC aplicado pero no hay fila en profiles (rol ADMIN). Ajusta public.profiles."
      );
      return;
    }
  }

  throw new Error("No se pudo crear o actualizar el admin");
}

seed().catch((e) => {
  console.error("[seed-admin] ERROR", e);
  process.exit(1);
});