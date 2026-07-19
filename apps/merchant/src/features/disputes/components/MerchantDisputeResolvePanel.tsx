"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { Textarea } from "@repo/ui/textarea";
import {
  getDisputeSlaLevel,
  type StampDisputeListItem,
} from "@repo/supabase/queries/stamp-disputes-shared";
import { resolveMerchantDisputeAction } from "@/features/disputes/api/disputeActions";
import { merchantPendingDisputeCountQueryKey } from "@/features/disputes/api/disputeQueries";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";
import { useQueryClient } from "@tanstack/react-query";

const MIN_NOTE_LENGTH = 10;

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
      className="space-y-3"
      aria-labelledby={`merchant-resolve-${dispute.id}-heading`}
    >
      <h4
        id={`merchant-resolve-${dispute.id}-heading`}
        className="text-xs font-medium tracking-wide uppercase"
      >
        {t("resolveSectionTitle")}
      </h4>

      {deadlineLevel === "overdue" ? (
        <div
          className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-xs"
          role="alert"
        >
          <Clock className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden="true" />
          <p>{t("deadlineOverdueAlert")}</p>
        </div>
      ) : deadlineLevel === "due" ? (
        <div
          className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-950 dark:text-amber-100"
          role="status"
        >
          <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>{t("deadlineDueAlert")}</p>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Field label={t("noteLabel")} htmlFor={`merchant-note-${dispute.id}`}>
        <Textarea
          id={`merchant-note-${dispute.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          required
          className="min-h-16 text-sm"
          aria-invalid={note.length > 0 && !noteValid}
          aria-describedby={`merchant-note-hint-${dispute.id}`}
          placeholder={t("notePlaceholder")}
          disabled={isPending}
        />
      </Field>
      <p id={`merchant-note-hint-${dispute.id}`} className="merchant-body-muted text-[11px]">
        {t("noteHint")}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-9 text-foreground"
          disabled={isPending || !noteValid}
          onClick={() => requestResolve({ status: "rejected", issueStamp: false })}
        >
          {t("rejectCta")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-9 text-foreground"
          disabled={isPending || !noteValid}
          onClick={() => requestResolve({ status: "approved", issueStamp: false })}
        >
          {isPending ? t("resolving") : t("approveNoStampCta")}
        </Button>
        <Button
          type="button"
          size="sm"
          className="min-h-9"
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
