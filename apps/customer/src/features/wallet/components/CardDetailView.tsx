"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Copy, Gift, ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { CustomerLoyaltyCard } from "@/features/wallet/components/CustomerLoyaltyCard";
import { useCustomerCard } from "@/features/wallet/hooks/useCustomerCard";

type CardDetailViewProps = {
  cardId: string;
};

function isRewardReady(
  status: "collecting" | "pending_otp" | "unlocked",
): boolean {
  return status === "pending_otp" || status === "unlocked";
}

export function CardDetailView({ cardId }: CardDetailViewProps) {
  const t = useTranslations("card");
  const tErrors = useTranslations("errors.actions");
  const { data: card, isLoading, isError, error } = useCustomerCard(cardId);
  const [copied, setCopied] = useState(false);

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mx-auto h-96 w-full max-w-sm rounded-2xl" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (isError || !card) {
    const message =
      error?.message === "CUSTOMER_CARD_NOT_FOUND"
        ? tErrors("CUSTOMER_CARD_NOT_FOUND")
        : t("loadError");

    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-6">
        <Button
          variant="ghost"
          className="min-h-11 w-fit justify-start px-0"
          asChild
        >
          <Link href="/wallet">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            {t("backToWallet")}
          </Link>
        </Button>
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      </div>
    );
  }

  const rewardReady = isRewardReady(card.rewardStatus);
  const showRedemptionCode =
    card.rewardStatus === "unlocked" && card.pendingRedemptionCode;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 p-6 pb-8">
      <Button
        variant="ghost"
        className="min-h-11 w-fit justify-start px-0"
        asChild
      >
        <Link href="/wallet">
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          {t("backToWallet")}
        </Link>
      </Button>

      <div className="mx-auto w-full">
        <CustomerLoyaltyCard card={card} />
      </div>

      {card.description ? (
        <p className="text-center text-sm text-muted-foreground">
          {card.description}
        </p>
      ) : null}

      {showRedemptionCode ? (
        <div className="space-y-3 rounded-xl border border-brand-amber/40 bg-brand-amber/10 p-4">
          <div className="space-y-1 text-center">
            <p className="font-medium">{t("redemption.title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("redemption.subtitle")}
            </p>
          </div>
          <p
            className="text-center font-mono text-3xl font-bold tracking-[0.2em] text-foreground"
            aria-label={t("redemption.codeAria", {
              code: card.pendingRedemptionCode!,
            })}
          >
            {card.pendingRedemptionCode}
          </p>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full"
            onClick={() => handleCopyCode(card.pendingRedemptionCode!)}
            aria-label={t("redemption.copyAria")}
          >
            <Copy className="mr-2 size-4" aria-hidden />
            {copied ? t("redemption.copied") : t("redemption.copy")}
          </Button>
        </div>
      ) : null}

      {card.rewardStatus === "pending_otp" ? (
        <div className="space-y-3 rounded-xl border border-brand-amber/40 bg-brand-amber/10 p-4 text-center">
          <Gift className="mx-auto size-6 text-brand-amber" aria-hidden />
          <p className="text-sm font-medium">{t("claimPrompt")}</p>
          <Button
            asChild
            className="min-h-11 w-full bg-brand-amber text-foreground hover:bg-brand-amber/90"
          >
            <Link href={`/reward/${card.id}`}>{t("claimReward")}</Link>
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {!rewardReady ? (
          <Button
            asChild
            className="min-h-11 bg-brand-purple hover:bg-brand-purple/90"
          >
            <Link href="/scan">
              <ScanLine className="mr-2 size-4" aria-hidden />
              {t("scanCta")}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
