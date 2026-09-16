import type { Locale } from "@/components/i18n/translations";
import type { ServerActionResult } from "@/lib/errors/run-server-action";

type AdminActionFn<TArgs extends unknown[]> = (
  ...args: [...TArgs, locale?: Locale | string]
) => Promise<ServerActionResult<unknown>>;

/** Enlaza locale y convierte `{ ok: false }` en Error de cliente para useServerAction. */
export function bindAdminAction<TArgs extends unknown[]>(
  action: AdminActionFn<TArgs>,
  locale: Locale,
) {
  return async (...args: TArgs) => {
    const res = await action(...args, locale);
    if (!res.ok) throw new Error(res.message);
    return res;
  };
}
