"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { customerLoginAction } from "@/features/auth/api/authActions";
import { PhoneCountryFields } from "@/features/auth/components/PhoneCountryFields";
import { useAuthStore } from "@/features/auth/store/authStore";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";
import { isValidCustomerPhoneLocal } from "@repo/utils/phone";

export function CustomerLoginForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors.actions");
  const router = useRouter();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [error, setError] = useState<string | null>(null);

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
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { country: "NP" as const, phoneLocal: "" },
  });

  const country = watch("country");

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        setError(null);
        const fd = new FormData();
        fd.set("country", values.country);
        fd.set("phoneLocal", values.phoneLocal);
        const result = await customerLoginAction(fd);
        if (isActionFailure(result)) {
          setError(resolveActionError(tErrors, result.error));
          return;
        }
        if ("isNew" in result && result.isNew) {
          router.push(`/onboarding?phone=${encodeURIComponent(result.phone)}`);
          return;
        }
        if ("loggedIn" in result && result.loggedIn) {
          await refreshProfile();
          router.push("/wallet");
          router.refresh();
        }
      })}
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
        disabled={isSubmitting}
      >
        {t("actions.continue")}
      </Button>
    </form>
  );
}
