"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { FieldValues, Path } from "react-hook-form";
import Select from "react-select";
import { appSelectStyles } from "@/components/ui/react-select-app-styles";
import { Label, RequiredMark } from "./label";
import { Switch } from "./switch";
import { cn } from "@/utils/cn";

type FormSwitchFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label: string;
  description?: string;
};

export function FormSwitchField<TFieldValues extends FieldValues>({
  name,
  label,
  description,
}: FormSwitchFieldProps<TFieldValues>) {
  const { control, formState } = useFormContext<TFieldValues>();
  const err = formState.errors[name as keyof typeof formState.errors];
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor={String(name)} className="text-sm font-medium">
            {label}
          </Label>
          {description ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Switch
              id={String(name)}
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
      </div>
      {message ? (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export type SelectOption<T extends string = string> = { value: T; label: string };

type FormSelectFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  isDisabled?: boolean;
  /** id para accesibilidad / react-select instanceId */
  instanceId: string;
  /** Muestra * en la etiqueta (validación con zod). */
  required?: boolean;
  /** Búsqueda en el desplegable (filtra opciones al escribir). */
  isSearchable?: boolean;
  /**
   * Usa `position: fixed` para el menú, permitiendo que salga de contenedores
   * con overflow (p. ej. el área scrollable de un slide-over o modal).
   * El menú permanece en el árbol DOM del componente, por lo que Radix Dialog
   * no bloquea sus eventos de puntero.
   */
  useMenuPortal?: boolean;
  /** Tras cambiar la opción (p. ej. limpiar otro campo dependiente). */
  onValueChange?: (value: string) => void;
};

const fixedMenuStyles: typeof appSelectStyles = {
  ...appSelectStyles,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menu: (base: any, state: any) => {
    const base2 = typeof appSelectStyles.menu === "function"
      ? appSelectStyles.menu(base, state)
      : base;
    return { ...base2, zIndex: 9999 };
  },
};

export function FormSelectField<TFieldValues extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  isDisabled,
  instanceId,
  required: fieldRequired,
  isSearchable = false,
  useMenuPortal = false,
  onValueChange,
}: FormSelectFieldProps<TFieldValues>) {
  const { control, formState } = useFormContext<TFieldValues>();
  const err = formState.errors[name as keyof typeof formState.errors];
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";

  return (
    <div className="space-y-2">
      <Label htmlFor={`${instanceId}-input`}>
        {label}
        {fieldRequired ? <RequiredMark /> : null}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const value =
            options.find((opt) => opt.value === field.value) ?? null;
          return (
            <Select<SelectOption, false>
              instanceId={instanceId}
              inputId={`${instanceId}-input`}
              options={options}
              value={value}
              onChange={(opt) => {
                const next = opt?.value ?? "";
                field.onChange(next);
                onValueChange?.(next);
              }}
              onBlur={field.onBlur}
              placeholder={placeholder}
              isDisabled={isDisabled}
              isClearable={false}
              isSearchable={isSearchable}
              menuPosition={useMenuPortal ? "fixed" : undefined}
              noOptionsMessage={() => "Sin coincidencias"}
              styles={useMenuPortal ? fixedMenuStyles : appSelectStyles}
              className={cn("w-full", isDisabled && "opacity-60")}
            />
          );
        }}
      />
      {message ? (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
