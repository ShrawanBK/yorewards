"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { AlertTriangle, Check, Clock, MapPin, X } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Field } from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/lib/utils";
import type { PendingStampQueueItem } from "@repo/supabase/queries/stamps";
import {
  approveStampAction,
  rejectStampAction,
} from "@/features/stamp-queue/api/stampQueueActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

const PENDING_TTL_MS = 5 * 60 * 1000;

const REJECT_REASON_CODES = [
  "min_spend_not_met",
  "item_not_eligible",
  "other",
] as const;

type RejectReasonCode = (typeof REJECT_REASON_CODES)[number];

function remainingMs(createdAt: string) {
  return Math.max(0, PENDING_TTL_MS - (Date.now() - new Date(createdAt).getTime()));
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function StampQueueItem({
  item,
  merchantId,
}: {
  item: PendingStampQueueItem;
  merchantId: string;
}) {
  const t = useTranslations("stampQueue");
  const tErrors = useTranslations("errors.actions");
  const format = useFormatter();
  const [error, setError] = useState<string | null>(null);
  const [amountSpent, setAmountSpent] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReasonCode, setRejectReasonCode] = useState<RejectReasonCode | "">(
    "",
  );
  const [isPending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState(() => remainingMs(item.createdAt));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(remainingMs(item.createdAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [item.createdAt]);

  const displayName = item.customerName?.split(" ")[0] ?? t("unknownCustomer");
  const parsedAmount = Number(amountSpent);
  const showMinSpendWarning =
    item.minSpend > 0 &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount < item.minSpend;

  const amountLabel = useMemo(
    () =>
      t("amountLabel", {
        currency: item.minSpendCurrency,
      }),
    [item.minSpendCurrency, t],
  );

  function handleApprove() {
    setError(null);
    const amount = Number(amountSpent);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t("amountRequired"));
      return;
    }
    startTransition(async () => {
      const result = await approveStampAction(merchantId, item.id, amount);
      if (result.error) {
        setError(resolveActionError(tErrors, result.error));
        return;
      }
      showActionSuccess(t, "success.approvedWithAmount", {
        customer: displayName,
        amount: format.number(amount, {
          style: "currency",
          currency: item.minSpendCurrency,
          maximumFractionDigits: 0,
        }),
      });
    });
  }

  function handleReject() {
    setError(null);
    const reason = rejectReasonCode
      ? t(`rejectReasons.${rejectReasonCode}`)
      : undefined;
    startTransition(async () => {
      const result = await rejectStampAction(
        merchantId,
        item.id,
        reason,
      );
      if (result.error) {
        setError(resolveActionError(tErrors, result.error));
        return;
      }
      showActionSuccess(t, "success.rejected", { customer: displayName });
      setRejectOpen(false);
      setRejectReasonCode("");
    });
  }

  const expired = countdown <= 0;

  return (
    <>
      <article
        className={cn(
          "merchant-glass-card flex w-full flex-col gap-5 border-primary/20 p-5 lg:flex-row lg:items-stretch",
          expired && "opacity-60",
        )}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xl font-semibold text-foreground">{displayName}</p>
              <p className="merchant-body-muted text-sm">
                {item.cardName}
                {item.branchName ? (
                  <span className="inline-flex items-center gap-1">
                    {" · "}
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {item.branchName}
                  </span>
                ) : null}
              </p>
            </div>
            <p className="rounded-full bg-muted px-3 py-1 text-sm font-medium tabular-nums">
              {t("progress", {
                current: item.currentStamps,
                target: item.stampTarget,
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {format.relativeTime(new Date(item.createdAt), Date.now())}
            </span>
            <span aria-live="polite" className={cn(expired && "text-destructive")}>
              {t("expiresIn", { time: formatCountdown(countdown) })}
            </span>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-3 lg:max-w-sm lg:border-l lg:border-border lg:pl-5">
          <Field label={amountLabel} htmlFor={`amount-${item.id}`}>
            <Input
              id={`amount-${item.id}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder={t("amountPlaceholder")}
              value={amountSpent}
              disabled={isPending || expired}
              className="h-12 text-lg tabular-nums"
              onChange={(e) => setAmountSpent(e.target.value)}
            />
          </Field>

          {showMinSpendWarning ? (
            <p
              className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"
              role="status"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("minSpendWarning", {
                amount: format.number(item.minSpend, {
                  style: "currency",
                  currency: item.minSpendCurrency,
                  maximumFractionDigits: 0,
                }),
              })}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              size="lg"
              className="min-h-11"
              disabled={isPending || expired}
              onClick={handleApprove}
            >
              <Check className="size-5" aria-hidden />
              {isPending ? t("approving") : t("approve")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="min-h-11"
              disabled={isPending || expired}
              onClick={() => setRejectOpen(true)}
            >
              <X className="size-5" aria-hidden />
              {t("reject")}
            </Button>
          </div>
        </div>
      </article>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>{t("rejectDescription")}</DialogDescription>
          </DialogHeader>
          <Field label={t("rejectReasonLabel")} htmlFor="reject-reason">
            <select
              id="reject-reason"
              value={rejectReasonCode}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onChange={(e) =>
                setRejectReasonCode(e.target.value as RejectReasonCode | "")
              }
            >
              <option value="">{t("rejectReasonOptional")}</option>
              {REJECT_REASON_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`rejectReasons.${code}`)}
                </option>
              ))}
            </select>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleReject}
            >
              {t("confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
