/** URL pública de la app (sin barra final). Usada en enlaces absolutos y callbacks (Stripe, emails). */
export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}
