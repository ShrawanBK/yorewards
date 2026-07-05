"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Check, Clock, MapPin, X } from "lucide-react";
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
import type { PendingStampQueueItem } from "@repo/supabase/queries/stamps";
import {
  approveStampAction,
  rejectStampAction,
} from "@/features/stamp-queue/api/stampQueueActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

const PENDING_TTL_MS = 5 * 60 * 1000;

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
  const [rejectReason, setRejectReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState(() => remainingMs(item.createdAt));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(remainingMs(item.createdAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [item.createdAt]);

  const displayName = item.customerName?.split(" ")[0] ?? t("unknownCustomer");

  function handleApprove() {
    setError(null);
    const amount = Number(amountSpent);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t("amountRequired"));
      return;
    }
    startTransition(async () => {
      const result = await approveStampAction(merchantId, item.id, amount);
      if (result.error) setError(resolveActionError(tErrors, result.error));
      else showActionSuccess(t, "success.approved", { customer: displayName });
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectStampAction(
        merchantId,
        item.id,
        rejectReason || undefined,
      );
      if (result.error) {
        setError(resolveActionError(tErrors, result.error));
        return;
      }
      showActionSuccess(t, "success.rejected", { customer: displayName });
      setRejectOpen(false);
      setRejectReason("");
    });
  }

  return (
    <>
      <article className="merchant-glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{displayName}</p>
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
          <p className="text-sm text-muted-foreground">
            {t("progress", {
              current: item.currentStamps,
              target: item.stampTarget,
            })}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {format.relativeTime(new Date(item.createdAt), Date.now())}
            </span>
            <span aria-live="polite">
              {t("expiresIn", { time: formatCountdown(countdown) })}
            </span>
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:min-w-[12rem]">
          <Field label={t("amountLabel")} htmlFor={`amount-${item.id}`}>
            <Input
              id={`amount-${item.id}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder={t("amountPlaceholder")}
              value={amountSpent}
              disabled={isPending || countdown <= 0}
              onChange={(e) => setAmountSpent(e.target.value)}
            />
          </Field>
          <div className="flex items-center justify-end gap-2">
            <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-11 shrink-0"
            disabled={isPending || countdown <= 0}
            aria-label={t("approveAria", { name: displayName })}
            onClick={handleApprove}
          >
            <Check className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            </Button>
            <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-11 shrink-0"
            disabled={isPending || countdown <= 0}
            aria-label={t("rejectAria", { name: displayName })}
            onClick={() => setRejectOpen(true)}
          >
            <X className="size-5 text-destructive" aria-hidden />
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
            <Input
              id="reject-reason"
              value={rejectReason}
              maxLength={120}
              placeholder={t("rejectReasonPlaceholder")}
              onChange={(e) => setRejectReason(e.target.value)}
            />
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
