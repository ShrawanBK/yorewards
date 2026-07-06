"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import {
  fetchStampableBranchesAction,
  fetchStampableMerchantsAction,
} from "@/features/scan/api/catalogActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";

type ManualStampPickerProps = {
  disabled?: boolean;
  onSelect: (payload: {
    merchantId: string;
    loyaltyCardId: string;
    locationId: string;
  }) => void;
};

export function ManualStampPicker({
  disabled,
  onSelect,
}: ManualStampPickerProps) {
  const t = useTranslations("scan.manual");
  const tErrors = useTranslations("errors.actions");
  const [merchants, setMerchants] = useState<
    { merchantId: string; businessName: string; loyaltyCardId: string; cardName: string }[]
  >([]);
  const [branches, setBranches] = useState<
    { locationId: string; branchName: string }[]
  >([]);
  const [merchantId, setMerchantId] = useState("");
  const [loyaltyCardId, setLoyaltyCardId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchStampableMerchantsAction().then((result) => {
      setLoading(false);
      if (isActionFailure(result)) {
        setError(resolveActionError(tErrors, result.error));
        return;
      }
      setMerchants(result.merchants);
    });
  }, [tErrors]);

  useEffect(() => {
    if (!merchantId || !loyaltyCardId) {
      setBranches([]);
      setLocationId("");
      return;
    }
    void fetchStampableBranchesAction(merchantId, loyaltyCardId).then(
      (result) => {
        if (isActionFailure(result)) {
          setError(resolveActionError(tErrors, result.error));
          return;
        }
        setBranches(result.branches);
        setLocationId("");
      },
    );
  }, [merchantId, loyaltyCardId, tErrors]);

  function handleMerchantChange(value: string) {
    setError(null);
    setMerchantId(value);
    const match = merchants.find((m) => m.merchantId === value);
    setLoyaltyCardId(match?.loyaltyCardId ?? "");
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card p-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <>
          <Field label={t("merchantLabel")} htmlFor="manual-merchant">
            <select
              id="manual-merchant"
              className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={merchantId}
              disabled={disabled}
              onChange={(e) => handleMerchantChange(e.target.value)}
            >
              <option value="">{t("merchantPlaceholder")}</option>
              {merchants.map((m) => (
                <option key={m.merchantId} value={m.merchantId}>
                  {m.businessName} — {m.cardName}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("branchLabel")} htmlFor="manual-branch">
            <select
              id="manual-branch"
              className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={locationId}
              disabled={disabled || !merchantId || branches.length === 0}
              onChange={(e) => {
                setError(null);
                setLocationId(e.target.value);
              }}
            >
              <option value="">{t("branchPlaceholder")}</option>
              {branches.map((b) => (
                <option key={b.locationId} value={b.locationId}>
                  {b.branchName}
                </option>
              ))}
            </select>
          </Field>

          <Button
            type="button"
            className="min-h-11 w-full bg-brand-purple hover:bg-brand-purple/90"
            disabled={disabled || !merchantId || !locationId}
            onClick={() =>
              onSelect({ merchantId, loyaltyCardId, locationId })
            }
          >
            {t("submit")}
          </Button>
        </>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
