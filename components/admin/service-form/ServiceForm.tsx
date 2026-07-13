"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { ProductDescriptionEditor } from "@/components/ProductDescriptionEditor";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Dropzone } from "./Dropzone";
import { ImageGrid } from "./ImageGrid";
import { ServiceBannerSlot } from "./ServiceBannerSlot";
import { useServiceImagesManager } from "./use-service-images-manager";
import type { ExistingServiceImageInput, ServiceFormSubmitData } from "./types";

type ServiceFormProps = {
  initialName?: string;
  initialNameEn?: string;
  initialShortDescription?: string;
  initialShortDescriptionEn?: string;
  initialDescription?: string;
  initialDescriptionEn?: string;
  initialBannerMobileUrl?: string | null;
  initialBannerTabletUrl?: string | null;
  initialBannerDesktopUrl?: string | null;
  existingImages: ExistingServiceImageInput[];
  onSubmit: (data: ServiceFormSubmitData) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
  formId?: string;
  showActions?: boolean;
};

export function ServiceForm({
  initialName = "",
  initialNameEn = "",
  initialShortDescription = "",
  initialShortDescriptionEn = "",
  initialDescription = "",
  initialDescriptionEn = "",
  initialBannerMobileUrl = null,
  initialBannerTabletUrl = null,
  initialBannerDesktopUrl = null,
  existingImages,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
  formId,
  showActions = true,
}: ServiceFormProps) {
  const { t, locale } = useI18n();
  const [name, setName] = useState(initialName);
  const [nameEn, setNameEn] = useState(initialNameEn);
  const [shortDescription, setShortDescription] = useState(
    initialShortDescription,
  );
  const [shortDescriptionEn, setShortDescriptionEn] = useState(
    initialShortDescriptionEn,
  );
  const [description, setDescription] = useState(initialDescription);
  const [descriptionEn, setDescriptionEn] = useState(initialDescriptionEn);
  const [bannerMobileFile, setBannerMobileFile] = useState<File | null>(null);
  const [bannerTabletFile, setBannerTabletFile] = useState<File | null>(null);
  const [bannerDesktopFile, setBannerDesktopFile] = useState<File | null>(null);
  const [removeBannerMobile, setRemoveBannerMobile] = useState(false);
  const [removeBannerTablet, setRemoveBannerTablet] = useState(false);
  const [removeBannerDesktop, setRemoveBannerDesktop] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameEnError, setNameEnError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "media">("basic");
  const [basicLanguageTab, setBasicLanguageTab] = useState<"es" | "en">(
    locale === "en" ? "en" : "es",
  );

  useEffect(() => {
    setBasicLanguageTab(locale === "en" ? "en" : "es");
  }, [locale]);

  const images = useServiceImagesManager(existingImages);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNameError(null);
    setNameEnError(null);

    const cleanedName = name.trim();
    const cleanedNameEn = nameEn.trim();
    if (!cleanedName) {
      setNameError(t("admin.services.form.errors.nameRequired"));
      return;
    }
    if (!cleanedNameEn) {
      setNameEnError(t("admin.services.form.errors.nameEnRequired"));
      return;
    }

    await onSubmit({
      name: cleanedName,
      nameEn: cleanedNameEn,
      shortDescription: shortDescription.trim(),
      shortDescriptionEn: shortDescriptionEn.trim(),
      description: description.trim(),
      descriptionEn: descriptionEn.trim(),
      newImages: images.newImages,
      updatedExistingImages: images.updatedExistingImages,
      removedImages: images.removedImages,
      bannerMobileFile,
      bannerTabletFile,
      bannerDesktopFile,
      removeBannerMobile,
      removeBannerTablet,
      removeBannerDesktop,
    });
  };

  const shortDescriptionTextareaClassName = cn(
    "w-full rounded-lg border border-border/80 bg-white px-3 py-2.5 text-sm shadow-sm transition",
    "min-h-[4.5rem] resize-y leading-relaxed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
    "placeholder:text-muted-foreground/70",
    "dark:bg-card",
  );

  const shortDescriptionField =
    basicLanguageTab === "es" ? (
      <div className="space-y-2">
        <Label htmlFor="service-short-description">
          {t("admin.services.form.labelShortDescription")}
        </Label>
        <p className="text-xs text-muted-foreground">
          {t("admin.services.form.shortDescriptionHint")}
        </p>
        <textarea
          id="service-short-description"
          rows={3}
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder={t("admin.services.form.placeholderShortDescription")}
          disabled={isSubmitting}
          className={shortDescriptionTextareaClassName}
        />
      </div>
    ) : (
      <div className="space-y-2">
        <Label htmlFor="service-short-description-en">
          {t("admin.services.form.labelShortDescriptionEn")}
        </Label>
        <p className="text-xs text-muted-foreground">
          {t("admin.services.form.shortDescriptionHint")}
        </p>
        <textarea
          id="service-short-description-en"
          rows={3}
          value={shortDescriptionEn}
          onChange={(e) => setShortDescriptionEn(e.target.value)}
          placeholder={t("admin.services.form.placeholderShortDescriptionEn")}
          disabled={isSubmitting}
          className={shortDescriptionTextareaClassName}
        />
      </div>
    );

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={cn("flex min-h-0 min-w-0 flex-col gap-0", className)}
    >
      <div
        role="tablist"
        aria-label={t("admin.services.form.tabs.ariaLabel")}
        className="sticky top-0 z-[100] -mx-4 flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-border/60 bg-background px-4 pb-3 pt-4 shadow-sm [scrollbar-width:thin]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "basic"}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
            activeTab === "basic"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          )}
          onClick={() => setActiveTab("basic")}
        >
          {t("admin.services.form.tabs.basic")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "media"}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
            activeTab === "media"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          )}
          onClick={() => setActiveTab("media")}
        >
          {t("admin.services.form.tabs.media")}
        </button>
      </div>

      <div className="relative z-0 min-h-0 flex-1 space-y-4 pt-4">
        {activeTab === "basic" ? (
          <section className={adminSlideOverSectionClassName}>
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
                      aria-selected={basicLanguageTab === "en"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        basicLanguageTab === "en"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setBasicLanguageTab("en")}
                    >
                      {t("admin.services.form.languageTabs.english")}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={basicLanguageTab === "es"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        basicLanguageTab === "es"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setBasicLanguageTab("es")}
                    >
                      {t("admin.services.form.languageTabs.spanish")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={basicLanguageTab === "es"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        basicLanguageTab === "es"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setBasicLanguageTab("es")}
                    >
                      {t("admin.services.form.languageTabs.spanish")}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={basicLanguageTab === "en"}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                        basicLanguageTab === "en"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                      onClick={() => setBasicLanguageTab("en")}
                    >
                      {t("admin.services.form.languageTabs.english")}
                    </button>
                  </>
                )}
              </div>
              <div className="border-t border-border/60" aria-hidden />
            </div>

            {basicLanguageTab === "es" ? (
              <div className="space-y-2">
                <Label htmlFor="service-name">
                  {t("admin.services.form.labelName")}
                  <RequiredMark />
                </Label>
                <Input
                  id="service-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder={t("admin.services.form.placeholderName")}
                  autoComplete="off"
                  aria-required
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={
                    nameError ? "service-name-error" : undefined
                  }
                  className={cn(
                    adminServiceLikeInputClassName,
                    nameError &&
                      "border-destructive focus-visible:ring-destructive/30",
                  )}
                />
                {nameError ? (
                  <p
                    id="service-name-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {nameError}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="service-name-en">
                  {t("admin.services.form.labelNameEn")}
                  <RequiredMark />
                </Label>
                <Input
                  id="service-name-en"
                  value={nameEn}
                  onChange={(e) => {
                    setNameEn(e.target.value);
                    if (nameEnError) setNameEnError(null);
                  }}
                  placeholder={t("admin.services.form.placeholderNameEn")}
                  autoComplete="off"
                  aria-required
                  aria-invalid={Boolean(nameEnError)}
                  aria-describedby={
                    nameEnError ? "service-name-en-error" : undefined
                  }
                  className={cn(
                    adminServiceLikeInputClassName,
                    nameEnError &&
                      "border-destructive focus-visible:ring-destructive/30",
                  )}
                />
                {nameEnError ? (
                  <p
                    id="service-name-en-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {nameEnError}
                  </p>
                ) : null}
              </div>
            )}

            {shortDescriptionField}

            {basicLanguageTab === "es" ? (
              <ProductDescriptionEditor
                id="service-description-rich-es"
                label={t("admin.services.form.labelDescription")}
                value={description}
                onChange={setDescription}
                disabled={isSubmitting}
              />
            ) : (
              <ProductDescriptionEditor
                id="service-description-rich-en"
                label={t("admin.services.form.labelDescriptionEn")}
                value={descriptionEn}
                onChange={setDescriptionEn}
                disabled={isSubmitting}
              />
            )}
          </section>
        ) : (
          <div className="space-y-4">
            <section className={adminSlideOverSectionClassName}>
              <header>
                <h2 className="text-sm font-semibold tracking-wide text-foreground">
                  {t("admin.services.form.banners.title")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("admin.services.form.banners.description")}
                </p>
              </header>

              <div className="flex min-w-0 gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 [scrollbar-width:thin] md:flex-col md:gap-3 md:overflow-visible md:pb-0">
                <ServiceBannerSlot
                  breakpoint="mobile"
                  className="w-[12rem] shrink-0 md:w-full"
                  existingUrl={initialBannerMobileUrl}
                  file={bannerMobileFile}
                  markedForRemoval={removeBannerMobile}
                  disabled={isSubmitting}
                  onFileChange={(file) => {
                    setBannerMobileFile(file);
                    setRemoveBannerMobile(false);
                  }}
                  onRemove={() => {
                    setBannerMobileFile(null);
                    setRemoveBannerMobile(true);
                  }}
                />
                <ServiceBannerSlot
                  breakpoint="tablet"
                  className="w-[12rem] shrink-0 md:w-full"
                  existingUrl={initialBannerTabletUrl}
                  file={bannerTabletFile}
                  markedForRemoval={removeBannerTablet}
                  disabled={isSubmitting}
                  onFileChange={(file) => {
                    setBannerTabletFile(file);
                    setRemoveBannerTablet(false);
                  }}
                  onRemove={() => {
                    setBannerTabletFile(null);
                    setRemoveBannerTablet(true);
                  }}
                />
                <ServiceBannerSlot
                  breakpoint="desktop"
                  className="w-[12rem] shrink-0 md:w-full"
                  existingUrl={initialBannerDesktopUrl}
                  file={bannerDesktopFile}
                  markedForRemoval={removeBannerDesktop}
                  disabled={isSubmitting}
                  onFileChange={(file) => {
                    setBannerDesktopFile(file);
                    setRemoveBannerDesktop(false);
                  }}
                  onRemove={() => {
                    setBannerDesktopFile(null);
                    setRemoveBannerDesktop(true);
                  }}
                />
              </div>
            </section>

            <section className={adminSlideOverSectionClassName}>
              <header>
                <h2 className="text-sm font-semibold tracking-wide text-foreground">
                  {t("admin.services.form.media.title")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("admin.services.form.media.description")}
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
                  {t("admin.services.form.media.empty")}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {showActions ? (
        <footer className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 min-w-[110px] transition hover:-translate-y-[1px]"
            aria-label={t("admin.services.form.cancelAria")}
          >
            {t("admin.services.form.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            pending={Boolean(isSubmitting)}
            pendingLabel={t("admin.services.form.saving")}
            skipMinWidth
            className="h-10 min-w-[140px] transition hover:-translate-y-[1px] active:translate-y-0"
            aria-label={t("admin.services.form.saveAria")}
          >
            {t("admin.services.form.save")}
          </ButtonPending>
        </footer>
      ) : null}
    </form>
  );
}
