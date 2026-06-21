"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { PasswordInput } from "@repo/ui/password-input";
import { Field } from "@repo/ui/field";
import { loginAction } from "@/features/auth/api/authActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

export function AdminLoginForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors.actions");
  const [error, setError] = useState<string | null>(null);

  const schema = z.object({
    email: z.string().email(t("errors.email")),
    password: z.string().min(6, t("errors.password")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        setError(null);
        const fd = new FormData();
        fd.set("email", values.email);
        fd.set("password", values.password);
        const result = await loginAction(fd);
        if (result?.error) setError(resolveActionError(tErrors, result.error));
      })}
    >
      <Field
        label={t("fields.email")}
        htmlFor="email"
        error={errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("placeholders.email")}
          {...register("email")}
        />
      </Field>
      <Field
        label={t("fields.password")}
        htmlFor="password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          autoComplete="current-password"
          showLabel={t("password.show")}
          hideLabel={t("password.hide")}
          {...register("password")}
        />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="submit"
        className="w-full bg-brand-purple hover:bg-brand-purple/90"
        disabled={isSubmitting}
      >
        {t("actions.signin")}
      </Button>
    </form>
  );
}
