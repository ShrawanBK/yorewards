"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  approveMerchantAction,
  rejectMerchantAction,
  suspendMerchantAction,
  type MerchantActionResult,
} from "@/features/merchants/api/merchantActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionError, showActionSuccess } from "@/shared/utils/action-feedback";
import type { Database, MerchantStatus } from "@repo/supabase/types";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

export function MerchantAdminActions({ merchant }: { merchant: Merchant }) {
  const t = useTranslations("merchants");
  const tErrors = useTranslations("errors.actions");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);
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
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError(true);
      return;
    }
    setReasonError(false);
    runAction(
      () => rejectMerchantAction(merchant.id, trimmed),
      "success.rejected",
    );
  }

  if (merchant.status === "pending") {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-1">
          <Input
            aria-label={t("reject.label", { name })}
            aria-invalid={reasonError}
            placeholder={t("reject.placeholder")}
            value={reason}
            disabled={isPending}
            onChange={(event) => {
              setReason(event.target.value);
              if (reasonError) setReasonError(false);
            }}
          />
          {reasonError ? (
            <p className="text-xs text-destructive">{t("reject.required")}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" disabled={isPending} onClick={handleReject}>
            {t("actions.reject")}
          </Button>
          <Button
            className="bg-brand-green hover:bg-brand-green/90"
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
      <Button
        variant="destructive"
        disabled={isPending}
        onClick={() =>
          runAction(
            () => suspendMerchantAction(merchant.id),
            "success.suspended",
          )
        }
      >
        {t("actions.suspend")}
      </Button>
    );
  }

  return (
    <Button
      className="bg-brand-green hover:bg-brand-green/90"
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
  { variant: "default" | "secondary" | "outline" | "destructive"; className?: string }
> = {
  pending: { variant: "secondary" },
  active: { variant: "default", className: "bg-brand-green text-white" },
  suspended: { variant: "outline" },
  rejected: { variant: "destructive" },
};
