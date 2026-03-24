"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { FieldValues, Path } from "react-hook-form";
import Select, { type StylesConfig } from "react-select";
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
        <div className="space-y-0.5">
          <Label htmlFor={String(name)}>{label}</Label>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
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
        <p className="text-xs text-destructive">{message}</p>
      ) : null}
    </div>
  );
}

export type SelectOption<T extends string = string> = { value: T; label: string };

const defaultSelectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    borderColor: "hsl(214 32% 91%)",
    backgroundColor: "hsl(0 0% 100%)",
    boxShadow: state.isFocused
      ? "0 0 0 2px hsl(222.2 84% 56.3% / 0.2)"
      : "none",
    "&:hover": { borderColor: "hsl(214 32% 91%)" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(222.2 84% 4.9%)",
    fontSize: "0.875rem",
  }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(215.4 16.3% 46.9%)",
    padding: "0 8px",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(0 0% 100%)",
    border: "1px solid hsl(214 32% 91%)",
    borderRadius: "0.375rem",
    zIndex: 60,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    padding: "8px 12px",
    backgroundColor: state.isSelected
      ? "hsl(222.2 47.4% 11.2%)"
      : state.isFocused
        ? "hsl(210 40% 96.1%)"
        : "hsl(0 0% 100%)",
    color: state.isSelected ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
    cursor: "pointer",
  }),
};

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
};

export function FormSelectField<TFieldValues extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  isDisabled,
  instanceId,
  required: fieldRequired,
}: FormSelectFieldProps<TFieldValues>) {
  const { control, formState } = useFormContext<TFieldValues>();
  const err = formState.errors[name as keyof typeof formState.errors];
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";

  return (
    <div className="space-y-1">
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
              onChange={(opt) => field.onChange(opt?.value ?? "")}
              onBlur={field.onBlur}
              placeholder={placeholder}
              isDisabled={isDisabled}
              isClearable={false}
              isSearchable={false}
              styles={defaultSelectStyles}
              className={cn("w-full", isDisabled && "opacity-60")}
            />
          );
        }}
      />
      {message ? (
        <p className="text-xs text-destructive">{message}</p>
      ) : null}
    </div>
  );
}
