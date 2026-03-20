/**
 * Prueba signInWithPassword contra la API de Auth (mismo flujo que el navegador).
 * Si aquí falla, el problema NO es Next.js sino credenciales / proyecto / políticas Supabase.
 *
 * Uso: node scripts/test-auth-login.mjs
 * Requiere en .env.local: NEXT_PUBLIC_SUPABASE_URL + clave ANON o PUBLISHABLE (no service role).
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";

const root = process.cwd();
if (existsSync(resolve(root, ".env"))) dotenv.config({ path: resolve(root, ".env") });
if (existsSync(resolve(root, ".env.local"))) dotenv.config({ path: resolve(root, ".env.local") });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const email = (process.env.ADMIN_EMAIL || "admin@globalcomputer.com").trim().toLowerCase();
const password = (process.env.ADMIN_PASSWORD || "Admin*2026!").trim();

if (!url || !anonKey) {
  console.error(
    "Falta NEXT_PUBLIC_SUPABASE_URL o clave pública (NEXT_PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)"
  );
  process.exit(1);
}

if (anonKey.includes("service_role")) {
  console.error(
    "No uses SUPABASE_SERVICE_ROLE_KEY aquí. Necesitas la clave anon / publishable (pública) del mismo proyecto."
  );
  process.exit(1);
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("Proyecto:", url);
console.log("Email usado:", email);
console.log("Longitud de ADMIN_PASSWORD (caracteres):", password.length);
console.log("Clave pública (primeros 12 chars):", anonKey.slice(0, 12) + "...");

const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error) {
  console.error("\n❌ signInWithPassword falló:", error.message);
  console.error("Código:", error.code, "status:", error.status);

  if (error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message)) {
    console.error("\n→ Esto significa: el email/contraseña NO coinciden con lo que hay en Auth (hash en auth.users).");
    console.error("  No es un fallo de Next.js ni de la clave publishable si el error es invalid_credentials.\n");
    console.error("Pasos:");
    console.error("  1) En .env.local define ADMIN_EMAIL y ADMIN_PASSWORD (sin comillas rotas; # comenta el resto de la línea).");
    console.error("  2) Ejecuta:  node scripts/seed-admin.mjs   (usa SUPABASE_SERVICE_ROLE_KEY + RPC para fijar el hash).");
    console.error("  3) Vuelve a ejecutar:  pnpm run test:auth");
    console.error("  4) Si sigue mal: Dashboard → Authentication → Users → tu usuario → Reset password (fuerza hash de GoTrue).");
    console.error("  5) Opcional: en Settings → API añade la clave legacy anon (eyJ...) como NEXT_PUBLIC_SUPABASE_ANON_KEY y prueba de nuevo.");
  } else {
    console.error("\nPistas generales:");
    console.error("- Confirma ADMIN_EMAIL / ADMIN_PASSWORD en .env.local.");
    console.error("- Authentication → Providers → Email activado.");
    console.error("- node scripts/seed-admin.mjs (RPC actualiza encrypted_password).");
  }
  process.exit(1);
}

console.log("\n✅ Login OK. user id:", data.user?.id);
console.log("Si esto funciona pero la app no, revisa cookies / mismo .env en Next (reinicia pnpm dev).");
process.exit(0);
