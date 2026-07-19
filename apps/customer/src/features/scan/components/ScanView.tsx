"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { useAuthStore } from "@/features/auth";
import { submitStampScanAction } from "@/features/scan/api/scanActions";
import { QrScanner } from "@/features/scan/components/QrScanner";
import { ManualStampPicker } from "@/features/scan/components/ManualStampPicker";
import {
  parseLoyaltyQrParams,
  parseLoyaltyQrText,
} from "@/features/scan/utils/parseLoyaltyQr";
import { refreshCustomerWallet } from "@/features/wallet/api/walletQueries";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";

type ScanViewProps = {
  searchParams?: { m?: string; c?: string; l?: string };
};

export function ScanView({ searchParams }: ScanViewProps) {
  const t = useTranslations("scan");
  const tErrors = useTranslations("errors.actions");
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = useAuthStore((s) => s.customerId);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const processedDeepLink = useRef(false);

  const hasDeepLinkParams = Boolean(
    searchParams?.m || searchParams?.c || searchParams?.l,
  );
  const deepLink = parseLoyaltyQrParams(
    searchParams?.m,
    searchParams?.c,
    searchParams?.l,
  );
  const invalidDeepLink = hasDeepLinkParams && !deepLink;

  const resetScanner = useCallback(() => {
    setBusy(false);
    setScannerKey((key) => key + 1);
  }, []);

  const handlePayload = useCallback(
    async (payload: {
      merchantId: string;
      loyaltyCardId: string;
      locationId: string;
    }) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      setErrorCode(null);

      const result = await submitStampScanAction(payload);
      if (isActionFailure(result)) {
        setError(resolveActionError(tErrors, result.error));
        setErrorCode(result.error.code);
        resetScanner();
        return;
      }

      if ("redirectTo" in result && result.redirectTo) {
        if (customerId) {
          await refreshCustomerWallet(queryClient, customerId);
        }
        router.push(result.redirectTo);
        return;
      }

      if ("sessionId" in result) {
        if (customerId) {
          await refreshCustomerWallet(queryClient, customerId);
        }
        router.push(`/stamp/pending/${result.sessionId}`);
      }
    },
    [busy, router, tErrors, resetScanner, queryClient, customerId],
  );

  const handleScan = useCallback(
    (text: string) => {
      const payload = parseLoyaltyQrText(text);
      if (!payload) {
        setError(t("invalidQr"));
        setErrorCode("SCAN_INVALID_QR");
        resetScanner();
        return;
      }
      void handlePayload(payload);
    },
    [handlePayload, resetScanner, t],
  );

  useEffect(() => {
    if (invalidDeepLink) {
      setError(t("invalidQr"));
      setErrorCode("SCAN_INVALID_QR");
      return;
    }
    if (!deepLink || processedDeepLink.current) return;
    processedDeepLink.current = true;
    void handlePayload(deepLink);
  }, [deepLink, handlePayload, invalidDeepLink, t]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <QrScanner key={scannerKey} onScan={handleScan} paused={busy || showManual} />

      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full"
        onClick={() => setShowManual((v) => !v)}
        aria-expanded={showManual}
      >
        {showManual ? t("hideManual") : t("manualCta")}
      </Button>

      {showManual ? (
        <ManualStampPicker disabled={busy} onSelect={handlePayload} />
      ) : null}

      {busy ? (
        <p className="text-center text-sm text-muted-foreground">
          {t("processing")}
        </p>
      ) : null}

      {error ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <Button asChild variant="outline" className="min-h-11">
            <Link href={errorCode === "UNAUTHORIZED" ? "/login" : "/wallet"}>
              {errorCode === "UNAUTHORIZED" ? t("signInAgain") : t("backToWallet")}
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
