"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";
import { customerOnboardingAction } from "@/features/auth/api/authActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";
import { detectCountry } from "@repo/utils/phone";

export function CustomerOnboardingForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors.actions");
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const [clientError, setClientError] = useState<string | null>(null);

  const [serverState, formAction, isPending] = useActionState(
    customerOnboardingAction,
    null,
  );

  const serverError =
    serverState && isActionFailure(serverState)
      ? resolveActionError(tErrors, serverState.error)
      : null;

  const error = clientError ?? serverError;

  const schema = z.object({
    name: z.string().min(2, t("errors.name")),
  });
  const {
    register,
    setError,
    clearErrors,
    formState: { errors },
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
  const phoneLocal = phone.replace(country === "FI" ? "+358" : "+977", "");

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    setClientError(null);
    clearErrors();

    const fd = new FormData(event.currentTarget);
    const name = String(fd.get("name") ?? "").trim();

    if (name.length < 2) {
      event.preventDefault();
      setError("name", { message: t("errors.name") });
    }
  }

  return (
    <form
      method="post"
      action={formAction}
      className="space-y-4"
      onSubmit={handleFormSubmit}
      noValidate
    >
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="country" value={country} />
      <input type="hidden" name="phoneLocal" value={phoneLocal} />
      <p className="text-sm text-muted-foreground">
        {t("onboarding.phoneLabel")}:{" "}
        <span className="font-medium text-foreground">{phone}</span>
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
        disabled={isPending}
      >
        {t("actions.start")}
      </Button>
    </form>
  );
}
