"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { Textarea } from "@repo/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  getDisputeSlaLevel,
  needsEarlyAdminResolveConfirm,
  type StampDisputeListItem,
} from "@repo/supabase/queries/stamp-disputes";
import { adminResolveDisputeAction } from "@/features/disputes/api/disputeActions";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

const MIN_NOTE_LENGTH = 10;

type PendingResolve = {
  status: "approved" | "rejected";
  issueStamp: boolean;
};

export function AdminDisputeResolvePanel({
  dispute,
  onResolved,
}: {
  dispute: StampDisputeListItem;
  onResolved?: () => void;
}) {
  const t = useTranslations("disputes");
  const tErrors = useTranslations("errors.actions");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [pendingResolve, setPendingResolve] = useState<PendingResolve | null>(null);

  const trimmedNote = note.trim();
  const noteValid = trimmedNote.length >= MIN_NOTE_LENGTH;
  const slaLevel = getDisputeSlaLevel(dispute.status, dispute.createdAt);
  const awaitingMerchant = needsEarlyAdminResolveConfirm(dispute.status, dispute.createdAt);

  async function submitResolve(
    resolve: PendingResolve,
    confirmBypassMerchantSla: boolean,
  ) {
    setIsPending(true);
    setError(null);
    const result = await adminResolveDisputeAction({
      disputeId: dispute.id,
      status: resolve.status,
      note: trimmedNote,
      issueStamp: resolve.issueStamp,
      confirmBypassMerchantSla,
    });
    setIsPending(false);

    if (isActionFailure(result)) {
      if (result.error.code === "DISPUTE_MERCHANT_SLA_ACTIVE") {
        setPendingResolve(resolve);
        return;
      }
      setError(resolveActionError(tErrors, result.error));
      return;
    }

    setPendingResolve(null);
    setNote("");

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

    if (awaitingMerchant) {
      setPendingResolve(resolve);
      return;
    }

    void submitResolve(resolve, false);
  }

  function handleEarlyConfirm() {
    if (!pendingResolve) return;
    void submitResolve(pendingResolve, true);
  }

  if (dispute.status !== "pending") {
    return null;
  }

  return (
    <section
      className="space-y-4 border-t border-border pt-4"
      aria-labelledby={`resolve-${dispute.id}-heading`}
    >
      <h3 id={`resolve-${dispute.id}-heading`} className="text-sm font-medium">
        {t("resolveSectionTitle")}
      </h3>

      {slaLevel === "overdue" ? (
        <div
          className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm"
          role="status"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <p>{t("slaOverdueAlert")}</p>
        </div>
      ) : awaitingMerchant ? (
        <div
          className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{t("slaAwaitingMerchantAlert")}</p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Field label={t("noteLabel")} htmlFor={`resolve-note-${dispute.id}`}>
        <Textarea
          id={`resolve-note-${dispute.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          required
          aria-invalid={note.length > 0 && !noteValid}
          aria-describedby={`resolve-note-hint-${dispute.id}`}
          placeholder={t("notePlaceholder")}
          disabled={isPending}
        />
      </Field>
      <p id={`resolve-note-hint-${dispute.id}`} className="text-xs text-muted-foreground">
        {t("noteHint")}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="admin-btn-outline text-foreground"
          disabled={isPending || !noteValid}
          onClick={() => requestResolve({ status: "rejected", issueStamp: false })}
        >
          {t("rejectCta")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="text-foreground"
          disabled={isPending || !noteValid}
          onClick={() => requestResolve({ status: "approved", issueStamp: false })}
        >
          {isPending ? t("resolving") : t("approveNoStampCta")}
        </Button>
        <Button
          type="button"
          className="admin-btn-success"
          disabled={isPending || !noteValid}
          aria-busy={isPending}
          onClick={() => requestResolve({ status: "approved", issueStamp: true })}
        >
          {isPending ? t("resolving") : t("approveWithStampCta")}
        </Button>
      </div>

      <Dialog
        open={pendingResolve !== null && awaitingMerchant}
        onOpenChange={(open) => {
          if (!open && !isPending) setPendingResolve(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("earlyResolveTitle")}</DialogTitle>
            <DialogDescription>{t("earlyResolveDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="admin-btn-outline text-foreground"
              disabled={isPending}
              onClick={() => setPendingResolve(null)}
            >
              {t("cancel")}
            </Button>
            <Button type="button" disabled={isPending} onClick={handleEarlyConfirm}>
              {isPending ? t("resolving") : t("earlyResolveConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
