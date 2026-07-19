"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import type { CountryCode } from "@repo/supabase/types";
import { updateBusinessProfileAction } from "@/features/business/api/businessActions";
import { isValidMerchantPhone } from "@/features/business/utils/phoneSchema";
import { isCredibleWebsiteOrSocial } from "@/features/business/utils/credibleOnboarding";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

export function EditBusinessProfileForm({
  merchant,
}: {
  merchant: MerchantRow;
}) {
  const t = useTranslations("business");
  const tErrors = useTranslations("errors.actions");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          business_name: z.string().min(2, t("errors.businessName")),
          category: z.string().min(2, t("errors.category")),
          country: z.enum(["NP", "FI", "AU"]),
          phone: z.string().min(1, t("errors.phoneRequired")),
          registration_number: z
            .string()
            .min(3, t("errors.registrationNumber")),
          website_url: z
            .string()
            .min(4, t("errors.websiteUrl"))
            .refine(isCredibleWebsiteOrSocial, t("errors.websiteUrl")),
          business_address: z.string().min(5, t("errors.businessAddress")),
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
    defaultValues: {
      business_name: merchant.business_name,
      category: merchant.category ?? "",
      country: merchant.country as CountryCode,
      phone: merchant.phone ?? "",
      registration_number: merchant.registration_number ?? "",
      website_url: merchant.website_url ?? "",
      business_address: merchant.business_address ?? "",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => fd.set(k, v ?? ""));
        const result = await updateBusinessProfileAction(merchant.id, fd);
        if (result?.error) {
          setError(resolveActionError(tErrors, result.error));
          return;
        }
        showActionSuccess(t, "success.profileSaved");
        router.refresh();
      })}
    >
      <Field
        label={t("fields.businessName")}
        htmlFor="edit-business_name"
        error={form.formState.errors.business_name?.message}
      >
        <Input id="edit-business_name" {...form.register("business_name")} />
      </Field>
      <Field
        label={t("fields.category")}
        htmlFor="edit-category"
        error={form.formState.errors.category?.message}
      >
        <Input id="edit-category" {...form.register("category")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("fields.registrationNumber")}
          htmlFor="edit-registration_number"
          error={form.formState.errors.registration_number?.message}
        >
          <Input
            id="edit-registration_number"
            {...form.register("registration_number")}
          />
        </Field>
        <Field
          label={t("fields.websiteUrl")}
          htmlFor="edit-website_url"
          error={form.formState.errors.website_url?.message}
        >
          <Input id="edit-website_url" {...form.register("website_url")} />
        </Field>
      </div>
      <Field
        label={t("fields.businessAddress")}
        htmlFor="edit-business_address"
        error={form.formState.errors.business_address?.message}
      >
        <Input
          id="edit-business_address"
          {...form.register("business_address")}
        />
      </Field>
      <Field label={t("fields.country")} htmlFor="edit-country">
        <select
          id="edit-country"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          {...form.register("country")}
        >
          <option value="NP">{t("countries.NP")}</option>
          <option value="FI">{t("countries.FI")}</option>
          <option value="AU">{t("countries.AU")}</option>
        </select>
      </Field>
      <Field
        label={t("fields.phone")}
        htmlFor="edit-phone"
        error={form.formState.errors.phone?.message}
      >
        <Input
          id="edit-phone"
          type="tel"
          autoComplete="tel"
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
        disabled={form.formState.isSubmitting}
        className="min-h-11"
      >
        {form.formState.isSubmitting
          ? t("actions.savingProfile")
          : t("actions.saveProfile")}
      </Button>
    </form>
  );
}
