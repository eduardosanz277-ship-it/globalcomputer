/** sessionStorage: URL de WhatsApp tras crear cotización manual. */
export const GC_MANUAL_QUOTE_WHATSAPP_KEY = "gc_manual_quote_whatsapp";
/** sessionStorage: número de pedido tras crear cotización manual. */
export const GC_MANUAL_QUOTE_ORDER_NUMBER_KEY = "gc_manual_quote_order_number";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Abrir en el mismo tick del clic del usuario (antes de cualquier `await`).
 * Tras un fetch el navegador bloquea `window.open`; por eso hay que precargar aquí.
 * En lugar de una pestaña en blanco, muestra un loading hasta asignar la URL de WhatsApp.
 */
export function openWhatsAppWindowForUserGesture(
  loadingMessage = "Loading…",
): Window | null {
  try {
    const win = window.open("about:blank", "_blank");
    if (!win) return null;

    const safeMessage = escapeHtml(loadingMessage);
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeMessage}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      background: #f8fafc;
      color: #334155;
    }
    .wrap { text-align: center; padding: 1.5rem; }
    .spin {
      width: 2rem;
      height: 2rem;
      margin: 0 auto 1rem;
      border: 3px solid #cbd5e1;
      border-top-color: #25d366;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { margin: 0; font-size: 0.95rem; font-weight: 500; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="spin" aria-hidden="true"></div>
    <p>${safeMessage}</p>
  </div>
</body>
</html>`);
    win.document.close();
    return win;
  } catch {
    return null;
  }
}

/**
 * Guarda datos de éxito, asigna la URL de WhatsApp a la ventana precargada y navega.
 */
export function redirectAfterManualQuoteSuccess(
  whatsappUrl: string,
  options?: {
    preOpenedWindow?: Window | null;
    orderNumber?: string | null;
  },
) {
  const preOpenedWindow = options?.preOpenedWindow;
  const orderNumber = options?.orderNumber?.trim();

  try {
    sessionStorage.setItem(GC_MANUAL_QUOTE_WHATSAPP_KEY, whatsappUrl);
    if (orderNumber) {
      sessionStorage.setItem(GC_MANUAL_QUOTE_ORDER_NUMBER_KEY, orderNumber);
    }
  } catch {
    /* ignore quota / private mode */
  }

  if (preOpenedWindow && !preOpenedWindow.closed) {
    try {
      preOpenedWindow.location.href = whatsappUrl;
    } catch {
      try {
        preOpenedWindow.close();
      } catch {
        /* ignore */
      }
      window.open(whatsappUrl, "_blank");
    }
  } else {
    window.open(whatsappUrl, "_blank");
  }

  window.location.assign("/cart/quote-success");
}

export function closePreOpenedWhatsAppWindow(preOpenedWindow?: Window | null) {
  if (preOpenedWindow && !preOpenedWindow.closed) {
    try {
      preOpenedWindow.close();
    } catch {
      /* ignore */
    }
  }
}
