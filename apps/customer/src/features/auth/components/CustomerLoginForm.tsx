"use client";

import { useActionState, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { customerLoginAction } from "@/features/auth/api/authActions";
import { PhoneCountryFields } from "@/features/auth/components/PhoneCountryFields";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";
import { isValidCustomerPhoneLocal, type CountryCode } from "@repo/utils/phone";

export function CustomerLoginForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors.actions");
  const [clientError, setClientError] = useState<string | null>(null);

  const [serverState, formAction, isPending] = useActionState(
    customerLoginAction,
    null,
  );

  const serverError =
    serverState && isActionFailure(serverState)
      ? resolveActionError(tErrors, serverState.error)
      : null;

  const error = clientError ?? serverError;

  const schema = useMemo(
    () =>
      z
        .object({
          country: z.enum(["NP", "FI"]),
          phoneLocal: z.string().min(1, t("errors.phoneRequired")),
        })
        .superRefine((data, ctx) => {
          if (!isValidCustomerPhoneLocal(data.country, data.phoneLocal)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t(`errors.phone${data.country}`),
              path: ["phoneLocal"],
            });
          }
        }),
    [t],
  );

  const {
    register,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { country: "NP" as const, phoneLocal: "" },
  });

  const country = watch("country");

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    setClientError(null);
    clearErrors();

    const fd = new FormData(event.currentTarget);
    const rawCountry = String(fd.get("country") ?? "NP");
    const phoneLocal = String(fd.get("phoneLocal") ?? "").trim();
    const countryCode =
      rawCountry === "FI" ? ("FI" as const) : ("NP" as const);

    if (!phoneLocal) {
      event.preventDefault();
      setError("phoneLocal", { message: t("errors.phoneRequired") });
      return;
    }

    if (!isValidCustomerPhoneLocal(countryCode as CountryCode, phoneLocal)) {
      event.preventDefault();
      setError("phoneLocal", {
        message: t(`errors.phone${countryCode}`),
      });
      return;
    }

    // Valid: allow native POST to the server action (works without JS too).
  }

  return (
    <form
      method="post"
      action={formAction}
      className="space-y-4"
      onSubmit={handleFormSubmit}
      noValidate
    >
      <PhoneCountryFields
        register={register}
        errors={errors}
        country={country}
      />
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
        {t("actions.continue")}
      </Button>
    </form>
  );
}
