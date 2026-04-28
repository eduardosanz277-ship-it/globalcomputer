function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type LowStockTemplateInput = {
  productName: string;
  productSku: string;
  stock: number;
  threshold: number;
};

export function renderLowStockAlertEmailTemplate(
  input: LowStockTemplateInput,
): string {
  const safeProduct = escapeHtml(input.productName.trim() || "Producto");
  const safeSku = escapeHtml(input.productSku.trim() || "N/A");
  const now = new Date().toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f3f5f9;font-family:Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#dc2626;color:#ffffff;padding:16px 20px;font-size:18px;font-weight:700;">
                Alerta de stock bajo
              </td>
            </tr>
            <tr>
              <td style="padding:20px;">
                <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;">
                  Se detectó un producto por debajo del umbral configurado.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0;font-size:14px;color:#6b7280;">Producto</td>
                    <td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right;">${safeProduct}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:14px;color:#6b7280;">SKU</td>
                    <td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right;">${safeSku}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:14px;color:#6b7280;">Stock actual</td>
                    <td style="padding:8px 0;font-size:14px;font-weight:700;color:#dc2626;text-align:right;">${input.stock}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:14px;color:#6b7280;">Umbral</td>
                    <td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right;">${input.threshold}</td>
                  </tr>
                </table>
                <p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;">
                  Generado: ${escapeHtml(now)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
