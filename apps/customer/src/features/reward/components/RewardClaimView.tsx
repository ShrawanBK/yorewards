"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gift, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import {
  fetchRewardClaimContextAction,
  sendRedemptionOtpAction,
  verifyRedemptionOtpAction,
} from "@/features/reward/api/rewardActions";
import { RedemptionCodePanel } from "@/features/reward/components/RedemptionCodePanel";
import { RewardOtpForm } from "@/features/reward/components/RewardOtpForm";
import { rewardQueryKeys } from "@/features/reward/api/rewardQueries";
import {
  invalidateCustomerCard,
  invalidateCustomerWallet,
} from "@/features/wallet";
import { useAuthStore } from "@/features/auth";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";

type RewardClaimViewProps = {
  cardId: string;
};

export function RewardClaimView({ cardId }: RewardClaimViewProps) {
  const t = useTranslations("reward");
  const tErrors = useTranslations("errors.actions");
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = useAuthStore((s) => s.customerId);

  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
  const [justVerified, setJustVerified] = useState(false);

  const { data: context, isLoading, isError } = useQuery({
    queryKey: rewardQueryKeys.claim(cardId),
    queryFn: async () => {
      const result = await fetchRewardClaimContextAction(cardId);
      if (isActionFailure(result)) {
        throw new Error(result.error.code);
      }
      return result.context;
    },
  });

  useEffect(() => {
    if (!context) return;
    if (context.rewardStatus === "collecting") {
      router.replace(`/wallet/${cardId}`);
    }
    if (context.rewardStatus === "unlocked" && context.redemptionCode) {
      setRedemptionCode(context.redemptionCode);
    }
  }, [context, cardId, router]);

  async function handleSendOtp() {
    setSendingOtp(true);
    setActionError(null);
    try {
      const result = await sendRedemptionOtpAction(cardId);
      if (isActionFailure(result)) {
        setActionError(resolveActionError(tErrors, result.error));
        return;
      }
      setOtpSent(true);
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp(otp: string) {
    setActionError(null);
    const result = await verifyRedemptionOtpAction(cardId, otp);
    if (isActionFailure(result)) {
      setActionError(resolveActionError(tErrors, result.error));
      return;
    }

    setRedemptionCode(result.redemptionCode);
    setJustVerified(true);

    if (customerId) {
      await Promise.all([
        invalidateCustomerWallet(queryClient, customerId),
        invalidateCustomerCard(queryClient, cardId),
        queryClient.invalidateQueries({
          queryKey: rewardQueryKeys.claim(cardId),
        }),
      ]);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !context) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-6">
        <Button variant="ghost" className="min-h-11 w-fit px-0" asChild>
          <Link href="/wallet">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            {t("backToWallet")}
          </Link>
        </Button>
        <p className="text-sm text-destructive" role="alert">
          {t("loadError")}
        </p>
      </div>
    );
  }

  const displayCode = redemptionCode ?? context.redemptionCode;
  const showUnavailable =
    context.rewardStatus === "unlocked" && !displayCode && !otpSent;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 p-6 pb-8">
      <Button variant="ghost" className="min-h-11 w-fit px-0" asChild>
        <Link href={`/wallet/${cardId}`}>
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          {t("backToCard")}
        </Link>
      </Button>

      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-amber/15 text-brand-amber">
          <Gift className="size-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {context.businessName} · {context.cardName}
        </p>
      </div>

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      {showUnavailable ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {t("unavailable")}
        </p>
      ) : null}

      {displayCode ? (
        <>
          <RedemptionCodePanel code={displayCode} celebrate={justVerified} />
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/wallet">{t("backToWallet")}</Link>
          </Button>
        </>
      ) : showUnavailable ? null : (
        <div className="space-y-5 rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 size-5 shrink-0 text-brand-purple" aria-hidden />
            <div className="space-y-1">
              <p className="font-medium">{t("send.phoneLabel")}</p>
              <p className="font-mono text-sm text-muted-foreground">
                {context.maskedPhone}
              </p>
              <p className="text-sm text-muted-foreground">
                {otpSent ? t("send.sentHint") : t("send.hint")}
              </p>
            </div>
          </div>

          {!otpSent ? (
            <Button
              type="button"
              className="min-h-11 w-full bg-brand-purple hover:bg-brand-purple/90"
              disabled={sendingOtp}
              onClick={handleSendOtp}
            >
              {sendingOtp ? t("send.sending") : t("send.cta")}
            </Button>
          ) : (
            <>
              <RewardOtpForm onSubmit={handleVerifyOtp} />
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full"
                disabled={sendingOtp}
                onClick={handleSendOtp}
              >
                {t("send.resend")}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
