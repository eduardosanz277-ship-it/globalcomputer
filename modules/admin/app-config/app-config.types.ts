export const APP_CONFIG_KEYS = [
  "support_email",
  "support_phone",
  "support_address",
  "low_stock_notifications_enabled",
  "low_stock_threshold",
] as const;

export type AppConfigKey = (typeof APP_CONFIG_KEYS)[number];

/** Ajustes de app_config (soporte + alertas de stock bajo). */
export type AppConfigSettings = {
  supportEmail: string;
  supportPhone: string;
  /** Dirección física o de contacto (soporte / tienda). */
  supportAddress: string;
  /** Activa/desactiva alertas por umbral de stock bajo. */
  lowStockNotificationsEnabled: boolean;
  /** Cantidad máxima para considerar stock bajo (si las alertas están activas). */
  lowStockThreshold: number;
};
