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
      } catch (error: any) {
        const message =
          options.errorMessage ||
          error?.message ||
          "Ha ocurrido un error inesperado";
        toast.error(message);
      }
    });
  };

  return { execute, isPending };
}

