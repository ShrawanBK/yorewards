"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { submitStampScanAction } from "@/features/scan/api/scanActions";
import { QrScanner } from "@/features/scan/components/QrScanner";
import type { LoyaltyQrPayload } from "@/features/scan/utils/parseLoyaltyQr";
import { parseLoyaltyQrText } from "@/features/scan/utils/parseLoyaltyQr";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";

type ScanViewProps = {
  deepLink?: LoyaltyQrPayload;
};

export function ScanView({ deepLink }: ScanViewProps) {
  const t = useTranslations("scan");
  const tErrors = useTranslations("errors.actions");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const processedDeepLink = useRef(false);

  const resetScanner = useCallback(() => {
    setBusy(false);
    setScannerKey((key) => key + 1);
  }, []);

  const handlePayload = useCallback(
    async (payload: LoyaltyQrPayload) => {
      if (busy) return;
      setBusy(true);
      setError(null);

      const result = await submitStampScanAction(payload);
      if (isActionFailure(result)) {
        setError(resolveActionError(tErrors, result.error));
        resetScanner();
        return;
      }

      if ("redirectTo" in result && result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }

      if ("sessionId" in result) {
        router.push(`/stamp/pending/${result.sessionId}`);
      }
    },
    [busy, router, tErrors, resetScanner],
  );

  const handleScan = useCallback(
    (text: string) => {
      const payload = parseLoyaltyQrText(text);
      if (!payload) {
        setError(t("invalidQr"));
        resetScanner();
        return;
      }
      void handlePayload(payload);
    },
    [handlePayload, resetScanner, t],
  );

  useEffect(() => {
    if (!deepLink || processedDeepLink.current) return;
    processedDeepLink.current = true;
    void handlePayload(deepLink);
  }, [deepLink, handlePayload]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <QrScanner key={scannerKey} onScan={handleScan} paused={busy} />

      {busy ? (
        <p className="text-center text-sm text-muted-foreground">
          {t("processing")}
        </p>
      ) : null}

      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
