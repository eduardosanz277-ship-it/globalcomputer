"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { Brand } from "@/modules/admin/brands/brands.types";
import type { BrandType } from "@/modules/admin/brand-types/brand-types.types";
import type { SpecificCharacteristic } from "@/modules/admin/specific-characteristics/specific-characteristics.types";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/modules/admin/products/products.schema";
import type {
  Product,
  ProductCharacteristicValueInput,
} from "@/modules/admin/products/products.types";
import {
  createProductWithImageAction,
  updateProductWithImageAction,
} from "./actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Form, FormField } from "@/components/ui/form";
import { FormSelectField, FormSwitchField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  adminServiceLikeInputClassName,
  adminSlideOverNestedScrollClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dropzone,
  ImageGrid,
  useServiceImagesManager,
  type ExistingServiceImageInput,
} from "@/components/admin/service-form";
import { Sparkles, Trash2, RefreshCcw } from "lucide-react";

const PRODUCT_FORM_ID = "product-form-slide-over";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  brands: Brand[];
  brandTypes: BrandType[];
  specificCharacteristics: SpecificCharacteristic[];
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  brands,
  brandTypes,
  specificCharacteristics,
}: Props) {
  const router = useRouter();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      stock: 0,
      price: 0,
      discountBusinessPct: 0,
      discountClient: 0,
      active: true,
      manualPdfUrl: "",
      brandId: "",
      brandTypeId: "",
    },
  });

  const [characteristics, setCharacteristics] = useState<
    Array<{ specificId: string; value: string }>
  >([]);
  const [manualPdfFile, setManualPdfFile] = useState<File | null>(null);

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createProductWithImageAction,
    {
      successMessage: "Producto creado",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateProductWithImageAction,
    {
      successMessage: "Producto actualizado",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;

    if (product) {
      form.reset({
        sku: product.sku,
        name: product.name,
        description: product.description ?? "",
        stock: product.stock,
        price: product.price,
        discountBusinessPct: product.discountBusinessPct,
        discountClient: product.discountClient,
        active: product.active,
        manualPdfUrl: product.manualPdfUrl ?? "",
        brandId: product.brandId,
        brandTypeId: product.brandTypeId,
      });
      setCharacteristics(
        product.characteristicValues.map((item) => ({
          specificId: item.specificId,
          value: item.value ?? "",
        })),
      );
      setManualPdfFile(null);
    } else {
      form.reset({
        sku: "",
        name: "",
        description: "",
        stock: 0,
        price: 0,
        discountBusinessPct: 0,
        discountClient: 0,
        active: true,
        manualPdfUrl: "",
        brandId: "",
        brandTypeId: "",
      });
      setCharacteristics([]);
      setManualPdfFile(null);
    }
  }, [open, product, form]);

  const watchedBrandId = form.watch("brandId");

  const brandOptions = useMemo(
    () => brands.map((b) => ({ value: b.id, label: b.name })),
    [brands],
  );

  const brandTypeOptions = useMemo(() => {
    const base = brandTypes
      .filter((t) => !watchedBrandId || t.brandId === watchedBrandId)
      .map((t) => ({
        value: t.id,
        label: `${t.brandName} \u00B7 ${t.name}`,
      }));

    // Solo mostrar el tipo guardado como opción extra si sigue editando la misma
    // marca; si el usuario cambió de marca, no inyectar el tipo anterior.
    if (
      product &&
      watchedBrandId === product.brandId &&
      product.brandTypeId &&
      !base.some((item) => item.value === product.brandTypeId)
    ) {
      base.unshift({
        value: product.brandTypeId,
        label: `${product.brandName} \u00B7 ${product.brandTypeName}`,
      });
    }

    return base;
  }, [brandTypes, watchedBrandId, product]);

  // Si cambia la marca (o los tipos cargados), el `brandTypeId` debe seguir
  // perteneciendo a esa marca; si no, se limpia para que el select coincida.
  useEffect(() => {
    if (!watchedBrandId) return;
    const current = form.getValues("brandTypeId");
    if (!current) return;
    const validForBrand = brandTypes.some(
      (t) => t.id === current && t.brandId === watchedBrandId,
    );
    if (!validForBrand) {
      form.setValue("brandTypeId", "", {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [watchedBrandId, brandTypes, form]);

  const specificOptions = useMemo(() => {
    const selectedIds = new Set(characteristics.map((c) => c.specificId));
    const all = specificCharacteristics
      .filter((s) => s.active || selectedIds.has(s.id))
      .slice()
      .sort((a, b) => {
        const byGeneral = a.generalName.localeCompare(b.generalName, "es");
        if (byGeneral !== 0) return byGeneral;
        return a.name.localeCompare(b.name, "es");
      });

    return all;
  }, [specificCharacteristics, characteristics]);

  const toggleCharacteristic = (specificId: string) => {
    setCharacteristics((prev) => {
      const exists = prev.some((item) => item.specificId === specificId);
      if (exists) {
        return prev.filter((item) => item.specificId !== specificId);
      }
      return [...prev, { specificId, value: "" }];
    });
  };

  const updateCharacteristicValue = (specificId: string, value: string) => {
    setCharacteristics((prev) =>
      prev.map((item) =>
        item.specificId === specificId ? { ...item, value } : item,
      ),
    );
  };

  const existingImages: ExistingServiceImageInput[] =
    product?.images.map((img) => ({
      id: img.id,
      url: img.url,
      order: img.order,
      isPrimary: img.isPrimary,
    })) ?? [];

  const formKey = `${product?.id ?? "new"}-${open ? "open" : "closed"}`;

  const handleSubmit = (
    values: ProductFormValues,
    newImages: ReturnType<typeof useServiceImagesManager>["newImages"],
    updatedExistingImages: ReturnType<
      typeof useServiceImagesManager
    >["updatedExistingImages"],
    removedImages: string[],
  ) => {
    const sortedNew = [...newImages].sort((a, b) => a.order - b.order);
    const files = sortedNew.map((img) => img.file);
    const primaryIndex = sortedNew.findIndex((img) => img.isPrimary);

    const characteristicValues: ProductCharacteristicValueInput[] =
      characteristics.map((c) => ({
        specificId: c.specificId,
        value: c.value,
      }));

    if (product) {
      executeUpdate(
        product.id,
        values,
        files,
        primaryIndex,
        updatedExistingImages,
        removedImages,
        characteristicValues,
        manualPdfFile,
      );
      return;
    }

    executeCreate(
      values,
      files,
      primaryIndex >= 0 ? primaryIndex : 0,
      characteristicValues,
      manualPdfFile,
    );
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={product ? "Editar producto" : "Nuevo producto"}
      description={
        "Gestiona información comercial, imágenes y características específicas del producto."
      }
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <ButtonPending
            type="submit"
            form={PRODUCT_FORM_ID}
            pending={isPending}
            pendingLabel="Guardando"
          >
            Guardar
          </ButtonPending>
        </SlideOverFooter>
      }
      contentAriaLabel="Formulario de producto"
    >
      <ProductFormBody
        key={formKey}
        form={form}
        onSubmit={handleSubmit}
        isPending={isPending}
        product={product}
        brandOptions={brandOptions}
        brandTypeOptions={brandTypeOptions}
        specificOptions={specificOptions}
        characteristics={characteristics}
        toggleCharacteristic={toggleCharacteristic}
        updateCharacteristicValue={updateCharacteristicValue}
        existingImages={existingImages}
        manualPdfFile={manualPdfFile}
        setManualPdfFile={setManualPdfFile}
      />
    </SlideOver>
  );
}

function ProductFormBody({
  form,
  onSubmit,
  isPending,
  product,
  brandOptions,
  brandTypeOptions,
  specificOptions,
  characteristics,
  toggleCharacteristic,
  updateCharacteristicValue,
  existingImages,
  manualPdfFile,
  setManualPdfFile,
}: {
  form: ReturnType<typeof useForm<ProductFormValues>>;
  onSubmit: (
    values: ProductFormValues,
    newImages: ReturnType<typeof useServiceImagesManager>["newImages"],
    updatedExistingImages: ReturnType<
      typeof useServiceImagesManager
    >["updatedExistingImages"],
    removedImages: string[],
  ) => void;
  isPending: boolean;
  product: Product | null;
  brandOptions: Array<{ value: string; label: string }>;
  brandTypeOptions: Array<{ value: string; label: string }>;
  specificOptions: SpecificCharacteristic[];
  characteristics: Array<{ specificId: string; value: string }>;
  toggleCharacteristic: (specificId: string) => void;
  updateCharacteristicValue: (specificId: string, value: string) => void;
  existingImages: ExistingServiceImageInput[];
  manualPdfFile: File | null;
  setManualPdfFile: (file: File | null) => void;
}) {
  const errors = form.formState.errors;
  const images = useServiceImagesManager(existingImages);

  const selectedSet = useMemo(
    () => new Set(characteristics.map((item) => item.specificId)),
    [characteristics],
  );

  const onSubmitForm = (values: ProductFormValues) => {
    onSubmit(
      values,
      images.newImages,
      images.updatedExistingImages,
      images.removedImages,
    );
  };

  return (
    <Form
      id={PRODUCT_FORM_ID}
      form={form}
      onSubmit={onSubmitForm}
      className="space-y-5"
    >
      <section className={adminSlideOverSectionClassName}>
        <header className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Información básica
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            name="sku"
            label="SKU"
            required
            disabled={isPending}
            error={errors.sku?.message}
            className={adminServiceLikeInputClassName}
            autoComplete="off"
          />
          <FormField
            name="name"
            label="Nombre"
            required
            disabled={isPending}
            error={errors.name?.message}
            className={adminServiceLikeInputClassName}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-description">Descripción</Label>
          <textarea
            id="product-description"
            {...form.register("description")}
            disabled={isPending}
            className="min-h-[110px] w-full rounded-lg border border-border/80 bg-background/80 px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring/35"
            placeholder="Describe brevemente el producto"
          />
          {errors.description?.message ? (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            name="stock"
            label="Stock"
            type="number"
            required
            disabled={isPending}
            error={errors.stock?.message}
            className={adminServiceLikeInputClassName}
            min={0}
          />
          <FormField
            name="price"
            label="Precio"
            type="number"
            step="0.01"
            required
            disabled={isPending}
            error={errors.price?.message}
            className={adminServiceLikeInputClassName}
            min={0}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            name="discountBusinessPct"
            label="Descuento empresa (%)"
            type="number"
            step="0.01"
            required
            disabled={isPending}
            error={errors.discountBusinessPct?.message}
            className={adminServiceLikeInputClassName}
            min={0}
            max={100}
          />
          <FormField
            name="discountClient"
            label="Descuento cliente (%)"
            type="number"
            step="0.01"
            required
            disabled={isPending}
            error={errors.discountClient?.message}
            className={adminServiceLikeInputClassName}
            min={0}
            max={100}
          />
        </div>

        <div className="border-t border-border/50 pt-4">
          <FormSwitchField<ProductFormValues>
            name="active"
            label="Activo en catálogo"
            description="Si está desactivado, el producto no se mostrará en el catálogo público."
          />
        </div>
      </section>

      <section className={adminSlideOverSectionClassName}>
        <header className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Imágenes
          </h2>
          <p className="text-xs text-muted-foreground">
            Reordena por drag & drop, define una principal y elimina las que no
            necesites.
          </p>
        </header>

        <Dropzone onFilesAdded={images.addFiles} />

        {images.items.length > 0 ? (
          <ImageGrid
            items={images.items}
            onReorder={images.moveImage}
            onRemove={images.removeImage}
            onSetPrimary={images.markPrimary}
            onMoveUp={(key) => images.moveByKeyboard(key, "up")}
            onMoveDown={(key) => images.moveByKeyboard(key, "down")}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Aún no hay imágenes. Puedes subir una o varias.
          </div>
        )}
      </section>

      <section className={adminSlideOverSectionClassName}>
        <header className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Manual PDF (opcional)
          </h2>
          <p className="text-xs text-muted-foreground">
            {"Sube el PDF del manual. Al guardar se registrará su URL pública."}
          </p>
        </header>

        <div className="rounded-lg border border-border/70 bg-muted/30 p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <svg
              className="mt-0.5 h-9 w-9 shrink-0 text-red-500/90 sm:h-10 sm:w-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
              />
            </svg>

            <div className="min-w-0 flex-1">
              {!manualPdfFile ? (
                <div className="space-y-2">
                  <Label htmlFor="product-manual-pdf" className="sr-only">
                    Subir PDF del manual
                  </Label>
                  <label
                    htmlFor="product-manual-pdf"
                    className="inline-flex cursor-pointer items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent"
                  >
                    Subir PDF
                  </label>
                  <Input
                    id="product-manual-pdf"
                    type="file"
                    accept="application/pdf"
                    disabled={isPending}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setManualPdfFile(f);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato PDF. Máximo 10 MB.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="product-manual-pdf"
                    type="file"
                    accept="application/pdf"
                    disabled={isPending}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setManualPdfFile(f);
                    }}
                  />
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3">
                    <span className="truncate text-sm text-foreground">
                      {manualPdfFile.name}
                    </span>
                    <TooltipProvider delayDuration={120}>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label
                              htmlFor="product-manual-pdf"
                              className="cursor-pointer inline-flex items-center justify-center rounded-md p-1 text-primary transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <RefreshCcw className="h-4 w-4" aria-hidden />
                              <span className="sr-only">Reemplazar</span>
                            </label>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="center"
                            className="rounded-lg border-border/60 bg-popover px-3 py-1.5 text-[11px] text-popover-foreground shadow-lg"
                          >
                            Reemplazar
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setManualPdfFile(null)}
                              className="inline-flex items-center justify-center rounded-md p-1 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                              <span className="sr-only">Eliminar</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="center"
                            className="rounded-lg border-border/60 bg-popover px-3 py-1.5 text-[11px] text-popover-foreground shadow-lg"
                          >
                            Eliminar
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={adminSlideOverSectionClassName}>
        <div className="grid grid-cols-1 gap-4">
          <FormSelectField<ProductFormValues>
            name="brandId"
            label="Marca"
            required
            instanceId="product-brand"
            options={brandOptions}
            placeholder="Selecciona una marca"
            isDisabled={isPending}
          />
          <FormSelectField<ProductFormValues>
            name="brandTypeId"
            label="Tipo por marca"
            instanceId="product-brand-type"
            options={brandTypeOptions}
            placeholder={
              brandTypeOptions.length === 0
                ? "No hay tipos para esta marca"
                : "Selecciona un tipo"
            }
            isDisabled={isPending || brandTypeOptions.length === 0}
          />
        </div>
      </section>

      <section className={adminSlideOverSectionClassName}>
        <header className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Características específicas
          </h2>
          <p className="text-xs text-muted-foreground">
            Marca las características que aplican al producto y, si quieres,
            añade un valor extra.
          </p>
        </header>

        <div className={adminSlideOverNestedScrollClassName}>
          {specificOptions.map((item) => {
            const selected = selectedSet.has(item.id);

            return (
              <div
                key={item.id}
                className="rounded-lg border border-border/60 p-3"
              >
                <label className="flex items-start gap-3">
                  <Input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleCharacteristic(item.id)}
                    disabled={isPending}
                    className="mt-0.5 h-4 w-4"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.generalName}
                    </p>
                  </div>
                </label>

                {/* Temporalmente oculto: valor opcional por característica específica. */}
                {/* {selected ? (
                  <div className="mt-3 space-y-1">
                    <Label htmlFor={`specific-${item.id}`} className="text-xs">
                      Valor (opcional)
                    </Label>
                    <Input
                      id={`specific-${item.id}`}
                      value={currentValue}
                      onChange={(e) =>
                        updateCharacteristicValue(item.id, e.target.value)
                      }
                      disabled={isPending}
                      placeholder="Ej. 220V / 1 año / Negro"
                      className="h-9"
                    />
                  </div>
                ) : null} */}
              </div>
            );
          })}
        </div>
      </section>
    </Form>
  );
}
