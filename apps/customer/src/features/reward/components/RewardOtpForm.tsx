"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";

type RewardOtpFormProps = {
  disabled?: boolean;
  onSubmit: (otp: string) => Promise<void>;
};

export function RewardOtpForm({ disabled, onSubmit }: RewardOtpFormProps) {
  const t = useTranslations("reward.verify");
  const [submitting, setSubmitting] = useState(false);

  const schema = z.object({
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, t("otpInvalid")),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { otp: "" },
  });

  async function handleSubmit(values: z.infer<typeof schema>) {
    setSubmitting(true);
    try {
      await onSubmit(values.otp);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(handleSubmit)}
      noValidate
    >
      <Field
        label={t("otpLabel")}
        htmlFor="reward-otp"
        error={form.formState.errors.otp?.message}
      >
        <Input
          id="reward-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder={t("otpPlaceholder")}
          className="min-h-11 text-center font-mono text-lg tracking-[0.3em]"
          aria-invalid={Boolean(form.formState.errors.otp)}
          {...form.register("otp")}
        />
      </Field>
      <Button
        type="submit"
        className="min-h-11 w-full bg-brand-purple hover:bg-brand-purple/90"
        disabled={disabled || submitting}
      >
        {submitting ? t("verifying") : t("submit")}
      </Button>
    </form>
  );
}
