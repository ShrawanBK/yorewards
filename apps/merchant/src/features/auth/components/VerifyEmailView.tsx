"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { Button } from "@repo/ui/button";
import { resendMerchantEmailVerificationAction } from "@/features/auth/api/authActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";
import { showActionSuccess } from "@/shared/utils/action-feedback";

export function VerifyEmailView() {
  const t = useTranslations("auth.verifyEmail");
  const tErrors = useTranslations("errors.actions");
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    setError(null);
    startTransition(async () => {
      const result = await resendMerchantEmailVerificationAction(
        email || undefined,
      );
      if (isActionFailure(result)) {
        setError(resolveActionError(tErrors, result.error));
        return;
      }
      showActionSuccess(t, "resentToast");
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Mail className="size-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        {email ? (
          <p className="font-medium text-foreground">{email}</p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="min-h-11 w-full"
        disabled={isPending || !email}
        onClick={handleResend}
      >
        {isPending ? t("resending") : t("resend")}
      </Button>

      <Button variant="outline" className="min-h-11 w-full" asChild>
        <Link href="/merchant/login">{t("backToLogin")}</Link>
      </Button>
    </div>
  );
}
