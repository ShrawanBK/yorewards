"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Gift, Search } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Field } from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import type { RedemptionLookup } from "@repo/supabase/queries/redemptions";
import {
  confirmRedemptionAction,
  lookupRedemptionAction,
} from "@/features/redemption/api/redemptionActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

export function RedemptionCodeForm({ merchantId }: { merchantId: string }) {
  const t = useTranslations("redemption");
  const tErrors = useTranslations("errors.actions");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [redemption, setRedemption] = useState<RedemptionLookup | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmedCustomer, setConfirmedCustomer] = useState<string | null>(
    null,
  );
  const [confirmOutcome, setConfirmOutcome] = useState<{
    carryover: number;
    nextCycle: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLookup(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setConfirmedCustomer(null);
    setConfirmOutcome(null);
    startTransition(async () => {
      const result = await lookupRedemptionAction(merchantId, code);
      if (result.error) {
        setError(resolveActionError(tErrors, result.error));
        setRedemption(null);
        return;
      }
      setRedemption(result.redemption ?? null);
    });
  }

  function handleConfirm() {
    if (!redemption) return;
    const customer =
      redemption.customerName?.split(" ")[0] ?? t("unknownCustomer");
    const carryover = Math.max(
      0,
      redemption.currentStamps - redemption.stampTarget,
    );
    const nextCycle = redemption.cycleNumber + 1;
    setError(null);
    startTransition(async () => {
      const result = await confirmRedemptionAction(merchantId, redemption.id);
      if (result.error) {
        setError(resolveActionError(tErrors, result.error));
        return;
      }
      setConfirmedCustomer(customer);
      setConfirmOutcome({ carryover, nextCycle });
      setSuccess(true);
      showActionSuccess(
        t,
        carryover > 0
          ? "success.confirmedWithCarryover"
          : "success.confirmedNoCarryover",
        { customer, carryover, nextCycle },
      );
      setRedemption(null);
      setCode("");
    });
  }

  const displayName =
    redemption?.customerName?.split(" ")[0] ?? t("unknownCustomer");

  const redemptionCarryover = redemption
    ? Math.max(0, redemption.currentStamps - redemption.stampTarget)
    : 0;
  const redemptionNextCycle = redemption ? redemption.cycleNumber + 1 : 0;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <form onSubmit={handleLookup} className="space-y-4">
        <Field label={t("codeLabel")} htmlFor="redemption-code">
          <Input
            id="redemption-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t("codePlaceholder")}
            maxLength={6}
            autoComplete="off"
            spellCheck={false}
            className="font-mono text-lg tracking-widest uppercase"
          />
        </Field>
        <Button type="submit" disabled={isPending || code.trim().length < 6}>
          <Search className="size-4" aria-hidden />
          {t("lookup")}
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {success && confirmedCustomer ? (
        <Card className="merchant-glass-card border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-base">
              {t("successTitle", { customer: confirmedCustomer })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="merchant-body-muted text-sm">
              {confirmOutcome && confirmOutcome.carryover > 0
                ? t("successDescriptionWithCarryover", {
                    carryover: confirmOutcome.carryover,
                    nextCycle: confirmOutcome.nextCycle,
                  })
                : t("successDescriptionNoCarryover")}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {redemption ? (
        <Card className="merchant-glass-card">
          <CardHeader className="gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary-dark dark:text-primary">
              <Gift className="size-5" aria-hidden />
            </div>
            <CardTitle>{t("confirmTitle", { name: displayName })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("reward")}</dt>
                <dd className="text-right font-medium">
                  {redemption.rewardDescription}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("card")}</dt>
                <dd className="font-medium">{redemption.cardName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {t("stampsThisCycle")}
                </dt>
                <dd className="font-medium tabular-nums">
                  {t("stampProgress", {
                    current: redemption.currentStamps,
                    target: redemption.stampTarget,
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {t("approvedThisCycle")}
                </dt>
                <dd className="font-medium tabular-nums">
                  {t("approvedCount", {
                    count: redemption.approvedStampCountThisCycle,
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("allTimeVisits")}</dt>
                <dd className="font-medium tabular-nums">
                  {t("approvedCount", {
                    count: redemption.allTimeApprovedCount,
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("cycle")}</dt>
                <dd className="font-medium tabular-nums">
                  {redemption.cycleNumber}
                </dd>
              </div>
            </dl>
            <p className="merchant-body-muted text-xs">
              {redemptionCarryover > 0
                ? t("confirmHintWithCarryover", {
                    carryover: redemptionCarryover,
                    nextCycle: redemptionNextCycle,
                  })
                : t("confirmHintNoCarryover", {
                    nextCycle: redemptionNextCycle,
                  })}
            </p>
            <Button
              type="button"
              className="w-full"
              disabled={isPending}
              onClick={handleConfirm}
            >
              {t("confirm")}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
