"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { formatClientError } from "@/lib/errors/format-client-error";
import { useTransition } from "react";
import { toast } from "react-toastify";

interface Options<TArgs extends any[], TResult> {
  successMessage?: string;
  errorMessage?: string;
  /** Sustituye el formateo por defecto (p. ej. errores de dominio muy específicos). */
  formatError?: (error: unknown) => string | undefined;
  onSuccess?: (result: TResult) => void;
  /** Se ejecuta siempre tras la acción (éxito o error), p. ej. `router.refresh()`. */
  onSettled?: () => void;
}

export function useServerAction<TArgs extends any[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: Options<TArgs, TResult> = {},
) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  const runAction = async (...args: TArgs): Promise<TResult> => {
    try {
      const result = await action(...args);
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      options.onSuccess?.(result);
      return result;
    } catch (error: unknown) {
      const message =
        options.formatError?.(error) ??
        formatClientError(error, t, { errorMessage: options.errorMessage });
      toast.error(message);
      throw error;
    } finally {
      options.onSettled?.();
    }
  };

  const execute = (...args: TArgs) => {
    startTransition(() => {
      void runAction(...args).catch(() => {
        /* error ya mostrado en runAction */
      });
    });
  };

  /** Igual que `execute` pero devuelve la promesa (p. ej. SweetAlert `preConfirm`). */
  const executeAsync = (...args: TArgs) => runAction(...args);

  return { execute, executeAsync, isPending };
}
