import Swal, { type SweetAlertResult } from "sweetalert2";

/** Outline warning (triangle), 24px — color via CSS `.swal-saas-icon-wrap--warning` */
const ICON_WARNING_OUTLINE = `<span class="swal-saas-icon-wrap swal-saas-icon-wrap--warning" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>`;

/** Outline question / decision — color via `.swal-saas-icon-wrap--positive` */
const ICON_QUESTION_OUTLINE = `<span class="swal-saas-icon-wrap swal-saas-icon-wrap--positive" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></span>`;

export type SwalSaasVariant = "destructive" | "positive";

export type SwalSaasIconType = "warning" | "question";

export type SwalSaasConfirmOptions = {
  title: string;
  html: string;
  confirmButtonText: string;
  cancelButtonText?: string;
  /** Botón principal: rojo (eliminar / rechazar) o verde (aprobar) */
  variant: SwalSaasVariant;
  /** Icono minimalista: advertencia o pregunta (flujos de aprobación) */
  iconType: SwalSaasIconType;
};

function buildSwalSaasOptions(options: SwalSaasConfirmOptions) {
  const iconHtml =
    options.iconType === "question"
      ? ICON_QUESTION_OUTLINE
      : ICON_WARNING_OUTLINE;

  const confirmClass =
    options.variant === "positive"
      ? "swal-saas-btn swal-saas-btn--confirm swal-saas-btn--positive"
      : "swal-saas-btn swal-saas-btn--confirm swal-saas-btn--destructive";

  return {
    title: options.title,
    html: options.html,
    iconHtml,
    showCancelButton: true,
    reverseButtons: true,
    focusCancel: true,
    confirmButtonText: options.confirmButtonText,
    cancelButtonText: options.cancelButtonText ?? "Cancelar",
    buttonsStyling: false,
    customClass: {
      popup: "swal-saas-modal",
      title: "swal-saas-title",
      htmlContainer: "swal-saas-html",
      actions: "swal-saas-actions",
      confirmButton: confirmClass,
      cancelButton: "swal-saas-btn swal-saas-btn--cancel",
      icon: "swal-saas-icon-host",
    },
    showClass: {
      popup: "swal-saas-show-popup",
      backdrop: "swal-saas-show-backdrop",
    },
    hideClass: {
      popup: "swal-saas-hide-popup",
      backdrop: "swal-saas-hide-backdrop",
    },
  };
}

/**
 * Modal de confirmación estilo SaaS (SweetAlert2 con estilos globales `.swal-saas-modal`).
 * Mantiene el mismo contrato que `Swal.fire` para `isConfirmed`.
 */
export function swalSaasConfirm(
  options: SwalSaasConfirmOptions,
): Promise<SweetAlertResult> {
  return Swal.fire(buildSwalSaasOptions(options));
}

function isConfirmInCustomLoadingState(): boolean {
  return (
    Swal.getConfirmButton()?.classList.contains("swal-saas-confirm-loading") ??
    false
  );
}

/** Texto junto al spinner según la acción (sobrescribible con `loadingConfirmText`). */
function resolveLoadingConfirmText(
  confirmButtonText: string,
  explicit?: string,
): string {
  if (explicit?.trim()) return explicit.trim();
  if (confirmButtonText === "Aprobar") return "Aprobando";
  if (confirmButtonText === "Rechazar") return "Rechazando";
  return "Eliminando";
}

/** Mantiene el mismo botón: spinner delante + texto; deshabilita Cancelar. */
function applyConfirmLoadingUi(loadingText: string): () => void {
  const btn = Swal.getConfirmButton();
  const cancelBtn = Swal.getCancelButton();
  if (!btn) return () => {};

  const previousHtml = btn.innerHTML;
  btn.classList.add("swal-saas-confirm-loading");
  btn.setAttribute("aria-busy", "true");
  btn.disabled = true;
  // Mismo trazo que `Loader2` de lucide-react (loader-circle): h-4 w-4 + animate-spin en formularios
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="swal-saas-lucide-loader" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>${loadingText}</span>`;
  if (cancelBtn) cancelBtn.disabled = true;

  return () => {
    btn.classList.remove("swal-saas-confirm-loading");
    btn.removeAttribute("aria-busy");
    btn.disabled = false;
    btn.innerHTML = previousHtml;
    if (cancelBtn) cancelBtn.disabled = false;
  };
}

export type SwalSaasConfirmAsyncOptions = SwalSaasConfirmOptions & {
  /** Ejecuta la acción server; al resolver, SweetAlert2 cierra el modal. */
  preConfirm: () => Promise<unknown>;
  /** Texto mostrado en el botón durante la acción (por defecto: Eliminando / Rechazando / Aprobando). */
  loadingConfirmText?: string;
};

/**
 * Mismo botón de confirmación con spinner delante y texto tipo "Eliminando…" mientras corre `preConfirm`.
 * No usa el loader por defecto de SweetAlert2 (que sustituye el botón).
 */
export function swalSaasConfirmAsync(
  options: SwalSaasConfirmAsyncOptions,
): Promise<SweetAlertResult> {
  const { preConfirm, loadingConfirmText, ...rest } = options;
  return Swal.fire({
    ...buildSwalSaasOptions(rest),
    showLoaderOnConfirm: false,
    allowOutsideClick: () => !isConfirmInCustomLoadingState(),
    allowEscapeKey: () => !isConfirmInCustomLoadingState(),
    preConfirm: async () => {
      const loadingText = resolveLoadingConfirmText(
        rest.confirmButtonText,
        loadingConfirmText,
      );
      const restore = applyConfirmLoadingUi(loadingText);
      try {
        await preConfirm();
      } catch {
        restore();
        // El error ya se mostró con toast en `useServerAction`.
        return false;
      }
    },
  });
}
