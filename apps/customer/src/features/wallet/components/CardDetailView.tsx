"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Copy, Gift, ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { CustomerLoyaltyCard } from "@/features/wallet/components/CustomerLoyaltyCard";
import { useCustomerCard } from "@/features/wallet/hooks/useCustomerCard";
import { CustomerDisputesPanel, DisputeForm } from "@/features/disputes";
import type { CustomerStampDisputeItem } from "@repo/supabase/queries/stamp-disputes-shared";

type CardDetailViewProps = {
  cardId: string;
  initialDisputes?: CustomerStampDisputeItem[];
};

function isRewardReady(
  status: "collecting" | "pending_otp" | "unlocked",
): boolean {
  return status === "pending_otp" || status === "unlocked";
}

function formatAmount(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString()}`;
}

export function CardDetailView({
  cardId,
  initialDisputes = [],
}: CardDetailViewProps) {
  const t = useTranslations("card");
  const tDispute = useTranslations("dispute");
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
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
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
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
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
  const { spendSummary, visits } = card;
  const hasPendingDispute = initialDisputes.some((d) => d.status === "pending");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-6 pb-8 sm:px-6">
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

      <div className="mx-auto w-full max-w-sm sm:max-w-none">
        <CustomerLoyaltyCard card={card} />
      </div>

      {card.description ? (
        <p className="text-center text-sm text-muted-foreground">
          {card.description}
        </p>
      ) : null}

      {spendSummary.visitCount > 0 ? (
        <section
          className="space-y-3 rounded-xl border border-border/60 p-4"
          aria-labelledby="spend-summary-heading"
        >
          <h2 id="spend-summary-heading" className="text-base font-semibold">
            {t("insights.title")}
          </h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("insights.totalSpent")}</dt>
              <dd className="font-medium">
                {formatAmount(spendSummary.totalSpent, spendSummary.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("insights.avgSpent")}</dt>
              <dd className="font-medium">
                {formatAmount(spendSummary.averageSpent, spendSummary.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("insights.visits")}</dt>
              <dd className="font-medium">{spendSummary.visitCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("insights.lastVisit")}</dt>
              <dd className="font-medium">
                {spendSummary.lastVisitAt
                  ? new Date(spendSummary.lastVisitAt).toLocaleDateString()
                  : t("insights.noVisits")}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {visits.length > 0 ? (
        <section aria-labelledby="visit-history-heading">
          <h2 id="visit-history-heading" className="mb-3 text-base font-semibold">
            {t("visits.title")}
          </h2>
          <ul className="space-y-2">
            {visits.map((visit) => (
              <li
                key={visit.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {formatAmount(visit.amountSpent, visit.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {visit.branchName ?? t("visits.unknownBranch")}
                  </p>
                </div>
                <time
                  className="shrink-0 text-xs text-muted-foreground"
                  dateTime={visit.stampedAt}
                >
                  {new Date(visit.stampedAt).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        </section>
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

      <CustomerDisputesPanel disputes={initialDisputes} />

      {!hasPendingDispute ? (
        <DisputeForm customerCardId={card.id} />
      ) : (
        <p
          className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
          role="status"
        >
          {tDispute("pendingBlocked")}
        </p>
      )}
    </div>
  );
}
