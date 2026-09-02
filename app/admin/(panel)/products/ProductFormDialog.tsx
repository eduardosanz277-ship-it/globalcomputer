"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Select from "react-select";
import type { BrandType } from "@/modules/admin/brand-types/brand-types.types";
import type { Brand } from "@/modules/admin/brands/brands.types";
import type {
  AdminCategory,
  AdminSubcategory,
} from "@/modules/admin/categories/categories.types";
import type { SpecificCharacteristic } from "@/modules/admin/specific-characteristics/specific-characteristics.types";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/modules/admin/products/products.schema";
import type {
  Product,
  ProductAccessoryInput,
  ProductCharacteristicValueInput,
} from "@/modules/admin/products/products.types";
import {
  createProductWithImageAction,
  updateProductWithImageAction,
} from "./actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Form, FormField } from "@/components/ui/form";
import { FormSelectField, FormSwitchField } from "@/components/ui/form-fields";
import { appSelectStyles } from "@/components/ui/react-select-app-styles";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import { cn } from "@/utils/cn";
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
import { ExternalLink, FileText, RefreshCcw, Trash2, X } from "lucide-react";
import { ProductDescriptionEditor } from "@/components/ProductDescriptionEditor";
import { useI18n } from "@/components/i18n/I18nProvider";
import { ProductPricingTab } from "./ProductPricingTab";

const PRODUCT_FORM_ID = "product-form-slide-over";

function getManualPdfDisplayName(file: File | null, url: string): string {
  if (file?.name) return file.name;
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").filter(Boolean).at(-1) ?? "manual.pdf";
    const decoded = decodeURIComponent(last);
    return decoded.replace(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i,
      "",
    );
  } catch {
    const fallback = url.split("/").filter(Boolean).at(-1);
    return fallback || "manual.pdf";
  }
}

