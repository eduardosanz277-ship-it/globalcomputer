/**
 * Contador global de cargas pendientes (navegación, API, formularios).
 * Solo actualiza `data-gc-loading` / eventos; no toca el `<head>`.
 */

type Listener = (active: boolean, pending: number) => void;

let pendingCount = 0;
const listeners = new Set<Listener>();

function emit() {
  const active = pendingCount > 0;
  if (typeof document !== "undefined") {
    if (active) document.documentElement.dataset.gcLoading = "1";
    else delete document.documentElement.dataset.gcLoading;
  }
  listeners.forEach((listener) => listener(active, pendingCount));
}

export function subscribeAppLoading(listener: Listener) {
  listeners.add(listener);
  listener(pendingCount > 0, pendingCount);
  return () => {
    listeners.delete(listener);
  };
}

export function appLoadingStart() {
  if (typeof window === "undefined") return;
  pendingCount += 1;
  emit();
}

export function appLoadingDone() {
  if (typeof window === "undefined") return;
  pendingCount = Math.max(0, pendingCount - 1);
  emit();
}

export function appLoadingReset() {
  if (typeof window === "undefined") return;
  pendingCount = 0;
  emit();
}

export function isAppLoadingActive() {
  return pendingCount > 0;
}
