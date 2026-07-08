"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import { changeEmailAction } from "@/features/account/api/accountActions";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const t = useTranslations("settings.account.email");
  const tErrors = useTranslations("errors.actions");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await changeEmailAction(formData);

    setPending(false);
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }

    showActionSuccess(t, "success");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm merchant-body-muted">{t("current", { email: currentEmail })}</p>
      <Field label={t("newLabel")} htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="min-h-11"
        />
      </Field>
      <p className="text-sm merchant-body-muted">{t("verifyHint")}</p>
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
