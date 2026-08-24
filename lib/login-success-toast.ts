export const LOGIN_SUCCESS_TOAST_KEY = "gc-login-success-toast";

export function markLoginSuccessToast(): void {
  try {
    sessionStorage.setItem(LOGIN_SUCCESS_TOAST_KEY, "1");
  } catch {
    /* private mode / blocked storage */
  }
}

export function consumeLoginSuccessToast(): boolean {
  try {
    if (sessionStorage.getItem(LOGIN_SUCCESS_TOAST_KEY) !== "1") return false;
    sessionStorage.removeItem(LOGIN_SUCCESS_TOAST_KEY);
    return true;
  } catch {
    return false;
  }
}
