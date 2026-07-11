"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Textarea } from "@repo/ui/textarea";
import { Label } from "@repo/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  approveMerchantAction,
  rejectMerchantAction,
  reactivateMerchantAction,
  suspendMerchantAction,
  type MerchantActionResult,
} from "@/features/merchants/api/merchantActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import {
  showActionError,
  showActionSuccess,
} from "@/shared/utils/action-feedback";
import type { Database, MerchantStatus } from "@repo/supabase/types";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

type ConfirmAction = "suspend" | "reactivate";

function MerchantReasonDialog({
  merchant,
  action,
  onClose,
}: {
  merchant: Merchant;
  action: ConfirmAction;
  onClose: () => void;
}) {
  const t = useTranslations("merchants");
  const tErrors = useTranslations("errors.actions");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const name = merchant.business_name;

  function runAction(actionFn: () => Promise<MerchantActionResult>) {
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError(true);
      return;
    }
    setReasonError(false);
    startTransition(async () => {
      const result = await actionFn();
      if (result?.error) {
        showActionError(resolveActionError(tErrors, result.error));
        return;
      }
      showActionSuccess(
        t,
        action === "suspend" ? "success.suspended" : "success.reactivated",
        { name },
      );
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "suspend"
              ? t("confirm.suspendTitle", { name })
              : t("confirm.reactivateTitle", { name })}
          </DialogTitle>
          <DialogDescription>
            {action === "suspend"
              ? t("confirm.suspendDescription")
              : t("confirm.reactivateDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="merchant-action-reason">
            {action === "suspend"
              ? t("confirm.suspendReasonLabel")
              : t("confirm.reactivateReasonLabel")}
          </Label>
          <Textarea
            id="merchant-action-reason"
            rows={3}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (reasonError) setReasonError(false);
            }}
            placeholder={
              action === "suspend"
                ? t("confirm.suspendReasonPlaceholder")
                : t("confirm.reactivateReasonPlaceholder")
            }
            aria-invalid={reasonError}
            disabled={isPending}
          />
          {reasonError ? (
            <p className="text-xs text-destructive" role="alert">
              {t("confirm.reasonRequired")}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="admin-btn-outline"
            disabled={isPending}
            onClick={onClose}
          >
            {t("confirm.cancel")}
          </Button>
          <Button
            type="button"
            className={
              action === "reactivate"
                ? "admin-btn-success"
                : "admin-btn-destructive"
            }
            disabled={isPending}
            onClick={() =>
              runAction(() =>
                action === "suspend"
                  ? suspendMerchantAction(merchant.id, reason)
                  : reactivateMerchantAction(merchant.id, reason),
              )
            }
          >
            {action === "suspend"
              ? t("actions.suspend")
              : t("actions.reactivate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MerchantAdminActions({ merchant }: { merchant: Merchant }) {
  const t = useTranslations("merchants");
  const tErrors = useTranslations("errors.actions");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const name = merchant.business_name;

  function runAction(
    action: () => Promise<MerchantActionResult>,
    successKey: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        showActionError(resolveActionError(tErrors, result.error));
        return;
      }
      showActionSuccess(t, successKey, { name });
    });
  }

  function handleReject() {
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectReasonError(true);
      return;
    }
    setRejectReasonError(false);
    runAction(
      () => rejectMerchantAction(merchant.id, trimmed),
      "success.rejected",
    );
  }

  if (merchant.status === "pending") {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-1">
          <Textarea
            aria-label={t("reject.label", { name })}
            aria-invalid={rejectReasonError}
            placeholder={t("reject.placeholder")}
            rows={2}
            value={rejectReason}
            disabled={isPending}
            onChange={(event) => {
              setRejectReason(event.target.value);
              if (rejectReasonError) setRejectReasonError(false);
            }}
          />
          {rejectReasonError ? (
            <p className="text-xs text-destructive" role="alert">
              {t("reject.required")}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            className="admin-btn-destructive"
            disabled={isPending}
            onClick={handleReject}
          >
            {t("actions.reject")}
          </Button>
          <Button
            className="admin-btn-success"
            disabled={isPending}
            onClick={() =>
              runAction(
                () => approveMerchantAction(merchant.id),
                "success.approved",
              )
            }
          >
            {t("actions.approve")}
          </Button>
        </div>
      </div>
    );
  }

  if (merchant.status === "active") {
    return (
      <>
        <Button
          type="button"
          className="admin-btn-destructive"
          disabled={isPending}
          onClick={() => setConfirmAction("suspend")}
        >
          {t("actions.suspend")}
        </Button>
        {confirmAction === "suspend" ? (
          <MerchantReasonDialog
            merchant={merchant}
            action="suspend"
            onClose={() => setConfirmAction(null)}
          />
        ) : null}
      </>
    );
  }

  if (merchant.status === "suspended") {
    return (
      <>
        <Button
          type="button"
          className="admin-btn-success"
          disabled={isPending}
          onClick={() => setConfirmAction("reactivate")}
        >
          {t("actions.reactivate")}
        </Button>
        {confirmAction === "reactivate" ? (
          <MerchantReasonDialog
            merchant={merchant}
            action="reactivate"
            onClose={() => setConfirmAction(null)}
          />
        ) : null}
      </>
    );
  }

  return (
    <Button
      className="admin-btn-success"
      disabled={isPending}
      onClick={() =>
        runAction(
          () => approveMerchantAction(merchant.id),
          "success.reactivated",
        )
      }
    >
      {t("actions.reactivate")}
    </Button>
  );
}

export const MERCHANT_STATUS_BADGE: Record<
  MerchantStatus,
  {
    variant: "default" | "secondary" | "outline" | "destructive";
    className?: string;
  }
> = {
  pending: { variant: "secondary" },
  pending_verification: { variant: "secondary" },
  active: { variant: "default", className: "bg-brand-green text-white" },
  suspended: { variant: "outline" },
  rejected: { variant: "destructive" },
};
