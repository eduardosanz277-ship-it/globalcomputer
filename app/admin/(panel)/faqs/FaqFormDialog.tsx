"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createFaqFormSchema,
  type FaqFormValues,
} from "@/modules/admin/faqs/faqs.schema";
import type { FaqAdmin } from "@/modules/admin/faqs/faqs.types";
import { createFaqAdminAction, updateFaqAdminAction } from "./actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Form, FormField } from "@/components/ui/form";
import { FormSwitchField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import { Label, RequiredMark } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { useI18n } from "@/components/i18n/I18nProvider";

const FORM_ID = "admin-faq-form-slide-over";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq: FaqAdmin | null;
};

export function FaqFormDialog({ open, onOpenChange, faq }: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const localizedSchema = createFaqFormSchema({
    questionRequired: t("admin.faqs.form.errors.questionRequired"),
    questionEnRequired: t("admin.faqs.form.errors.questionEnRequired"),
    answerRequired: t("admin.faqs.form.errors.answerRequired"),
    answerEnRequired: t("admin.faqs.form.errors.answerEnRequired"),
    maxQuestionChars: t("admin.faqs.form.errors.maxQuestionChars"),
    maxQuestionEnChars: t("admin.faqs.form.errors.maxQuestionEnChars"),
    maxAnswerChars: t("admin.faqs.form.errors.maxAnswerChars"),
    maxAnswerEnChars: t("admin.faqs.form.errors.maxAnswerEnChars"),
  });
  const form = useForm<FaqFormValues>({
    resolver: zodResolver(localizedSchema),
    defaultValues: {
      question: "",
      questionEn: "",
      answer: "",
      answerEn: "",
      active: true,
    },
  });

  const errors = form.formState.errors;
  const { register } = form;

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createFaqAdminAction,
    {
      successMessage: t("admin.faqs.toast.created"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateFaqAdminAction,
    {
      successMessage: t("admin.faqs.toast.updated"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;
  const isEnglishLocale = locale === "en";

  useEffect(() => {
    if (!open) return;
    if (faq) {
      form.reset({
        question: faq.question,
        questionEn: faq.questionEn,
        answer: faq.answer,
        answerEn: faq.answerEn,
        active: faq.active,
      });
    } else {
      form.reset({
        question: "",
        questionEn: "",
        answer: "",
        answerEn: "",
        active: true,
      });
    }
  }, [open, faq, form]);

  const onSubmit = (values: FaqFormValues) => {
    if (faq) {
      executeUpdate(faq.id, values);
    } else {
      executeCreate(values);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        faq
          ? t("admin.faqs.form.titleEdit")
          : t("admin.faqs.form.titleNew")
      }
      description={t("admin.faqs.form.description")}
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("admin.faqs.form.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            form={FORM_ID}
            pending={isPending}
            pendingLabel={t("admin.faqs.form.saving")}
          >
            {t("admin.faqs.form.save")}
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <Form id={FORM_ID} form={form} onSubmit={onSubmit} className="space-y-0">
        <section className={adminSlideOverSectionClassName}>
          <div className="space-y-4">
            {isEnglishLocale ? (
              <>
                <FormField
                  name="questionEn"
                  label={t("admin.faqs.form.labelQuestionEn")}
                  required
                  disabled={isPending}
                  error={errors.questionEn?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <FormField
                  name="question"
                  label={t("admin.faqs.form.labelQuestionSpanish")}
                  required
                  disabled={isPending}
                  error={errors.question?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <div className="space-y-2">
                  <Label htmlFor="answerEn">
                    {t("admin.faqs.form.labelAnswerEn")}
                    <RequiredMark />
                  </Label>
                  <textarea
                    id="answerEn"
                    rows={6}
                    disabled={isPending}
                    {...register("answerEn")}
                    className={cn(
                      "w-full rounded-lg border border-border/80 bg-white px-3 py-2.5 shadow-sm transition",
                      "min-h-[9rem] resize-y leading-relaxed",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                      "dark:bg-card",
                    )}
                  />
                  {errors.answerEn?.message ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.answerEn.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">
                    {t("admin.faqs.form.labelAnswerSpanish")}
                    <RequiredMark />
                  </Label>
                  <textarea
                    id="answer"
                    rows={6}
                    disabled={isPending}
                    {...register("answer")}
                    className={cn(
                      "w-full rounded-lg border border-border/80 bg-white px-3 py-2.5 shadow-sm transition",
                      "min-h-[9rem] resize-y leading-relaxed",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                      "dark:bg-card",
                    )}
                  />
                  {errors.answer?.message ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.answer.message}
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <FormField
                  name="question"
                  label={t("admin.faqs.form.labelQuestion")}
                  required
                  disabled={isPending}
                  error={errors.question?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <FormField
                  name="questionEn"
                  label={t("admin.faqs.form.labelQuestionEn")}
                  required
                  disabled={isPending}
                  error={errors.questionEn?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <div className="space-y-2">
                  <Label htmlFor="answer">
                    {t("admin.faqs.form.labelAnswer")}
                    <RequiredMark />
                  </Label>
                  <textarea
                    id="answer"
                    rows={6}
                    disabled={isPending}
                    {...register("answer")}
                    className={cn(
                      "w-full rounded-lg border border-border/80 bg-white px-3 py-2.5 shadow-sm transition",
                      "min-h-[9rem] resize-y leading-relaxed",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                      "dark:bg-card",
                    )}
                  />
                  {errors.answer?.message ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.answer.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answerEn">
                    {t("admin.faqs.form.labelAnswerEn")}
                    <RequiredMark />
                  </Label>
                  <textarea
                    id="answerEn"
                    rows={6}
                    disabled={isPending}
                    {...register("answerEn")}
                    className={cn(
                      "w-full rounded-lg border border-border/80 bg-white px-3 py-2.5 shadow-sm transition",
                      "min-h-[9rem] resize-y leading-relaxed",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                      "dark:bg-card",
                    )}
                  />
                  {errors.answerEn?.message ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.answerEn.message}
                    </p>
                  ) : null}
                </div>
              </>
            )}

            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<FaqFormValues>
                name="active"
                label={t("admin.faqs.form.activeLabel")}
                description={t("admin.faqs.form.activeDescription")}
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
