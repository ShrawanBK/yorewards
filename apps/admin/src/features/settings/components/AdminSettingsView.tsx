"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import { PasswordInput } from "@repo/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import {
  changeAdminEmailAction,
  changeAdminPasswordAction,
} from "@/features/settings/api/accountActions";
import { isActionFailure } from "@repo/utils/action-error";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { LocaleSwitcher } from "@/shared/ui/LocaleSwitcher";

export function AdminSettingsView() {
  const t = useTranslations("settings.account");
  const tLang = useTranslations("settings.language");
  const tErrors = useTranslations("errors.actions");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{tLang("title")}</CardTitle>
          <CardDescription>{tLang("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher className="max-w-xs" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("passwordTitle")}</CardTitle>
          <CardDescription>{t("passwordSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setPasswordError(null);
              const result = await changeAdminPasswordAction(
                new FormData(event.currentTarget),
              );
              if (isActionFailure(result)) {
                setPasswordError(resolveActionError(tErrors, result.error));
              }
            }}
          >
            <Field label={t("newPassword")} htmlFor="admin-password">
              <PasswordInput
                id="admin-password"
                name="password"
                required
                minLength={8}
                showLabel={t("show")}
                hideLabel={t("hide")}
              />
            </Field>
            <Field label={t("confirmPassword")} htmlFor="admin-password-confirm">
              <PasswordInput
                id="admin-password-confirm"
                name="confirmPassword"
                required
                minLength={8}
                showLabel={t("show")}
                hideLabel={t("hide")}
              />
            </Field>
            {passwordError ? (
              <p className="text-sm text-destructive" role="alert">
                {passwordError}
              </p>
            ) : null}
            <Button type="submit" className="admin-btn-primary min-h-11">
              {t("passwordSubmit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("emailTitle")}</CardTitle>
          <CardDescription>{t("emailSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setEmailError(null);
              const result = await changeAdminEmailAction(
                new FormData(event.currentTarget),
              );
              if (isActionFailure(result)) {
                setEmailError(resolveActionError(tErrors, result.error));
              }
            }}
          >
            <Field label={t("newEmail")} htmlFor="admin-email">
              <Input id="admin-email" name="email" type="email" required className="min-h-11" />
            </Field>
            {emailError ? (
              <p className="text-sm text-destructive" role="alert">
                {emailError}
              </p>
            ) : null}
            <Button type="submit" variant="outline" className="admin-btn-outline min-h-11">
              {t("emailSubmit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
