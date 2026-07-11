"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatter } from "next-intl";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import type { MerchantInvoiceRow } from "@repo/supabase/queries/merchant-subscriptions";
import type { MerchantSubscriptionRow } from "@repo/supabase/queries/merchant-subscriptions";
import type { SubscriptionTier } from "@repo/supabase/types";
import {
  startEsewaCheckoutAction,
} from "@/features/billing/api/billingActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

type BillingViewProps = {
  merchantId: string;
  tier: SubscriptionTier;
  subscription: MerchantSubscriptionRow | null;
  invoices: MerchantInvoiceRow[];
  starterPriceNpr: number;
};

function formatTrialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function BillingView({
  merchantId,
  tier,
  subscription,
  invoices,
  starterPriceNpr,
}: BillingViewProps) {
  const t = useTranslations("billing");
  const tErrors = useTranslations("errors.actions");
  const format = useFormatter();
  const [termsAccepted, setTermsAccepted] = useState(
    Boolean(subscription?.terms_accepted_at),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const trialDaysLeft = formatTrialDaysLeft(subscription?.trial_ends_at ?? null);
  const onPaidPlan =
    tier !== "free" &&
    (subscription?.status === "trialing" || subscription?.status === "active");

  async function handleUpgrade() {
    setError(null);
    setPending(true);
    const result = await startEsewaCheckoutAction(merchantId, termsAccepted);
    setPending(false);
    if (result.error) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="merchant-glass-card border-border/60">
        <CardHeader>
          <CardTitle>{t("currentPlan.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-lg font-semibold text-foreground">
            {t(`plans.${tier}`)}
          </p>
          {subscription?.status === "trialing" && trialDaysLeft !== null ? (
            <p className="merchant-body-muted text-sm" role="status">
              {t("currentPlan.trialCountdown", { days: trialDaysLeft })}
            </p>
          ) : null}
          {tier === "free" ? (
            <p className="merchant-body-muted text-sm">{t("currentPlan.freeHint")}</p>
          ) : null}
        </CardContent>
      </Card>

      {!onPaidPlan ? (
        <Card className="merchant-glass-card border-border/60">
          <CardHeader>
            <CardTitle>{t("upgrade.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="merchant-body-muted text-sm">
              {t("upgrade.starterBlurb", { price: starterPriceNpr })}
            </p>
            <label className="flex items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-input"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                aria-label={t("upgrade.termsAria")}
              />
              <span>
                {t("upgrade.termsPrefix")}{" "}
                <Link
                  href="/merchant/terms"
                  className="text-[var(--accent-text)] underline-offset-4 hover:underline"
                >
                  {t("upgrade.termsLink")}
                </Link>
              </span>
            </label>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="button"
              onClick={handleUpgrade}
              disabled={pending || !termsAccepted}
            >
              {pending ? t("upgrade.pending") : t("upgrade.cta")}
            </Button>
            <p className="merchant-body-muted text-xs">{t("upgrade.sandboxNote")}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="merchant-glass-card border-border/60">
        <CardHeader>
          <CardTitle>{t("invoices.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="merchant-body-muted text-sm">{t("invoices.empty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {invoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {t(`plans.${invoice.tier}`)}
                    </p>
                    <p className="merchant-body-muted">
                      {format.dateTime(new Date(invoice.created_at), {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {invoice.amount_npr === 0
                        ? t("invoices.trial")
                        : t("invoices.amount", { amount: invoice.amount_npr })}
                    </p>
                    <p className="merchant-body-muted capitalize">
                      {invoice.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
