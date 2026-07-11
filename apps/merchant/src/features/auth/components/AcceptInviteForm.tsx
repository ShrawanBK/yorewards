"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { PasswordInput } from "@repo/ui/password-input";
import { Field } from "@repo/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import {
  acceptStaffInviteSignInAction,
  acceptStaffInviteSignUpAction,
} from "@/features/auth/api/authActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

type Tab = "signin" | "signup";

export function AcceptInviteForm({
  invitedEmail,
  defaultTab = "signin",
}: {
  invitedEmail: string;
  defaultTab?: Tab;
}) {
  const t = useTranslations("acceptInvite");
  const tErrors = useTranslations("errors.actions");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  const signInSchema = z.object({
    email: z.string().email(t("errors.email")),
    password: z.string().min(6, t("errors.password")),
  });
  const signUpSchema = signInSchema
    .extend({ confirm_password: z.string() })
    .refine((d) => d.password === d.confirm_password, {
      message: t("errors.confirmPassword"),
      path: ["confirm_password"],
    });

  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: invitedEmail },
  });
  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: invitedEmail },
  });

  const pw = { showLabel: t("password.show"), hideLabel: t("password.hide") };

  const lockedEmailProps = useMemo(
    () => ({
      readOnly: true,
      className: "bg-muted/40",
      "aria-readonly": true as const,
    }),
    [],
  );

  return (
    <Tabs defaultValue={defaultTab} className="w-full gap-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">{t("tabs.signin")}</TabsTrigger>
        <TabsTrigger value="signup">{t("tabs.signup")}</TabsTrigger>
      </TabsList>

      <TabsContent value="signin">
        <form
          className="space-y-8"
          onSubmit={signInForm.handleSubmit(async (values) => {
            setSignInError(null);
            const fd = new FormData();
            fd.set("email", values.email);
            fd.set("password", values.password);
            fd.set("invited_email", invitedEmail);
            const result = await acceptStaffInviteSignInAction(fd);
            if (result?.error) {
              setSignInError(resolveActionError(tErrors, result.error));
            }
          })}
        >
          <Field label={t("fields.email")} htmlFor="invite-signin-email">
            <Input
              id="invite-signin-email"
              type="email"
              autoComplete="email"
              {...lockedEmailProps}
              {...signInForm.register("email")}
            />
          </Field>
          <Field
            label={t("fields.password")}
            htmlFor="invite-signin-password"
            error={signInForm.formState.errors.password?.message}
          >
            <PasswordInput
              id="invite-signin-password"
              autoComplete="current-password"
              {...pw}
              {...signInForm.register("password")}
            />
          </Field>
          {signInError ? (
            <p className="text-sm text-destructive" role="alert">
              {signInError}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            disabled={signInForm.formState.isSubmitting}
          >
            {t("actions.signin")}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="signup">
        <form
          className="space-y-4"
          onSubmit={signUpForm.handleSubmit(async (values) => {
            setSignUpError(null);
            const fd = new FormData();
            fd.set("email", values.email);
            fd.set("password", values.password);
            fd.set("invited_email", invitedEmail);
            const result = await acceptStaffInviteSignUpAction(fd);
            if (result?.error) {
              setSignUpError(resolveActionError(tErrors, result.error));
            }
          })}
        >
          <Field label={t("fields.email")} htmlFor="invite-signup-email">
            <Input
              id="invite-signup-email"
              type="email"
              autoComplete="email"
              {...lockedEmailProps}
              {...signUpForm.register("email")}
            />
          </Field>
          <Field
            label={t("fields.password")}
            htmlFor="invite-signup-password"
            error={signUpForm.formState.errors.password?.message}
          >
            <PasswordInput
              id="invite-signup-password"
              autoComplete="new-password"
              {...pw}
              {...signUpForm.register("password")}
            />
          </Field>
          <Field
            label={t("fields.confirmPassword")}
            htmlFor="invite-signup-confirm-password"
            error={signUpForm.formState.errors.confirm_password?.message}
          >
            <PasswordInput
              id="invite-signup-confirm-password"
              autoComplete="new-password"
              {...pw}
              {...signUpForm.register("confirm_password")}
            />
          </Field>
          {signUpError ? (
            <p className="text-sm text-destructive" role="alert">
              {signUpError}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            disabled={signUpForm.formState.isSubmitting}
          >
            {t("actions.signup")}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
