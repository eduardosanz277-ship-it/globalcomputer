import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminEmail = process.env.ADMIN_EMAIL || "admin@globalcomputer.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin*2026!";
const adminFullName = process.env.ADMIN_FULL_NAME || "Administrador";
const adminRole = process.env.ADMIN_ROLE || "ADMIN";

if (!supabaseUrl) {
  throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en el entorno");
}
if (!serviceRoleKey) {
  throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (service role) en el entorno");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function seed() {
  // 1) Crear o actualizar usuario admin usando la Admin API
  let userId = null;

  try {
    const { data } = await supabase.auth.admin.getUserByEmail(adminEmail);
    userId = data?.user?.id ?? null;
  } catch {
    userId = null;
  }

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminFullName,
        role: adminRole,
      },
    });
    if (error) throw error;
    userId = data?.user?.id ?? null;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminFullName,
        role: adminRole,
      },
    });
    if (error) throw error;
  }

  if (!userId) {
    throw new Error("No se pudo resolver el userId del admin");
  }

  // 2) Asegurar que el perfil tenga rol ADMIN
  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: adminFullName,
        role: adminRole,
      },
      { onConflict: "id" }
    );
  if (profileErr) throw profileErr;

  console.log("[seed-admin] OK", { userId, email: adminEmail, role: adminRole });
}

seed().catch((e) => {
  console.error("[seed-admin] ERROR", e);
  process.exit(1);
});

