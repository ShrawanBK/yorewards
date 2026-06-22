"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";
import { customerOnboardingAction } from "@/features/auth/api/authActions";
import { useAuthStore } from "@/features/auth/store/authStore";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";
import { detectCountry } from "@repo/utils/phone";

export function CustomerOnboardingForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors.actions");
  const router = useRouter();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const [error, setError] = useState<string | null>(null);

  const schema = z.object({
    name: z.string().min(2, t("errors.name")),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  if (!phone) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          {t("errors.missingPhone")}
        </p>
        <Button variant="outline" className="min-h-11 w-full" asChild>
          <Link href="/login">{t("actions.backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  const country = detectCountry(phone);

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async ({ name }) => {
        setError(null);
        const fd = new FormData();
        fd.set("phone", phone);
        fd.set("country", country);
        fd.set(
          "phoneLocal",
          phone.replace(country === "FI" ? "+358" : "+977", ""),
        );
        fd.set("name", name);
        const result = await customerOnboardingAction(fd);
        if (isActionFailure(result)) {
          setError(resolveActionError(tErrors, result.error));
          return;
        }
        if (result.completed) {
          await refreshProfile();
          router.push("/wallet");
          router.refresh();
        }
      })}
    >
      <p className="text-sm text-muted-foreground">
        {t("onboarding.phoneLabel")}: <span className="font-medium text-foreground">{phone}</span>
      </p>
      <Field
        label={t("fields.name")}
        htmlFor="name"
        error={errors.name?.message}
      >
        <Input
          id="name"
          autoComplete="name"
          placeholder={t("placeholders.name")}
          {...register("name")}
        />
      </Field>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="min-h-11 w-full bg-brand-purple hover:bg-brand-purple/90"
        disabled={isSubmitting}
      >
        {t("actions.start")}
      </Button>
    </form>
  );
}
