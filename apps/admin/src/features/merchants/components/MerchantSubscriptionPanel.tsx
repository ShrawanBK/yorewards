"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Field } from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import type { MerchantSubscriptionRow } from "@repo/supabase/queries/merchant-subscriptions";
import type { SubscriptionTier } from "@repo/supabase/types";
import {
  extendMerchantTrialAction,
  setMerchantTierAction,
} from "@/features/merchants/api/subscriptionActions";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

const TIERS: SubscriptionTier[] = ["free", "starter", "growth", "enterprise"];

export function MerchantSubscriptionPanel({
  merchantId,
  subscription,
  merchantTier,
}: {
  merchantId: string;
  subscription: MerchantSubscriptionRow | null;
  merchantTier: string;
}) {
  const t = useTranslations("merchants.subscription");
  const tErrors = useTranslations("errors.actions");
  const format = useFormatter();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    (subscription?.tier ?? merchantTier) as SubscriptionTier,
  );
  const [extraDays, setExtraDays] = useState("7");

  const tier = subscription?.tier ?? merchantTier;
  const status = subscription?.status ?? "free";

  async function handleTierSave() {
    setPending(true);
    setError(null);
    const result = await setMerchantTierAction(merchantId, selectedTier);
    setPending(false);
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    showActionSuccess(t, "success.tierUpdated", { tier: selectedTier });
    router.refresh();
  }

  async function handleExtendTrial() {
    const days = Number(extraDays);
    setPending(true);
    setError(null);
    const result = await extendMerchantTrialAction(merchantId, days);
    setPending(false);
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    showActionSuccess(t, "success.trialExtended", { days });
    router.refresh();
  }

  return (
    <Card className="admin-card">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("currentTier")}</dt>
            <dd className="font-medium capitalize">{tier}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("status")}</dt>
            <dd className="font-medium">{t(`statuses.${status}`)}</dd>
          </div>
          {subscription?.trial_ends_at ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">{t("trialEnds")}</dt>
              <dd className="font-medium">
                {format.dateTime(new Date(subscription.trial_ends_at), {
                  dateStyle: "medium",
                })}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="space-y-3 border-t border-border pt-4">
          <Field label={t("adjustTier")} htmlFor="admin-tier">
            <select
              id="admin-tier"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as SubscriptionTier)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {TIERS.map((value) => (
                <option key={value} value={value}>
                  {t(`tiers.${value}`)}
                </option>
              ))}
            </select>
          </Field>
          <Button type="button" disabled={pending} onClick={handleTierSave}>
            {pending ? t("saving") : t("saveTier")}
          </Button>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <Field label={t("extendTrialDays")} htmlFor="trial-days">
            <Input
              id="trial-days"
              type="number"
              min={1}
              max={90}
              value={extraDays}
              onChange={(e) => setExtraDays(e.target.value)}
            />
          </Field>
          <Button
            type="button"
            variant="outline"
            className="text-foreground"
            disabled={pending}
            onClick={handleExtendTrial}
          >
            {pending ? t("extending") : t("extendTrial")}
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
