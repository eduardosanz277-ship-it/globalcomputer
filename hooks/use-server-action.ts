"use client";

import { useTransition } from "react";
import { toast } from "react-toastify";

interface Options<TArgs extends any[], TResult> {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: TResult) => void;
}

export function useServerAction<TArgs extends any[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: Options<TArgs, TResult> = {}
) {
  const [isPending, startTransition] = useTransition();

  const execute = (...args: TArgs) => {
    startTransition(async () => {
      try {
        const result = await action(...args);
        if (options.successMessage) {
          toast.success(options.successMessage);
        }
        options.onSuccess?.(result);
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
      }
    });
  };

  return { execute, isPending };
}

