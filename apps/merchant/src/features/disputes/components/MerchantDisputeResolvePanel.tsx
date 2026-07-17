"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { Textarea } from "@repo/ui/textarea";
import {
  getDisputeSlaLevel,
  type StampDisputeListItem,
} from "@repo/supabase/queries/stamp-disputes-shared";
import { resolveMerchantDisputeAction } from "@/features/disputes/api/disputeActions";
import { merchantPendingDisputeCountQueryKey } from "@/features/disputes/api/disputeQueries";
import { MERCHANT_STATUS_BADGE } from "@/shared/constants/status-badges";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";
import { useQueryClient } from "@tanstack/react-query";

const MIN_NOTE_LENGTH = 10;

const DEADLINE_BADGE = {
  on_track: MERCHANT_STATUS_BADGE.pending,
  due: {
    variant: "secondary" as const,
    className:
      "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  },
  overdue: MERCHANT_STATUS_BADGE.rejected,
};

type PendingResolve = {
  status: "approved" | "rejected";
  issueStamp: boolean;
};

export function MerchantDisputeResolvePanel({
  dispute,
  merchantId,
  onResolved,
}: {
  dispute: StampDisputeListItem;
  merchantId: string;
  onResolved?: () => void;
}) {
  const t = useTranslations("disputes");
  const tErrors = useTranslations("errors.actions");
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const trimmedNote = note.trim();
  const noteValid = trimmedNote.length >= MIN_NOTE_LENGTH;
  const deadlineLevel = getDisputeSlaLevel(dispute.status, dispute.createdAt);
  const deadlineStyle = deadlineLevel ? DEADLINE_BADGE[deadlineLevel] : null;

  async function submitResolve(resolve: PendingResolve) {
    setIsPending(true);
    setError(null);
    const result = await resolveMerchantDisputeAction({
      disputeId: dispute.id,
      merchantId,
      status: resolve.status,
      note: trimmedNote,
      issueStamp: resolve.issueStamp,
    });
    setIsPending(false);

    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }

    setNote("");
    void queryClient.invalidateQueries({
      queryKey: merchantPendingDisputeCountQueryKey(merchantId),
    });

    if (resolve.status === "rejected") {
      showActionSuccess(t, "success.rejected");
    } else if (resolve.issueStamp) {
      showActionSuccess(t, "success.approvedWithStamp");
    } else {
      showActionSuccess(t, "success.approved");
    }

    onResolved?.();
  }

  function requestResolve(resolve: PendingResolve) {
    if (!noteValid) {
      setError(tErrors("DISPUTE_RESPONSE_REQUIRED"));
      return;
    }
    setError(null);
    void submitResolve(resolve);
  }

  if (dispute.status !== "pending") {
    return null;
  }

  return (
    <section
      className="space-y-4 border-t border-border pt-4"
      aria-labelledby={`merchant-resolve-${dispute.id}-heading`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={`merchant-resolve-${dispute.id}-heading`} className="text-sm font-medium">
          {t("resolveSectionTitle")}
        </h4>
        {deadlineLevel && deadlineStyle ? (
          <Badge variant={deadlineStyle.variant} className={deadlineStyle.className}>
            {t(`responseDeadline.${deadlineLevel}`)}
          </Badge>
        ) : null}
      </div>

      {deadlineLevel === "overdue" ? (
        <div
          className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm"
          role="alert"
        >
          <Clock className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <p>{t("deadlineOverdueAlert")}</p>
        </div>
      ) : deadlineLevel === "due" ? (
        <div
          className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{t("deadlineDueAlert")}</p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Field label={t("noteLabel")} htmlFor={`merchant-note-${dispute.id}`}>
        <Textarea
          id={`merchant-note-${dispute.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          required
          className="min-h-24"
          aria-invalid={note.length > 0 && !noteValid}
          aria-describedby={`merchant-note-hint-${dispute.id}`}
          placeholder={t("notePlaceholder")}
          disabled={isPending}
        />
      </Field>
      <p id={`merchant-note-hint-${dispute.id}`} className="merchant-body-muted text-xs">
        {t("noteHint")}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 text-foreground"
          disabled={isPending || !noteValid}
          onClick={() => requestResolve({ status: "rejected", issueStamp: false })}
        >
          {t("rejectCta")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 text-foreground"
          disabled={isPending || !noteValid}
          onClick={() => requestResolve({ status: "approved", issueStamp: false })}
        >
          {isPending ? t("resolving") : t("approveNoStampCta")}
        </Button>
        <Button
          type="button"
          className="min-h-11"
          disabled={isPending || !noteValid}
          aria-busy={isPending}
          onClick={() => requestResolve({ status: "approved", issueStamp: true })}
        >
          {isPending ? t("resolving") : t("approveWithStampCta")}
        </Button>
      </div>
    </section>
  );
}
