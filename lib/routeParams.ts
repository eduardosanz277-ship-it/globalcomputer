/**
 * Next.js puede pasar `params` como Promise o como objeto plano según versión / contexto.
 */
export async function resolveRouteParams<T extends Record<string, string>>(
  params: Promise<T> | T,
): Promise<T> {
  return Promise.resolve(params);
}
