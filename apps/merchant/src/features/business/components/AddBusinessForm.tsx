"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";
import { addBusinessAction } from "@/features/business/api/businessActions";
import { isValidMerchantPhone } from "@/features/business/utils/phoneSchema";
import { isCredibleWebsiteOrSocial } from "@/features/business/utils/credibleOnboarding";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

export function AddBusinessForm({ ownerEmail }: { ownerEmail: string }) {
  const t = useTranslations("business");
  const tErrors = useTranslations("errors.actions");
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          business_name: z.string().min(2, t("errors.businessName")),
          category: z.string().min(2, t("errors.category")),
          country: z.enum(["NP", "FI"]),
          phone: z.string().min(1, t("errors.phoneRequired")),
          registration_number: z
            .string()
            .min(3, t("errors.registrationNumber")),
          website_url: z
            .string()
            .min(4, t("errors.websiteUrl"))
            .refine(isCredibleWebsiteOrSocial, t("errors.websiteUrl")),
          business_address: z
            .string()
            .min(5, t("errors.businessAddress")),
        })
        .superRefine((data, ctx) => {
          if (!isValidMerchantPhone(data.phone, data.country)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t(`errors.phone.${data.country}`),
              path: ["phone"],
            });
          }
        }),
    [t],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { country: "NP" as const, phone: "" },
  });

  const country = form.watch("country");

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        const fd = new FormData();
        fd.set("email", ownerEmail);
        Object.entries(values).forEach(([k, v]) => fd.set(k, v ?? ""));
        const result = await addBusinessAction(fd);
        if (result?.error) setError(resolveActionError(tErrors, result.error));
      })}
    >
      <Field
        label={t("fields.businessName")}
        htmlFor="business_name"
        error={form.formState.errors.business_name?.message}
      >
        <Input
          id="business_name"
          placeholder={t("placeholders.businessName")}
          {...form.register("business_name")}
        />
      </Field>
      <Field
        label={t("fields.category")}
        htmlFor="category"
        error={form.formState.errors.category?.message}
      >
        <Input
          id="category"
          placeholder={t("placeholders.category")}
          {...form.register("category")}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("fields.registrationNumber")}
          htmlFor="registration_number"
          error={form.formState.errors.registration_number?.message}
        >
          <Input
            id="registration_number"
            placeholder={t("placeholders.registrationNumber")}
            {...form.register("registration_number")}
          />
        </Field>
        <Field
          label={t("fields.websiteUrl")}
          htmlFor="website_url"
          error={form.formState.errors.website_url?.message}
        >
          <Input
            id="website_url"
            placeholder={t("placeholders.websiteUrl")}
            {...form.register("website_url")}
          />
        </Field>
      </div>
      <Field
        label={t("fields.businessAddress")}
        htmlFor="business_address"
        error={form.formState.errors.business_address?.message}
      >
        <Input
          id="business_address"
          placeholder={t("placeholders.businessAddress")}
          {...form.register("business_address")}
        />
      </Field>
      <Field label={t("fields.country")} htmlFor="country">
        <select
          id="country"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          {...form.register("country")}
        >
          <option value="NP">{t("countries.NP")}</option>
          <option value="FI">{t("countries.FI")}</option>
        </select>
      </Field>
      <Field
        label={t("fields.phone")}
        htmlFor="phone"
        error={form.formState.errors.phone?.message}
      >
        <Input
          id="phone"
          type="tel"
          placeholder={
            country === "FI"
              ? t("placeholders.phoneFI")
              : t("placeholders.phoneNP")
          }
          {...form.register("phone")}
        />
      </Field>
      <p className="text-sm merchant-body-muted">{t("credibleHint")}</p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
        disabled={form.formState.isSubmitting}
      >
        {t("actions.submit")}
      </Button>
    </form>
  );
}
