"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";
import { addBusinessAction } from "@/features/business/api/businessActions";

export function AddBusinessForm({ ownerEmail }: { ownerEmail: string }) {
  const t = useTranslations("business");
  const [error, setError] = useState<string | null>(null);

  const schema = z.object({
    business_name: z.string().min(2, t("errors.businessName")),
    category: z.string().min(2, t("errors.category")),
    country: z.enum(["NP", "FI"]),
    phone: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { country: "NP" as const },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        const fd = new FormData();
        fd.set("email", ownerEmail);
        Object.entries(values).forEach(([k, v]) => fd.set(k, v ?? ""));
        const result = await addBusinessAction(fd);
        if (result?.error) setError(result.error);
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
      <Field label={t("fields.phoneOptional")} htmlFor="phone">
        <Input
          id="phone"
          type="tel"
          placeholder={t("placeholders.phone")}
          {...form.register("phone")}
        />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="submit"
        className="w-full bg-brand-purple hover:bg-brand-purple/90 sm:w-auto"
        disabled={form.formState.isSubmitting}
      >
        {t("actions.submit")}
      </Button>
    </form>
  );
}
