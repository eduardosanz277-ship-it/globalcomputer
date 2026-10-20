import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const PER_MINUTE = 1;
const PER_HOUR = 5;

export class ContactRateLimitError extends Error {
  readonly code = "RATE_LIMIT" as const;
  constructor() {
    super("RATE_LIMIT");
    this.name = "ContactRateLimitError";
  }
}

function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = req.headers.get("x-real-ip")?.trim();
  return forwarded || real || "unknown";
}

async function countRecent(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  scope: "ip" | "email",
  keyHash: string,
  sinceIso: string,
): Promise<number | null> {
  const { count, error } = await admin
    .from("contact_request_submissions")
    .select("id", { count: "exact", head: true })
    .eq("scope", scope)
    .eq("key_hash", keyHash)
    .gte("created_at", sinceIso);

  if (error) {
    console.warn("[contact] rate limit count:", error.message);
    return null;
  }
  return count ?? 0;
}

/**
 * 1 envío por minuto y 5 por hora, por IP y por email.
 * Si la tabla aún no existe, no bloquea el formulario.
 */
export async function enforceContactRequestRateLimit(
  req: Request,
  email: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const now = Date.now();
  const minuteAgo = new Date(now - 60_000).toISOString();
  const hourAgo = new Date(now - 3_600_000).toISOString();

  const checks: Array<{ scope: "ip" | "email"; value: string }> = [
    { scope: "ip", value: clientIp(req) },
    { scope: "email", value: email.trim().toLowerCase() },
  ];

  for (const check of checks) {
    const keyHash = hashKey(`${check.scope}:${check.value}`);
    const perMinute = await countRecent(admin, check.scope, keyHash, minuteAgo);
    const perHour = await countRecent(admin, check.scope, keyHash, hourAgo);
    if (perMinute == null || perHour == null) return;
    if (perMinute >= PER_MINUTE || perHour >= PER_HOUR) {
      throw new ContactRateLimitError();
    }
  }
}

export async function recordContactRequestSubmission(
  req: Request,
  email: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const rows = [
    {
      scope: "ip" as const,
      key_hash: hashKey(`ip:${clientIp(req)}`),
    },
    {
      scope: "email" as const,
      key_hash: hashKey(`email:${email.trim().toLowerCase()}`),
    },
  ];

  const { error } = await admin.from("contact_request_submissions").insert(rows);
  if (error) {
    console.warn("[contact] rate limit insert:", error.message);
    return;
  }

  const cutoff = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const { error: cleanupError } = await admin
    .from("contact_request_submissions")
    .delete()
    .lt("created_at", cutoff);
  if (cleanupError) {
    console.warn("[contact] rate limit cleanup:", cleanupError.message);
  }
}
