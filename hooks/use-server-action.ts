"use client";

import { useTransition } from "react";
import { toast } from "react-toastify";

interface Options<TArgs extends any[], TResult> {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: TResult) => void;
  /** Se ejecuta siempre tras la acción (éxito o error), p. ej. `router.refresh()`. */
  onSettled?: () => void;
}

export function useServerAction<TArgs extends any[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: Options<TArgs, TResult> = {},
) {
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
      const fromApi =
        error instanceof Error && error.message.trim()
          ? error.message
          : typeof error === "object" &&
              error !== null &&
              "message" in error &&
              typeof (error as { message?: unknown }).message === "string"
            ? (error as { message: string }).message
            : null;
      const message =
        fromApi ??
        options.errorMessage ??
        "Ha ocurrido un error inesperado";
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
