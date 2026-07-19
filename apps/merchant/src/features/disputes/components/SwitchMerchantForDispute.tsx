"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { switchActiveMerchantForDisputeAction } from "@/features/disputes/api/switchActiveMerchantForDisputeAction";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

export function SwitchMerchantForDispute({
  disputeId,
  merchantId,
  businessName,
}: {
  disputeId: string;
  merchantId: string;
  businessName: string;
}) {
  const t = useTranslations("disputes.detail");
  const tErrors = useTranslations("errors.actions");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const result = await switchActiveMerchantForDisputeAction({
        disputeId,
        merchantId,
      });
      if (result && isActionFailure(result)) {
        setError(resolveActionError(tErrors, result.error));
      }
    })();
  }, [disputeId, merchantId, tErrors]);

  return (
    <div className="merchant-glass-card space-y-2 rounded-xl border border-border p-6 text-center">
      <p className="font-medium text-foreground">
        {t("switchingBusiness", { business: businessName })}
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="merchant-body-muted text-sm" aria-live="polite">
          {t("switchingBusinessHint")}
        </p>
      )}
    </div>
  );
}
