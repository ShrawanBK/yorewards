"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { PasswordInput } from "@repo/ui/password-input";
import { changePasswordAction } from "@/features/account/api/accountActions";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

export function ChangePasswordForm() {
  const t = useTranslations("settings.account.password");
  const tErrors = useTranslations("errors.actions");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError(null);

    const formData = new FormData(form);
    const result = await changePasswordAction(formData);

    setPending(false);
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }

    showActionSuccess(t, "success");
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label={t("newLabel")} htmlFor="password">
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          showLabel={t("show")}
          hideLabel={t("hide")}
        />
      </Field>
      <Field label={t("confirmLabel")} htmlFor="confirmPassword">
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          showLabel={t("show")}
          hideLabel={t("hide")}
        />
      </Field>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="min-h-11">
        {pending ? t("saving") : t("submit")}
      </Button>
    </form>
  );
}
