"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";
import {
  resendSignupOtpAction,
  sendSignupOtpAction,
  verifySignupOtpAction,
} from "@/features/auth/api/authActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";
import { detectCountry } from "@repo/utils/phone";
import { showActionSuccess } from "@/shared/utils/action-feedback";

type OtpStep = {
  phone: string;
  name: string;
  maskedPhone: string;
};

export function CustomerOnboardingForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors.actions");
  const params = useSearchParams();
  const phoneFromQuery = params.get("phone") ?? "";
  const [clientError, setClientError] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState<OtpStep | null>(null);
  const [isPending, startTransition] = useTransition();

  const nameSchema = z.object({
    name: z.string().min(2, t("errors.name")),
  });
  const otpSchema = z.object({
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, t("otp.otpInvalid")),
  });

  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  if (!phoneFromQuery && !otpStep) {
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

  const phone = otpStep?.phone ?? phoneFromQuery;
  const country = detectCountry(phone);
  const phoneLocal = phone.replace(country === "FI" ? "+358" : "+977", "");

  function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);

    const fd = new FormData(event.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (name.length < 2) {
      nameForm.setError("name", { message: t("errors.name") });
      return;
    }

    startTransition(async () => {
      const result = await sendSignupOtpAction(fd);
      if (isActionFailure(result)) {
        setClientError(resolveActionError(tErrors, result.error));
        return;
      }
      if ("step" in result && result.step === "otp") {
        setOtpStep({
          phone: result.phone,
          name: result.name,
          maskedPhone: result.maskedPhone,
        });
        showActionSuccess(t, "otp.sentToast");
      }
    });
  }

  function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);

    const fd = new FormData(event.currentTarget);
    const otp = String(fd.get("otp") ?? "").trim();
    if (!/^\d{6}$/.test(otp)) {
      otpForm.setError("otp", { message: t("otp.otpInvalid") });
      return;
    }

    startTransition(async () => {
      const result = await verifySignupOtpAction(fd);
      if (result && isActionFailure(result)) {
        setClientError(resolveActionError(tErrors, result.error));
      }
      // Success redirects to /wallet
    });
  }

  function handleResend() {
    if (!otpStep) return;
    setClientError(null);
    startTransition(async () => {
      const result = await resendSignupOtpAction(otpStep.phone);
      if (isActionFailure(result)) {
        setClientError(resolveActionError(tErrors, result.error));
        return;
      }
      showActionSuccess(t, "otp.resentToast");
    });
  }

  if (otpStep) {
    return (
      <form
        className="space-y-4"
        onSubmit={handleOtpSubmit}
        noValidate
      >
        <input type="hidden" name="phone" value={otpStep.phone} />
        <input type="hidden" name="country" value={country} />
        <input type="hidden" name="phoneLocal" value={phoneLocal} />
        <input type="hidden" name="name" value={otpStep.name} />

        <div className="space-y-1 rounded-lg border border-border/60 bg-muted/40 p-3">
          <p className="text-sm text-muted-foreground">{t("otp.sentHint")}</p>
          <p className="font-mono text-sm font-medium text-foreground">
            {otpStep.maskedPhone}
          </p>
        </div>

        <Field
          label={t("otp.otpLabel")}
          htmlFor="signup-otp"
          error={otpForm.formState.errors.otp?.message}
        >
          <Input
            id="signup-otp"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={t("otp.otpPlaceholder")}
            className="min-h-11 text-center font-mono text-lg tracking-[0.3em]"
            aria-invalid={Boolean(otpForm.formState.errors.otp)}
            onChange={(e) => {
              otpForm.setValue("otp", e.target.value);
              otpForm.clearErrors("otp");
            }}
          />
        </Field>

        {clientError ? (
          <p className="text-sm text-destructive" role="alert">
            {clientError}
          </p>
        ) : null}

        <Button
          type="submit"
          className="min-h-11 w-full bg-brand-purple hover:bg-brand-purple/90"
          disabled={isPending}
        >
          {isPending ? t("otp.verifying") : t("otp.submit")}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full"
          disabled={isPending}
          onClick={handleResend}
        >
          {t("otp.resend")}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full"
          disabled={isPending}
          onClick={() => {
            setOtpStep(null);
            setClientError(null);
            otpForm.reset();
          }}
        >
          {t("otp.changeDetails")}
        </Button>
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleNameSubmit}
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
        error={nameForm.formState.errors.name?.message}
      >
        <Input
          id="name"
          autoComplete="name"
          placeholder={t("placeholders.name")}
          {...nameForm.register("name")}
        />
      </Field>
      {clientError ? (
        <p className="text-sm text-destructive" role="alert">
          {clientError}
        </p>
      ) : null}
      <Button
        type="submit"
        className="min-h-11 w-full bg-brand-purple hover:bg-brand-purple/90"
        disabled={isPending}
      >
        {isPending ? t("otp.sending") : t("actions.start")}
      </Button>
    </form>
  );
}