/** Alto mínimo de las demás pestañas = alto natural de Información general. */
const productFormSectionClassName = adminSlideOverSectionClassName;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  products: Product[];
  brands: Brand[];
  brandTypes: BrandType[];
  specificCharacteristics: SpecificCharacteristic[];
  categories: AdminCategory[];
  subcategories: AdminSubcategory[];
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  products,
  brands,
  brandTypes,
  specificCharacteristics,
  categories,
  subcategories,
}: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      sku: "",
      name: "",
      nameEn: "",
      description: "",
      descriptionEn: "",
      specifications: "",
      specificationsEn: "",
      stock: 0,
      pricingStrategy: "cost",
      cost: 0,
      marginClientPct: 0,
      marginBusinessPct: 0,
      priceClient: 0,
      priceBusiness: 0,
      discountClientPct: 0,
      discountBusinessPct: 0,
      shippingType: "standard",
      shippingSurchargePerUnit: undefined as unknown as number,
      active: true,
      featured: false,
      manualPdfUrl: "",
      brandId: "",
      brandTypeId: "",
      placementCategoryId: "",
      placementSubcategoryId: "",
    },
  });

  const [characteristics, setCharacteristics] = useState<
    Array<{ specificId: string; value: string }>
  >([]);
  const [accessories, setAccessories] = useState<
    Array<{ accessoryProductId: string }>
  >([]);
  const [manualPdfFile, setManualPdfFile] = useState<File | null>(null);

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createProductWithImageAction,
    {
      successMessage: t("admin.products.toast.created"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateProductWithImageAction,
    {
      successMessage: t("admin.products.toast.updated"),
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
        nameEn: product.nameEn ?? "",
        description: product.description ?? "",
        descriptionEn: product.descriptionEn ?? "",
        specifications: product.specifications ?? "",
        specificationsEn: product.specificationsEn ?? "",
        stock: product.stock,
        pricingStrategy: product.pricingStrategy,
        cost: product.cost,
        marginClientPct: product.marginClientPct,
        marginBusinessPct: product.marginBusinessPct,
        priceClient: product.priceClient,
        priceBusiness: product.priceBusiness,
        discountClientPct: product.discountClientPct,
        discountBusinessPct: product.discountBusinessPct,
        shippingType: product.shippingType,
        shippingSurchargePerUnit:
          product.shippingType === "non_standard" &&
          product.shippingSurchargePerUnit > 0
            ? product.shippingSurchargePerUnit
            : (undefined as unknown as number),
        active: product.active,
        featured: product.featured,
        manualPdfUrl: product.manualPdfUrl ?? "",
        brandId: product.brandId,
        brandTypeId: product.brandTypeId,
        placementCategoryId: product.placementCategoryId,
        placementSubcategoryId: product.placementSubcategoryId,
      });
      setCharacteristics(
        product.characteristicValues.map((item) => ({
          specificId: item.specificId,
          value: item.value ?? "",
        })),
      );
      setAccessories(
        product.accessories.map((item) => ({
          accessoryProductId: item.accessoryProductId,
        })),
      );
      setManualPdfFile(null);
    } else {
      form.reset({
        sku: "",
        name: "",
        nameEn: "",
        description: "",
        descriptionEn: "",
        specifications: "",
        specificationsEn: "",
        stock: 0,
        pricingStrategy: "cost",
        cost: 0,
        marginClientPct: 0,
        marginBusinessPct: 0,
        priceClient: 0,
        priceBusiness: 0,
        discountClientPct: 0,
        discountBusinessPct: 0,
        shippingType: "standard",
        shippingSurchargePerUnit: undefined as unknown as number,
        active: true,
        featured: false,
        manualPdfUrl: "",
        brandId: "",
        brandTypeId: "",
        placementCategoryId: "",
        placementSubcategoryId: "",
      });
      setCharacteristics([]);
      setAccessories([]);
      setManualPdfFile(null);
    }
  }, [open, product, form]);

  const watchedBrandId = form.watch("brandId");
  const watchedPlacementCategoryId = form.watch("placementCategoryId");

  const localizedBrandName = (brand: Brand): string =>
    locale === "en" ? brand.nameEn?.trim() || brand.name : brand.name;
  const localizedBrandTypeName = (type: BrandType): string =>
    locale === "en" ? type.nameEn?.trim() || type.name : type.name;
  const localizedBrandTypeBrandName = (type: BrandType): string =>
    locale === "en"
      ? type.brandNameEn?.trim() || type.brandName
      : type.brandName;
  const localizedCategoryName = (category: AdminCategory): string =>
    locale === "en" ? category.nameEn?.trim() || category.name : category.name;

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: localizedCategoryName(c),
      })),
    [categories, locale],
  );

  const subcategoriesForCategory = useMemo(
    () =>
      watchedPlacementCategoryId
        ? subcategories.filter(
            (s) => s.categoryId === watchedPlacementCategoryId,
          )
        : [],
    [subcategories, watchedPlacementCategoryId],
  );

  useEffect(() => {
    if (!watchedPlacementCategoryId) return;
    const current = form.getValues("placementSubcategoryId");
    if (!current) return;
    const ok = subcategories.some(
      (s) => s.id === current && s.categoryId === watchedPlacementCategoryId,
    );
    if (!ok) {
      form.setValue("placementSubcategoryId", "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watchedPlacementCategoryId, subcategories, form]);

  const brandOptions = useMemo(
    () =>
      brands.map((b) => ({
        value: b.id,
        label: localizedBrandName(b),
      })),
    [brands, locale],
  );

  const brandTypeOptions = useMemo(() => {
    const base = brandTypes
      .filter((t) => !watchedBrandId || t.brandId === watchedBrandId)
      .map((t) => ({
        value: t.id,
        label: `${localizedBrandTypeBrandName(t)} \u00B7 ${localizedBrandTypeName(t)}`,
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
  }, [brandTypes, watchedBrandId, product, locale]);

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
    const localizedSpecificName = (item: SpecificCharacteristic): string =>
      locale === "en" ? item.nameEn?.trim() || item.name : item.name;
    const localizedGeneralName = (item: SpecificCharacteristic): string =>
      locale === "en"
        ? item.generalNameEn?.trim() || item.generalName
        : item.generalName;

    const selectedIds = new Set(characteristics.map((c) => c.specificId));
    const all = specificCharacteristics
      .filter((s) => s.active || selectedIds.has(s.id))
      .slice()
      .sort((a, b) => {
        const byGeneral = localizedGeneralName(a).localeCompare(
          localizedGeneralName(b),
          locale,
        );
        if (byGeneral !== 0) return byGeneral;
        return localizedSpecificName(a).localeCompare(
          localizedSpecificName(b),
          locale,
        );
      });

    return all;
  }, [specificCharacteristics, characteristics, locale]);

  const toggleCharacteristic = (specificId: string) => {
    setCharacteristics((prev) => {
      const exists = prev.some((item) => item.specificId === specificId);
      if (exists) {
        return prev.filter((item) => item.specificId !== specificId);
      }
      return [...prev, { specificId, value: "" }];
    });
  };

  const removeCharacteristic = (specificId: string) => {
    setCharacteristics((prev) =>
      prev.filter((item) => item.specificId !== specificId),
    );
  };

  const updateCharacteristicValue = (specificId: string, value: string) => {
    setCharacteristics((prev) =>
      prev.map((item) =>
        item.specificId === specificId ? { ...item, value } : item,
      ),
    );
  };

  const accessoryTypeCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of categories) {
      if (c.isAccessoryType) ids.add(c.id);
    }
    return ids;
  }, [categories]);

  const subcategoryParentCategoryId = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subcategories) map.set(s.id, s.categoryId);
    return map;
  }, [subcategories]);

  /** Categoría o subcategoría del producto (placement) que se usa para filtrar el picker de accesorios. */
  const accessoryPlacementId = (p: Product): string | null =>
    p.subcategoryId ?? p.categoryId;

  /** Productos elegibles como accesorio: su categoría (directa o vía subcategoría) está marcada como «de tipo accesorio». */
  const accessoryCandidates = useMemo(() => {
    return products.filter((p) => {
      if (product && p.id === product.id) return false;
      const parentCategoryId = p.subcategoryId
        ? subcategoryParentCategoryId.get(p.subcategoryId)
        : p.categoryId;
      return Boolean(parentCategoryId && accessoryTypeCategoryIds.has(parentCategoryId));
    });
  }, [products, product, subcategoryParentCategoryId, accessoryTypeCategoryIds]);

  const localizedCategoryLabel = (c: AdminCategory): string =>
    locale === "en" ? c.nameEn?.trim() || c.name : c.name;
  const localizedSubcategoryLabel = (s: AdminSubcategory): string =>
    locale === "en" ? s.nameEn?.trim() || s.name : s.name;

  /** Opciones del filtro «categoría/subcategoría» del picker de accesorios: solo las marcadas «de tipo accesorio». */
  const accessoryPlacementOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = [];
    const accessoryCategories = categories
      .filter((c) => c.isAccessoryType)
      .sort((a, b) =>
        localizedCategoryLabel(a).localeCompare(localizedCategoryLabel(b), locale),
      );
    for (const c of accessoryCategories) {
      opts.push({ value: c.id, label: localizedCategoryLabel(c) });
      const subs = subcategories
        .filter((s) => s.categoryId === c.id)
        .sort((a, b) =>
          localizedSubcategoryLabel(a).localeCompare(
            localizedSubcategoryLabel(b),
            locale,
          ),
        );
      for (const s of subs) {
        opts.push({
          value: s.id,
          label: `${localizedCategoryLabel(c)} › ${localizedSubcategoryLabel(s)}`,
        });
      }
    }
    return opts;
  }, [categories, subcategories, locale]);

  const toggleAccessory = (accessoryProductId: string) => {
    setAccessories((prev) => {
      const exists = prev.some(
        (item) => item.accessoryProductId === accessoryProductId,
      );
      if (exists) {
        return prev.filter(
          (item) => item.accessoryProductId !== accessoryProductId,
        );
      }
      return [...prev, { accessoryProductId }];
    });
  };

  const removeAccessory = (accessoryProductId: string) => {
    setAccessories((prev) =>
      prev.filter((item) => item.accessoryProductId !== accessoryProductId),
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

    const accessoryValues: ProductAccessoryInput[] = accessories.map((a) => ({
      accessoryProductId: a.accessoryProductId,
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
        accessoryValues,
      );
      return;
    }

    executeCreate(
      values,
      files,
      primaryIndex >= 0 ? primaryIndex : 0,
      characteristicValues,
      manualPdfFile,
      accessoryValues,
    );
  };

  const slideOverContentRef = useRef<HTMLDivElement>(null);

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        product
          ? t("admin.products.form.titleEdit")
          : t("admin.products.form.titleNew")
      }
      description={t("admin.products.form.description")}
      panelClassName="md:w-[min(90vw,42rem)] lg:w-[55%] lg:max-w-none"
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("admin.products.form.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            form={PRODUCT_FORM_ID}
            pending={isPending}
            pendingLabel={t("admin.products.form.saving")}
          >
            {t("admin.products.form.save")}
          </ButtonPending>
        </SlideOverFooter>
      }
      contentAriaLabel={t("admin.products.form.contentAria")}
      contentClassName="bg-background px-4 pb-4 pt-0"
      contentRef={slideOverContentRef}
    >
      <ProductFormBody
        key={formKey}
        scrollContainerRef={slideOverContentRef}
        pricingResetKey={formKey}
        form={form}
        onSubmit={handleSubmit}
        isPending={isPending}
        product={product}
        categoryOptions={categoryOptions}
        subcategoriesForCategory={subcategoriesForCategory}
        brandOptions={brandOptions}
        brandTypeOptions={brandTypeOptions}
        specificOptions={specificOptions}
        characteristics={characteristics}
        toggleCharacteristic={toggleCharacteristic}
        removeCharacteristic={removeCharacteristic}
        updateCharacteristicValue={updateCharacteristicValue}
        accessoryCandidates={accessoryCandidates}
        accessoryPlacementId={accessoryPlacementId}
        accessoryPlacementOptions={accessoryPlacementOptions}
        accessories={accessories}
        toggleAccessory={toggleAccessory}
        removeAccessory={removeAccessory}
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
  pricingResetKey,
  categoryOptions,
  subcategoriesForCategory,
  brandOptions,
  brandTypeOptions,
  specificOptions,
  characteristics,
  toggleCharacteristic,
  removeCharacteristic,
  updateCharacteristicValue,
  accessoryCandidates,
  accessoryPlacementId,
  accessoryPlacementOptions,
  accessories,
  toggleAccessory,
  removeAccessory,
  existingImages,
  manualPdfFile,
  setManualPdfFile,
  scrollContainerRef,
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
  pricingResetKey: string;
  categoryOptions: Array<{ value: string; label: string }>;
  subcategoriesForCategory: AdminSubcategory[];
  brandOptions: Array<{ value: string; label: string }>;
  brandTypeOptions: Array<{ value: string; label: string }>;
  specificOptions: SpecificCharacteristic[];
  characteristics: Array<{ specificId: string; value: string }>;
  toggleCharacteristic: (specificId: string) => void;
  removeCharacteristic: (specificId: string) => void;
  updateCharacteristicValue: (specificId: string, value: string) => void;
  accessoryCandidates: Product[];
  accessoryPlacementId: (p: Product) => string | null;
  accessoryPlacementOptions: Array<{ value: string; label: string }>;
  accessories: Array<{ accessoryProductId: string }>;
  toggleAccessory: (accessoryProductId: string) => void;
  removeAccessory: (accessoryProductId: string) => void;
  existingImages: ExistingServiceImageInput[];
  manualPdfFile: File | null;
  setManualPdfFile: (file: File | null) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t, locale } = useI18n();
  type GeneralFilterOption = { value: string; label: string };
  const errors = form.formState.errors;
  const watchedPlacementCategoryId = form.watch("placementCategoryId");
  const watchedManualPdfUrl = form.watch("manualPdfUrl")?.trim() ?? "";
  const hasManualPdf = Boolean(manualPdfFile) || Boolean(watchedManualPdfUrl);
  const manualPdfInputRef = useRef<HTMLInputElement | null>(null);
  const [manualPdfError, setManualPdfError] = useState("");
  const MANUAL_PDF_MAX_BYTES = 5 * 1024 * 1024;

  const applyManualPdfFile = (file: File | null) => {
    if (!file) return;
    const typeOk =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const sizeOk = file.size > 0 && file.size <= MANUAL_PDF_MAX_BYTES;
    if (!typeOk || !sizeOk) {
      setManualPdfError(t("admin.products.form.media.manualInvalidFile"));
      return;
    }
    setManualPdfError("");
    setManualPdfFile(file);
  };

  const openManualPdfPicker = () => {
    if (isPending) return;
    manualPdfInputRef.current?.click();
  };

  const images = useServiceImagesManager(existingImages);
  const [selectedGeneralId, setSelectedGeneralId] = useState<string>("all");
  const [accessorySearch, setAccessorySearch] = useState("");
  const [accessoryPlacementFilter, setAccessoryPlacementFilter] =
    useState<string>("all");
  const generalSectionRef = useRef<HTMLElement>(null);
  const [sectionMinHeightPx, setSectionMinHeightPx] = useState<number>();

  type ProductFormTabId =
    | "general"
    | "description"
    | "pricing"
    | "shipping"
    | "media"
    | "characteristics"
    | "specifications"
    | "accessories";

  const PRODUCT_FORM_TABS: { id: ProductFormTabId; label: string }[] = [
    { id: "general", label: t("admin.products.form.tabs.general") },
    { id: "description", label: t("admin.products.form.tabs.description") },
    { id: "pricing", label: t("admin.products.form.tabs.pricing") },
    { id: "shipping", label: t("admin.products.form.tabs.shipping") },
    { id: "media", label: t("admin.products.form.tabs.media") },
    {
      id: "characteristics",
      label: t("admin.products.form.tabs.characteristics"),
    },
    {
      id: "specifications",
      label: t("admin.products.form.tabs.specifications"),
    },
    {
      id: "accessories",
      label: t("admin.products.form.tabs.accessories"),
    },
  ];

  const [activeTab, setActiveTab] = useState<ProductFormTabId>("general");

  // Resetea el scroll del SlideOver al inicio al cambiar de pestaña
  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [activeTab, scrollContainerRef]);

  const [descriptionLanguageTab, setDescriptionLanguageTab] = useState<
    "es" | "en"
  >(locale === "en" ? "en" : "es");
  const [specificationsLanguageTab, setSpecificationsLanguageTab] = useState<
    "es" | "en"
  >(locale === "en" ? "en" : "es");

  useLayoutEffect(() => {
    if (activeTab !== "general") return;
    const el = generalSectionRef.current;
    if (!el) return;

    const updateHeight = () => {
      const next = Math.ceil(el.getBoundingClientRect().height);
      if (next > 0) setSectionMinHeightPx(next);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    activeTab,
    watchedPlacementCategoryId,
    locale,
    subcategoriesForCategory.length,
  ]);

  const sectionMinHeightStyle = sectionMinHeightPx
    ? ({ minHeight: sectionMinHeightPx } as const)
    : undefined;

  useEffect(() => {
    const next = locale === "en" ? "en" : "es";
    setDescriptionLanguageTab(next);
    setSpecificationsLanguageTab(next);
  }, [locale]);

  const selectedSet = useMemo(
    () => new Set(characteristics.map((item) => item.specificId)),
    [characteristics],
  );

  const specificGeneralOptions = useMemo<GeneralFilterOption[]>(() => {
    const localizedGeneralName = (item: SpecificCharacteristic): string =>
      locale === "en"
        ? item.generalNameEn?.trim() || item.generalName
        : item.generalName;

    const map = new Map<string, string>();
    for (const item of specificOptions) {
      if (!map.has(item.generalId)) {
        map.set(item.generalId, localizedGeneralName(item));
      }
    }
    const dynamic = Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
    return [
      {
        value: "all",
        label: t("admin.products.form.characteristics.filterAll"),
      },
      ...dynamic,
    ];
  }, [locale, specificOptions, t]);

  const visibleSpecificOptions = useMemo(() => {
    if (selectedGeneralId === "all") return specificOptions;
    return specificOptions.filter(
      (item) => item.generalId === selectedGeneralId,
    );
  }, [specificOptions, selectedGeneralId]);

  const selectedSpecificGroups = useMemo(() => {
    const localizedGeneral = (item: SpecificCharacteristic): string =>
      locale === "en"
        ? item.generalNameEn?.trim() || item.generalName
        : item.generalName;
    const localizedSpecific = (item: SpecificCharacteristic): string =>
      locale === "en" ? item.nameEn?.trim() || item.name : item.name;

    const selectedIds = new Set(characteristics.map((c) => c.specificId));
    const selectedItems = specificOptions
      .filter((item) => selectedIds.has(item.id))
      .slice()
      .sort((a, b) => {
        const byGeneral = localizedGeneral(a).localeCompare(
          localizedGeneral(b),
          locale,
        );
        if (byGeneral !== 0) return byGeneral;
        return localizedSpecific(a).localeCompare(localizedSpecific(b), locale);
      });

    const grouped = new Map<string, SpecificCharacteristic[]>();
    for (const item of selectedItems) {
      const key = localizedGeneral(item);
      const list = grouped.get(key) ?? [];
      list.push(item);
      grouped.set(key, list);
    }
    return Array.from(grouped.entries());
  }, [characteristics, locale, specificOptions]);

  const accessorySelectedSet = useMemo(
    () => new Set(accessories.map((a) => a.accessoryProductId)),
    [accessories],
  );

  const localizedProductLabel = (p: Product): string =>
    locale === "en" ? p.nameEn?.trim() || p.name : p.name;

  const visibleAccessoryCandidates = useMemo(() => {
    const query = accessorySearch.trim().toLowerCase();
    let base = accessoryCandidates;
    if (accessoryPlacementFilter !== "all") {
      base = base.filter(
        (p) => accessoryPlacementId(p) === accessoryPlacementFilter,
      );
    }
    if (query) {
      base = base.filter(
        (p) =>
          localizedProductLabel(p).toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query),
      );
    }
    return base
      .slice()
      .sort((a, b) =>
        localizedProductLabel(a).localeCompare(localizedProductLabel(b), locale),
      );
  }, [
    accessoryCandidates,
    accessorySearch,
    accessoryPlacementFilter,
    accessoryPlacementId,
    locale,
  ]);

  /**
   * Info para mostrar en la lista de seleccionados: prioriza los candidatos actuales
   * (datos frescos) y cae al snapshot guardado en `product.accessories` para que un
   * accesorio ya vinculado siga mostrándose aunque su categoría deje de ser «de tipo
   * accesorio» (no desaparece de la vista hasta que el admin lo quite a propósito).
   */
  const accessoryDisplayById = useMemo(() => {
    const map = new Map<
      string,
      { name: string; nameEn: string | null; sku: string }
    >();
    for (const a of product?.accessories ?? []) {
      map.set(a.accessoryProductId, {
        name: a.name,
        nameEn: a.nameEn,
        sku: a.sku,
      });
    }
    for (const p of accessoryCandidates) {
      map.set(p.id, { name: p.name, nameEn: p.nameEn, sku: p.sku });
    }
    return map;
  }, [product, accessoryCandidates]);

  const selectedAccessoryProducts = useMemo(
    () =>
      accessories
        .map((a) => {
          const info = accessoryDisplayById.get(a.accessoryProductId);
          if (!info) return null;
          return { id: a.accessoryProductId, ...info };
        })
        .filter(
          (p): p is { id: string; name: string; nameEn: string | null; sku: string } =>
            Boolean(p),
        ),
    [accessories, accessoryDisplayById],
  );

  const onSubmitForm = (values: ProductFormValues) => {
    onSubmit(
      values,
      images.newImages,
      images.updatedExistingImages,
      images.removedImages,
    );
  };

  const removeContentTopMargin =
    activeTab === "shipping" ||
    activeTab === "media" ||
    activeTab === "characteristics" ||
    activeTab === "specifications" ||
    activeTab === "accessories";

  return (
    <Form
      id={PRODUCT_FORM_ID}
      form={form}
      onSubmit={onSubmitForm}
      className={cn(
        "flex min-h-0 min-w-0 flex-col gap-0",
        removeContentTopMargin && "space-y-0",
      )}
    >
      <div
        role="tablist"
        aria-label={t("admin.products.form.tabs.ariaLabel")}
        className="sticky top-0 z-[100] -mx-4 flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-border/60 bg-background px-4 pb-3 pt-4 shadow-sm [scrollbar-width:thin]"
      >
        {PRODUCT_FORM_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
              activeTab === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative z-0 min-h-0 flex-1 space-y-4">
        {activeTab === "general" && (
          <section
            ref={generalSectionRef}
            className={productFormSectionClassName}
          >
            <div className="w-full">
              <div>
                <FormField
                  name="sku"
                  label="SKU"
                  required
                  disabled={isPending}
                  error={errors.sku?.message}
                  className={adminServiceLikeInputClassName}
                  autoComplete="off"
                />
              </div>
            </div>

            {locale === "en" ? (
              <>
                <div className="w-full">
                  <FormField
                    name="nameEn"
                    label={t("admin.products.form.fields.nameEn")}
                    required
                    disabled={isPending}
                    error={errors.nameEn?.message}
                    className={adminServiceLikeInputClassName}
                    autoComplete="off"
                  />
                </div>
                <div className="w-full">
                  <FormField
                    name="name"
                    label={t("admin.products.form.fields.name")}
                    required
                    disabled={isPending}
                    error={errors.name?.message}
                    className={adminServiceLikeInputClassName}
                    autoComplete="off"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="w-full">
                  <FormField
                    name="name"
                    label={t("admin.products.form.fields.name")}
                    required
                    disabled={isPending}
                    error={errors.name?.message}
                    className={adminServiceLikeInputClassName}
                    autoComplete="off"
                  />
                </div>
                <div className="w-full">
                  <FormField
                    name="nameEn"
                    label={t("admin.products.form.fields.nameEn")}
                    required
                    disabled={isPending}
                    error={errors.nameEn?.message}
                    className={adminServiceLikeInputClassName}
                    autoComplete="off"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 gap-4 border-t border-border/50 pt-4">
              <FormSelectField<ProductFormValues>
                name="brandId"
                label={t("admin.products.form.fields.brand")}
                required
                instanceId="product-brand"
                options={brandOptions}
                placeholder={t("admin.products.form.fields.brandPlaceholder")}
                isDisabled={isPending}
              />
              <FormSelectField<ProductFormValues>
                name="brandTypeId"
                label={t("admin.products.form.fields.brandType")}
                instanceId="product-brand-type"
                options={brandTypeOptions}
                placeholder={
                  brandTypeOptions.length === 0
                    ? t("admin.products.form.fields.brandTypeNoOptions")
                    : t("admin.products.form.fields.brandTypePlaceholder")
                }
                isDisabled={isPending || brandTypeOptions.length === 0}
              />
            </div>

            <header className="space-y-1 border-t border-border/50 pt-4">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                {t("admin.products.form.catalog.title")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("admin.products.form.catalog.description")}
              </p>
            </header>

            <div className="space-y-4">
              <FormSelectField<ProductFormValues>
                name="placementCategoryId"
                label={t("admin.products.form.fields.category")}
                required
                instanceId="product-category"
                options={categoryOptions}
                placeholder={
                  categoryOptions.length === 0
                    ? t("admin.products.form.fields.categoryNoOptions")
                    : t("admin.products.form.fields.categoryPlaceholder")
                }
                isDisabled={isPending || categoryOptions.length === 0}
                useMenuPortal
              />

              <div className="space-y-2">
                <Label
                  id="product-subcategory-group-label"
                  className="text-sm font-medium"
                >
                  {t("admin.products.form.fields.subcategory")}
                </Label>
                {!watchedPlacementCategoryId ? (
                  <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    {t(
                      "admin.products.form.fields.subcategoryPickCategoryHint",
                    )}
                  </p>
                ) : subcategoriesForCategory.length === 0 ? (
                  <p className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    {t("admin.products.form.fields.subcategoryEmptyHint")}
                  </p>
                ) : (
                  <Controller
                    name="placementSubcategoryId"
                    control={form.control}
                    render={({ field }) => (
                      <div
                        role="radiogroup"
                        aria-labelledby="product-subcategory-group-label"
                        className={adminSlideOverNestedScrollClassName}
                      >
                        <div className="rounded-lg border border-border/60 p-3">
                          <label className="flex cursor-pointer items-start gap-3">
                            <Input
                              type="radio"
                              name="product-placement-subcategory"
                              checked={field.value === ""}
                              onChange={() => field.onChange("")}
                              disabled={isPending}
                              className="mt-0.5 h-4 w-4"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {t(
                                  "admin.products.form.fields.subcategoryOnlyCategory",
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t(
                                  "admin.products.form.fields.subcategoryNone",
                                )}
                              </p>
                            </div>
                          </label>
                        </div>
                        {subcategoriesForCategory.map((sub) => (
                          <div
                            key={sub.id}
                            className="rounded-lg border border-border/60 p-3"
                          >
                            <label className="flex cursor-pointer items-start gap-3">
                              <Input
                                type="radio"
                                name="product-placement-subcategory"
                                checked={field.value === sub.id}
                                onChange={() => field.onChange(sub.id)}
                                disabled={isPending}
                                className="mt-0.5 h-4 w-4"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  {locale === "en"
                                    ? sub.nameEn?.trim() || sub.name
                                    : sub.name}
                                </p>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                )}
              </div>
              {errors.placementSubcategoryId?.message ? (
                <p className="text-sm text-destructive">
                  {String(errors.placementSubcategoryId.message)}
                </p>
              ) : null}
            </div>

            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<ProductFormValues>
                name="active"
                label={t("admin.products.form.fields.active")}
                description={t("admin.products.form.fields.activeDescription")}
              />
            </div>
            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<ProductFormValues>
                name="featured"
                label={t("admin.products.form.fields.featured")}
                description={t(
                  "admin.products.form.fields.featuredDescription",
                )}
              />
            </div>
          </section>
        )}

        {activeTab === "description" && (
          <section
            className={productFormSectionClassName}
            style={sectionMinHeightStyle}
          >
            <div className="space-y-2">
              <div
                role="tablist"
                aria-label={t("admin.services.form.languageTabs.ariaLabel")}
                className="flex items-center justify-start gap-2"
              >
                {locale === "en" ? (
                  <>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={descriptionLanguageTab === "en"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        descriptionLanguageTab === "en"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setDescriptionLanguageTab("en")}
                    >
                      {t("admin.services.form.languageTabs.english")}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={descriptionLanguageTab === "es"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        descriptionLanguageTab === "es"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setDescriptionLanguageTab("es")}
                    >
                      {t("admin.services.form.languageTabs.spanish")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={descriptionLanguageTab === "es"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        descriptionLanguageTab === "es"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setDescriptionLanguageTab("es")}
                    >
                      {t("admin.services.form.languageTabs.spanish")}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={descriptionLanguageTab === "en"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        descriptionLanguageTab === "en"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setDescriptionLanguageTab("en")}
                    >
                      {t("admin.services.form.languageTabs.english")}
                    </button>
                  </>
                )}
              </div>
              <div className="border-t border-border/60" aria-hidden />
            </div>
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <div
                  className={cn(descriptionLanguageTab !== "es" && "hidden")}
                >
                  <ProductDescriptionEditor
                    id="product-description-rich"
                    label={t("admin.products.form.fields.description")}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                    error={errors.description?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="descriptionEn"
              control={form.control}
              render={({ field }) => (
                <div
                  className={cn(descriptionLanguageTab !== "en" && "hidden")}
                >
                  <ProductDescriptionEditor
                    id="product-description-rich-en"
                    label={t("admin.products.form.fields.descriptionEn")}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                    error={errors.descriptionEn?.message}
                  />
                </div>
              )}
            />
          </section>
        )}

        <div className={cn(activeTab !== "pricing" && "hidden")}>
          <ProductPricingTab
            form={form}
            isPending={isPending}
            sectionClassName={productFormSectionClassName}
            sectionStyle={sectionMinHeightStyle}
          />
        </div>

        {activeTab === "shipping" && (
          <section
            className={productFormSectionClassName}
            style={sectionMinHeightStyle}
          >
            <header className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                {t("admin.products.form.shipping.title")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("admin.products.form.shipping.description")}
              </p>
            </header>

            <Controller
              name="shippingType"
              control={form.control}
              render={({ field }) => (
                <div
                  role="radiogroup"
                  aria-label={t("admin.products.form.fields.shippingType")}
                  className="space-y-2"
                >
                  <div className="rounded-lg border border-border/60 p-3">
                    <label className="flex cursor-pointer items-start gap-3">
                      <Input
                        type="radio"
                        name="product-shipping-type"
                        checked={field.value === "standard"}
                        onChange={() => {
                          field.onChange("standard");
                          form.setValue("shippingSurchargePerUnit", 0, {
                            shouldValidate: false,
                            shouldDirty: true,
                          });
                          form.clearErrors("shippingSurchargePerUnit");
                        }}
                        disabled={isPending}
                        className="mt-0.5 h-4 w-4"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {t("admin.products.form.fields.shippingTypeStandard")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "admin.products.form.fields.shippingTypeStandardHint",
                          )}
                        </p>
                      </div>
                    </label>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <label className="flex cursor-pointer items-start gap-3">
                      <Input
                        type="radio"
                        name="product-shipping-type"
                        checked={field.value === "non_standard"}
                        onChange={() => {
                          field.onChange("non_standard");
                          const current = form.getValues(
                            "shippingSurchargePerUnit",
                          );
                          if (!(typeof current === "number" && current > 0)) {
                            form.setValue(
                              "shippingSurchargePerUnit",
                              undefined as unknown as number,
                              {
                                shouldValidate: false,
                                shouldDirty: true,
                              },
                            );
                          }
                          form.clearErrors("shippingSurchargePerUnit");
                        }}
                        disabled={isPending}
                        className="mt-0.5 h-4 w-4"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {t(
                            "admin.products.form.fields.shippingTypeNonStandard",
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "admin.products.form.fields.shippingTypeNonStandardHint",
                          )}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            />
            {errors.shippingType?.message ? (
              <p className="text-sm text-destructive">
                {String(errors.shippingType.message)}
              </p>
            ) : null}

            {form.watch("shippingType") === "non_standard" && (
              <Controller
                name="shippingSurchargePerUnit"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="shippingSurchargePerUnit">
                      {t("admin.products.form.fields.shippingSurchargePerUnit")}
                      <RequiredMark />
                    </Label>
                    <Input
                      id="shippingSurchargePerUnit"
                      type="number"
                      step="0.01"
                      placeholder={t(
                        "admin.products.form.fields.shippingSurchargePerUnitPlaceholder",
                      )}
                      disabled={isPending}
                      className={adminServiceLikeInputClassName}
                      autoComplete="off"
                      name={field.name}
                      ref={field.ref}
                      value={
                        field.value === undefined || field.value === null
                          ? ""
                          : field.value
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          field.onChange(undefined);
                          form.clearErrors("shippingSurchargePerUnit");
                          return;
                        }
                        const n = Number(raw);
                        field.onChange(Number.isFinite(n) ? n : undefined);
                        void form.trigger("shippingSurchargePerUnit");
                      }}
                      onBlur={() => {
                        field.onBlur();
                        void form.trigger("shippingSurchargePerUnit");
                      }}
                    />
                    {errors.shippingSurchargePerUnit?.message ? (
                      <p className="mt-1 text-sm text-destructive" role="alert">
                        {String(errors.shippingSurchargePerUnit.message)}
                      </p>
                    ) : null}
                  </div>
                )}
              />
            )}
          </section>
        )}

        {activeTab === "media" && (
          <>
            <section className={productFormSectionClassName}>
              <header className="space-y-1">
                <h2 className="text-sm font-semibold tracking-wide text-foreground">
                  {t("admin.products.form.media.imagesTitle")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("admin.products.form.media.imagesDescription")}
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
                  className="flex min-w-0 gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 [scrollbar-width:thin] sm:grid-cols-none"
                  itemClassName="w-[12rem] shrink-0"
                />
              ) : (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("admin.products.form.media.imagesEmpty")}
                </div>
              )}
            </section>

            <section className={productFormSectionClassName}>
              <header className="space-y-1">
                <h2 className="text-sm font-semibold tracking-wide text-foreground">
                  {t("admin.products.form.media.manualTitle")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("admin.products.form.media.manualDescription")}
                </p>
              </header>

              <div>
                <div
                  className={cn(
                    "rounded-lg border border-dashed bg-muted/30 p-4 sm:p-5",
                    manualPdfError ? "border-destructive" : "border-border/70",
                  )}
                  onDragOver={(e) => {
                    if (isPending) return;
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    if (isPending) return;
                    e.preventDefault();
                    applyManualPdfFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                >
                <input
                  ref={manualPdfInputRef}
                  id="product-manual-pdf"
                  type="file"
                  accept="application/pdf"
                  disabled={isPending}
                  aria-invalid={manualPdfError ? true : undefined}
                  aria-describedby={
                    manualPdfError ? "product-manual-pdf-error" : undefined
                  }
                  className="hidden"
                  onChange={(e) => {
                    applyManualPdfFile(e.target.files?.[0] ?? null);
                    e.currentTarget.value = "";
                  }}
                />

                {hasManualPdf ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background p-3 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
                        <FileText className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {getManualPdfDisplayName(
                            manualPdfFile,
                            watchedManualPdfUrl,
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {manualPdfFile
                            ? t("admin.products.form.media.manualPending")
                            : t("admin.products.detail.manualPdf")}
                        </p>
                      </div>
                    </div>

                    <TooltipProvider delayDuration={120}>
                      <div className="flex shrink-0 items-center gap-2">
                        {watchedManualPdfUrl && !manualPdfFile ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={watchedManualPdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                              >
                                <ExternalLink className="h-4 w-4" aria-hidden />
                                <span className="sr-only">
                                  {t("admin.products.form.media.manualView")}
                                </span>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="center"
                              className="rounded-lg border-border/60 bg-popover px-3 py-1.5 text-[11px] text-popover-foreground shadow-lg"
                            >
                              {t("admin.products.form.media.manualView")}
                            </TooltipContent>
                          </Tooltip>
                        ) : null}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={openManualPdfPicker}
                              className="inline-flex cursor-pointer items-center justify-center rounded-md p-1 text-primary transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                            >
                              <RefreshCcw className="h-4 w-4" aria-hidden />
                              <span className="sr-only">
                                {t("admin.products.form.media.manualReplace")}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="center"
                            className="rounded-lg border-border/60 bg-popover px-3 py-1.5 text-[11px] text-popover-foreground shadow-lg"
                          >
                            {t("admin.products.form.media.manualReplace")}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                setManualPdfError("");
                                setManualPdfFile(null);
                                form.setValue("manualPdfUrl", "", {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                              className="inline-flex items-center justify-center rounded-md p-1 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                              <span className="sr-only">
                                {t("admin.products.form.media.manualDelete")}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="center"
                            className="rounded-lg border-border/60 bg-popover px-3 py-1.5 text-[11px] text-popover-foreground shadow-lg"
                          >
                            {t("admin.products.form.media.manualDelete")}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
                        <FileText className="h-5 w-5" aria-hidden />
                      </span>
                      <Label htmlFor="product-manual-pdf" className="sr-only">
                        {t("admin.products.form.media.manualUploadAria")}
                      </Label>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={openManualPdfPicker}
                        className={cn(
                          "inline-flex h-10 cursor-pointer items-center rounded-md border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
                          manualPdfError
                            ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
                            : "border-border",
                        )}
                      >
                        {t("admin.products.form.media.manualUpload")}
                      </button>
                    </div>
                    <p className="pl-[3.25rem] text-xs text-muted-foreground">
                      {t("admin.products.form.media.manualHint")}
                    </p>
                  </div>
                )}
              </div>
              {manualPdfError ? (
                <p
                  id="product-manual-pdf-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {manualPdfError}
                </p>
              ) : null}
              </div>
            </section>
          </>
        )}

        {activeTab === "characteristics" && (
          <section
            className={productFormSectionClassName}
            style={sectionMinHeightStyle}
          >
            <header className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                {t("admin.products.form.characteristics.title")}
              </h2>
              {/* <p className="text-xs text-muted-foreground">
            Marca las características que aplican al producto y, si quieres,
            añade un valor extra.
          </p> */}
              <p className="text-xs text-muted-foreground">
                {t("admin.products.form.characteristics.description")}
              </p>
            </header>

            <div className="space-y-2">
              <Label
                htmlFor="specific-general-filter"
                className="text-sm font-medium"
              >
                {t("admin.products.form.characteristics.filterLabel")}
              </Label>
              <Select<GeneralFilterOption, false>
                instanceId="specific-general-filter"
                inputId="specific-general-filter"
                styles={appSelectStyles}
                options={specificGeneralOptions}
                value={
                  specificGeneralOptions.find(
                    (option) => option.value === selectedGeneralId,
                  ) ?? specificGeneralOptions[0]
                }
                onChange={(option) => {
                  if (option) setSelectedGeneralId(option.value);
                }}
                isClearable={false}
                isSearchable={false}
                isDisabled={isPending || specificGeneralOptions.length === 0}
                noOptionsMessage={() =>
                  t("admin.products.form.characteristics.noMatches")
                }
                className="w-full"
              />
            </div>

            <div className={adminSlideOverNestedScrollClassName}>
              {visibleSpecificOptions.map((item) => {
                const selected = selectedSet.has(item.id);

                return (
                  <label
                    key={item.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:border-primary/40 hover:bg-primary/[0.03]",
                      isPending && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleCharacteristic(item.id)}
                      disabled={isPending}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {locale === "en"
                          ? item.nameEn?.trim() || item.name
                          : item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {locale === "en"
                          ? item.generalNameEn?.trim() || item.generalName
                          : item.generalName}
                      </p>
                    </div>

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
                  </label>
                );
              })}
              {visibleSpecificOptions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                  {t("admin.products.form.characteristics.emptyForFilter")}
                </p>
              ) : null}
            </div>

            <div className="border-t border-border/60" aria-hidden />

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <h3 className="text-sm font-semibold text-foreground">
                {t("admin.products.form.characteristics.selectedTitle")}
              </h3>
              {selectedSpecificGroups.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("admin.products.form.characteristics.selectedEmpty")}
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {selectedSpecificGroups.map(([generalName, rows]) => (
                    <article
                      key={generalName}
                      className="overflow-hidden rounded-lg border border-border/70 bg-muted/20"
                    >
                      <header className="border-b border-border/70 bg-muted/30 px-3 py-2">
                        <p className="text-xs font-medium tracking-wide text-foreground">
                          {generalName}
                        </p>
                      </header>
                      <div className="flex flex-wrap gap-2 p-3">
                        {rows.map((item) => (
                          <div
                            key={item.id}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1.5"
                          >
                            <p className="truncate text-sm font-medium text-foreground">
                              {locale === "en"
                                ? item.nameEn?.trim() || item.name
                                : item.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeCharacteristic(item.id)}
                              disabled={isPending}
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label={t(
                                "admin.products.form.characteristics.removeAria",
                              ).replace(
                                "{name}",
                                locale === "en"
                                  ? item.nameEn?.trim() || item.name
                                  : item.name,
                              )}
                            >
                              <X className="h-3 w-3" aria-hidden />
                            </button>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "specifications" && (
          <section
            className={productFormSectionClassName}
            style={sectionMinHeightStyle}
          >
            <div className="space-y-2">
              <div
                role="tablist"
                aria-label={t("admin.services.form.languageTabs.ariaLabel")}
                className="flex items-center justify-start gap-2"
              >
                {locale === "en" ? (
                  <>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={specificationsLanguageTab === "en"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        specificationsLanguageTab === "en"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setSpecificationsLanguageTab("en")}
                    >
                      {t("admin.services.form.languageTabs.english")}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={specificationsLanguageTab === "es"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        specificationsLanguageTab === "es"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setSpecificationsLanguageTab("es")}
                    >
                      {t("admin.services.form.languageTabs.spanish")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={specificationsLanguageTab === "es"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        specificationsLanguageTab === "es"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setSpecificationsLanguageTab("es")}
                    >
                      {t("admin.services.form.languageTabs.spanish")}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={specificationsLanguageTab === "en"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        specificationsLanguageTab === "en"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setSpecificationsLanguageTab("en")}
                    >
                      {t("admin.services.form.languageTabs.english")}
                    </button>
                  </>
                )}
              </div>
              <div className="border-t border-border/60" aria-hidden />
            </div>
            <Controller
              name="specifications"
              control={form.control}
              render={({ field }) => (
                <div
                  className={cn(specificationsLanguageTab !== "es" && "hidden")}
                >
                  <ProductDescriptionEditor
                    id="product-specifications-rich"
                    label={t("admin.products.form.fields.specifications")}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                    error={errors.specifications?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="specificationsEn"
              control={form.control}
              render={({ field }) => (
                <div
                  className={cn(specificationsLanguageTab !== "en" && "hidden")}
                >
                  <ProductDescriptionEditor
                    id="product-specifications-rich-en"
                    label={t("admin.products.form.fields.specificationsEn")}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                    error={errors.specificationsEn?.message}
                  />
                </div>
              )}
            />
          </section>
        )}

        {activeTab === "accessories" && (
          <section
            className={productFormSectionClassName}
            style={sectionMinHeightStyle}
          >
            <header className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                {t("admin.products.form.accessories.title")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("admin.products.form.accessories.description")}
              </p>
            </header>

            <div className="space-y-2">
              <Label
                htmlFor="accessory-placement-filter"
                className="text-sm font-medium"
              >
                {t("admin.products.form.accessories.filterLabel")}
              </Label>
              <Select<{ value: string; label: string }, false>
                instanceId="accessory-placement-filter"
                inputId="accessory-placement-filter"
                styles={appSelectStyles}
                options={[
                  {
                    value: "all",
                    label: t("admin.products.form.accessories.filterAll"),
                  },
                  ...accessoryPlacementOptions,
                ]}
                value={
                  [
                    {
                      value: "all",
                      label: t("admin.products.form.accessories.filterAll"),
                    },
                    ...accessoryPlacementOptions,
                  ].find((option) => option.value === accessoryPlacementFilter) ??
                  null
                }
                onChange={(option) => {
                  if (option) setAccessoryPlacementFilter(option.value);
                }}
                isClearable={false}
                isSearchable={false}
                isDisabled={isPending || accessoryPlacementOptions.length === 0}
                noOptionsMessage={() =>
                  t("admin.products.form.accessories.noMatches")
                }
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="accessory-search"
                className="text-sm font-medium"
              >
                {t("admin.products.form.accessories.searchLabel")}
              </Label>
              <Input
                id="accessory-search"
                value={accessorySearch}
                onChange={(e) => setAccessorySearch(e.target.value)}
                placeholder={t(
                  "admin.products.form.accessories.searchPlaceholder",
                )}
                disabled={isPending}
                className={adminServiceLikeInputClassName}
                autoComplete="off"
              />
            </div>

            <div className={adminSlideOverNestedScrollClassName}>
              {visibleAccessoryCandidates.map((item) => {
                const selected = accessorySelectedSet.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:border-primary/40 hover:bg-primary/[0.03]",
                      isPending && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleAccessory(item.id)}
                      disabled={isPending}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {locale === "en"
                          ? item.nameEn?.trim() || item.name
                          : item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.sku}
                      </p>
                    </div>
                  </label>
                );
              })}
              {visibleAccessoryCandidates.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                  {accessoryCandidates.length === 0
                    ? t("admin.products.form.accessories.noCandidates")
                    : t("admin.products.form.accessories.noMatches")}
                </p>
              ) : null}
            </div>

            <div className="border-t border-border/60" aria-hidden />

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <h3 className="text-sm font-semibold text-foreground">
                {t("admin.products.form.accessories.selectedTitle")}
              </h3>
              {selectedAccessoryProducts.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("admin.products.form.accessories.selectedEmpty")}
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedAccessoryProducts.map((item) => {
                    const label =
                      locale === "en"
                        ? item.nameEn?.trim() || item.name
                        : item.name;
                    return (
                      <div
                        key={item.id}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1.5"
                      >
                        <p className="truncate text-sm font-medium text-foreground">
                          {label}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeAccessory(item.id)}
                          disabled={isPending}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={t(
                            "admin.products.form.accessories.removeAria",
                          ).replace("{name}", label)}
                        >
                          <X className="h-3 w-3" aria-hidden />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </Form>
  );
}
