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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import {
  signInMerchantAction,
  signUpMerchantAction,
} from "@/app/merchant/actions";

type Tab = "signin" | "signup";

export function MerchantAuthForm({
  defaultTab = "signin",
}: {
  defaultTab?: Tab;
}) {
  const t = useTranslations("auth");
  const [error, setError] = useState<string | null>(null);

  const signInSchema = z.object({
    email: z.string().email(t("errors.email")),
    password: z.string().min(6, t("errors.password")),
  });
  const signUpSchema = signInSchema
    .extend({
      business_name: z.string().min(2, t("errors.businessName")),
      category: z.string().min(2, t("errors.category")),
      country: z.enum(["NP", "FI"]),
      phone: z.string().optional(),
      confirm_password: z.string(),
    })
    .refine((d) => d.password === d.confirm_password, {
      message: t("errors.confirmPassword"),
      path: ["confirm_password"],
    });

  const signInForm = useForm({ resolver: zodResolver(signInSchema) });
  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { country: "NP" as const },
  });

  const pw = { showLabel: t("password.show"), hideLabel: t("password.hide") };

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
            setError(null);
            const fd = new FormData();
            fd.set("email", values.email);
            fd.set("password", values.password);
            const result = await signInMerchantAction(fd);
            if (result?.error) setError(result.error);
          })}
        >
          <Field
            label={t("fields.email")}
            htmlFor="signin-email"
            error={signInForm.formState.errors.email?.message}
          >
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              placeholder={t("placeholders.email")}
              {...signInForm.register("email")}
            />
          </Field>
          <Field
            label={t("fields.password")}
            htmlFor="signin-password"
            error={signInForm.formState.errors.password?.message}
          >
            <PasswordInput
              id="signin-password"
              autoComplete="current-password"
              {...pw}
              {...signInForm.register("password")}
            />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            className="w-full bg-brand-purple hover:bg-brand-purple/90"
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
            setError(null);
            const fd = new FormData();
            Object.entries(values).forEach(([k, v]) => fd.set(k, v ?? ""));
            const result = await signUpMerchantAction(fd);
            if (result?.error) setError(result.error);
          })}
        >
          <Field
            label={t("fields.businessName")}
            htmlFor="business_name"
            error={signUpForm.formState.errors.business_name?.message}
          >
            <Input
              id="business_name"
              placeholder={t("placeholders.businessName")}
              {...signUpForm.register("business_name")}
            />
          </Field>
          <Field
            label={t("fields.category")}
            htmlFor="category"
            error={signUpForm.formState.errors.category?.message}
          >
            <Input
              id="category"
              placeholder={t("placeholders.category")}
              {...signUpForm.register("category")}
            />
          </Field>
          <Field label={t("fields.country")} htmlFor="country">
            <select
              id="country"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              {...signUpForm.register("country")}
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
              {...signUpForm.register("phone")}
            />
          </Field>
          <Field
            label={t("fields.email")}
            htmlFor="signup-email"
            error={signUpForm.formState.errors.email?.message}
          >
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder={t("placeholders.email")}
              {...signUpForm.register("email")}
            />
          </Field>
          <Field
            label={t("fields.password")}
            htmlFor="signup-password"
            error={signUpForm.formState.errors.password?.message}
          >
            <PasswordInput
              id="signup-password"
              autoComplete="new-password"
              {...pw}
              {...signUpForm.register("password")}
            />
          </Field>
          <Field
            label={t("fields.confirmPassword")}
            htmlFor="signup-confirm-password"
            error={signUpForm.formState.errors.confirm_password?.message}
          >
            <PasswordInput
              id="signup-confirm-password"
              autoComplete="new-password"
              {...pw}
              {...signUpForm.register("confirm_password")}
            />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            className="w-full bg-brand-purple hover:bg-brand-purple/90"
            disabled={signUpForm.formState.isSubmitting}
          >
            {t("actions.signup")}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
