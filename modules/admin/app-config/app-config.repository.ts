import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AppConfigKey } from "./app-config.types";

type ConfigRow = { key: string; value: unknown };

export async function repoGetAppConfigByKeys(keys: readonly string[]) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_config")
    .select("key, value")
    .in("key", keys);

  if (error) throw new Error(error.message);
  return (data ?? []) as ConfigRow[];
}

export async function repoUpsertAppConfigEntries(
  entries: { key: AppConfigKey; value: unknown }[]
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("app_config").upsert(
    entries.map((e) => ({
      key: e.key,
      value: e.value,
    })),
    { onConflict: "key" }
  );

  if (error) throw new Error(error.message);
}
